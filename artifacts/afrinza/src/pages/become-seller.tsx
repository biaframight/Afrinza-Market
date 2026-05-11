import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateSeller, useCreateProduct } from "@/hooks/use-marketplace";
import { uploadProductImage } from "@/lib/supabase-db";
import type { Seller } from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, User, MapPin, Phone, CheckCircle2, Package,
  DollarSign, ImagePlus, X, ArrowRight, ChevronLeft, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MALAYSIA_LOCATIONS } from "@/lib/malaysia-locations";

const CATEGORIES = [
  { id: "Food", label: "African Food & Catering" },
  { id: "Fashion", label: "Fashion, Clothing & Tailoring" },
  { id: "Services", label: "Services (Hair, Plumbing, Delivery & More)" },
  { id: "Groceries", label: "Groceries & African Spices" },
  { id: "Beauty", label: "Beauty & Skincare Products" },
  { id: "Other", label: "Other" },
];

const DELIVERY_OPTIONS = ["Grab Delivery", "Lalamove", "Poslaju", "J&T Express", "Self Pickup"];
const PAYMENT_METHODS = ["Bank Transfer", "Touch n Go", "DuitNow QR", "Cash on Delivery", "Cash"];

const storeSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  ownerName: z.string().min(2, "Owner name is required"),
  location: z.string().min(1, "Location is required"),
  whatsapp: z.string().min(8, "Valid WhatsApp number required"),
  description: z.string().min(10, "Please provide a brief description of what you sell"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
});

const productSchema = z.object({
  title: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Describe your product for buyers"),
  price: z.string().refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Enter a valid price greater than 0"
  ),
  category: z.string().min(1, "Select a category"),
  stock: z.string().refine(
    (v) => !isNaN(parseInt(v)) && parseInt(v) >= 0,
    "Enter a valid stock quantity"
  ),
  deliveryOptions: z.array(z.string()).min(1, "Select at least one delivery option"),
  paymentMethods: z.array(z.string()).min(1, "Select at least one payment method"),
});

type StoreFormValues = z.infer<typeof storeSchema>;
type ProductFormValues = z.infer<typeof productSchema>;

export default function BecomeSeller() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdSeller, setCreatedSeller] = useState<Seller | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSeller = useCreateSeller();
  const createProduct = useCreateProduct();

  const storeForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "", ownerName: "", location: "",
      whatsapp: "", description: "", categories: [],
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "", description: "", price: "", category: "",
      stock: "1", deliveryOptions: [], paymentMethods: [],
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onStoreSubmit = (data: StoreFormValues) => {
    const categoryQuery = data.categories[0]?.toLowerCase() || "store";
    createSeller.mutate(
      {
        data: {
          ...data,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.storeName)}&backgroundColor=00897b,e53935,1e88e5,ffb300`,
          bannerUrl: `/images/seller-${categoryQuery === "groceries" ? "grocery" : categoryQuery}.png`,
        },
      },
      {
        onSuccess: (seller) => {
          setCreatedSeller(seller);
          setStep(2);
          if (seller.categories[0]) {
            productForm.setValue("category", seller.categories[0]);
          }
          window.scrollTo(0, 0);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to create store.";
          toast.error(msg);
          console.error("[Afrinza] createSeller error:", err);
        },
      }
    );
  };

  const onProductSubmit = async (data: ProductFormValues) => {
    if (!createdSeller) return;
    setIsUploading(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
      if (!imageUrl) {
        toast.warning("Image upload failed — your product will be listed without a photo. You can add one later.");
      }
    }

    setIsUploading(false);

    createProduct.mutate(
      {
        data: {
          title: data.title,
          description: data.description,
          price: parseFloat(data.price),
          category: data.category,
          location: createdSeller.location,
          sellerId: createdSeller.id,
          sellerName: createdSeller.storeName,
          sellerWhatsapp: createdSeller.whatsapp,
          sellerAvatar: createdSeller.avatarUrl,
          imageUrl,
          stock: parseInt(data.stock),
          deliveryOptions: data.deliveryOptions,
          paymentMethods: data.paymentMethods,
        },
      },
      {
        onSuccess: () => setIsSuccess(true),
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to add product.";
          toast.error(msg);
          console.error("[Afrinza] createProduct error:", err);
        },
      }
    );
  };

  const handleSkipProduct = () => setIsSuccess(true);

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4 text-center">
          {createdSeller ? "Store & Product Created!" : "Store Created!"}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
          Welcome to Afrinza! Your store is now live. Buyers can find you and contact you on WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setLocation("/sellers")} className="rounded-full px-8 h-12 text-base font-bold shadow-md">
            View Stores Directory
          </Button>
          <Button variant="outline" onClick={() => setLocation("/products")} className="rounded-full px-8 h-12 text-base">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <div className="bg-primary pt-16 pb-32 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 font-medium text-sm mb-6">
            {step === 1 ? "Step 1 of 2 — Store Details" : "Step 2 of 2 — Add Your First Product"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight">
            {step === 1
              ? "Start Selling to the African Community in Malaysia"
              : `Great! Now list your first product, ${createdSeller?.ownerName.split(" ")[0]}`}
          </h1>
          <p className="text-primary-foreground/90 text-lg">
            {step === 1
              ? "It takes less than 2 minutes to open your store and reach thousands of buyers."
              : "Help buyers discover what you're selling. You can add more products anytime."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl border border-border shadow-xl max-w-3xl mx-auto overflow-hidden">

          {/* ── Step indicator ─────────────────────────────── */}
          <div className="flex border-b border-border/60">
            {[
              { n: 1, label: "Store Details", icon: <Store className="w-4 h-4" /> },
              { n: 2, label: "First Product", icon: <Package className="w-4 h-4" /> },
            ].map(({ n, label, icon }) => (
              <div
                key={n}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                  step === n
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : step > n
                    ? "text-green-600 bg-green-50/50"
                    : "text-muted-foreground"
                }`}
              >
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : icon}
                {label}
              </div>
            ))}
          </div>

          <div className="p-6 md:p-10">

            {/* ════════════════ STEP 1: STORE DETAILS ════════════════ */}
            {step === 1 && (
              <Form {...storeForm}>
                <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-8">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={storeForm.control} name="storeName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" /> Store Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mama's Kitchen" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={storeForm.control} name="ownerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" /> Your Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={storeForm.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" /> State / City
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-muted/30">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-64">
                            {MALAYSIA_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={storeForm.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" /> WhatsApp Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+60 12-345 6789" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Buyers will contact this number directly.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={storeForm.control} name="categories" render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-semibold">What do you sell?</FormLabel>
                        <FormDescription>Select all that apply.</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => (
                          <FormField key={cat.id} control={storeForm.control} name="categories" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(cat.id)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([...field.value, cat.id])
                                      : field.onChange(field.value?.filter((v) => v !== cat.id))
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer w-full text-sm leading-none">{cat.label}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={storeForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Store Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell customers about your products, your origin, and what makes your store special..."
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
                      disabled={createSeller.isPending}
                    >
                      {createSeller.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Store…</>
                      ) : (
                        <>Next: Add Your First Product <ArrowRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      By continuing, you agree to the Afrinza Seller Guidelines and Terms of Service.
                    </p>
                  </div>
                </form>
              </Form>
            )}

            {/* ════════════════ STEP 2: FIRST PRODUCT ════════════════ */}
            {step === 2 && (
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-8">

                  {/* Product image upload */}
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-muted-foreground" /> Product Photo
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {imagePreview ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border bg-muted/10">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <ImagePlus className="w-10 h-10" />
                        <div className="text-center">
                          <p className="font-semibold text-sm">Click to upload a photo</p>
                          <p className="text-xs mt-1">JPG, PNG or WebP · Max 5 MB</p>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={productForm.control} name="title" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" /> Product Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jollof Rice Party Pack (10 pax)" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={productForm.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" /> Price (MYR)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">RM</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 bg-muted/30 pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={productForm.control} name="stock" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Stock Available</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="e.g. 10" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={productForm.control} name="category" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-semibold">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-muted/30">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={productForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Product Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product — ingredients, size, what's included, how to order, etc."
                          className="min-h-[120px] resize-none bg-muted/30 p-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Delivery options */}
                  <FormField control={productForm.control} name="deliveryOptions" render={() => (
                    <FormItem>
                      <div className="mb-3">
                        <FormLabel className="text-base font-semibold">Delivery Options</FormLabel>
                        <FormDescription>How can buyers receive this product?</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {DELIVERY_OPTIONS.map((opt) => (
                          <FormField key={opt} control={productForm.control} name="deliveryOptions" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-border p-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(opt)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([...field.value, opt])
                                      : field.onChange(field.value?.filter((v) => v !== opt))
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm leading-none">{opt}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Payment methods */}
                  <FormField control={productForm.control} name="paymentMethods" render={() => (
                    <FormItem>
                      <div className="mb-3">
                        <FormLabel className="text-base font-semibold">Payment Methods</FormLabel>
                        <FormDescription>How can buyers pay you?</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PAYMENT_METHODS.map((method) => (
                          <FormField key={method} control={productForm.control} name="paymentMethods" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-border p-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(method)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([...field.value, method])
                                      : field.onChange(field.value?.filter((v) => v !== method))
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm leading-none">{method}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="pt-6 border-t border-border/50 flex flex-col gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 rounded-full text-base font-bold shadow-md"
                      disabled={createProduct.isPending || isUploading}
                    >
                      {isUploading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading Image…</>
                      ) : createProduct.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Adding Product…</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5 mr-2" /> Publish Product & Finish</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-12 rounded-full text-muted-foreground text-sm"
                      onClick={handleSkipProduct}
                      disabled={createProduct.isPending || isUploading}
                    >
                      Skip for now — add products later
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto mt-1"
                    >
                      <ChevronLeft className="w-3 h-3" /> Back to store details
                    </button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
