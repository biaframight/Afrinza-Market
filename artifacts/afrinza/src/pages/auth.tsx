import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, Mail, Lock, User, Store, ShoppingBag,
  Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { signUpWithEmail, signInWithEmail, resetPasswordForEmail } from "@/lib/supabase-auth";

type Tab = "signin" | "signup" | "forgot" | "check-email";
type CheckEmailReason = "signup" | "reset";

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

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

function PasswordInput({ field, placeholder }: { field: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        {...field}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        className="h-12 bg-muted/30 pr-11"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [checkEmailReason, setCheckEmailReason] = useState<CheckEmailReason>("signup");
  const [checkEmail, setCheckEmail] = useState("");
  const [pendingRole, setPendingRole] = useState<"buyer" | "seller">("buyer");

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "buyer" },
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
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
    setCheckEmail(data.email);
    setPendingRole(data.role);
    setCheckEmailReason("signup");
    setTab("check-email");
  };

  const onForgot = async (data: ForgotValues) => {
    setLoading(true);
    const { error } = await resetPasswordForEmail(data.email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCheckEmail(data.email);
    setCheckEmailReason("reset");
    setTab("check-email");
  };

  const roleValue = signUpForm.watch("role");

  if (tab === "check-email") {
    const isSignup = checkEmailReason === "signup";
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border shadow-xl p-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-bold font-serif mb-2">
              {isSignup ? "Check your email!" : "Reset link sent!"}
            </h1>

            <p className="text-muted-foreground text-sm mb-1">
              {isSignup ? "We sent a confirmation link to:" : "We sent a password reset link to:"}
            </p>
            <p className="font-semibold text-foreground mb-6 break-all">{checkEmail}</p>

            {isSignup ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-6 text-left space-y-1">
                  <p className="font-semibold">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700">
                    <li>Open your email inbox</li>
                    <li>Click the <span className="font-semibold">Confirm your email</span> link</li>
                    <li>Come back here and sign in</li>
                    {pendingRole === "seller" && (
                      <li>Complete your seller store setup</li>
                    )}
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Can't find the email? Check your spam or junk folder.
                </p>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 mb-6 text-left">
                  <p>Open the email and click the reset link. You'll be taken to a page where you can set a new password.</p>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Can't find the email? Check your spam or junk folder.
                </p>
              </>
            )}

            <Button
              onClick={() => {
                setTab("signin");
                signInForm.reset();
              }}
              className="w-full rounded-full font-bold"
              size="lg"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md">

        {tab !== "forgot" && (
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
        )}

        <div className="bg-white rounded-3xl border border-border shadow-xl p-8">

          {/* ── SIGN IN ── */}
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
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="font-semibold flex items-center gap-2 mb-0">
                          <Lock className="w-4 h-4 text-muted-foreground" /> Password
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => setTab("forgot")}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <PasswordInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full rounded-full font-bold mt-2" disabled={loading}>
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

          {/* ── SIGN UP ── */}
          {tab === "signup" && (
            <>
              <h1 className="text-2xl font-bold font-serif mb-1">Join Afrinza</h1>
              <p className="text-muted-foreground text-sm mb-6">The African diaspora marketplace in Malaysia.</p>

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
                        <PasswordInput field={field} placeholder="Min. 6 characters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full rounded-full font-bold mt-2" disabled={loading}>
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

          {/* ── FORGOT PASSWORD ── */}
          {tab === "forgot" && (
            <>
              <button
                onClick={() => setTab("signin")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>

              <div className="flex justify-center mb-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold font-serif mb-1 text-center">Forgot password?</h1>
              <p className="text-muted-foreground text-sm mb-8 text-center">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <Form {...forgotForm}>
                <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-5">
                  <FormField control={forgotForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" /> Email address
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@email.com" className="h-12 bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
