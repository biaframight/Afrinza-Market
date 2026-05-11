import { useGetFeaturedProducts, useGetFeaturedSellers } from "@/hooks/use-marketplace";
import { ProductCard } from "@/components/product-card";
import { SellerCard } from "@/components/seller-card";
import { HeroSlider } from "@/components/hero-slider";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowRight, UtensilsCrossed, Shirt, Sparkles, Store, Send, Users, CheckCircle, Globe } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const TELEGRAM_URL = "https://t.me/+zN9_dGgYrPg2OTVl";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocationFilter] = useState("KL");

  const { data: featuredProducts, isLoading: isProductsLoading, isError: isProductsError } = useGetFeaturedProducts();
  const { data: featuredSellers, isLoading: isSellersLoading, isError: isSellersError } = useGetFeaturedSellers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (location) params.append("location", location);
    setLocation(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen pb-12">

      {/* ── Hero Slider ─────────────────────────────────────── */}
      <HeroSlider />

      {/* ── Search Bar ──────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary/8 via-primary/4 to-background pt-10 pb-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="container mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-2 mb-4"
          >
            <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20 shadow-sm">
              <Globe className="w-3.5 h-3.5" /> Global African Diaspora Marketplace
            </span>
            <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
              🇲🇾 Now Live in Malaysia — Phase 1
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 font-serif max-w-3xl tracking-tight leading-tight"
          >
            Find <span className="text-primary italic">Home</span>, Anywhere.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl"
          >
            Find African food, fashion, beauty, and trusted services near you in Malaysia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-3xl bg-white p-2 rounded-2xl md:rounded-full shadow-xl shadow-primary/5 border border-border/50"
          >
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row w-full gap-2">
              <div className="flex-1 flex items-center px-4 bg-muted/30 rounded-xl md:rounded-full border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all h-12">
                <Search className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-44 flex items-center px-4 bg-muted/30 rounded-xl md:rounded-full border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all h-12">
                <MapPin className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                <select
                  className="w-full bg-transparent border-none outline-none text-foreground cursor-pointer appearance-none text-sm"
                  value={location}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Malaysia</option>
                  <option value="KL">Kuala Lumpur</option>
                  <option value="Putrajaya">Putrajaya</option>
                  <option value="Selangor">Selangor</option>
                  <option value="Shah Alam">Shah Alam</option>
                  <option value="Petaling Jaya">Petaling Jaya</option>
                  <option value="Subang Jaya">Subang Jaya</option>
                  <option value="Cyberjaya">Cyberjaya</option>
                  <option value="Puchong">Puchong</option>
                  <option value="Klang">Klang</option>
                  <option value="Penang">Penang</option>
                  <option value="Georgetown">Georgetown</option>
                  <option value="Johor">Johor</option>
                  <option value="Johor Bahru">Johor Bahru</option>
                  <option value="Perak">Perak</option>
                  <option value="Ipoh">Ipoh</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Seremban">Seremban</option>
                  <option value="Melaka">Melaka</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Kuantan">Kuantan</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Terengganu">Terengganu</option>
                  <option value="Perlis">Perlis</option>
                  <option value="Sabah">Sabah</option>
                  <option value="Kota Kinabalu">Kota Kinabalu</option>
                  <option value="Sarawak">Sarawak</option>
                  <option value="Kuching">Kuching</option>
                  <option value="Labuan">Labuan</option>
                </select>
              </div>
              <Button type="submit" className="h-12 rounded-xl md:rounded-full px-7 font-semibold shadow-md">
                Search
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 -mt-6 relative z-20 mb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: "Food", href: "/products?category=Food", color: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100", icon: <UtensilsCrossed className="w-6 h-6" /> },
            { name: "Fashion", href: "/products?category=Fashion", color: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100", icon: <Shirt className="w-6 h-6" /> },
            { name: "Beauty", href: "/products?category=Beauty", color: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100", icon: <Sparkles className="w-6 h-6" /> },
            { name: "Services", href: "/products?category=Services", color: "bg-green-50 text-green-600 hover:bg-green-100 border-green-100", icon: <Store className="w-6 h-6" /> }
          ].map((cat) => (
            <Link key={cat.name} href={cat.href} className={`flex flex-col items-center justify-center p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 ${cat.color} group`}>
              <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <span className="font-semibold text-foreground text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Market Highlights ──────────────────────────────── */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground font-serif">Market Highlights</h2>
            <p className="text-muted-foreground mt-1">Discover popular items from our community</p>
          </div>
          <Link href="/products" className="hidden md:flex items-center text-primary font-medium hover:underline gap-1 text-sm">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isProductsError ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-2">Could not load products</p>
            <p className="text-sm">Check your connection or try again shortly.</p>
          </div>
        ) : !featuredProducts?.products.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No featured products yet</p>
            <p className="text-sm mt-1">Be the first to list your products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {featuredProducts.products.slice(0, 5).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" asChild className="rounded-full w-full">
            <Link href="/products">View all products</Link>
          </Button>
        </div>
      </section>

      {/* ── Top Rated Sellers ──────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/50 py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground font-serif">Top Rated Sellers</h2>
              <p className="text-muted-foreground mt-1">Trustworthy African businesses loved by the community</p>
            </div>
            <Link href="/sellers" className="hidden md:flex items-center text-primary font-medium hover:underline gap-1 text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isSellersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-full h-64 rounded-xl" />
              ))}
            </div>
          ) : isSellersError ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Could not load sellers</p>
              <p className="text-sm">Check your connection or try again shortly.</p>
            </div>
          ) : !featuredSellers?.sellers.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No featured sellers yet</p>
              <p className="text-sm mt-1">Sellers will appear here once approved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredSellers.sellers.slice(0, 4).map((seller, i) => (
                <SellerCard key={seller.id} seller={seller} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Community Section ──────────────────────────────── */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] opacity-10" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 text-amber-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5 border border-white/10">
                <Users className="w-4 h-4" /> Community
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-serif mb-4 leading-tight">
                Join the <span className="text-amber-400">Afrinza</span> Community
              </h2>
              <p className="text-white/75 text-base md:text-lg mb-8 max-w-lg">
                Connect with thousands of Africans in Malaysia. Discover deals, share recommendations, meet sellers, and stay updated — all in one place.
              </p>
              <ul className="space-y-2 mb-8 text-white/70 text-sm">
                {["Exclusive deals & first access to new sellers", "Connect with African businesses near you", "Community events, tips & marketplace updates"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#2AABEE] hover:bg-[#1f9ddc] text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105 text-base"
                >
                  <Send className="w-5 h-5" />
                  Join Afrinza Market on Telegram
                </a>
                <Link href="/become-seller">
                  <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 font-semibold">
                    Become a Seller
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-4 shrink-0">
              {[
                { value: "5,000+", label: "Community Members" },
                { value: "200+", label: "African Sellers" },
                { value: "10+", label: "Cities in Malaysia" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/8 border border-white/10 rounded-2xl px-6 py-5 text-center backdrop-blur-sm min-w-[130px]">
                  <p className="text-3xl font-bold text-amber-400 font-serif">{stat.value}</p>
                  <p className="text-white/60 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Become a Seller CTA ────────────────────────────── */}
      <section className="container mx-auto px-4 pb-8">
        <div className="bg-primary rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="relative z-10 md:w-2/3">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-serif mb-4">Have something to sell?</h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl">
              Join hundreds of African businesses thriving in Malaysia. Set up your shop in minutes and reach thousands of buyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild className="rounded-full font-bold text-secondary-foreground">
                <Link href="/become-seller">Open Your Store</Link>
              </Button>
              <Button size="lg" asChild variant="outline" className="rounded-full text-white border-white hover:bg-white/10">
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative z-10 md:w-1/3 flex justify-center">
            <div className="w-40 h-40 md:w-56 md:h-56 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Store className="w-20 h-20 text-white" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
