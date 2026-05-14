import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AfrinzaLogo } from "@/components/afrinza-logo";
import { MarketBanner } from "@/components/market-banner";
import {
  ShoppingCart, Search, Menu, Store, Home, PackageSearch,
  MessageCircleQuestion, Sparkles, Info, HelpCircle,
  LayoutDashboard, LogOut, UserCircle, Shield,
} from "lucide-react";
import { useGetCart } from "@/hooks/use-marketplace";
import { getSessionId } from "@/lib/session";
import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/auth-context";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sessionId = getSessionId();
  const { user, isAuthenticated, sellerProfile, signOut } = useAuthContext();

  const { data: cartData } = useGetCart({ sessionId });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const cartItemCount = cartData?.itemCount || 0;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Account";

  const initials = (displayName[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <MarketBanner />
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left"><AfrinzaLogo height={38} /></SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-8">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <Home className="h-5 w-5 text-muted-foreground" /> Home
                  </Link>
                  <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <PackageSearch className="h-5 w-5 text-muted-foreground" /> Products
                  </Link>
                  <Link href="/sellers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <Store className="h-5 w-5 text-muted-foreground" /> Sellers
                  </Link>
                  <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <Sparkles className="h-5 w-5 text-muted-foreground" /> Services
                  </Link>
                  <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <Info className="h-5 w-5 text-muted-foreground" /> About
                  </Link>
                  <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" /> How it Works
                  </Link>
                  <div className="h-px bg-border my-2" />
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground" /> My Dashboard
                      </Link>
                      {user?.email === "alphuplift@gmail.com" && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold">
                          <Shield className="h-5 w-5" /> Admin Panel
                        </Link>
                      )}
                      {!sellerProfile && (
                        <Link href="/become-seller" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                          <Store className="h-5 w-5" /> Open a Store
                        </Link>
                      )}
                      <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium text-left text-muted-foreground">
                        <LogOut className="h-5 w-5" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                        <UserCircle className="h-5 w-5 text-muted-foreground" /> Sign In / Register
                      </Link>
                      <Link href="/become-seller" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                        <Store className="h-5 w-5" /> Become a Seller
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <AfrinzaLogo height={44} />
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              🇲🇾 Malaysia · Phase 1
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 mx-3">
            <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">Products</Link>
            <Link href="/sellers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">Sellers</Link>
            <Link href="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">Services</Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">About</Link>
            <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">How it Works</Link>
          </nav>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                enterKeyHint="search"
                placeholder="What are you looking for?"
                className="pl-9 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="sr-only">Search</button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors">
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </Link>

            <div className="hidden md:flex items-center gap-2 ml-1">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1">
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.email === "alphuplift@gmail.com" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-primary font-semibold">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {!sellerProfile && (
                      <DropdownMenuItem asChild>
                        <Link href="/become-seller" className="flex items-center gap-2 cursor-pointer">
                          <Store className="w-4 h-4" /> Open a Store
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-muted-foreground flex items-center gap-2 cursor-pointer">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" className="rounded-full h-9 px-4 text-sm" asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-4 text-sm" asChild>
                    <Link href="/become-seller">Become a Seller</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative w-full flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              enterKeyHint="search"
              placeholder="Search products..."
              className="pl-9 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-1 md:col-span-1 lg:col-span-2">
              <Link href="/" className="inline-flex items-center mb-4">
                <AfrinzaLogo height={48} />
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm mb-3 leading-relaxed mt-4">
                The global African diaspora marketplace. Buy, sell and connect — wherever you are in the world.
              </p>
              <p className="text-xs text-muted-foreground/70 mb-5">
                🇲🇾 Live in Malaysia &nbsp;·&nbsp; 🇬🇧 🇨🇦 🇦🇪 🇩🇪 🇺🇸 Coming soon
              </p>
              <a
                href="https://wa.me/60166088141"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 text-primary hover:bg-primary/5 px-4 py-2 text-sm font-medium transition-colors"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                Support on WhatsApp
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Marketplace</h3>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/products?category=Food" className="text-sm text-muted-foreground hover:text-primary transition-colors">African Food</Link></li>
                <li><Link href="/products?category=Fashion" className="text-sm text-muted-foreground hover:text-primary transition-colors">Fashion & Style</Link></li>
                <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Services</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Afrinza</Link></li>
                <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">How it Works</Link></li>
                <li><Link href="/become-seller" className="text-sm text-muted-foreground hover:text-primary transition-colors">Open a Store</Link></li>
                <li><Link href="/sellers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Seller Directory</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Afrinza — The Global African Marketplace. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              🇲🇾 Phase 1: Malaysia &nbsp;·&nbsp; Expanding worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
