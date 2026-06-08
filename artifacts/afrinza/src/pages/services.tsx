import { useState } from "react";
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
} from "lucide-react";
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
import { useGetRoomListings, useCreateRoomListing } from "@/hooks/use-marketplace";

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

  // Main tab: service providers vs rooms
  const [mainTab, setMainTab] = useState<"services" | "rooms">("services");

  // Rooms sub-tab: find vs list
  const [roomTab, setRoomTab] = useState<"find" | "list">("find");

  // Room search state
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchedLocation, setSearchedLocation] = useState<string | undefined>(undefined);

  // Service provider form state
  const [isServiceSuccess, setIsServiceSuccess] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);

  // Room listing form state
  const [isRoomSuccess, setIsRoomSuccess] = useState(false);

  const roomListings = useGetRoomListings(searchedLocation);
  const createRoomListing = useCreateRoomListing();

  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { providerName: "", businessName: "", location: "", whatsapp: "", description: "", serviceTypes: [], experience: "" },
  });

  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { listerName: "", whatsapp: "", location: "", title: "", roomType: "", pricePerMonth: "", description: "", amenities: [], availableFrom: "" },
  });

  // ─── Service submit ───────────────────────────────────────────

  const onServiceSubmit = async (data: ServiceFormValues) => {
    if (!isAuthenticated) {
      if (!authEmail.trim()) { toast.error("Email address is required."); return; }
      if (authPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
      setIsCreatingAuth(true);
      const { error: authError } = await signUpWithEmail(authEmail, authPassword, { fullName: data.providerName, role: "seller" });
      setIsCreatingAuth(false);
      if (authError) { toast.error(authError.message); return; }
    }

    const waNumber = "60166088141";
    const msg = encodeURIComponent(
      `*New Service Provider — Afrinza*\n\n*Name:* ${data.providerName}\n*Business:* ${data.businessName}\n*Services:* ${data.serviceTypes.join(", ")}\n*Location:* ${data.location}\n*WhatsApp:* ${data.whatsapp}\n*Experience:* ${data.experience}\n*Description:* ${data.description}\n*Login Email:* ${authEmail || user?.email || "N/A"}`
    );
    setIsServiceSuccess(true);
    window.scrollTo(0, 0);
    setTimeout(() => window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank"), 800);
  };

  // ─── Room submit ──────────────────────────────────────────────

  const onRoomSubmit = async (data: RoomFormValues) => {
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
      });

      const waNumber = "60166088141";
      const msg = encodeURIComponent(
        `*New Room Listing — Afrinza*\n\n*Name:* ${data.listerName}\n*Title:* ${data.title}\n*Type:* ${data.roomType}\n*Location:* ${data.location}\n*Price:* ${data.pricePerMonth ? `RM ${data.pricePerMonth}/month` : "Negotiable"}\n*WhatsApp:* ${data.whatsapp}\n*Amenities:* ${data.amenities.join(", ") || "Not specified"}\n*Description:* ${data.description}`
      );
      setIsRoomSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank"), 800);
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  };

  // ─── Success screens ──────────────────────────────────────────

  if (isServiceSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4">Registration Submitted!</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Your service listing is being reviewed. A WhatsApp message has been sent to the Afrinza team.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setIsServiceSuccess(false)} variant="outline" className="rounded-full px-8 h-12 font-semibold">Register Another</Button>
          <Button asChild className="rounded-full px-8 h-12 font-semibold"><a href="/auth">Sign In to My Account</a></Button>
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
        <p className="text-lg text-muted-foreground mb-4 max-w-md">
          Your room listing is live and searchers can find it by location. A notification has also been sent to the Afrinza team.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => { setIsRoomSuccess(false); setRoomTab("find"); setMainTab("rooms"); roomForm.reset(); }}
            variant="outline"
            className="rounded-full px-8 h-12 font-semibold"
          >
            Browse Rooms
          </Button>
          <Button
            onClick={() => { setIsRoomSuccess(false); setRoomTab("list"); roomForm.reset(); }}
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

      {/* ── Hero ────────────────────────────────────────────────── */}
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

      {/* ── Main tab switcher ────────────────────────────────────── */}
      <div className="container mx-auto px-4 -mt-7 relative z-30 flex justify-center mb-4">
        <div className="inline-flex bg-white rounded-2xl border border-border shadow-lg p-1.5 gap-1">
          <button
            onClick={() => setMainTab("services")}
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
        <>
          {/* Feature cards */}
          <div className="container mx-auto px-4 mt-6 relative z-20 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-5 shadow-lg border border-border/50 text-center">
                  <div className="flex justify-center mb-3">{f.icon}</div>
                  <p className="font-bold text-sm text-foreground mb-1">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Registration form */}
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-3xl border border-border shadow-xl max-w-3xl mx-auto overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Service Provider Registration</h2>
                    <p className="text-muted-foreground text-sm">Your login account will be created automatically.</p>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="mb-8 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                    <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Create Your Login Account
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">Use these credentials to sign in and manage your service profile anytime.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                        </label>
                        <Input type="email" placeholder="you@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="h-11 bg-white" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Password
                        </label>
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

                    <FormField control={serviceForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your services, availability, pricing structure, areas you cover, and why clients should choose you..." className="min-h-[120px] resize-none bg-muted/30 p-4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="pt-6 border-t border-border/50">
                      <Button type="submit" size="lg" className="w-full h-14 rounded-full text-base font-bold shadow-md" disabled={serviceForm.formState.isSubmitting || isCreatingAuth}>
                        {isCreatingAuth ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account…</>
                        ) : serviceForm.formState.isSubmitting ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting…</>
                        ) : (
                          <>List My Services <ArrowRight className="w-5 h-5 ml-2" /></>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-4">
                        Your registration will be reviewed and you'll be contacted via WhatsApp within 24 hours.
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          ROOMS FOR RENT SECTION
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "rooms" && (
        <div className="container mx-auto px-4 mt-6">

          {/* Sub-tab switcher */}
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

          {/* ── FIND A ROOM ─────────────────────────────────────── */}
          {roomTab === "find" && (
            <div className="max-w-5xl mx-auto">
              {/* Location search bar */}
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

              {/* Results */}
              {roomListings.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : roomListings.error ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">Could not load listings</p>
                  <p className="text-sm mt-1">Make sure the database migration has been run. See the migration file <code className="bg-muted px-1 rounded text-xs">008_rooms.sql</code>.</p>
                </div>
              ) : !roomListings.data || roomListings.data.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                  <Home className="w-14 h-14 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg mb-2">No rooms found</p>
                  <p className="text-sm mb-6">
                    {searchedLocation
                      ? `No rooms currently listed in ${searchedLocation}. Try a different location.`
                      : "No rooms listed yet. Be the first to list one!"}
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
                        <div className="p-5 flex flex-col flex-1">
                          {/* Header */}
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="font-bold text-foreground leading-tight flex-1">{room.title}</h3>
                            <Badge className="shrink-0 bg-primary/10 text-primary border-transparent text-[10px]">{room.roomType}</Badge>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {room.location}
                          </div>

                          {/* Price */}
                          {room.pricePerMonth ? (
                            <div className="text-xl font-bold text-foreground mb-3">
                              RM {room.pricePerMonth.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/month</span>
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-muted-foreground mb-3 italic">Price negotiable</div>
                          )}

                          {/* Amenities */}
                          {room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {room.amenities.map((a) => (
                                <span key={a} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{a}</span>
                              ))}
                            </div>
                          )}

                          {/* Available from */}
                          {room.availableFrom && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              Available from {new Date(room.availableFrom).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                          )}

                          {/* Description */}
                          {room.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{room.description}</p>
                          )}

                          {/* Contact button */}
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

              {/* CTA to list */}
              <div className="mt-10 bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
                <Home className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-bold text-lg mb-1">Have a room to rent?</p>
                <p className="text-sm text-muted-foreground mb-4">List it for free and connect with potential tenants across Malaysia.</p>
                <Button onClick={() => setRoomTab("list")} className="rounded-full gap-2">
                  <Home className="w-4 h-4" /> List My Room
                </Button>
              </div>
            </div>
          )}

          {/* ── LIST A ROOM ──────────────────────────────────────── */}
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

                  <Form {...roomForm}>
                    <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-7">

                      {/* Basic info */}
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

                      {/* Room title */}
                      <FormField control={roomForm.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Cozy Master Room in Cheras, near LRT" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Location + Room type */}
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

                      {/* Price + Available from */}
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

                      {/* Amenities */}
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

                      {/* Description */}
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
                        <Button type="submit" size="lg" className="w-full h-14 rounded-full text-base font-bold shadow-md" disabled={roomForm.formState.isSubmitting || createRoomListing.isPending}>
                          {roomForm.formState.isSubmitting || createRoomListing.isPending ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing Listing…</>
                          ) : (
                            <>Publish Room Listing <ArrowRight className="w-5 h-5 ml-2" /></>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                          Your listing will be visible to anyone searching for rooms. Tenants contact you directly on WhatsApp.
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
