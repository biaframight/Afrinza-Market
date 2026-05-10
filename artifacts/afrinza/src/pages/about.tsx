import { AfrinzaLogo } from "@/components/afrinza-logo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Globe, Users, ShieldCheck, Send } from "lucide-react";

const TELEGRAM_URL = "https://t.me/+zN9_dGgYrPg2OTVl";

const VALUES = [
  { icon: <Heart className="w-6 h-6 text-primary" />, title: "Community First", desc: "Afrinza was built by and for Africans living in Malaysia. Every feature exists to serve our community." },
  { icon: <Globe className="w-6 h-6 text-emerald-600" />, title: "Pan-African", desc: "We welcome sellers and buyers from all African nations — Nigerian, Ghanaian, Kenyan, Congolese, Ugandan and more." },
  { icon: <ShieldCheck className="w-6 h-6 text-blue-600" />, title: "Trusted & Verified", desc: "We verify sellers to ensure you're dealing with genuine, reliable African businesses across Malaysia." },
  { icon: <Users className="w-6 h-6 text-amber-600" />, title: "Built on Connection", desc: "WhatsApp-first transactions keep things personal. We connect buyers directly with sellers — no middlemen." },
];

export default function About() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-16 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-8">
            <AfrinzaLogo height={64} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-foreground mb-6 leading-tight">
            Africa's <span className="text-primary italic">heartbeat</span><br />in Malaysia
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Afrinza is Malaysia's first dedicated African marketplace — a platform where Africans can buy, sell, and connect, right here in Malaysia.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-3xl font-bold font-serif mb-6">Our Story</h2>
        <div className="prose prose-lg text-muted-foreground space-y-4">
          <p>
            Moving to a new country is hard. Finding the food you grew up with, the fashion you love, or a trusted hairdresser who understands your hair — that's even harder.
          </p>
          <p>
            Afrinza was founded to solve exactly that. We built a marketplace where Africans across Malaysia can discover and support each other — whether you're selling jollof rice from your kitchen, offering cargo transport between states, braiding hair on weekends, or tailoring ankara outfits from your studio.
          </p>
          <p>
            Today, Afrinza connects thousands of Africans across Kuala Lumpur, Selangor, Penang, Johor, and beyond — and we're growing every day.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 border-y border-border/50 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold font-serif mb-10 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-border shadow-sm flex gap-4">
                <div className="p-3 bg-muted/30 rounded-xl h-fit">{v.icon}</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "5,000+", label: "Community Members" },
            { value: "200+", label: "African Sellers" },
            { value: "10+", label: "Cities in Malaysia" },
            { value: "4+", label: "Service Categories" },
          ].map((s) => (
            <div key={s.label} className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
              <p className="text-4xl font-bold text-primary font-serif">{s.value}</p>
              <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 max-w-3xl text-center pb-8">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-3xl p-10 text-white">
          <h2 className="text-3xl font-bold font-serif mb-4">Join Our Community</h2>
          <p className="text-white/75 mb-8">Connect with 5,000+ Africans on our Telegram group — Afrinza Market.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#1f9ddc] text-white font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105">
              <Send className="w-5 h-5" /> Join Telegram
            </a>
            <Button size="lg" variant="outline" asChild className="rounded-full border-white/30 text-white hover:bg-white/10">
              <Link href="/become-seller">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
