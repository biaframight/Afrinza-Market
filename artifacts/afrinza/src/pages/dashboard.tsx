import { useState, useRef } from "react";
import { useLocation } from "wouter";
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
} from "@/hooks/use-marketplace";
import { uploadProductImage, uploadReceiptImage } from "@/lib/supabase-db";
import { updateUserProfile } from "@/lib/supabase-auth";
import type { Product } from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, Package, Plus, Pencil, Trash2, Loader2, ImagePlus,
  X, CheckCircle2, User, DollarSign, ShoppingBag, AlertTriangle, Shield,
  BadgeCheck, Lock, Phone, Clock, XCircle, CreditCard, Upload,
} from "lucide-react";
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
import { MALAYSIA_LOCATIONS } from "@/lib/malaysia-locations";

const CATEGORIES = ["Food", "Fashion", "Services", "Groceries", "Beauty", "Other"];
const DELIVERY_OPTIONS = ["Afrinza Rider", "Grab Delivery", "Lalamove", "Self Pickup"];
const PAYMENT_METHODS = ["Bank Transfer", "Touch n Go", "DuitNow QR", "Cash on Delivery", "Cash"];

type Tab = "store" | "products" | "add-product" | "profile";

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

  // KYC modal
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycWhatsapp, setKycWhatsapp] = useState("");

  // Subscribe modal
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeStep, setSubscribeStep] = useState<"qr" | "upload">("qr");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [subUploading, setSubUploading] = useState(false);

  // Redirect if not authed
  if (!loading && !isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  if (loading || sellerLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Initialize store form from sellerProfile
  if (sellerProfile && !storeInitialized) {
    setStoreForm({
      storeName: sellerProfile.storeName,
      ownerName: sellerProfile.ownerName,
      description: sellerProfile.description ?? "",
      location: sellerProfile.location,
      whatsapp: sellerProfile.whatsapp,
      categories: sellerProfile.categories,
    });
    setStoreInitialized(true);
    if (!profileForm.fullName) {
      setProfileForm({ fullName: user?.user_metadata?.full_name ?? "" });
    }
  } else if (!profileForm.fullName && user?.user_metadata?.full_name) {
    setProfileForm({ fullName: user.user_metadata.full_name });
  }

  const isSeller = !!sellerProfile;

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
    if (!sellerProfile) return;
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
    { id: "products", label: "My Products", icon: <Package className="w-4 h-4" /> },
    { id: "add-product", label: "Add Product", icon: <Plus className="w-4 h-4" /> },
    { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
  ];

  const buyerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
  ];

  const tabs = isSeller ? sellerTabs : buyerTabs;
  const currentTab = isSeller ? activeTab : "profile";

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
          <a
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
          </a>
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
                  <label className="text-sm font-semibold block mb-1.5">Location</label>
                  <Select value={storeForm.location} onValueChange={(v) => setStoreForm((f) => ({ ...f, location: v }))}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {MALAYSIA_LOCATIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
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
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
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
                    <BadgeCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-blue-900 mb-1 flex items-center gap-2">
                      Store Verified <BadgeCheck className="w-5 h-5 text-blue-500" />
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
        {currentTab === "store" && sellerProfile && (
          <div className="max-w-2xl mt-6">
            {currentSub.data?.status === "confirmed" ? (
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
                      Your RM 10 subscription for <strong>{formatMonth(currentSub.data.month)}</strong> has been confirmed.
                    </p>
                  </div>
                </div>
              </div>
            ) : currentSub.data?.status === "pending" ? (
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
                      Subscribe for <strong>RM 10/month</strong> to keep your seller or service profile active on Afrinza.
                    </p>
                    {currentSub.data?.status === "rejected" && (
                      <p className="text-xs text-red-600 mb-2 mt-1">⚠ Your last payment was rejected. Please resubmit.</p>
                    )}
                    <Button
                      onClick={() => { setSubscribeStep("qr"); setSubscribeOpen(true); }}
                      className="rounded-full gap-2 mt-3"
                      size="sm"
                    >
                      <CreditCard className="w-4 h-4" /> Subscribe — RM 10 / month
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
                    <CreditCard className="w-5 h-5 text-primary" /> Subscribe — RM 10 / month
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <img src="/tng-qr.jpeg" alt="Touch 'n Go QR Code" className="w-full max-w-[220px] mx-auto rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-3">Scan with Touch 'n Go eWallet or any banking app</p>
                    <p className="text-2xl font-bold text-foreground mt-2">RM 10.00</p>
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
                        RM {parseFloat(product.price).toFixed(2)}
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
                  <label className="text-sm font-semibold block mb-1.5">Price (MYR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">RM</span>
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
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary mb-1">Want to sell on Afrinza?</p>
                  <p className="text-xs text-muted-foreground mb-3">Open a store and reach thousands of customers.</p>
                  <Button size="sm" className="rounded-full gap-1.5" onClick={() => setLocation("/become-seller")}>
                    <Store className="w-3.5 h-3.5" /> Open a Store
                  </Button>
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
                <label className="text-sm font-semibold block mb-1.5">Price (MYR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">RM</span>
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

      {/* ── DELETE CONFIRM ──────────────────────────────────────── */}
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
    </div>
  );
}
