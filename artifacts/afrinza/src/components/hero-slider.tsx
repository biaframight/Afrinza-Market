import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1400&q=80&auto=format&fit=crop",
    tag: "African Food",
    title: "Taste of Home",
    subtitle: "Authentic jollof rice, egusi, suya & freshly cooked African meals — wherever you are in the world.",
    cta: { label: "Order Food", href: "/products?category=Food" },
    gradient: "from-orange-950/80 via-orange-900/50 to-transparent",
    accent: "bg-orange-500",
  },
  {
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&q=80&auto=format&fit=crop",
    tag: "African Fashion",
    title: "Wear Your Heritage",
    subtitle: "Ankara prints, kente cloth, dashiki & bespoke African tailoring — crafted with pride for the diaspora.",
    cta: { label: "Shop Fashion", href: "/products?category=Fashion" },
    gradient: "from-emerald-950/80 via-emerald-900/50 to-transparent",
    accent: "bg-emerald-500",
  },
  {
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80&auto=format&fit=crop",
    tag: "Hair & Beauty",
    title: "Look Gorgeous",
    subtitle: "Professional African hair braiding, knotless, locs, twists & skincare services close to you.",
    cta: { label: "Book a Service", href: "/services" },
    gradient: "from-purple-950/80 via-purple-900/50 to-transparent",
    accent: "bg-purple-500",
  },
  {
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&q=80&auto=format&fit=crop",
    tag: "Trusted Services",
    title: "Professionals You Can Trust",
    subtitle: "Plumbing, electrical, cleaning, cargo & more — African service providers in your city.",
    cta: { label: "Find Services", href: "/services" },
    gradient: "from-blue-950/80 via-blue-900/50 to-transparent",
    accent: "bg-blue-500",
  },
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&auto=format&fit=crop",
    tag: "Delivery & Riders",
    title: "Fast African Delivery",
    subtitle: "African riders delivering across Malaysia — join as a rider or book a delivery today.",
    cta: { label: "Rider Services", href: "/services" },
    gradient: "from-red-950/80 via-red-900/50 to-transparent",
    accent: "bg-red-500",
  },
  {
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&auto=format&fit=crop",
    tag: "Going Global 🌍",
    title: "A World Platform for Africans",
    subtitle: "Launching in Malaysia · Coming soon to UK, Canada, UAE, Germany & USA. One platform for every African abroad.",
    cta: { label: "Our Story", href: "/about" },
    gradient: "from-slate-950/80 via-slate-900/50 to-transparent",
    accent: "bg-amber-500",
    external: false,
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <div
      className="relative w-full h-[380px] md:h-[520px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-16 px-6 md:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-white/90 mb-3 px-3 py-1 rounded-full ${slide.accent}/70 backdrop-blur-sm border border-white/20`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {slide.tag}
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white font-serif mb-3 leading-tight drop-shadow-xl max-w-2xl">
              {slide.title}
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-lg mb-6 leading-relaxed">
              {slide.subtitle}
            </p>
            <Link href={slide.cta.href}>
              <span className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full hover:bg-amber-400 transition-all hover:scale-105 text-sm shadow-lg cursor-pointer">
                {slide.cta.label} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
        {current + 1} / {slides.length}
      </div>

      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all hover:scale-110 border border-white/10" aria-label="Previous">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all hover:scale-110 border border-white/10" aria-label="Next">
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "bg-white w-7 h-2" : "bg-white/40 hover:bg-white/70 w-2 h-2"}`}
          />
        ))}
      </div>
    </div>
  );
}
