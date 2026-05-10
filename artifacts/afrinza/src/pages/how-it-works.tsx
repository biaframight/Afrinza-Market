import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, ShoppingCart, MessageCircle, Star, Store, Wrench, Truck, CheckCircle } from "lucide-react";

const BUYER_STEPS = [
  { icon: <Search className="w-7 h-7 text-white" />, color: "bg-primary", step: "01", title: "Browse & Discover", desc: "Search for African food, fashion, beauty products, or services near your city in Malaysia." },
  { icon: <ShoppingCart className="w-7 h-7 text-white" />, color: "bg-amber-500", step: "02", title: "Add to Cart", desc: "Add items from one or multiple sellers to your cart and review your order summary." },
  { icon: <MessageCircle className="w-7 h-7 text-white" />, color: "bg-[#25D366]", step: "03", title: "Order via WhatsApp", desc: "Place your order and get redirected to the seller's WhatsApp to confirm payment and delivery." },
  { icon: <Star className="w-7 h-7 text-white" />, color: "bg-purple-500", step: "04", title: "Receive & Review", desc: "Receive your order and leave a review to help the community discover great sellers." },
];

const SELLER_STEPS = [
  { icon: <Store className="w-7 h-7 text-white" />, color: "bg-primary", step: "01", title: "Register Your Store", desc: "Sign up as a seller — it takes under 2 minutes. Share your store name, category, location and WhatsApp." },
  { icon: <CheckCircle className="w-7 h-7 text-white" />, color: "bg-emerald-500", step: "02", title: "Get Verified", desc: "Our team reviews your store and verifies your identity to build buyer trust." },
  { icon: <MessageCircle className="w-7 h-7 text-white" />, color: "bg-[#25D366]", step: "03", title: "Receive Orders", desc: "Buyers contact you directly on WhatsApp. Confirm orders, arrange payment and delivery personally." },
  { icon: <Star className="w-7 h-7 text-white" />, color: "bg-amber-500", step: "04", title: "Grow Your Business", desc: "Earn reviews, grow your reputation and reach thousands of Africans across Malaysia." },
];

const SERVICE_STEPS = [
  { icon: <Wrench className="w-7 h-7 text-white" />, color: "bg-blue-500", step: "01", title: "List Your Service", desc: "Register on the Services page — describe what you offer, your coverage area and contact number." },
  { icon: <CheckCircle className="w-7 h-7 text-white" />, color: "bg-emerald-500", step: "02", title: "Get Listed", desc: "After review, your service appears in our directory for customers to find and contact you." },
  { icon: <MessageCircle className="w-7 h-7 text-white" />, color: "bg-[#25D366]", step: "03", title: "Clients Contact You", desc: "Clients reach out via WhatsApp to book or enquire about your services." },
  { icon: <Truck className="w-7 h-7 text-white" />, color: "bg-amber-500", step: "04", title: "Deliver & Earn", desc: "Provide your service, collect payment and build a 5-star reputation on Afrinza." },
];

function StepGrid({ steps }: { steps: typeof BUYER_STEPS }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((s, i) => (
        <div key={s.step} className="relative flex flex-col items-center text-center">
          {i < steps.length - 1 && (
            <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border z-0" />
          )}
          <div className={`w-16 h-16 ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg relative z-10`}>
            {s.icon}
          </div>
          <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">Step {s.step}</span>
          <h3 className="font-bold text-base mb-2">{s.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-16 pb-16 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 border border-primary/20">
            Simple & Transparent
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 leading-tight">
            How Afrinza Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Whether you're buying, selling, or offering a service — Afrinza makes it simple, personal and WhatsApp-first.
          </p>
        </div>
      </section>

      {/* For Buyers */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-10">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">For Buyers</span>
          <h2 className="text-3xl font-bold font-serif">How to Buy on Afrinza</h2>
        </div>
        <StepGrid steps={BUYER_STEPS} />
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-10 font-bold shadow-md">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </section>

      <div className="bg-muted/30 border-y border-border/50 py-1" />

      {/* For Sellers */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-10">
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">For Sellers</span>
          <h2 className="text-3xl font-bold font-serif">How to Sell on Afrinza</h2>
        </div>
        <StepGrid steps={SELLER_STEPS} />
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-10 font-bold shadow-md">
            <Link href="/become-seller">Open Your Store</Link>
          </Button>
        </div>
      </section>

      <div className="bg-muted/30 border-y border-border/50 py-1" />

      {/* For Service Providers */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">For Service Providers</span>
          <h2 className="text-3xl font-bold font-serif">How to List Your Services</h2>
          <p className="text-muted-foreground mt-2">Plumbers, riders, hair braiders, cargo handlers, cleaners & more</p>
        </div>
        <StepGrid steps={SERVICE_STEPS} />
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-10 font-bold shadow-md">
            <Link href="/services">List Your Services</Link>
          </Button>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="container mx-auto px-4 max-w-3xl">
        <div className="bg-primary rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold font-serif mb-4">Still have questions?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Reach us directly on WhatsApp or join our Telegram community for help and updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/60173346205" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe59] text-white font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105">
              <MessageCircle className="w-5 h-5" /> WhatsApp Support
            </a>
            <a href="https://t.me/+zN9_dGgYrPg2OTVl" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-3.5 rounded-full transition-all">
              Join Telegram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
