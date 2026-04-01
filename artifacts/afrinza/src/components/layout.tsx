import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  Store,
  Home,
  PackageSearch,
  MessageCircleQuestion,
} from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const sessionId = getSessionId();
  
  const { data: cartData } = useGetCart({ sessionId }, { 
    query: { 
      queryKey: ["cart", sessionId]
    } 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartItemCount = cartData?.itemCount || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <div className="bg-black rounded-xl px-3 py-1 inline-flex items-center">
                      <img src="/afrinza-logo-v2-nobg.png" alt="Afrinza" className="h-10 w-auto" />
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-lg rounded-md hover:bg-muted font-medium">
                    <Home className="h-5 w-5 text-muted-foreground" /> Home
                  </Link>
                  <Link href="/products" className="flex items-center gap-3 px-3 py-2 text-lg rounded-md hover:bg-muted font-medium">
                    <PackageSearch className="h-5 w-5 text-muted-foreground" /> Products
                  </Link>
                  <Link href="/sellers" className="flex items-center gap-3 px-3 py-2 text-lg rounded-md hover:bg-muted font-medium">
                    <Store className="h-5 w-5 text-muted-foreground" /> Sellers
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <Link href="/become-seller" className="flex items-center gap-3 px-3 py-2 text-lg rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                    <Store className="h-5 w-5" /> Become a Seller
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="bg-black rounded-xl px-3 py-1 flex items-center">
              <img src="/afrinza-logo-v2-nobg.png" alt="Afrinza" className="h-10 w-auto" />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 mx-4">
            <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/sellers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Sellers
            </Link>
          </nav>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="What are you looking for?" 
                className="pl-9 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors">
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>
            
            <div className="hidden md:block ml-2">
              <Button asChild variant="default" className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-sm">
                <Link href="/become-seller">Become a Seller</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative w-full flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-1 md:col-span-1 lg:col-span-2">
              <Link href="/" className="inline-flex items-center mb-4">
                <div className="bg-black rounded-xl px-3 py-1.5 inline-flex items-center">
                  <img src="/afrinza-logo-v2-nobg.png" alt="Afrinza" className="h-12 w-auto" />
                </div>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed mt-4">
                Your African Marketplace in Malaysia. Find home, anywhere. Buy and sell authentic food, fashion, and services.
              </p>
              <Button variant="outline" className="rounded-full gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary">
                <MessageCircleQuestion className="w-4 h-4" />
                Support on WhatsApp
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Marketplace</h3>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/products?category=food" className="text-sm text-muted-foreground hover:text-primary transition-colors">African Food</Link></li>
                <li><Link href="/products?category=fashion" className="text-sm text-muted-foreground hover:text-primary transition-colors">Fashion & Style</Link></li>
                <li><Link href="/products?category=beauty" className="text-sm text-muted-foreground hover:text-primary transition-colors">Beauty Services</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">For Sellers</h3>
              <ul className="space-y-3">
                <li><Link href="/become-seller" className="text-sm text-muted-foreground hover:text-primary transition-colors">Open a Store</Link></li>
                <li><Link href="/sellers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Seller Directory</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Afrinza Marketplace. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Connecting African sellers and buyers across Malaysia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
