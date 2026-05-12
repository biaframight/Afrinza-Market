import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useUpdateSeller,
  useGetProductsBySeller,
  useUpdateProduct,
  useDeleteProduct,
  useCreateProduct,
} from "@/hooks/use-marketplace";
import { uploadProductImage } from "@/lib/supabase-db";
import { updateUserProfile } from "@/lib/supabase-auth";
import type { Product } from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, Package, Plus, Pencil, Trash2, Loader2, ImagePlus,
  X, CheckCircle2, User, DollarSign, ShoppingBag, AlertTriangle, Shield,
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
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Add product form
  const [addForm, setAddForm] = useState({ title: "", description: "", price: "", stock: "1", category: "", deliveryOptions: [] as string[], paymentMethods: [] as string[] });
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addUploading, setAddUploading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const updateSeller = useUpdateSeller();
  const { data: products, isLoading: productsLoading } = useGetProductsBySeller(sellerProfile?.id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();

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

  const handleSaveStore = () => {
    if (!sellerProfile) return;
    if (!storeForm.storeName.trim() || !storeForm.whatsapp.trim()) {
      toast.error("Store name and WhatsApp are required.");
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
    setEditImagePreview(product.imageUrl);
    setEditImageFile(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editForm.title.trim() || !editForm.price) { toast.error("Title and price are required."); return; }
    setEditUploading(true);
    let imageUrl: string | null | undefined = undefined;
    if (editImageFile) {
      const url = await uploadProductImage(editImageFile);
      imageUrl = url ?? editingProduct.imageUrl;
    }
    setEditUploading(false);
    updateProduct.mutate(
      {
        id: editingProduct.id,
        updates: {
          title: editForm.title,
          description: editForm.description,
          price: parseFloat(editForm.price),
          category: editForm.category,
          stock: parseInt(editForm.stock) || 0,
          ...(imageUrl !== undefined && { imageUrl }),
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

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setAddImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAddImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async () => {
    if (!sellerProfile) return;
    if (!addForm.title.trim() || !addForm.price || !addForm.category) {
      toast.error("Title, price, and category are required."); return;
    }
    setAddUploading(true);
    let imageUrl: string | null = null;
    if (addImageFile) {
      imageUrl = await uploadProductImage(addImageFile);
      if (!imageUrl) toast.warning("Image upload failed — product will be listed without a photo.");
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
          imageUrl,
          stock: parseInt(addForm.stock) || 1,
          deliveryOptions: addForm.deliveryOptions,
          paymentMethods: addForm.paymentMethods,
        },
      },
      {
        onSuccess: () => {
          toast.success("Product added!");
          setAddForm({ title: "", description: "", price: "", stock: "1", category: "", deliveryOptions: [], paymentMethods: [] });
          setAddImageFile(null); setAddImagePreview(null);
          if (addFileRef.current) addFileRef.current.value = "";
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
                  <Input value={storeForm.whatsapp} onChange={(e) => setStoreForm((f) => ({ ...f, whatsapp: e.target.value }))} className="h-11 bg-muted/30" />
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
              {/* Image */}
              <div>
                <label className="text-sm font-semibold block mb-2">Product Photo</label>
                <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={handleAddImageChange} />
                {addImagePreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-muted/20">
                    <img src={addImagePreview} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => { setAddImageFile(null); setAddImagePreview(null); if (addFileRef.current) addFileRef.current.value = ""; }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => addFileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                    <ImagePlus className="w-8 h-8" />
                    <p className="text-sm font-medium">Click to upload · Max 5 MB</p>
                  </button>
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
              <label className="text-sm font-semibold block mb-2">Photo</label>
              <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageChange} />
              {editImagePreview ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted/20">
                  <img src={editImagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 flex items-end justify-end p-2">
                    <button type="button" onClick={() => editFileRef.current?.click()} className="bg-black/60 text-white text-xs rounded-full px-3 py-1.5 hover:bg-black/80">Change photo</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => editFileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 transition-all">
                  <ImagePlus className="w-7 h-7" /><p className="text-sm">Upload photo</p>
                </button>
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
