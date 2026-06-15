import { useState, useEffect } from "react";
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
import {
  signUpWithEmail,
  signInWithEmail,
  resetPasswordForEmail,
  updatePassword,
  onAuthStateChange,
} from "@/lib/supabase-auth";

type Tab = "signin" | "signup" | "forgot" | "check-email" | "set-password" | "applying";
type CheckEmailReason = "signup" | "reset";

const PENDING_PW_KEY = "afrinza_pending_reset_pw";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Name is too long")
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ'\- ]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes — no numbers or symbols"
    )
    .refine((v) => v.trim().split(/\s+/).length >= 1, "Please enter your full name"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("That doesn't look like a valid email address — check for typos"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller"]),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const setPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type SetPasswordValues = z.infer<typeof setPasswordSchema>;

function PasswordInput({
  field,
  placeholder,
}: {
  field: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };
  placeholder?: string;
}) {
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

  /* ── Listen for Supabase PASSWORD_RECOVERY event ── */
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event !== "PASSWORD_RECOVERY") return;

      const stored = sessionStorage.getItem(PENDING_PW_KEY);
      if (stored) {
        /* User set a new password on the forgot-password form — apply it automatically */
        sessionStorage.removeItem(PENDING_PW_KEY);
        setTab("applying");
        const { error } = await updatePassword(stored);
        if (error) {
          toast.error("Couldn't update password: " + error.message);
          setTab("set-password");
        } else {
          toast.success("Password updated! You're now signed in.");
          setLocation("/dashboard");
        }
      } else {
        /* No stored password (different device / cleared session) — ask them to type it */
        setTab("set-password");
      }
    });
    return () => subscription.unsubscribe();
  }, [setLocation]);

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
    defaultValues: { email: "", newPassword: "", confirmPassword: "" },
  });

  const setPasswordForm = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSignIn = async (data: SignInValues) => {
    setLoading(true);
    const { error } = await signInWithEmail(data.email, data.password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
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
    if (error) { toast.error(error.message); return; }
    setCheckEmail(data.email);
    setPendingRole(data.role);
    setCheckEmailReason("signup");
    setTab("check-email");
  };

  const onForgot = async (data: ForgotValues) => {
    setLoading(true);
    const { error } = await resetPasswordForEmail(data.email);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    /* Store the desired new password — applied automatically when they click the email link */
    sessionStorage.setItem(PENDING_PW_KEY, data.newPassword);
    setCheckEmail(data.email);
    setCheckEmailReason("reset");
    setTab("check-email");
  };

  const onSetPassword = async (data: SetPasswordValues) => {
    setLoading(true);
    const { error } = await updatePassword(data.newPassword);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated! You're now signed in.");
    setLocation("/dashboard");
  };

  const roleValue = signUpForm.watch("role");

  /* ── Applying (auto-applying stored password) ── */
  if (tab === "applying") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border shadow-xl p-8 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold font-serif">Updating your password…</h1>
            <p className="text-muted-foreground text-sm mt-2">Just a moment, you'll be signed in shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Check email screen ── */
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
              {isSignup ? "Check your email!" : "Confirmation email sent!"}
            </h1>
            <p className="text-muted-foreground text-sm mb-1">
              {isSignup ? "We sent a confirmation link to:" : "We sent a password reset confirmation to:"}
            </p>
            <p className="font-semibold text-foreground mb-6 break-all">{checkEmail}</p>

            {isSignup ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-6 text-left space-y-1">
                <p className="font-semibold">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>Open your email inbox</li>
                  <li>Click the <span className="font-semibold">Confirm your email</span> link</li>
                  <li>Come back here and sign in</li>
                  {pendingRole === "seller" && <li>Complete your seller store setup</li>}
                </ol>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 mb-6 text-left">
                <p className="font-semibold mb-1">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Open your email inbox</li>
                  <li>Click the <span className="font-semibold">Confirm password change</span> link</li>
                  <li>You'll be signed in automatically with your new password</li>
                </ol>
              </div>
            )}

            <p className="text-xs text-muted-foreground mb-6">
              Can't find the email? Check your spam or junk folder.
            </p>

            <Button
              onClick={() => { setTab("signin"); signInForm.reset(); }}
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

  /* ── Set-password fallback (no stored password — different device) ── */
  if (tab === "set-password") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border shadow-xl p-8">
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-serif mb-1 text-center">Set your new password</h1>
            <p className="text-muted-foreground text-sm mb-8 text-center">
              Enter and confirm your new password below.
            </p>

            <Form {...setPasswordForm}>
              <form onSubmit={setPasswordForm.handleSubmit(onSetPassword)} className="space-y-5">
                <FormField control={setPasswordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" /> New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput field={field} placeholder="Min. 6 characters" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={setPasswordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" /> Confirm Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput field={field} placeholder="Repeat your new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save New Password"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main tabs: Sign In / Sign Up / Forgot ── */
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md">

        {tab !== "forgot" && (
          <div className="flex rounded-2xl border border-border bg-white overflow-hidden mb-6 shadow-sm">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "signin" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "signup" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
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
                <form onSubmit={signInForm.handleSubmit(onSignIn, () => toast.error("Please enter a valid email and password."))} className="space-y-5">
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
                <form onSubmit={signUpForm.handleSubmit(onSignUp, (errors) => {
                    if (errors.fullName) toast.error("Name: " + errors.fullName.message);
                    else if (errors.email) toast.error("Email: " + errors.email.message);
                    else if (errors.password) toast.error("Password: " + errors.password.message);
                    else toast.error("Please fix the errors highlighted below.");
                  })} className="space-y-5">
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
                onClick={() => { setTab("signin"); forgotForm.reset(); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>

              <div className="flex justify-center mb-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold font-serif mb-1 text-center">Reset your password</h1>
              <p className="text-muted-foreground text-sm mb-8 text-center">
                Enter your email and your new password. We'll send a confirmation link — click it and you're in.
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

                  <FormField control={forgotForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" /> New Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Min. 6 characters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={forgotForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" /> Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Repeat your new password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={loading}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                      : "Send Confirmation Email"}
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
