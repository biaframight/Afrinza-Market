import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Wrench, Truck, Scissors, Package, Zap, Droplets,
  Star, ArrowRight, Mail, Lock, Loader2, Bike,
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

const serviceSchema = z.object({
  providerName: z.string().min(2, "Name required"),
  businessName: z.string().min(2, "Business / trading name required"),
  location: z.string().min(1, "Location required"),
  whatsapp: z.string().min(8, "Valid WhatsApp number required"),
  description: z.string().min(10, "Briefly describe your services"),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  experience: z.string().min(1, "Required"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const FEATURES = [
  { icon: <Bike className="w-6 h-6 text-primary" />, title: "Afrinza Rider", desc: "Join as an Afrinza Rider and earn delivering to Africans across Malaysia." },
  { icon: <Droplets className="w-6 h-6 text-blue-500" />, title: "Plumbing & Repairs", desc: "Offer home repair services to households in your city." },
  { icon: <Scissors className="w-6 h-6 text-purple-500" />, title: "Hair & Beauty", desc: "Reach clients looking for African braiding, locs, twists & more." },
  { icon: <Package className="w-6 h-6 text-green-500" />, title: "Cargo & Moving", desc: "Help businesses and families move goods across states." },
];

export default function Services() {
  const { user, isAuthenticated } = useAuthContext();
  const [isSuccess, setIsSuccess] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      providerName: "",
      businessName: "",
      location: "",
      whatsapp: "",
      description: "",
      serviceTypes: [],
      experience: "",
    },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    // Step 1: Create login account if not already signed in
    if (!isAuthenticated) {
      if (!authEmail.trim()) { toast.error("Email address is required to create your account."); return; }
      if (authPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }

      setIsCreatingAuth(true);
      const { error: authError } = await signUpWithEmail(authEmail, authPassword, {
        fullName: data.providerName,
        role: "seller",
      });
      setIsCreatingAuth(false);

      if (authError) {
        toast.error(authError.message);
        return;
      }
      toast.success("Account created! You can now log in to manage your profile.");
    }

    // Step 2: Send WhatsApp notification to Afrinza team
    const waNumber = "60173346205";
    const msg = encodeURIComponent(
      `*New Service Provider — Afrinza*\n\n*Name:* ${data.providerName}\n*Business:* ${data.businessName}\n*Services:* ${data.serviceTypes.join(", ")}\n*Location:* ${data.location}\n*WhatsApp:* ${data.whatsapp}\n*Experience:* ${data.experience}\n*Description:* ${data.description}\n*Login Email:* ${authEmail || user?.email || "N/A"}`
    );
    setIsSuccess(true);
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
    }, 800);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4">Registration Submitted!</h1>
        <p className="text-lg text-muted-foreground mb-4 max-w-md">
          Your service listing is being reviewed. A WhatsApp message has been sent to the Afrinza team.
        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md">
          Your login account has been created — use your email and password to sign in and manage your profile anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setIsSuccess(false)} variant="outline" className="rounded-full px-8 h-12 font-semibold">
            Register Another Service
          </Button>
          <Button asChild className="rounded-full px-8 h-12 font-semibold">
            <a href="/auth">Sign In to My Account</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-amber-600 pt-16 pb-32 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
            For African Service Providers
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 leading-tight">
            List Your Services on Afrinza
          </h1>
          <p className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto">
            Whether you're an Afrinza Rider, plumber, hair braider, or cargo transporter — reach thousands of Africans across Malaysia who need your skills.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="container mx-auto px-4 -mt-16 relative z-20 mb-12">
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

      {/* Registration Form */}
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

            {/* Login account section (shown only when not logged in) */}
            {!isAuthenticated && (
              <div className="mb-8 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Create Your Login Account
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Use these credentials to sign in and manage your service profile anytime.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="h-11 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="h-11 bg-white"
                    />
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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="providerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Full Name</FormLabel>
                      <FormControl><Input placeholder="John Okafor" className="h-12 bg-muted/30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business / Trading Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Okafor Plumbing Services" className="h-12 bg-muted/30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / City (Coverage Area)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-muted/30">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64">
                          {MALAYSIA_LOCATIONS.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl><Input placeholder="+60 12-345 6789" className="h-12 bg-muted/30" {...field} /></FormControl>
                      <FormDescription className="text-xs">Clients will contact you via this number.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="experience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-muted/30">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
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

                {/* Service Types */}
                <FormField control={form.control} name="serviceTypes" render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base font-semibold">What services do you offer?</FormLabel>
                      <FormDescription>Select all that apply.</FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SERVICE_TYPES.map((svc) => (
                        <FormField key={svc.id} control={form.control} name="serviceTypes" render={({ field }) => (
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

                <FormField control={form.control} name="description" render={({ field }) => (
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

                <div className="pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                    disabled={form.formState.isSubmitting || isCreatingAuth}
                  >
                    {isCreatingAuth ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account…</>
                    ) : form.formState.isSubmitting ? (
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
    </div>
  );
}
