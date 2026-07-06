import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ShoppingBag, Store, Wrench, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { setUserRole } from "@/lib/supabase-auth";

type RoleOption = "buyer" | "seller" | "service_provider";

const OPTIONS: {
  value: RoleOption;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "buyer",
    label: "I'm a Buyer",
    sub: "Browse products, services & rooms and contact sellers on WhatsApp",
    icon: <ShoppingBag className="w-7 h-7" />,
  },
  {
    value: "seller",
    label: "I'm a Seller",
    sub: "Open a store and sell products to the community",
    icon: <Store className="w-7 h-7" />,
  },
  {
    value: "service_provider",
    label: "I'm a Service Provider",
    sub: "Offer skills — delivery, hair braiding, repairs & more",
    icon: <Wrench className="w-7 h-7" />,
  },
];

export default function ChooseRole() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuthContext();
  const [submitting, setSubmitting] = useState<RoleOption | null>(null);

  /* Not signed in — send to auth first */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleChoose = async (role: RoleOption) => {
    setSubmitting(role);
    const { error } = await setUserRole(role);
    setSubmitting(null);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (role === "buyer") {
      toast.success("You're all set! Welcome to Afrinza.");
      setLocation("/");
    } else if (role === "seller") {
      setLocation("/become-seller");
    } else {
      setLocation("/services?register=true");
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl border border-border shadow-xl p-8 md:p-10">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2 text-center">
            {firstName ? `Welcome, ${firstName}!` : "Welcome to Afrinza!"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8 text-center">
            Your email is confirmed. How do you want to use Afrinza? You can always add another role later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OPTIONS.map(({ value, label, sub, icon }) => (
              <button
                key={value}
                type="button"
                disabled={submitting !== null}
                onClick={() => handleChoose(value)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border text-center text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-60"
              >
                {submitting === value ? (
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                ) : (
                  icon
                )}
                <span className="font-semibold text-sm text-foreground">{label}</span>
                <span className="text-xs opacity-80 leading-snug">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
