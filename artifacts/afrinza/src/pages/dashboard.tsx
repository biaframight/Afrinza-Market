import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useUpdateSeller,
  useGetProductsBySeller,
  useUpdateProduct,
  useDeleteProduct,
  useCreateProduct,
  useSubmitKyc,
  useGetCurrentSubscription,
  useCreateSubscriptionPayment,
  useGetMyRoomListings,
  useGetServiceProviderByUser,
  useGetServiceProviderSub,
  useCreateServiceProviderSub,
  useSubmitServiceProviderKyc,
  useUpdateServiceProvider,
  useUpdateRoomListing,
  useDeleteRoomListing,
  useFeatureFlag,
} from "@/hooks/use-marketplace";
import { uploadProductImage, uploadReceiptImage, uploadServiceProviderReceipt, uploadServicePhoto, uploadRoomPhoto } from "@/lib/supabase-db";
import { updateUserProfile } from "@/lib/supabase-auth";
import type { Product, RoomListing } from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, Package, Plus, Pencil, Trash2, Loader2, ImagePlus,
  X, CheckCircle2, User, DollarSign, ShoppingBag, AlertTriangle, Shield,
  BadgeCheck, Lock, Phone, Clock, XCircle, CreditCard, Upload,
  Wrench, KeyRound, MapPin, ExternalLink,
} from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MALAYSIA_LOCATIONS, CITIES_BY_COUNTRY, LOCATION_COUNTRIES, getCountryForCity, formatPrice, getCurrencyForCity, getCurrencyForCountry } from "@/lib/malaysia-locations";

const CATEGORIES = ["Food", "Fashion", "Services", "Groceries", "Beauty", "Other"];
const DELIVERY_OPTIONS = ["Afrinza Rider", "Grab Delivery", "Lalamove", "Self Pickup"];
const PAYMENT_METHODS = ["Bank Transfer", "Touch n Go", "DuitNow QR", "Cash on Delivery", "Cash"];

type Tab = "store" | "products" | "add-product" | "services" | "rooms" | "profile";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, sellerProfile, sellerLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<Tab>("store");

  // Store edit state
  const [storeForm, setStoreForm] = useState({
    storeName: "", ownerName: "", description: "", location: "", whatsapp: "", categories: [] as string[],
  });
  const [storeInitialized, setStoreInitialized] = useState(false);

  // Product edit dialog
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "", stock: "", category: "", deliveryOptions: [] as string[], paymentMethods: [] as string[] });
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Add product form
  const [addForm, setAddForm] = useState({ title: "", description: "", price: "", stock: "1", category: "", deliveryOptions: [] as string[], paymentMethods: [] as string[] });
  const [addImageFiles, setAddImageFiles] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [addUploading, setAddUploading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const updateSeller = useUpdateSeller();
  const { data: products, isLoading: productsLoading } = useGetProductsBySeller(sellerProfile?.id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const submitKyc = useSubmitKyc();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentSub = useGetCurrentSubscription(sellerProfile?.id, currentMonth);
  const createSubscription = useCreateSubscriptionPayment();
  const myServiceProvider = useGetServiceProviderByUser(user?.id);
  const myRooms = useGetMyRoomListings(
    user?.id,
    sellerProfile?.whatsapp || myServiceProvider.data?.whatsapp
  );
  const submitSpKyc = useSubmitServiceProviderKyc();
  const currentSpSub = useGetServiceProviderSub(myServiceProvider.data?.id, currentMonth);
  const createSpSub = useCreateServiceProviderSub();
  const updateSp = useUpdateServiceProvider();
  const updateRoom = useUpdateRoomListing();
  const deleteRoom = useDeleteRoomListing();

  // KYC modal
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycWhatsapp, setKycWhatsapp] = useState("");

  // Subscribe modal (seller)
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeStep, setSubscribeStep] = useState<"qr" | "upload">("qr");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [subUploading, setSubUploading] = useState(false);

  // SP subscription modal
  const [spSubOpen, setSpSubOpen] = useState(false);
  const [spSubStep, setSpSubStep] = useState<"qr" | "upload">("qr");
  const [spReceiptFile, setSpReceiptFile] = useState<File | null>(null);
  const [spReceiptPreview, setSpReceiptPreview] = useState<string>("");
  const [spSubUploading, setSpSubUploading] = useState(false);
  const spReceiptRef = useRef<HTMLInputElement>(null);

  // SP KYC modal
  const [spKycOpen, setSpKycOpen] = useState(false);
  const [spKycWhatsapp, setSpKycWhatsapp] = useState("");

  // SP edit dialog
  const [spEditOpen, setSpEditOpen] = useState(false);
  const [spEditForm, setSpEditForm] = useState({
    providerName: "", businessName: "", location: "", description: "", experience: "", serviceTypes: [] as string[], customServiceType: "", photos: [] as string[],
  });
  const [spPhotoUploading, setSpPhotoUploading] = useState(false);

  // Room edit / delete
  const [editingRoom, setEditingRoom] = useState<RoomListing | null>(null);
  const [roomEditForm, setRoomEditForm] = useState({
    title: "", description: "", pricePerMonth: "", roomType: "", location: "", amenities: [] as string[], availableFrom: "",
    images: [] as string[],
  });
  const [roomEditNewFiles, setRoomEditNewFiles] = useState<File[]>([]);
  const [roomEditNewPreviews, setRoomEditNewPreviews] = useState<string[]>([]);
  const [roomPhotoUploading, setRoomPhotoUploading] = useState(false);
  const roomEditPhotoRef = useRef<HTMLInputElement>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  // Country selectors for location dependent dropdowns
  const [storeCountry, setStoreCountry] = useState("");
  const [spEditCountry, setSpEditCountry] = useState("");
  const [roomEditCountry, setRoomEditCountry] = useState("");

  // Auto-switch tab from URL param ?tab=X and auto-open modals via ?action=X
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as Tab | null;
    const action = params.get("action");
    const validTabs: Tab[] = ["store", "products", "add-product", "services", "rooms", "profile"];
    if (tab && validTabs.includes(tab)) setActiveTab(tab);
    if (action === "verify-sp") setSpKycOpen(true);
    if (action === "subscribe") { setSubscribeStep("qr"); setSubscribeOpen(true); }
    if (action === "subscribe-sp") { setSpSubStep("qr"); setSpSubOpen(true); }
  }, []);

  // Redirect if not authed
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Initialize store form from sellerProfile — must be before any early return
  useEffect(() => {
    if (sellerProfile && !storeInitialized) {
      setStoreForm({
        storeName: sellerProfile.storeName,
        ownerName: sellerProfile.ownerName,
        description: sellerProfile.description ?? "",
        location: sellerProfile.location,
        whatsapp: sellerProfile.whatsapp,
        categories: sellerProfile.categories,
      });
      setStoreCountry(getCountryForCity(sellerProfile.location));
      setStoreInitialized(true);
    }
  }, [sellerProfile, storeInitialized]);

  // Initialize profile form from user metadata — must be before any early return
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setProfileForm({ fullName: user.user_metadata.full_name });
    }
  }, [user?.id]);

  if (!loading && !isAuthenticated) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (loading || sellerLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSeller = !!sellerProfile;
  const serviceProducts = (products ?? []).filter((p) => p.category === "Services");

  const subFeature = useFeatureFlag("subscription_enabled");
  const subscriptionEnabled = subFeature.data === "true";
  const subCurrencySymbol = sellerProfile ? getCurrencyForCity(sellerProfile.location).symbol : "RM";

  // One subscription covers all roles — seller sub and SP sub are interchangeable
  const anySubConfirmed = currentSub.data?.status === "confirmed" || currentSpSub.data?.status === "confirmed";
  const anySubPending = !anySubConfirmed && (currentSub.data?.status === "pending" || currentSpSub.data?.status === "pending");
  const anySubRejected = !anySubConfirmed && !anySubPending && (currentSub.data?.status === "rejected" || currentSpSub.data?.status === "rejected");

  const isValidPhone = (v: string) =>
    /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, ""));

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${names[parseInt(m) - 1]} ${year}`;
  };

  const handleSubmitReceipt = async () => {
    if (!receiptFile || !sellerProfile) return;
    setSubUploading(true);
    try {
      const url = await uploadReceiptImage(receiptFile);
      await createSubscription.mutateAsync({
        sellerId: sellerProfile.id,
        month: currentMonth,
        receiptUrl: url,
      });
      setSubscribeOpen(false);
      setSubscribeStep("qr");
      setReceiptFile(null);
      setReceiptPreview("");
      toast.success("Payment submitted! We'll confirm it within 24 hours.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setSubUploading(false);
    }
  };

  const handleSpKycSubmit = () => {
    if (!spKycWhatsapp.trim() || !myServiceProvider.data) return;
    if (!isValidPhone(spKycWhatsapp)) {
      toast.error("Enter a valid phone number, e.g. +60123456789 or 0123456789");
      return;
    }
    submitSpKyc.mutate(
      { providerId: myServiceProvider.data.id, whatsapp: spKycWhatsapp },
      {
        onSuccess: () => {
          toast.success("Verification request submitted! Our team will contact you on WhatsApp.");
          setSpKycOpen(false);
          setSpKycWhatsapp("");
          myServiceProvider.refetch();
        },
        onError: () => toast.error("Failed to submit. Please try again."),
      }
    );
  };

  const handleSpReceiptSubmit = async () => {
    if (!spReceiptFile || !myServiceProvider.data) return;
    setSpSubUploading(true);
    try {
      const url = await uploadServiceProviderReceipt(spReceiptFile);
      await createSpSub.mutateAsync({
        providerId: myServiceProvider.data.id,
        month: currentMonth,
        receiptUrl: url,
      });
      setSpSubOpen(false);
      setSpSubStep("qr");
      setSpReceiptFile(null);
      setSpReceiptPreview("");
      toast.success("Payment submitted! We'll confirm within 24 hours.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setSpSubUploading(false);
    }
  };

  const handleKycSubmit = () => {
    if (!kycWhatsapp.trim() || !sellerProfile) return;
    if (!isValidPhone(kycWhatsapp)) {
      toast.error("Enter a valid phone number, e.g. +60123456789 or 0123456789");
      return;
    }
    submitKyc.mutate(
      { sellerId: sellerProfile.id, whatsapp: kycWhatsapp },
      {
        onSuccess: () => {
          toast.success("Verification request submitted! Our team will contact you on WhatsApp.");
          setKycModalOpen(false);
          setKycWhatsapp("");
        },
        onError: () => toast.error("Failed to submit. Please try again."),
      }
    );
  };

  const handleSaveStore = () => {
    if (!sellerProfile) return;
    if (!storeForm.storeName.trim()) {
      toast.error("Store name is required.");
      return;
    }
    if (!storeForm.whatsapp.trim()) {
      toast.error("WhatsApp number is required.");
      return;
    }
    if (!isValidPhone(storeForm.whatsapp)) {
      toast.error("Enter a valid phone number, e.g. +60123456789 or 0123456789");
      return;
    }
    updateSeller.mutate(
      { id: sellerProfile.id, updates: storeForm },
      {
        onSuccess: () => toast.success("Store updated!"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      description: product.description ?? "",
      price: product.price,
      stock: String(product.stock),
      category: product.category,
      deliveryOptions: product.deliveryOptions,
      paymentMethods: product.paymentMethods,
    });
    setEditExistingImages(product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []);
    setEditNewFiles([]);
    setEditNewPreviews([]);
  };

  const handleEditImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!incoming.length) return;
    const remaining = 5 - editExistingImages.length - editNewFiles.length;
    const allowed = incoming.slice(0, remaining);
    if (allowed.length < incoming.length) toast.warning(`Max 5 photos — only ${allowed.length} added.`);
    allowed.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB`); return; }
      setEditNewFiles((prev) => [...prev, f]);
      const reader = new FileReader();
      reader.onload = (ev) => setEditNewPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editForm.title.trim() || !editForm.price) { toast.error("Title and price are required."); return; }
    setEditUploading(true);
    const newUrls: string[] = [];
    for (const f of editNewFiles) {
      const url = await uploadProductImage(f);
      if (url) newUrls.push(url);
    }
    setEditUploading(false);
    const allImages = [...editExistingImages, ...newUrls];
    updateProduct.mutate(
      {
        id: editingProduct.id,
        updates: {
          title: editForm.title,
          description: editForm.description,
          price: parseFloat(editForm.price),
          category: editForm.category,
          stock: parseInt(editForm.stock) || 0,
          images: allImages,
          deliveryOptions: editForm.deliveryOptions,
          paymentMethods: editForm.paymentMethods,
        },
      },
      {
        onSuccess: () => { toast.success("Product updated!"); setEditingProduct(null); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  };

  const handleDeleteProduct = () => {
    if (!deletingId) return;
    deleteProduct.mutate(
      { id: deletingId },
      {
        onSuccess: () => { toast.success("Product deleted."); setDeletingId(null); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
      }
    );
  };

  const handleOpenSpEdit = () => {
    if (!myServiceProvider.data) return;
    setSpEditForm({
      providerName: myServiceProvider.data.providerName,
      businessName: myServiceProvider.data.businessName ?? "",
      location: myServiceProvider.data.location,
      description: myServiceProvider.data.description ?? "",
      experience: myServiceProvider.data.experience ?? "",
      serviceTypes: myServiceProvider.data.serviceTypes,
      customServiceType: myServiceProvider.data.customServiceType ?? "",
      photos: myServiceProvider.data.photos ?? [],
    });
    setSpEditCountry(getCountryForCity(myServiceProvider.data.location));
    setSpEditOpen(true);
  };

  const handleSpPhotoAdd = async (file: File) => {
    setSpPhotoUploading(true);
    try {
      const url = await uploadServicePhoto(file);
      if (url) setSpEditForm((f) => ({ ...f, photos: [...f.photos, url] }));
      else toast.error("Photo upload failed.");
    } catch {
      toast.error("Photo upload failed.");
    } finally {
      setSpPhotoUploading(false);
    }
  };

  const handleSaveSpEdit = () => {
    if (!myServiceProvider.data) return;
    if (!spEditForm.providerName.trim()) { toast.error("Provider name is required."); return; }
    updateSp.mutate(
      {
        id: myServiceProvider.data.id,
        updates: {
          providerName: spEditForm.providerName,
          businessName: spEditForm.businessName,
          location: spEditForm.location,
          description: spEditForm.description,
          experience: spEditForm.experience,
          serviceTypes: spEditForm.serviceTypes,
          customServiceType: spEditForm.customServiceType || null,
          photos: spEditForm.photos,
        },
      },
      {
        onSuccess: () => { toast.success("Service profile updated!"); setSpEditOpen(false); myServiceProvider.refetch(); },
        onError: () => toast.error("Update failed. Please try again."),
      }
    );
  };

  const handleOpenRoomEdit = (room: RoomListing) => {
    setEditingRoom(room);
    setRoomEditForm({
      title: room.title,
      description: room.description ?? "",
      pricePerMonth: room.pricePerMonth != null ? String(room.pricePerMonth) : "",
      roomType: room.roomType,
      location: room.location,
      amenities: room.amenities,
      availableFrom: room.availableFrom ?? "",
      images: room.images ?? [],
    });
    setRoomEditCountry(getCountryForCity(room.location));
    setRoomEditNewFiles([]);
    setRoomEditNewPreviews([]);
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoom) return;
    if (!roomEditForm.title.trim()) { toast.error("Title is required."); return; }
    setRoomPhotoUploading(true);
    let finalImages = [...roomEditForm.images];
    try {
      if (roomEditNewFiles.length > 0) {
        const uploaded = await Promise.all(roomEditNewFiles.map((f) => uploadRoomPhoto(f)));
        finalImages = [...finalImages, ...uploaded.filter((u): u is string => u !== null)];
      }
    } catch {
      toast.error("Photo upload failed. Please try again.");
      setRoomPhotoUploading(false);
      return;
    }
    setRoomPhotoUploading(false);
    updateRoom.mutate(
      {
        id: editingRoom.id,
        updates: {
          title: roomEditForm.title,
          description: roomEditForm.description,
          pricePerMonth: roomEditForm.pricePerMonth ? parseFloat(roomEditForm.pricePerMonth) : null,
          roomType: roomEditForm.roomType,
          location: roomEditForm.location,
          amenities: roomEditForm.amenities,
          availableFrom: roomEditForm.availableFrom || null,
          images: finalImages,
        },
      },
      {
        onSuccess: () => { toast.success("Room listing updated!"); setEditingRoom(null); },
        onError: () => toast.error("Update failed. Please try again."),
      }
    );
  };

  const handleDeleteRoom = () => {
    if (!deletingRoomId) return;
    deleteRoom.mutate(
      { id: deletingRoomId },
      {
        onSuccess: () => { toast.success("Room listing removed."); setDeletingRoomId(null); },
        onError: () => toast.error("Delete failed. Please try again."),
      }
    );
  };

  const handleAddImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!incoming.length) return;
    const remaining = 5 - addImageFiles.length;
    const allowed = incoming.slice(0, remaining);
    if (allowed.length < incoming.length) toast.warning(`Max 5 photos — only ${allowed.length} added.`);
    allowed.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB`); return; }
      setAddImageFiles((prev) => [...prev, f]);
      const reader = new FileReader();
      reader.onload = (ev) => setAddImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeAddImage = (idx: number) => {
    setAddImageFiles((f) => f.filter((_, i) => i !== idx));
    setAddImagePreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleAddProduct = async () => {
    if (!sellerProfile) { toast.error("Seller profile not found. Please refresh the page."); return; }
    if (!addForm.title.trim() || !addForm.price || !addForm.category) {
      toast.error("Title, price, and category are required."); return;
    }
    setAddUploading(true);
    const uploadedUrls: string[] = [];
    for (const f of addImageFiles) {
      const url = await uploadProductImage(f);
      if (url) uploadedUrls.push(url);
    }
    if (addImageFiles.length > 0 && uploadedUrls.length === 0) {
      toast.warning("Image upload failed — product will be listed without a photo.");
    }
    setAddUploading(false);
    createProduct.mutate(
      {
        data: {
          title: addForm.title,
          description: addForm.description,
          price: parseFloat(addForm.price),
          category: addForm.category,
          location: sellerProfile.location,
          sellerId: sellerProfile.id,
          sellerName: sellerProfile.storeName,
          sellerWhatsapp: sellerProfile.whatsapp,
          sellerAvatar: sellerProfile.avatarUrl,
          imageUrl: uploadedUrls[0] ?? null,
          images: uploadedUrls,
          stock: parseInt(addForm.stock) || 1,
          deliveryOptions: addForm.deliveryOptions,
          paymentMethods: addForm.paymentMethods,
        },
      },
      {
        onSuccess: () => {
          toast.success("Product added!");
          setAddForm({ title: "", description: "", price: "", stock: "1", category: "", deliveryOptions: [], paymentMethods: [] });
          setAddImageFiles([]); setAddImagePreviews([]);
          setActiveTab("products");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add product"),
      }
    );
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    const { error } = await updateUserProfile({ fullName: profileForm.fullName });
    setProfileSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated!");
  };

  const sellerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "store", label: "My Store", icon: <Store className="w-4 h-4" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
    { id: "add-product", label: "Add", icon: <Plus className="w-4 h-4" /> },
    { id: "services", label: "Services", icon: <Wrench className="w-4 h-4" /> },
    { id: "rooms", label: "Rooms", icon: <KeyRound className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  ];

  const buyerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "services", label: "Services", icon: <Wrench className="w-4 h-4" /> },
    { id: "rooms", label: "Rooms", icon: <KeyRound className="w-4 h-4" /> },
    { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
  ];

  const tabs = isSeller ? sellerTabs : buyerTabs;
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  const checkboxGroup = (
    options: string[],
    selected: string[],
    onChange: (v: string[]) => void
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox
            checked={selected.includes(opt)}
            onCheckedChange={(c) =>
              c ? onChange([...selected, opt]) : onChange(selected.filter((v) => v !== opt))
            }
          />
          {opt}
        </label>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* Header */}
      <div className="bg-primary text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(user?.user_metadata?.full_name ?? user?.email ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif">
                {user?.user_metadata?.full_name || "My Dashboard"}
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-0.5">
                {isSeller ? `Seller · ${sellerProfile.storeName}` : "Buyer account"} · {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 shadow-sm mb-6 overflow-x-auto">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-1 justify-center transition-all ${
                currentTab === id
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── ADMIN SHORTCUT (Kizito only) ─────────────────────────── */}
        {user?.email === "alphuplift@gmail.com" && (
          <Link
            href="/admin"
            className="flex items-center gap-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-5 mb-6 shadow-lg hover:opacity-95 transition-opacity"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg leading-tight">Admin Panel</p>
              <p className="text-white/80 text-sm mt-0.5">Manage sellers, products & sponsored listings</p>
            </div>
            <span className="text-white/60 text-2xl font-light">›</span>
          </Link>
        )}

        {/* ── MY STORE TAB: no profile fallback ────────────────────── */}
        {currentTab === "store" && !sellerProfile && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Store Profile Found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              We couldn't load your store information. Please refresh the page or contact support.
            </p>
          </div>
        )}

        {/* ── MY STORE TAB ─────────────────────────────────────────── */}
        {currentTab === "store" && sellerProfile && (
          <div className="bg-white rounded-3xl border border-border shadow p-6 md:p-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Store Information
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Store Name</label>
                  <Input value={storeForm.storeName} onChange={(e) => setStoreForm((f) => ({ ...f, storeName: e.target.value }))} className="h-11 bg-muted/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Owner Name</label>
                  <Input value={storeForm.ownerName} onChange={(e) => setStoreForm((f) => ({ ...f, ownerName: e.target.value }))} className="h-11 bg-muted/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Country</label>
                  <Select value={storeCountry} onValueChange={(v) => { setStoreCountry(v); setStoreForm((f) => ({ ...f, location: "" })); }}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {LOCATION_COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">City / State</label>
                  <Select value={storeForm.location} onValueChange={(v) => setStoreForm((f) => ({ ...f, location: v }))} disabled={!storeCountry}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder={storeCountry ? "Select city" : "Select country first"} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {(CITIES_BY_COUNTRY[storeCountry] ?? []).map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">WhatsApp</label>
                  {sellerProfile.isVerified ? (
                    <div className="relative">
                      <Input value={storeForm.whatsapp} readOnly className="h-11 bg-muted/30 pr-10 cursor-not-allowed opacity-70" />
                      <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <Input value={storeForm.whatsapp} onChange={(e) => setStoreForm((f) => ({ ...f, whatsapp: e.target.value }))} className="h-11 bg-muted/30" />
                  )}
                  {sellerProfile.isVerified && (
                    <p className="text-xs text-muted-foreground mt-1">Locked — contact Afrinza support to change your verified number.</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Store Description</label>
                <Textarea value={storeForm.description} onChange={(e) => setStoreForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[100px] bg-muted/30 resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-3">Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={storeForm.categories.includes(cat)}
                        onCheckedChange={(c) =>
                          setStoreForm((f) => ({
                            ...f,
                            categories: c
                              ? [...f.categories, cat]
                              : f.categories.filter((v) => v !== cat),
                          }))
                        }
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleSaveStore} className="rounded-full px-8 h-11" disabled={updateSeller.isPending}>
                {updateSeller.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STORE TAB: KYC VERIFICATION CARD ─────────────────────── */}
        {currentTab === "store" && sellerProfile && (
          <div className="max-w-2xl">
            {sellerProfile.kycStatus === "none" && (
              <div className="bg-white rounded-3xl border border-border shadow p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <VerifiedBadge size="md" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Get Verified</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      A verified badge builds buyer trust and makes your store stand out. Our team will contact you on WhatsApp to confirm your identity.
                    </p>
                    <Button onClick={() => setKycModalOpen(true)} className="rounded-full gap-2" size="sm">
                      <BadgeCheck className="w-4 h-4" /> Start Verification
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {sellerProfile.kycStatus === "pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-amber-900 mb-1">Verification Pending</h3>
                    <p className="text-sm text-amber-800 mb-2">
                      Our team will contact you on WhatsApp at <strong>{sellerProfile.kycWhatsapp}</strong> within 1–2 business days.
                    </p>
                    <p className="text-xs text-amber-700">To change your submitted number, please contact Afrinza support.</p>
                  </div>
                </div>
              </div>
            )}

            {sellerProfile.kycStatus === "verified" && (
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                    <VerifiedBadge size="md" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-blue-900 mb-1 flex items-center gap-2">
                      Store Verified <VerifiedBadge size="md" />
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      Your store has a verified badge visible to all buyers on the marketplace.
                    </p>
                    <p className="text-xs text-blue-700">To update your verified contact number, please reach out to Afrinza support.</p>
                  </div>
                </div>
              </div>
            )}

            {sellerProfile.kycStatus === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-red-900 mb-1">Verification Unsuccessful</h3>
                    <p className="text-sm text-red-800 mb-4">
                      We were unable to verify your store. Please resubmit with a valid WhatsApp number.
                    </p>
                    <Button onClick={() => setKycModalOpen(true)} variant="outline" className="rounded-full gap-2 border-red-300 text-red-700 hover:bg-red-100" size="sm">
                      <Phone className="w-4 h-4" /> Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STORE TAB: SUBSCRIPTION CARD ─────────────────────── */}
        {subscriptionEnabled && currentTab === "store" && sellerProfile && (
          <div className="max-w-2xl mt-6">
            {anySubConfirmed ? (
              <div className="bg-green-50 border border-green-200 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-900 mb-1 flex items-center gap-2">
                      Subscription Active <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </h3>
                    <p className="text-sm text-green-800">
                      Your {subCurrencySymbol} 10 subscription for <strong>{formatMonth(currentMonth)}</strong> is confirmed — covers your store, services, and room listings.
                    </p>
                  </div>
                </div>
              </div>
            ) : anySubPending ? (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-amber-900 mb-1">Payment Pending Confirmation</h3>
                    <p className="text-sm text-amber-800">Your payment proof has been received. We'll confirm it within 24 hours.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-border shadow p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Monthly Subscription</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      One <strong>{subCurrencySymbol} 10/month</strong> subscription keeps your store, services, and room listings all active.
                    </p>
                    {anySubRejected && (
                      <p className="text-xs text-red-600 mb-2 mt-1">⚠ Your last payment was rejected. Please resubmit.</p>
                    )}
                    <Button
                      onClick={() => { setSubscribeStep("qr"); setSubscribeOpen(true); }}
                      className="rounded-full gap-2 mt-3"
                      size="sm"
                    >
                      <CreditCard className="w-4 h-4" /> Subscribe — {subCurrencySymbol} 10 / month
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KYC modal */}
        <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-500" /> Request Store Verification
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Enter the WhatsApp number our team should use to contact you for identity verification.
              </p>
              <div>
                <label className="text-sm font-semibold block mb-1.5">WhatsApp Number</label>
                <Input
                  value={kycWhatsapp}
                  onChange={(e) => setKycWhatsapp(e.target.value)}
                  placeholder="e.g. +60123456789"
                  className="h-11"
                />
              </div>
              <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ Once submitted, this number cannot be changed without contacting Afrinza support.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKycModalOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleKycSubmit} disabled={!kycWhatsapp.trim() || submitKyc.isPending} className="rounded-full gap-2">
                {submitKyc.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><BadgeCheck className="w-4 h-4" /> Submit Request</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscribe modal */}
        <Dialog
          open={subscribeOpen}
          onOpenChange={(open) => {
            if (!subUploading) {
              setSubscribeOpen(open);
              if (!open) { setSubscribeStep("qr"); setReceiptFile(null); setReceiptPreview(""); }
            }
          }}
        >
          <DialogContent className="max-w-sm rounded-3xl">
            {subscribeStep === "qr" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Subscribe — {subCurrencySymbol} 10 / month
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <img src="/tng-qr.jpeg" alt="Touch 'n Go QR Code" className="w-full max-w-[220px] mx-auto rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-3">Scan with Touch 'n Go eWallet or any banking app</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{subCurrencySymbol} 10.00</p>
                    <p className="text-xs text-muted-foreground">Monthly subscription fee</p>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    After paying, take a screenshot of your payment confirmation and tap "I've Paid".
                  </p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button onClick={() => setSubscribeStep("upload")} className="rounded-full gap-2 w-full">
                    <CheckCircle2 className="w-4 h-4" /> I've Paid — Upload Proof
                  </Button>
                  <Button variant="outline" onClick={() => setSubscribeOpen(false)} className="rounded-full w-full">Cancel</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" /> Upload Payment Proof
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                  <p className="text-sm text-muted-foreground">Upload a screenshot of your payment confirmation from Touch 'n Go or your banking app.</p>
                  <input
                    ref={receiptRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setReceiptFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  {receiptPreview ? (
                    <div className="relative">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full rounded-2xl max-h-48 object-contain bg-muted" />
                      <button
                        onClick={() => { setReceiptFile(null); setReceiptPreview(""); }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => receiptRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-2xl py-8 text-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Tap to upload screenshot</p>
                      <p className="text-xs mt-1 opacity-70">JPG, PNG, or WEBP</p>
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3">
                    ⏳ Payment will be reviewed and approved within 24 hours.
                  </p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button
                    onClick={handleSubmitReceipt}
                    disabled={!receiptFile || subUploading}
                    className="rounded-full gap-2 w-full"
                  >
                    {subUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><Upload className="w-4 h-4" /> Submit Proof</>
                    }
                  </Button>
                  <Button variant="outline" onClick={() => setSubscribeStep("qr")} disabled={subUploading} className="rounded-full w-full">
                    ← Back
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MY PRODUCTS TAB ──────────────────────────────────────── */}
        {currentTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> My Products
              </h2>
              <Button onClick={() => setActiveTab("add-product")} className="rounded-full gap-2" size="sm">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : !products || products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-border shadow p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No products yet</h3>
                <p className="text-muted-foreground text-sm mb-6">Start adding products to your store.</p>
                <Button onClick={() => setActiveTab("add-product")} className="rounded-full gap-2">
                  <Plus className="w-4 h-4" /> Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="aspect-square bg-white relative overflow-hidden border-b border-border/40">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ImagePlus className="w-10 h-10" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {formatPrice(product.price, product.location)}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{product.title}</h3>
                      <p className="text-xs text-muted-foreground">{product.category} · Stock: {product.stock}</p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 rounded-full gap-1.5" onClick={() => openEditDialog(product)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeletingId(product.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY SERVICES TAB ──────────────────────────────────────── */}
        {currentTab === "services" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> My Services
              </h2>
            </div>

            {myServiceProvider.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : myServiceProvider.data ? (
              /* ── Has SP profile ─── */
              <div className="space-y-5 max-w-2xl">
                {/* Profile card */}
                <div className="bg-white rounded-3xl border border-border shadow p-6">
                  <div className="flex items-start gap-4 mb-5">
                    {myServiceProvider.data.photos.length > 0 ? (
                      <img src={myServiceProvider.data.photos[0]} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Wrench className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-lg">{myServiceProvider.data.providerName}</h3>
                        {myServiceProvider.data.isVerified && <VerifiedBadge size="md" />}
                      </div>
                      {myServiceProvider.data.businessName && (
                        <p className="text-sm text-muted-foreground">{myServiceProvider.data.businessName}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {myServiceProvider.data.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {myServiceProvider.data.serviceTypes.map((t) => (
                      <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{t}</span>
                    ))}
                    {myServiceProvider.data.customServiceType && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">{myServiceProvider.data.customServiceType}</span>
                    )}
                  </div>
                  {myServiceProvider.data.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{myServiceProvider.data.description}</p>
                  )}
                </div>

                {/* Verification card */}
                <div className="bg-white rounded-3xl border border-border shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${myServiceProvider.data.isVerified ? "bg-blue-50" : myServiceProvider.data.kycStatus === "pending" ? "bg-amber-50" : "bg-muted"}`}>
                      {myServiceProvider.data.isVerified ? (
                        <VerifiedBadge size="md" />
                      ) : myServiceProvider.data.kycStatus === "pending" ? (
                        <Clock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Shield className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-0.5">Identity Verification</p>
                      {myServiceProvider.data.isVerified ? (
                        <p className="text-xs text-blue-600 font-medium">Verified ✓ — your profile shows a verified badge</p>
                      ) : myServiceProvider.data.kycStatus === "pending" ? (
                        <p className="text-xs text-amber-600">Under review — our team will contact you on WhatsApp within 24 hours.</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">Get a verified badge on your profile by completing identity verification.</p>
                          <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => setSpKycOpen(true)}>
                            <Shield className="w-3.5 h-3.5" /> Request Verification
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription card — shared with seller subscription */}
                {subscriptionEnabled && !anySubConfirmed && !anySubPending && (
                  <div className="bg-white rounded-3xl border border-border shadow p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-0.5">Monthly Subscription · {formatMonth(currentMonth)}</p>
                        {anySubRejected && (
                          <p className="text-xs text-red-600 mb-1">⚠ Last payment rejected — please resubmit.</p>
                        )}
                        <p className="text-xs text-muted-foreground mb-3">
                          One {subCurrencySymbol} 10/month subscription covers your store, services, and room listings.
                        </p>
                        {isSeller ? (
                          // Dual-role user: one payment goes through the seller sub (covers all roles)
                          <Button size="sm" className="rounded-full gap-1.5" onClick={() => { setSubscribeStep("qr"); setSubscribeOpen(true); }}>
                            <CreditCard className="w-3.5 h-3.5" /> Pay {subCurrencySymbol} 10 Subscription
                          </Button>
                        ) : (
                          // SP-only user: use SP sub modal
                          <Button size="sm" className="rounded-full gap-1.5" onClick={() => { setSpSubStep("qr"); setSpSubOpen(true); }}>
                            <CreditCard className="w-3.5 h-3.5" /> Pay {subCurrencySymbol} 10 Subscription
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {subscriptionEnabled && anySubConfirmed && (
                  <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-0.5 text-green-900">Subscription Active · {formatMonth(currentMonth)}</p>
                        <p className="text-xs text-green-700">{subCurrencySymbol} 10 confirmed — covers your store, services &amp; room listings ✓</p>
                      </div>
                    </div>
                  </div>
                )}
                {subscriptionEnabled && anySubPending && (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-0.5 text-amber-900">Payment Pending · {formatMonth(currentMonth)}</p>
                        <p className="text-xs text-amber-700">Receipt submitted — admin will confirm within 24 hours.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleOpenSpEdit}>
                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setLocation("/services")}>
                    <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
                  </Button>
                </div>
              </div>
            ) : (
              /* ── No SP profile ─── */
              <div className="bg-white rounded-3xl border border-border shadow p-10 text-center max-w-md">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Register as a Service Provider</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Reach Africans across Malaysia — list your skills as an Afrinza Rider, hair braider, plumber, caterer, and more.
                </p>
                <Button className="rounded-full gap-2 w-full" onClick={() => setLocation("/services?register=true")}>
                  <Wrench className="w-4 h-4" /> Register as Service Provider
                </Button>
                {subscriptionEnabled && <p className="text-xs text-muted-foreground mt-3">{subCurrencySymbol} 10/month subscription · Profile goes live instantly</p>}
              </div>
            )}
          </div>
        )}

        {/* ── MY ROOMS TAB ─────────────────────────────────────────── */}
        {currentTab === "rooms" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> My Room Listings
              </h2>
              <Button className="rounded-full gap-2" size="sm" onClick={() => setLocation("/services?tab=rooms")}>
                <Plus className="w-4 h-4" /> List a New Room
              </Button>
            </div>

            {myRooms.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : !myRooms.data || myRooms.data.length === 0 ? (
              <div className="bg-white rounded-3xl border border-border shadow p-12 text-center">
                <KeyRound className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No rooms listed yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  List your room and connect with Africans across Malaysia looking for accommodation.
                </p>
                <Button className="rounded-full gap-2" onClick={() => setLocation("/services?tab=rooms")}>
                  <KeyRound className="w-4 h-4" /> List a Room
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.data.map((room) => (
                  <div key={room.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {room.isActive ? (
                          <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending Approval</span>
                        )}
                        <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-full">{room.roomType}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{room.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {room.location}
                    </p>
                    {room.pricePerMonth != null && (
                      <p className="text-sm font-bold text-primary">
                        {getCurrencyForCity(room.location).symbol} {room.pricePerMonth.toFixed(0)}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    )}
                    {room.amenities.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{room.amenities.join(" · ")}</p>
                    )}
                    {room.availableFrom && (
                      <p className="text-xs text-muted-foreground mt-1">Available: {room.availableFrom}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 rounded-full gap-1.5" onClick={() => handleOpenRoomEdit(room)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeletingRoomId(room.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sellerProfile?.whatsapp && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">How room listings are matched</p>
                <p className="text-xs">
                  Rooms are matched by your registered WhatsApp number (<strong>{sellerProfile.whatsapp}</strong>).
                  Use this same number when listing rooms to see them here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── ADD PRODUCT TAB ──────────────────────────────────────── */}
        {currentTab === "add-product" && sellerProfile && (
          <div className="bg-white rounded-3xl border border-border shadow p-6 md:p-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add New Product
            </h2>
            <div className="space-y-5">
              {/* Images */}
              <div>
                <label className="text-sm font-semibold block mb-2">
                  Product Photos <span className="text-muted-foreground font-normal text-xs">({addImageFiles.length}/5 · up to 5 photos)</span>
                </label>
                <input ref={addFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImagesChange} />
                {addImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {addImagePreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted/20 shrink-0">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeAddImage(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary text-white font-bold py-0.5">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
                {addImageFiles.length < 5 ? (
                  <button type="button" onClick={() => addFileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                    <ImagePlus className="w-7 h-7" />
                    <p className="text-sm font-medium">{addImageFiles.length === 0 ? "Click to upload · up to 5 photos · max 5 MB each" : `Add more (${5 - addImageFiles.length} slot${5 - addImageFiles.length !== 1 ? "s" : ""} left)`}</p>
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">5 photos added (maximum reached)</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold block mb-1.5">Product Name</label>
                  <Input placeholder="e.g. Jollof Rice Party Pack" value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} className="h-11 bg-muted/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Price ({storeCountry ? getCurrencyForCountry(storeCountry).code : "MYR"})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{storeCountry ? getCurrencyForCountry(storeCountry).symbol : "RM"}</span>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} className="h-11 bg-muted/30 pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Stock</label>
                  <Input type="number" min="0" value={addForm.stock} onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))} className="h-11 bg-muted/30" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold block mb-1.5">Category</label>
                  <Select value={addForm.category} onValueChange={(v) => setAddForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Description</label>
                <Textarea placeholder="Describe your product…" value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[90px] bg-muted/30 resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-3">Delivery Options</label>
                {checkboxGroup(DELIVERY_OPTIONS, addForm.deliveryOptions, (v) => setAddForm((f) => ({ ...f, deliveryOptions: v })))}
              </div>
              <div>
                <label className="text-sm font-semibold block mb-3">Payment Methods</label>
                {checkboxGroup(PAYMENT_METHODS, addForm.paymentMethods, (v) => setAddForm((f) => ({ ...f, paymentMethods: v })))}
              </div>
              <Button onClick={handleAddProduct} className="rounded-full px-8 h-11 w-full" disabled={createProduct.isPending || addUploading}>
                {addUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : createProduct.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding…</> : <><Plus className="w-4 h-4 mr-2" />Add Product</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ──────────────────────────────────────────── */}
        {currentTab === "profile" && (
          <div className="bg-white rounded-3xl border border-border shadow p-6 md:p-8 max-w-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> My Profile
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Full Name</label>
                <Input value={profileForm.fullName} onChange={(e) => setProfileForm({ fullName: e.target.value })} className="h-11 bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5 text-muted-foreground">Email (cannot change)</label>
                <Input value={user?.email ?? ""} disabled className="h-11 bg-muted/20 text-muted-foreground" />
              </div>
              {!isSeller && (
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold mb-1">Start listing on Afrinza</p>
                  {subscriptionEnabled && (
                    <p className="text-xs text-muted-foreground mb-3">
                      One {subCurrencySymbol} 10/month subscription covers all three — sell products, offer services, and list rooms.
                    </p>
                  )}
                  <div className="space-y-2">
                    <button
                      onClick={() => setLocation("/become-seller")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Open a Store</p>
                        <p className="text-xs text-muted-foreground">Sell products to Africans across Malaysia</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setLocation("/services")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Register a Service</p>
                        <p className="text-xs text-muted-foreground">Offer skills — delivery, hair braiding, repairs &amp; more</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setLocation("/services?tab=rooms")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">List a Room for Rent</p>
                        <p className="text-xs text-muted-foreground">Connect with Africans looking for accommodation</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              <Button onClick={handleSaveProfile} className="rounded-full px-8 h-11" disabled={profileSaving}>
                {profileSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Profile</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT PRODUCT DIALOG ─────────────────────────────────── */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Photos <span className="text-muted-foreground font-normal text-xs">({editExistingImages.length + editNewFiles.length}/5)</span>
              </label>
              <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditImagesChange} />
              {(editExistingImages.length > 0 || editNewPreviews.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {editExistingImages.map((src, i) => (
                    <div key={`ex-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted/20 shrink-0">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditExistingImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && editNewFiles.length === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary text-white font-bold py-0.5">Cover</span>}
                    </div>
                  ))}
                  {editNewPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-dashed border-primary/50 bg-primary/5 shrink-0">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setEditNewFiles((f) => f.filter((_, j) => j !== i)); setEditNewPreviews((p) => p.filter((_, j) => j !== i)); }} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary/80 text-white font-bold py-0.5">New</span>
                    </div>
                  ))}
                </div>
              )}
              {editExistingImages.length + editNewFiles.length < 5 ? (
                <button type="button" onClick={() => editFileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <ImagePlus className="w-6 h-6" />
                  <p className="text-xs">{editExistingImages.length + editNewFiles.length === 0 ? "Upload photos (up to 5)" : `Add more (${5 - editExistingImages.length - editNewFiles.length} left)`}</p>
                </button>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-1">5 photos (maximum reached)</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">Product Name</label>
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="h-11 bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Price ({storeCountry ? getCurrencyForCountry(storeCountry).code : "MYR"})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">{storeCountry ? getCurrencyForCountry(storeCountry).symbol : "RM"}</span>
                  <Input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="h-11 bg-muted/30 pl-9" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Stock</label>
                <Input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))} className="h-11 bg-muted/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">Category</label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">Description</label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[80px] bg-muted/30 resize-none" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Delivery Options</label>
              {checkboxGroup(DELIVERY_OPTIONS, editForm.deliveryOptions, (v) => setEditForm((f) => ({ ...f, deliveryOptions: v })))}
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Payment Methods</label>
              {checkboxGroup(PAYMENT_METHODS, editForm.paymentMethods, (v) => setEditForm((f) => ({ ...f, paymentMethods: v })))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSaveProduct} disabled={updateProduct.isPending || editUploading}>
              {editUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : updateProduct.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SP KYC MODAL ─────────────────────────────────────────── */}
      <Dialog open={spKycOpen} onOpenChange={setSpKycOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Request Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Our team will contact you on WhatsApp to verify your identity. Once verified, your profile will show a verified badge.
            </p>
            <div>
              <label className="text-sm font-semibold block mb-1.5">Your WhatsApp Number</label>
              <Input placeholder="+60123456789" value={spKycWhatsapp} onChange={(e) => setSpKycWhatsapp(e.target.value)} className="h-11 bg-muted/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setSpKycOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSpKycSubmit} disabled={submitSpKyc.isPending}>
              {submitSpKyc.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SP SUBSCRIPTION MODAL ────────────────────────────────── */}
      <Dialog open={spSubOpen} onOpenChange={(open) => { setSpSubOpen(open); if (!open) { setSpSubStep("qr"); setSpReceiptFile(null); setSpReceiptPreview(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pay Monthly Subscription</DialogTitle>
          </DialogHeader>
          {spSubStep === "qr" ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Scan the QR code below using Touch 'n Go or DuitNow to pay {subCurrencySymbol} 10 for <strong>{formatMonth(currentMonth)}</strong>.</p>
              <div className="flex flex-col items-center gap-3 bg-muted/20 rounded-2xl p-4">
                <img src="/tng-qr.jpeg" alt="TNG QR" className="w-40 h-40 object-contain rounded-xl" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="text-center">
                  <p className="font-bold text-sm">{subCurrencySymbol} 10 / month</p>
                  <p className="text-xs text-muted-foreground">Touch 'n Go · DuitNow</p>
                </div>
              </div>
              <Button className="w-full rounded-full" onClick={() => setSpSubStep("upload")}>
                <Upload className="w-4 h-4 mr-2" /> I've Paid — Upload Receipt
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Upload a screenshot of your payment to confirm your subscription.</p>
              <input ref={spReceiptRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSpReceiptFile(f);
                const reader = new FileReader();
                reader.onload = (ev) => setSpReceiptPreview(ev.target?.result as string);
                reader.readAsDataURL(f);
              }} />
              {spReceiptPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border h-36">
                  <img src={spReceiptPreview} alt="" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => { setSpReceiptFile(null); setSpReceiptPreview(""); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => spReceiptRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <Upload className="w-6 h-6" />
                  <p className="text-sm">Click to upload receipt screenshot</p>
                </button>
              )}
              <DialogFooter className="gap-2 flex-row">
                <Button variant="outline" className="rounded-full flex-1" onClick={() => setSpSubStep("qr")}>Back</Button>
                <Button className="rounded-full flex-1" onClick={handleSpReceiptSubmit} disabled={!spReceiptFile || spSubUploading}>
                  {spSubUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : "Submit Receipt"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE PRODUCT CONFIRM ──────────────────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The product will be permanently removed from your store.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="rounded-full bg-destructive hover:bg-destructive/90" disabled={deleteProduct.isPending}>
              {deleteProduct.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── SP EDIT DIALOG ──────────────────────────────────────── */}
      <Dialog open={spEditOpen} onOpenChange={setSpEditOpen}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Service Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Provider / Your Name</label>
                <Input value={spEditForm.providerName} onChange={(e) => setSpEditForm((f) => ({ ...f, providerName: e.target.value }))} className="h-11 bg-muted/30" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Business Name <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input value={spEditForm.businessName} onChange={(e) => setSpEditForm((f) => ({ ...f, businessName: e.target.value }))} className="h-11 bg-muted/30" placeholder="e.g. Kwame Rides" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Country</label>
                <Select value={spEditCountry} onValueChange={(v) => { setSpEditCountry(v); setSpEditForm((f) => ({ ...f, location: "" })); }}>
                  <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LOCATION_COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">City / State</label>
                <Select value={spEditForm.location} onValueChange={(v) => setSpEditForm((f) => ({ ...f, location: v }))} disabled={!spEditCountry}>
                  <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder={spEditCountry ? "Select city" : "Select country first"} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(CITIES_BY_COUNTRY[spEditCountry] ?? []).map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Description</label>
                <Textarea value={spEditForm.description} onChange={(e) => setSpEditForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[80px] bg-muted/30 resize-none" placeholder="Tell clients about your services…" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Experience <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input value={spEditForm.experience} onChange={(e) => setSpEditForm((f) => ({ ...f, experience: e.target.value }))} className="h-11 bg-muted/30" placeholder="e.g. 3 years" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Service Types</label>
              <div className="grid grid-cols-2 gap-2">
                {["Afrinza Rider","Delivery","Plumbing","Electrical","Hair Braiding","Cargo","Cleaning","Catering","Tailoring","Car Repair","Other"].map((svc) => (
                  <label key={svc} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={spEditForm.serviceTypes.includes(svc)}
                      onCheckedChange={(c) => setSpEditForm((f) => ({
                        ...f,
                        serviceTypes: c ? [...f.serviceTypes, svc] : f.serviceTypes.filter((v) => v !== svc),
                      }))}
                    />
                    {svc}
                  </label>
                ))}
              </div>
            </div>
            {spEditForm.serviceTypes.includes("Other") && (
              <div>
                <label className="text-sm font-semibold block mb-1.5">Custom Service Type</label>
                <Input value={spEditForm.customServiceType} onChange={(e) => setSpEditForm((f) => ({ ...f, customServiceType: e.target.value }))} className="h-11 bg-muted/30" placeholder="Describe your service" />
              </div>
            )}

            {/* ── PHOTOS ─────────────────────────────────────────── */}
            <div>
              <label className="text-sm font-semibold block mb-2">Photos <span className="font-normal text-muted-foreground">(up to 6)</span></label>
              <div className="grid grid-cols-3 gap-2">
                {spEditForm.photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                    <img src={url} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSpEditForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {spEditForm.photos.length < 6 && (
                  <label className={`aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-1 transition-colors ${spPhotoUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/70"}`}>
                    {spPhotoUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={spPhotoUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSpPhotoAdd(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setSpEditOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSaveSpEdit} disabled={updateSp.isPending}>
              {updateSp.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ROOM EDIT DIALOG ────────────────────────────────────── */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => { if (!open) setEditingRoom(null); }}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Room Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold block mb-1.5">Title</label>
              <Input value={roomEditForm.title} onChange={(e) => setRoomEditForm((f) => ({ ...f, title: e.target.value }))} className="h-11 bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Room Type</label>
                <Select value={roomEditForm.roomType} onValueChange={(v) => setRoomEditForm((f) => ({ ...f, roomType: v }))}>
                  <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Single Room","Master Room","Suite / Studio","Shared Room"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Price / month ({roomEditCountry ? getCurrencyForCountry(roomEditCountry).code : "MYR"})</label>
                <Input type="number" min="0" value={roomEditForm.pricePerMonth} onChange={(e) => setRoomEditForm((f) => ({ ...f, pricePerMonth: e.target.value }))} className="h-11 bg-muted/30" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Country</label>
                <Select value={roomEditCountry} onValueChange={(v) => { setRoomEditCountry(v); setRoomEditForm((f) => ({ ...f, location: "" })); }}>
                  <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LOCATION_COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">City / State</label>
                <Select value={roomEditForm.location} onValueChange={(v) => setRoomEditForm((f) => ({ ...f, location: v }))} disabled={!roomEditCountry}>
                  <SelectTrigger className="h-11 bg-muted/30"><SelectValue placeholder={roomEditCountry ? "Select city" : "Select country first"} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(CITIES_BY_COUNTRY[roomEditCountry] ?? []).map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Available From <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input type="date" value={roomEditForm.availableFrom} onChange={(e) => setRoomEditForm((f) => ({ ...f, availableFrom: e.target.value }))} className="h-11 bg-muted/30" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Textarea value={roomEditForm.description} onChange={(e) => setRoomEditForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[80px] bg-muted/30 resize-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {["WiFi","Air Conditioning","Water Heater","Parking","Washing Machine","Kitchen Access","Private Bathroom","Fully Furnished"].map((a) => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={roomEditForm.amenities.includes(a)}
                      onCheckedChange={(c) => setRoomEditForm((f) => ({
                        ...f,
                        amenities: c ? [...f.amenities, a] : f.amenities.filter((v) => v !== a),
                      }))}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="text-sm font-semibold block mb-2">Photos</label>
              {roomEditForm.images.length === 0 && roomEditNewPreviews.length === 0 && (
                <p className="text-xs text-muted-foreground mb-2">No photos yet.</p>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {roomEditForm.images.map((url, i) => (
                  <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    <img src={url} alt={`photo-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setRoomEditForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {roomEditNewPreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/40 group">
                    <img src={src} alt={`new-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setRoomEditNewFiles((f) => f.filter((_, idx) => idx !== i));
                        setRoomEditNewPreviews((p) => p.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-primary/80 text-white text-center py-0.5">New</span>
                  </div>
                ))}
              </div>
              <input
                ref={roomEditPhotoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  setRoomEditNewFiles((prev) => [...prev, ...files]);
                  files.forEach((f) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => setRoomEditNewPreviews((prev) => [...prev, ev.target?.result as string]);
                    reader.readAsDataURL(f);
                  });
                }}
              />
              <Button type="button" variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => roomEditPhotoRef.current?.click()}>
                <ImagePlus className="w-4 h-4" /> Add Photos
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditingRoom(null)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSaveRoomEdit} disabled={updateRoom.isPending || roomPhotoUploading}>
              {(updateRoom.isPending || roomPhotoUploading) ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{roomPhotoUploading ? "Uploading…" : "Saving…"}</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE ROOM CONFIRM ──────────────────────────────────── */}
      <AlertDialog open={!!deletingRoomId} onOpenChange={(open) => { if (!open) setDeletingRoomId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Remove Room Listing?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the room listing. It will no longer appear to potential renters.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} className="rounded-full bg-destructive hover:bg-destructive/90" disabled={deleteRoom.isPending}>
              {deleteRoom.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removing…</> : "Remove Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
