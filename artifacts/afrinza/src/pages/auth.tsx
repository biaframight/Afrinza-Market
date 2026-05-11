import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Store, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { signUpWithEmail, signInWithEmail } from "@/lib/supabase-auth";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller"]),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "buyer" },
  });

  const onSignIn = async (data: SignInValues) => {
    setLoading(true);
    const { error } = await signInWithEmail(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    setLocation("/dashboard");
  };

  const onSignUp = async (data: SignUpValues) => {
    setLoading(true);
    const { error } = await signUpWithEmail(data.email, data.password, {
      fullName: data.fullName,
      role: data.role,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to confirm.");
    if (data.role === "seller") {
      setLocation("/become-seller");
    } else {
      setLocation("/products");
    }
  };

  const roleValue = signUpForm.watch("role");

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md">

        {/* Tab switcher */}
        <div className="flex rounded-2xl border border-border bg-white overflow-hidden mb-6 shadow-sm">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              tab === "signin"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              tab === "signup"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-border shadow-xl p-8">

          {tab === "signin" && (
            <>
              <h1 className="text-2xl font-bold font-serif mb-1">Welcome back</h1>
              <p className="text-muted-foreground text-sm mb-8">Sign in to manage your store or orders.</p>

              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-5">
                  <FormField control={signInForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" /> Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@email.com" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signInForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" /> Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full h-13 rounded-full font-bold mt-2" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : "Sign In"}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button onClick={() => setTab("signup")} className="text-primary font-semibold hover:underline">
                  Create one
                </button>
              </p>
            </>
          )}

          {tab === "signup" && (
            <>
              <h1 className="text-2xl font-bold font-serif mb-1">Join Afrinza</h1>
              <p className="text-muted-foreground text-sm mb-6">The African diaspora marketplace in Malaysia.</p>

              {/* Role picker */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { value: "buyer", label: "I'm a Buyer", sub: "Browse & order", icon: <ShoppingBag className="w-6 h-6" /> },
                  { value: "seller", label: "I'm a Seller", sub: "Open a store", icon: <Store className="w-6 h-6" /> },
                ].map(({ value, label, sub, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => signUpForm.setValue("role", value as "buyer" | "seller")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
                      roleValue === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {icon}
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-xs opacity-70">{sub}</span>
                  </button>
                ))}
              </div>

              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-5">
                  <FormField control={signUpForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Full Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signUpForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" /> Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@email.com" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signUpForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" /> Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 6 characters" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full h-13 rounded-full font-bold mt-2" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
                    ) : roleValue === "seller" ? (
                      "Create Account & Open Store"
                    ) : (
                      "Create Buyer Account"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <button onClick={() => setTab("signin")} className="text-primary font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
