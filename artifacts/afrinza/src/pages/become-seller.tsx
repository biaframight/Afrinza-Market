import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSeller } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Store, User, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MALAYSIA_LOCATIONS } from "@/lib/malaysia-locations";

const CATEGORIES = [
  { id: "Food", label: "African Food & Catering" },
  { id: "Fashion", label: "Fashion, Clothing & Tailoring" },
  { id: "Services", label: "Services (Hair, Plumbing, Delivery & More)" },
  { id: "Groceries", label: "Groceries & African Spices" },
  { id: "Beauty", label: "Beauty & Skincare Products" },
  { id: "Other", label: "Other" }
];

const sellerSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  ownerName: z.string().min(2, "Owner name is required"),
  location: z.string().min(1, "Location is required"),
  whatsapp: z.string().min(8, "Valid WhatsApp number required"),
  description: z.string().min(10, "Please provide a brief description of what you sell"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

export default function BecomeSeller() {
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  const createSeller = useCreateSeller();

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      storeName: "",
      ownerName: "",
      location: "",
      whatsapp: "",
      description: "",
      categories: [],
    },
  });

  const onSubmit = (data: SellerFormValues) => {
    // Generate random avatar and banner for demo purposes
    const categoryQuery = data.categories[0]?.toLowerCase() || "store";
    
    createSeller.mutate({
      data: {
        ...data,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.storeName)}&backgroundColor=00897b,e53935,1e88e5,ffb300`,
        bannerUrl: `/images/seller-${categoryQuery === 'groceries' ? 'grocery' : categoryQuery}.png`
      }
    }, {
      onSuccess: (seller) => {
        setIsSuccess(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast.error("Failed to register. Please try again.");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4 text-center">Store Created Successfully!</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
          Welcome to Afrinza! Your store is now live and ready to receive customers.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setLocation("/sellers")} className="rounded-full px-8 h-12 text-base font-bold shadow-md">
            View Stores Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary pt-16 pb-32 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 font-medium text-sm mb-6">
            Join the Community
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 leading-tight">
            Start Selling to the African Community in Malaysia
          </h1>
          <p className="text-primary-foreground/90 text-lg md:text-xl">
            It takes less than 2 minutes to open your store and reach thousands of buyers looking for your products.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl border border-border shadow-xl max-w-3xl mx-auto overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Store Details</h2>
                <p className="text-muted-foreground text-sm">Tell us about your business</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" /> Store Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mama's Kitchen" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" /> Your Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
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
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" /> WhatsApp Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+60 12-345 6789" className="h-12 bg-muted/30" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Buyers will contact this number directly.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-semibold text-foreground">What do you sell?</FormLabel>
                        <FormDescription>
                          Select all that apply to your business.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, category.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== category.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer w-full text-sm leading-none">
                                    {category.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Store Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell customers about your products, your origin, and what makes your store special..." 
                          className="min-h-[120px] resize-none bg-muted/30 p-4"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 border-t border-border/50">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-14 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                    disabled={createSeller.isPending}
                  >
                    {createSeller.isPending ? "Creating Store..." : "Create My Store"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    By clicking "Create My Store", you agree to the Afrinza Seller Guidelines and Terms of Service.
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
