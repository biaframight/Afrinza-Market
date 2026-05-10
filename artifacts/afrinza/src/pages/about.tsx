import { AfrinzaLogo } from "@/components/afrinza-logo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Globe, Users, ShieldCheck, Send, MapPin, TrendingUp, Rocket } from "lucide-react";

const TELEGRAM_URL = "https://t.me/+zN9_dGgYrPg2OTVl";

const LAUNCH_MARKETS = [
  { flag: "🇲🇾", country: "Malaysia", status: "live", label: "Phase 1 — Live Now" },
  { flag: "🇬🇧", country: "United Kingdom", status: "soon", label: "Coming Soon" },
  { flag: "🇨🇦", country: "Canada", status: "soon", label: "Coming Soon" },
  { flag: "🇦🇪", country: "United Arab Emirates", status: "soon", label: "Coming Soon" },
  { flag: "🇩🇪", country: "Germany", status: "soon", label: "Coming Soon" },
  { flag: "🇺🇸", country: "United States", status: "soon", label: "Coming Soon" },
];

const VALUES = [
  {
    icon: <Heart className="w-6 h-6 text-primary" />,
    title: "Community First",
    desc: "Afrinza was built by and for Africans living abroad. Every feature exists to serve the diaspora — wherever they are.",
  },
  {
    icon: <Globe className="w-6 h-6 text-emerald-600" />,
    title: "Truly Pan-African",
    desc: "We welcome sellers and buyers from all 54 African nations — Nigerian, Ghanaian, Kenyan, Congolese, Ethiopian and more.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Trusted & Verified",
    desc: "We verify sellers to ensure genuine, reliable African businesses. Your safety and trust are central to everything we build.",
  },
  {
    icon: <Users className="w-6 h-6 text-amber-600" />,
    title: "Built on Connection",
    desc: "WhatsApp-first transactions keep things personal. We connect buyers directly with sellers — no unnecessary middlemen.",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
    title: "Empowering African Entrepreneurs",
    desc: "We give African business owners a professional platform to grow, earn, and serve their communities across the world.",
  },
  {
    icon: <Rocket className="w-6 h-6 text-orange-600" />,
    title: "Global Vision",
    desc: "What starts in Malaysia becomes the world's most trusted African marketplace — serving every major diaspora city on earth.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen pb-20">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0f3460] via-[#1a1a2e] to-[#16213e] pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="flex justify-center mb-10">
            <AfrinzaLogo height={68} variant="light" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Globe className="w-3.5 h-3.5" /> Global African Diaspora Marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6 leading-tight">
            Africa's <span className="text-amber-400 italic">heartbeat</span>,<br />in every corner of the world.
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Afrinza is the global marketplace platform built for Africans living abroad — connecting buyers, sellers, and service providers across the diaspora, starting with Malaysia.
          </p>
        </div>
      </section>

      {/* ── Phase 1 Badge ────────────────────────────────────── */}
      <section className="bg-amber-50 border-y border-amber-100 py-4 px-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-center gap-3 flex-wrap text-center">
          <span className="text-amber-700 font-bold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" /> 🇲🇾 Phase 1 — Live in Malaysia
          </span>
          <span className="text-amber-500 text-sm hidden sm:block">·</span>
          <span className="text-amber-600 text-sm">Launching soon in 🇬🇧 🇨🇦 🇦🇪 🇩🇪 🇺🇸 and beyond</span>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-3xl font-bold font-serif mb-6">Our Mission</h2>
        <div className="space-y-5 text-muted-foreground text-base leading-relaxed">
          <p>
            Moving to a new country is hard. Finding the food you grew up with, the fashion you love, or a trusted tradesperson who understands your culture — that's even harder.
          </p>
          <p>
            Afrinza was built to solve exactly that. We started in Malaysia because it has one of the fastest-growing African diaspora communities in Southeast Asia. But our vision has always been bigger.
          </p>
          <p>
            We're building the platform that every African abroad has needed for decades — one place to buy, sell, offer services, connect, and thrive. Whether you're in Kuala Lumpur, London, Toronto, Dubai, Berlin, or New York: <strong className="text-foreground">Afrinza is your home away from home.</strong>
          </p>
        </div>
      </section>

      {/* ── Global Expansion ─────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/50 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">Expansion Roadmap</span>
            <h2 className="text-3xl font-bold font-serif">Where Afrinza is Going</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">One platform. Every major African diaspora market in the world.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {LAUNCH_MARKETS.map((m) => (
              <div key={m.country} className={`rounded-2xl p-4 text-center border transition-all ${m.status === "live" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-white border-border hover:border-primary/30 hover:shadow-sm"}`}>
                <div className="text-4xl mb-2">{m.flag}</div>
                <p className={`font-bold text-sm mb-1 ${m.status === "live" ? "text-white" : "text-foreground"}`}>{m.country}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.status === "live" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-serif">What We Stand For</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow flex gap-4">
              <div className="p-3 bg-muted/40 rounded-xl h-fit shrink-0">{v.icon}</div>
              <div>
                <h3 className="font-bold text-base mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-serif text-white text-center mb-10">Afrinza Today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "5,000+", label: "Community Members", emoji: "👥" },
              { value: "200+", label: "Verified Sellers", emoji: "🏪" },
              { value: "10+", label: "Cities in Malaysia", emoji: "📍" },
              { value: "6", label: "Target Global Markets", emoji: "🌍" },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl mb-2">{s.emoji}</div>
                <p className="text-3xl font-bold text-amber-400 font-serif">{s.value}</p>
                <p className="text-white/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <h2 className="text-3xl font-bold font-serif mb-4">Be Part of the Movement</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Join our Telegram community, open your store, or list your services. Help us build Africa's global marketplace together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#1f9ddc] text-white font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105 shadow-lg">
            <Send className="w-5 h-5" /> Join Afrinza Market on Telegram
          </a>
          <Button size="lg" asChild className="rounded-full px-8 font-bold shadow-md">
            <Link href="/become-seller">Open Your Store</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-full px-8 font-semibold">
            <Link href="/services">List Your Services</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
