import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Wrench, Truck, Scissors, Package, Zap, Droplets,
  Star, ArrowRight, Mail, Lock, Loader2, Bike,
  Home, Search, MapPin, Calendar, Phone, Wifi, Wind, Car, Utensils,
  ImagePlus, X, ChevronLeft,
} from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MALAYSIA_LOCATIONS } from "@/lib/malaysia-locations";
import { signUpWithEmail } from "@/lib/supabase-auth";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useGetRoomListings, useCreateRoomListing,
  useGetServiceProviders, useCreateServiceProvider,
} from "@/hooks/use-marketplace";
import { uploadServicePhoto, uploadRoomPhoto } from "@/lib/supabase-db";

// ─── Constants ────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { id: "Afrinza Rider", label: "Afrinza Rider (Delivery)", icon: <Bike className="w-4 h-4" /> },
  { id: "Delivery", label: "Delivery & Courier", icon: <Truck className="w-4 h-4" /> },
  { id: "Plumbing", label: "Plumbing & Pipework", icon: <Droplets className="w-4 h-4" /> },
  { id: "Electrical", label: "Electrical Services", icon: <Zap className="w-4 h-4" /> },
  { id: "Hair Braiding", label: "Hair Braiding & Styling", icon: <Scissors className="w-4 h-4" /> },
  { id: "Cargo", label: "Cargo Transport", icon: <Package className="w-4 h-4" /> },
  { id: "Cleaning", label: "House Cleaning", icon: <Star className="w-4 h-4" /> },
  { id: "Catering", label: "Catering & Food Services", icon: <Star className="w-4 h-4" /> },
  { id: "Tailoring", label: "Tailoring & Alterations", icon: <Scissors className="w-4 h-4" /> },
  { id: "Car Repair", label: "Car Repair & Maintenance", icon: <Wrench className="w-4 h-4" /> },
  { id: "Other", label: "Other Services", icon: <Wrench className="w-4 h-4" /> },
];

const ROOM_TYPES = ["Single Room", "Master Room", "Suite / Studio", "Shared Room"];

const AMENITIES = [
  { id: "WiFi", label: "WiFi", icon: <Wifi className="w-3.5 h-3.5" /> },
  { id: "Air Conditioning", label: "Air Conditioning", icon: <Wind className="w-3.5 h-3.5" /> },
  { id: "Water Heater", label: "Water Heater", icon: <Droplets className="w-3.5 h-3.5" /> },
  { id: "Parking", label: "Parking", icon: <Car className="w-3.5 h-3.5" /> },
  { id: "Washing Machine", label: "Washing Machine", icon: <Star className="w-3.5 h-3.5" /> },
  { id: "Kitchen Access", label: "Kitchen Access", icon: <Utensils className="w-3.5 h-3.5" /> },
  { id: "Private Bathroom", label: "Private Bathroom", icon: <Droplets className="w-3.5 h-3.5" /> },
  { id: "Fully Furnished", label: "Fully Furnished", icon: <Home className="w-3.5 h-3.5" /> },
];

const FEATURES = [
  { icon: <Bike className="w-6 h-6 text-primary" />, title: "Afrinza Rider", desc: "Join as an Afrinza Rider and earn delivering to Africans across Malaysia." },
  { icon: <Droplets className="w-6 h-6 text-blue-500" />, title: "Plumbing & Repairs", desc: "Offer home repair services to households in your city." },
  { icon: <Scissors className="w-6 h-6 text-purple-500" />, title: "Hair & Beauty", desc: "Reach clients looking for African braiding, locs, twists & more." },
  { icon: <Package className="w-6 h-6 text-green-500" />, title: "Cargo & Moving", desc: "Help businesses and families move goods across states." },
];

// ─── Schemas ──────────────────────────────────────────────────────

const serviceSchema = z.object({
  providerName: z.string().min(2, "Name required"),
  businessName: z.string().min(2, "Business / trading name required"),
  location: z.string().min(1, "Location required"),
  whatsapp: z.string()
    .min(1, "WhatsApp number is required")
    .refine((v) => /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, "")), "Enter a valid number, e.g. +60123456789"),
  description: z.string().min(10, "Briefly describe your services"),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  experience: z.string().min(1, "Required"),
  customServiceType: z.string().optional(),
});

const roomSchema = z.object({
  listerName: z.string().min(2, "Your name is required"),
  whatsapp: z.string()
    .min(1, "WhatsApp number is required")
    .refine((v) => /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, "")), "Enter a valid number, e.g. +60123456789"),
  location: z.string().min(1, "Location is required"),
  title: z.string().min(5, "Give your listing a title, e.g. 'Master Room in Bangsar'"),
  roomType: z.string().min(1, "Select a room type"),
  pricePerMonth: z.string().optional().refine(
    (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0),
    "Enter a valid price"
  ),
  description: z.string().min(10, "Describe the room for potential renters"),
  amenities: z.array(z.string()).default([]),
  availableFrom: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
type RoomFormValues = z.infer<typeof roomSchema>;

// ─── Main Component ───────────────────────────────────────────────

export default function Services() {
  const { user, isAuthenticated } = useAuthContext();

  const [mainTab, setMainTab] = useState<"services" | "rooms">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "rooms" ? "rooms" : "services";
  });

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [roomTab, setRoomTab] = useState<"find" | "list">("find");

  // Service provider filter
  const [spLocation, setSpLocation] = useState<string>("");
  const [filteredSpLocation, setFilteredSpLocation] = useState<string | undefined>(undefined);

  // Room search
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchedLocation, setSearchedLocation] = useState<string | undefined>(undefined);

  // Success state
  const [isServiceSuccess, setIsServiceSuccess] = useState(false);
  const [isRoomSuccess, setIsRoomSuccess] = useState(false);

  // Auth
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);

  // Service photos (up to 3)
  const [servicePhotos, setServicePhotos] = useState<File[]>([]);
  const [servicePhotoPreviews, setServicePhotoPreviews] = useState<string[]>([]);
  const servicePhotoRef = useRef<HTMLInputElement>(null);

  // Room photos (up to 6)
  const [roomPhotos, setRoomPhotos] = useState<File[]>([]);
  const [roomPhotoPreviews, setRoomPhotoPreviews] = useState<string[]>([]);
  const roomPhotoRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  // Queries
  const serviceProviders = useGetServiceProviders(filteredSpLocation);
  const createServiceProvider = useCreateServiceProvider();
  const roomListings = useGetRoomListings(searchedLocation);
  const createRoomListing = useCreateRoomListing();

  // Forms
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      providerName: "", businessName: "", location: "", whatsapp: "",
      description: "", serviceTypes: [], experience: "", customServiceType: "",
    },
  });

  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      listerName: "", whatsapp: "", location: "", title: "", roomType: "",
      pricePerMonth: "", description: "", amenities: [], availableFrom: "",
    },
  });

  const watchedServiceTypes = serviceForm.watch("serviceTypes");
  const showCustomServiceType = watchedServiceTypes.includes("Other");

  // ─── Photo handlers ───────────────────────────────────────────

  const handleServicePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = 3 - servicePhotos.length;
    const allowed = files.slice(0, remaining);
    if (allowed.length < files.length) toast.warning(`Max 3 photos — only ${allowed.length} added.`);
    allowed.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB`); return; }
      setServicePhotos((p) => [...p, f]);
      const reader = new FileReader();
      reader.onload = (ev) => setServicePhotoPreviews((p) => [...p, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeServicePhoto = (i: number) => {
    setServicePhotos((p) => p.filter((_, idx) => idx !== i));
    setServicePhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleRoomPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = 6 - roomPhotos.length;
    const allowed = files.slice(0, remaining);
    if (allowed.length < files.length) toast.warning(`Max 6 photos — only ${allowed.length} added.`);
    allowed.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB`); return; }
      setRoomPhotos((p) => [...p, f]);
      const reader = new FileReader();
      reader.onload = (ev) => setRoomPhotoPreviews((p) => [...p, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeRoomPhoto = (i: number) => {
    setRoomPhotos((p) => p.filter((_, idx) => idx !== i));
    setRoomPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  // ─── Service submit ───────────────────────────────────────────

  const onServiceSubmit = async (data: ServiceFormValues) => {
    let currentUserId: string | null = user?.id ?? null;

    if (!isAuthenticated) {
      if (!authEmail.trim()) { toast.error("Email address is required."); return; }
      if (authPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
      setIsCreatingAuth(true);
      const { error: authError, data: authData } = await signUpWithEmail(authEmail, authPassword, {
        fullName: data.providerName, role: "seller",
      });
      setIsCreatingAuth(false);
      if (authError) { toast.error(authError.message); return; }
      currentUserId = (authData as any)?.user?.id ?? null;
    }

    setUploading(true);
    let photoUrls: string[] = [];
    try {
      const results = await Promise.all(servicePhotos.map((f) => uploadServicePhoto(f)));
      photoUrls = results.filter((u): u is string => u !== null);
    } catch {
      toast.error("Photo upload failed. Please try again.");
      setUploading(false);
      return;
    }

    try {
      await createServiceProvider.mutateAsync({
        userId: currentUserId,
        providerName: data.providerName,
        businessName: data.businessName,
        location: data.location,
        whatsapp: data.whatsapp,
        description: data.description,
        experience: data.experience,
        serviceTypes: data.serviceTypes,
        customServiceType: data.customServiceType?.trim() || null,
        photos: photoUrls,
      });

      const waNumber = "60166088141";
      const svcList = [
        ...data.serviceTypes,
        data.customServiceType ? `Other: ${data.customServiceType}` : "",
      ].filter(Boolean).join(", ");
      const msg = encodeURIComponent(
        `*New Service Provider — Afrinza*\n\n*Name:* ${data.providerName}\n*Business:* ${data.businessName}\n*Services:* ${svcList}\n*Location:* ${data.location}\n*WhatsApp:* ${data.whatsapp}\n*Experience:* ${data.experience}\n*Description:* ${data.description}\n*Email:* ${authEmail || user?.email || "N/A"}`
      );
      setIsServiceSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank"), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to register. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Room submit ──────────────────────────────────────────────

  const onRoomSubmit = async (data: RoomFormValues) => {
    setUploading(true);
    let imageUrls: string[] = [];
    try {
      const results = await Promise.all(roomPhotos.map((f) => uploadRoomPhoto(f)));
      imageUrls = results.filter((u): u is string => u !== null);
    } catch {
      toast.error("Photo upload failed. Please try again.");
      setUploading(false);
      return;
    }

    try {
      await createRoomListing.mutateAsync({
        listerName: data.listerName,
        whatsapp: data.whatsapp,
        location: data.location,
        title: data.title,
        roomType: data.roomType,
        pricePerMonth: data.pricePerMonth ? parseFloat(data.pricePerMonth) : null,
        description: data.description,
        amenities: data.amenities,
        availableFrom: data.availableFrom || null,
        images: imageUrls,
      });

      const waNumber = "60166088141";
      const msg = encodeURIComponent(
        `*New Room Listing — Afrinza*\n\n*Name:* ${data.listerName}\n*Title:* ${data.title}\n*Type:* ${data.roomType}\n*Location:* ${data.location}\n*Price:* ${data.pricePerMonth ? `RM ${data.pricePerMonth}/month` : "Negotiable"}\n*WhatsApp:* ${data.whatsapp}\n*Photos:* ${imageUrls.length}`
      );
      setIsRoomSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank"), 800);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Success screens ──────────────────────────────────────────

  if (isServiceSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4">You're Listed!</h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-md">
          Your service profile is now live on Afrinza. Clients can find and contact you directly.
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          A WhatsApp notification has been sent to the Afrinza team. You'll be contacted for verification within 24 hours.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 max-w-sm w-full mb-8 text-left">
          <p className="font-bold text-sm text-amber-800 mb-1">💳 RM 10/month subscription required</p>
          <p className="text-xs text-amber-700 mb-3">
            Scan the QR code below to pay your monthly subscription and keep your listing active.
          </p>
          <div className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 border border-amber-200">
            <img
              src="/tng-qr.jpeg" alt="TNG QR"
              className="w-32 h-32 object-contain rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <p className="text-xs font-semibold text-amber-800">Scan to Pay · RM 10/month</p>
            <a href="https://wa.me/60166088141" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              Send receipt on WhatsApp →
            </a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => { setIsServiceSuccess(false); setShowRegisterForm(false); }}
            variant="outline" className="rounded-full px-8 h-12 font-semibold"
          >
            Back to Directory
          </Button>
          <Button asChild className="rounded-full px-8 h-12 font-semibold">
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  if (isRoomSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4">Room Listed!</h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-md">
          Your room listing is live — tenants can search and find it by location.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 max-w-sm w-full mb-8 text-left">
          <p className="font-bold text-sm text-amber-800 mb-1">💳 Subscription required — RM 10/month</p>
          <p className="text-xs text-amber-700 mb-3">
            Room listings require a monthly RM 10 subscription to stay active. Scan to pay and send your receipt via WhatsApp.
          </p>
          <div className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 border border-amber-200">
            <img
              src="/tng-qr.jpeg" alt="TNG QR"
              className="w-32 h-32 object-contain rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <p className="text-xs font-semibold text-amber-800">Scan to Pay · RM 10/month</p>
            <a href="https://wa.me/60166088141" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              Send receipt on WhatsApp →
            </a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => { setIsRoomSuccess(false); setRoomTab("find"); setMainTab("rooms"); roomForm.reset(); setRoomPhotos([]); setRoomPhotoPreviews([]); }}
            variant="outline" className="rounded-full px-8 h-12 font-semibold"
          >
            Browse Rooms
          </Button>
          <Button
            onClick={() => { setIsRoomSuccess(false); setRoomTab("list"); roomForm.reset(); setRoomPhotos([]); setRoomPhotoPreviews([]); }}
            className="rounded-full px-8 h-12 font-semibold"
          >
            List Another Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-amber-600 pt-16 pb-32 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          {mainTab === "services" ? (
            <>
              <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
                For African Service Providers
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 leading-tight">
                List Your Services on Afrinza
              </h1>
              <p className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto">
                Whether you're an Afrinza Rider, plumber, hair braider, or cargo transporter — reach thousands of Africans across Malaysia who need your skills.
              </p>
            </>
          ) : (
            <>
              <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
                Rooms for Rent
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 leading-tight">
                Find or List a Room
              </h1>
              <p className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto">
                Search for available rooms across Malaysia by location, or list your room and connect directly with potential tenants.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Main tab switcher ─────────────────────────────────────── */}
      <div className="container mx-auto px-4 -mt-7 relative z-30 flex justify-center mb-4">
        <div className="inline-flex bg-white rounded-2xl border border-border shadow-lg p-1.5 gap-1">
          <button
            onClick={() => { setMainTab("services"); setShowRegisterForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === "services" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Wrench className="w-4 h-4" /> Service Providers
          </button>
          <button
            onClick={() => setMainTab("rooms")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === "rooms" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Home className="w-4 h-4" /> Rooms for Rent
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SERVICE PROVIDERS SECTION
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "services" && (
        <div className="container mx-auto px-4 mt-6">
          {showRegisterForm ? (
            /* ── REGISTRATION FORM ───────────────────────────── */
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setShowRegisterForm(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Directory
              </button>

              <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Service Provider Registration</h2>
                      <p className="text-muted-foreground text-sm">Your profile goes live instantly — clients can find you by service type and location.</p>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="mb-8">
                    <label className="text-sm font-semibold block mb-1.5">
                      Profile / Work Photos
                      <span className="font-normal text-xs text-muted-foreground ml-1">(up to 3 · shown on your public profile)</span>
                    </label>
                    <input ref={servicePhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleServicePhotoChange} />
                    {servicePhotoPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {servicePhotoPreviews.map((src, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted/20 shrink-0">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeServicePhoto(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                            {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary text-white font-bold py-0.5">Cover</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {servicePhotos.length < 3 ? (
                      <button type="button" onClick={() => servicePhotoRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                        <ImagePlus className="w-7 h-7" />
                        <p className="text-sm font-medium">{servicePhotos.length === 0 ? "Add photos of yourself or your work (up to 3)" : `Add more (${3 - servicePhotos.length} remaining)`}</p>
                        <p className="text-xs">JPG, PNG, WEBP · max 5 MB each</p>
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">3 photos added (maximum reached)</p>
                    )}
                  </div>

                  {!isAuthenticated && (
                    <div className="mb-8 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Create Your Login Account
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">Use these credentials to sign in and manage your service profile anytime.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold block mb-1.5"><Mail className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />Email Address</label>
                          <Input type="email" placeholder="you@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="h-11 bg-white" />
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-1.5"><Lock className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />Password</label>
                          <Input type="password" placeholder="Min. 6 characters" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="h-11 bg-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {isAuthenticated && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      Signed in as <strong>{user?.email}</strong> — your account is already linked.
                    </div>
                  )}

                  <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={serviceForm.control} name="providerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Full Name</FormLabel>
                            <FormControl><Input placeholder="John Okafor" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={serviceForm.control} name="businessName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business / Trading Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Okafor Plumbing Services" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={serviceForm.control} name="location" render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / City (Coverage Area)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select area" /></SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-64">
                                {MALAYSIA_LOCATIONS.map((loc) => <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={serviceForm.control} name="whatsapp" render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl><Input placeholder="+60123456789" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormDescription className="text-xs">Clients will contact you via this number.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={serviceForm.control} name="experience" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select experience level" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                              <SelectItem value="1-2 years">1–2 years</SelectItem>
                              <SelectItem value="3-5 years">3–5 years</SelectItem>
                              <SelectItem value="6-10 years">6–10 years</SelectItem>
                              <SelectItem value="10+ years">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={serviceForm.control} name="serviceTypes" render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base font-semibold">What services do you offer?</FormLabel>
                            <FormDescription>Select all that apply.</FormDescription>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SERVICE_TYPES.map((svc) => (
                              <FormField key={svc.id} control={serviceForm.control} name="serviceTypes" render={({ field }) => (
                                <FormItem className={`flex items-center space-x-3 space-y-0 rounded-xl border p-3.5 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer ${svc.id === "Afrinza Rider" ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border"}`}>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(svc.id)}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange([...field.value, svc.id])
                                          : field.onChange(field.value?.filter((v) => v !== svc.id))
                                      }
                                    />
                                  </FormControl>
                                  <div className="flex items-center gap-2">
                                    <span className={svc.id === "Afrinza Rider" ? "text-primary" : "text-muted-foreground"}>{svc.icon}</span>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {svc.label}
                                      {svc.id === "Afrinza Rider" && (
                                        <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                      )}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )} />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* "Other" custom type text box — appears when "Other" is checked */}
                      {showCustomServiceType && (
                        <FormField control={serviceForm.control} name="customServiceType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specify Your Service Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Photography, Tutoring, Event Planning, IT Support…"
                                className="h-12 bg-muted/30"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Tell clients exactly what you offer.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      <FormField control={serviceForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your services, availability, pricing structure, areas you cover, and why clients should choose you..."
                              className="min-h-[120px] resize-none bg-muted/30 p-4"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        <p className="font-semibold mb-0.5">💳 Subscription: RM 10/month</p>
                        <p className="text-xs">After registering, you'll receive payment instructions to keep your listing active.</p>
                      </div>

                      <div className="pt-6 border-t border-border/50">
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-14 rounded-full text-base font-bold shadow-md"
                          disabled={serviceForm.formState.isSubmitting || isCreatingAuth || uploading || createServiceProvider.isPending}
                        >
                          {isCreatingAuth ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account…</>
                          ) : (uploading || createServiceProvider.isPending) ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading &amp; Registering…</>
                          ) : (
                            <>List My Services <ArrowRight className="w-5 h-5 ml-2" /></>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                          Your profile goes live instantly. You'll be contacted for verification within 24 hours.
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>

          ) : (
            /* ── PROVIDER DIRECTORY ──────────────────────────── */
            <div className="max-w-6xl mx-auto">
              {/* Feature cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {FEATURES.map((f) => (
                  <div key={f.title} className="bg-white rounded-2xl p-5 shadow-lg border border-border/50 text-center">
                    <div className="flex justify-center mb-3">{f.icon}</div>
                    <p className="font-bold text-sm text-foreground mb-1">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Filter + CTA bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
                <div className="flex gap-2 flex-1 w-full">
                  <Select value={spLocation} onValueChange={setSpLocation}>
                    <SelectTrigger className="h-11 bg-white border-border flex-1">
                      <SelectValue placeholder="Filter by location…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">All Locations</SelectItem>
                      {MALAYSIA_LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-11 px-4 rounded-xl"
                    onClick={() => setFilteredSpLocation(spLocation === "all" ? undefined : spLocation || undefined)}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  className="h-11 rounded-xl gap-2 whitespace-nowrap w-full sm:w-auto"
                  onClick={() => { setShowRegisterForm(true); window.scrollTo(0, 0); }}
                >
                  <Wrench className="w-4 h-4" /> List Your Services
                </Button>
              </div>

              {/* Provider grid */}
              {serviceProviders.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
                      <Skeleton className="h-40 w-full rounded-xl" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : serviceProviders.error ? (
                <div className="text-center py-16 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold mb-2">Could not load service providers</p>
                  <p className="text-sm">Run the migration in <code className="bg-muted px-1 rounded text-xs">MIGRATION.sql</code> in your Supabase SQL Editor first.</p>
                </div>
              ) : !serviceProviders.data || serviceProviders.data.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                  <Wrench className="w-14 h-14 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg mb-2">No service providers yet</p>
                  <p className="text-sm mb-6">
                    {filteredSpLocation
                      ? `No providers in ${filteredSpLocation}. Try a different location.`
                      : "Be the first to list your services on Afrinza!"}
                  </p>
                  <Button className="rounded-full gap-2" onClick={() => { setShowRegisterForm(true); window.scrollTo(0, 0); }}>
                    <Wrench className="w-4 h-4" /> List My Services
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {serviceProviders.data.length} provider{serviceProviders.data.length !== 1 ? "s" : ""}
                    {filteredSpLocation ? ` in ${filteredSpLocation}` : " across Malaysia"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {serviceProviders.data.map((provider) => (
                      <div key={provider.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        {provider.photos.length > 0 ? (
                          <div className="h-40 overflow-hidden bg-muted">
                            <img src={provider.photos[0]} alt={provider.providerName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <Wrench className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-foreground leading-tight flex-1">{provider.providerName}</h3>
                            {provider.isVerified && <VerifiedBadge size="md" />}
                          </div>
                          {provider.businessName && (
                            <p className="text-xs text-muted-foreground mb-2">{provider.businessName}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {provider.location}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-4 flex-1">
                            {provider.serviceTypes.map((t) => (
                              <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{t}</span>
                            ))}
                            {provider.customServiceType && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{provider.customServiceType}</span>
                            )}
                          </div>
                          <a
                            href={`https://wa.me/${provider.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-2.5 text-sm font-semibold transition-colors mt-auto"
                          >
                            <Phone className="w-4 h-4" /> Contact on WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
                    <Wrench className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="font-bold text-lg mb-1">Offer a service?</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join {serviceProviders.data.length} provider{serviceProviders.data.length !== 1 ? "s" : ""} already listed on Afrinza.
                    </p>
                    <Button className="rounded-full gap-2" onClick={() => { setShowRegisterForm(true); window.scrollTo(0, 0); }}>
                      <Wrench className="w-4 h-4" /> List My Services
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ROOMS FOR RENT SECTION
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "rooms" && (
        <div className="container mx-auto px-4 mt-6">

          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-2xl border border-border shadow-sm p-1 gap-1">
              <button
                onClick={() => setRoomTab("find")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${roomTab === "find" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Search className="w-4 h-4" /> Find a Room
              </button>
              <button
                onClick={() => setRoomTab("list")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${roomTab === "list" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Home className="w-4 h-4" /> List My Room
              </button>
            </div>
          </div>

          {/* ── FIND A ROOM ───────────────────────────────────────── */}
          {roomTab === "find" && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-3xl border border-border shadow-sm p-5 mb-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Search by Location
                </h2>
                <div className="flex gap-3">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-12 bg-muted/30 flex-1">
                      <SelectValue placeholder="Select a state or city…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">All Locations</SelectItem>
                      {MALAYSIA_LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setSearchedLocation(selectedLocation === "all" ? undefined : selectedLocation || undefined)}
                    className="h-12 px-6 rounded-xl gap-2 shrink-0"
                  >
                    <Search className="w-4 h-4" /> Search
                  </Button>
                </div>
                {searchedLocation && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Showing rooms in <strong>{searchedLocation}</strong>
                    <button onClick={() => { setSearchedLocation(undefined); setSelectedLocation(""); }} className="text-primary hover:underline ml-1">Clear</button>
                  </p>
                )}
              </div>

              {roomListings.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
                      <Skeleton className="h-44 w-full rounded-xl" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : roomListings.error ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">Could not load listings</p>
                  <p className="text-sm mt-1">Run <code className="bg-muted px-1 rounded text-xs">MIGRATION.sql</code> in your Supabase SQL Editor.</p>
                </div>
              ) : !roomListings.data || roomListings.data.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                  <Home className="w-14 h-14 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg mb-2">No rooms found</p>
                  <p className="text-sm mb-6">
                    {searchedLocation ? `No rooms in ${searchedLocation}. Try a different location.` : "No rooms listed yet. Be the first!"}
                  </p>
                  <Button onClick={() => setRoomTab("list")} className="rounded-full gap-2">
                    <Home className="w-4 h-4" /> List a Room
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {roomListings.data.length} room{roomListings.data.length !== 1 ? "s" : ""} available
                    {searchedLocation ? ` in ${searchedLocation}` : ""}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {roomListings.data.map((room) => (
                      <div key={room.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        {room.images && room.images.length > 0 ? (
                          <div className="h-44 overflow-hidden bg-muted">
                            <img src={room.images[0]} alt={room.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-44 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <Home className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="font-bold text-foreground leading-tight flex-1">{room.title}</h3>
                            <Badge className="shrink-0 bg-primary/10 text-primary border-transparent text-[10px]">{room.roomType}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {room.location}
                          </div>
                          {room.pricePerMonth ? (
                            <div className="text-xl font-bold text-foreground mb-3">
                              RM {room.pricePerMonth.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/month</span>
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-muted-foreground mb-3 italic">Price negotiable</div>
                          )}
                          {room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {room.amenities.map((a) => (
                                <span key={a} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{a}</span>
                              ))}
                            </div>
                          )}
                          {room.availableFrom && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              Available from {new Date(room.availableFrom).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                          )}
                          {room.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{room.description}</p>
                          )}
                          <a
                            href={`https://wa.me/${room.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-2.5 text-sm font-semibold transition-colors mt-auto"
                          >
                            <Phone className="w-4 h-4" /> Contact on WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-10 bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
                <Home className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-bold text-lg mb-1">Have a room to rent?</p>
                <p className="text-sm text-muted-foreground mb-4">List it and connect with Africans across Malaysia. RM 10/month subscription applies.</p>
                <Button onClick={() => setRoomTab("list")} className="rounded-full gap-2">
                  <Home className="w-4 h-4" /> List My Room
                </Button>
              </div>
            </div>
          )}

          {/* ── LIST A ROOM ───────────────────────────────────────── */}
          {roomTab === "list" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">List Your Room for Rent</h2>
                      <p className="text-muted-foreground text-sm">Your listing goes live instantly and tenants can find it by location.</p>
                    </div>
                  </div>

                  {/* Subscription notice */}
                  <div className="mb-7 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <p className="font-semibold mb-0.5">💳 Subscription required: RM 10/month</p>
                    <p className="text-xs">After listing, you'll receive a QR code to pay your subscription and keep your listing active.</p>
                  </div>

                  {/* Room photos */}
                  <div className="mb-7">
                    <label className="text-sm font-semibold block mb-1.5">
                      Room Photos
                      <span className="font-normal text-xs text-muted-foreground ml-1">(up to 6 · shown to potential tenants)</span>
                    </label>
                    <input ref={roomPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleRoomPhotoChange} />
                    {roomPhotoPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {roomPhotoPreviews.map((src, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted/20 shrink-0">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeRoomPhoto(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                            {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary text-white font-bold py-0.5">Cover</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {roomPhotos.length < 6 ? (
                      <button type="button" onClick={() => roomPhotoRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                        <ImagePlus className="w-7 h-7" />
                        <p className="text-sm font-medium">{roomPhotos.length === 0 ? "Add photos of the room (up to 6)" : `Add more (${6 - roomPhotos.length} remaining)`}</p>
                        <p className="text-xs">JPG, PNG, WEBP · max 5 MB each</p>
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">6 photos added (maximum reached)</p>
                    )}
                  </div>

                  <Form {...roomForm}>
                    <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={roomForm.control} name="listerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Full Name</FormLabel>
                            <FormControl><Input placeholder="John Okafor" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={roomForm.control} name="whatsapp" render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl><Input placeholder="+60123456789" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormDescription className="text-xs">Tenants will contact you directly on this number.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={roomForm.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Cozy Master Room in Cheras, near LRT" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={roomForm.control} name="location" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select area" /></SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-64">
                                {MALAYSIA_LOCATIONS.map((loc) => <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={roomForm.control} name="roomType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={roomForm.control} name="pricePerMonth" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rent (RM)</FormLabel>
                            <FormControl><Input type="number" min="0" placeholder="e.g. 650 (leave blank if negotiable)" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormDescription className="text-xs">Leave blank to show "Price negotiable".</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={roomForm.control} name="availableFrom" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available From</FormLabel>
                            <FormControl><Input type="date" className="h-12 bg-muted/30" {...field} /></FormControl>
                            <FormDescription className="text-xs">Leave blank if available immediately.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={roomForm.control} name="amenities" render={() => (
                        <FormItem>
                          <div className="mb-3">
                            <FormLabel className="text-base font-semibold">Amenities Included</FormLabel>
                            <FormDescription>Select all that apply.</FormDescription>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {AMENITIES.map((a) => (
                              <FormField key={a.id} control={roomForm.control} name="amenities" render={({ field }) => (
                                <FormItem className="flex items-center space-x-2.5 space-y-0 rounded-xl border border-border p-3 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(a.id)}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange([...field.value, a.id])
                                          : field.onChange(field.value?.filter((v) => v !== a.id))
                                      }
                                    />
                                  </FormControl>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">{a.icon}</span>
                                    <FormLabel className="font-normal cursor-pointer text-xs leading-tight">{a.label}</FormLabel>
                                  </div>
                                </FormItem>
                              )} />
                            ))}
                          </div>
                        </FormItem>
                      )} />

                      <FormField control={roomForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the room — size, surroundings, nearby amenities, house rules, who it's suitable for…"
                              className="min-h-[120px] resize-none bg-muted/30 p-4"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="pt-6 border-t border-border/50">
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-14 rounded-full text-base font-bold shadow-md"
                          disabled={roomForm.formState.isSubmitting || createRoomListing.isPending || uploading}
                        >
                          {(uploading || createRoomListing.isPending) ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading &amp; Publishing…</>
                          ) : (
                            <>Publish Room Listing <ArrowRight className="w-5 h-5 ml-2" /></>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                          Your listing goes live instantly. A RM 10/month subscription keeps it active.
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
