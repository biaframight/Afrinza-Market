import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AfrinzaLogo } from "@/components/afrinza-logo";
import { MarketBanner } from "@/components/market-banner";
import {
  ShoppingCart, Search, Menu, Store, Home, PackageSearch,
  MessageCircleQuestion, Sparkles, Info, HelpCircle,
  LayoutDashboard, LogOut, UserCircle, Shield, Wrench, KeyRound,
  CreditCard, BadgeCheck, AlertTriangle, X, Bell, ChevronDown,
} from "lucide-react";
import { useGetCart, useGetCurrentSubscription, useGetServiceProviderByUser, useGetServiceProviderSub } from "@/hooks/use-marketplace";
import { getSessionId } from "@/lib/session";
import { useState, useEffect, useRef } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [notifIndex, setNotifIndex] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionId = getSessionId();
  const { user, isAuthenticated, sellerProfile, signOut } = useAuthContext();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentSub = useGetCurrentSubscription(sellerProfile?.id, currentMonth);
  const myServiceProvider = useGetServiceProviderByUser(user?.id);
  const currentSpSub = useGetServiceProviderSub(myServiceProvider.data?.id, currentMonth);

  const { data: cartData } = useGetCart({ sessionId });

  // ── Compute pending actions ─────────────────────────────────────
  // One subscription covers ALL roles — if either seller or SP sub is confirmed, both are satisfied
  const anySubConfirmed = currentSub.data?.status === "confirmed" || currentSpSub.data?.status === "confirmed";
  const subsLoaded = !currentSub.isLoading && !currentSpSub.isLoading;
  const isBothSellerAndSp = !!sellerProfile && !!myServiceProvider.data;

  const sellerNeedsKyc = !!sellerProfile && sellerProfile.kycStatus === "none";
  // For dual-role users, show a single sub prompt (not two separate ones)
  const sellerNeedsSubscription = !!sellerProfile && subsLoaded && !anySubConfirmed;
  const spNeedsKyc = !!myServiceProvider.data && !myServiceProvider.data.isVerified && myServiceProvider.data.kycStatus === "none";
  // SP sub prompt only shown if they're NOT already a seller (seller sub covers them)
  const spNeedsSubscription = !!myServiceProvider.data && !isBothSellerAndSp && subsLoaded && !anySubConfirmed;
  const hasUrgentActions = isAuthenticated && (sellerNeedsKyc || sellerNeedsSubscription || spNeedsKyc || spNeedsSubscription);

  const notifications: { msg: string; tab: string }[] = [
    ...(sellerNeedsSubscription
      ? [{ msg: "💳 Your seller subscription for this month hasn't been paid — pay RM 10 to avoid business interruption.", tab: "store" }]
      : []),
    ...(sellerNeedsKyc
      ? [{ msg: "🛡 Verify your store identity to build buyer trust and unlock all features.", tab: "store" }]
      : []),
    ...(spNeedsSubscription
      ? [{ msg: "💳 Your service provider subscription hasn't been paid this month — pay RM 10 to keep your listing active.", tab: "services" }]
      : []),
    ...(spNeedsKyc
      ? [{ msg: "🛡 Complete identity verification to earn a verified badge on your service profile.", tab: "services" }]
      : []),
  ];

  const currentNotif = notifications[notifIndex % Math.max(notifications.length, 1)];

  // ── Rotate banner messages every 6s ───────────────────────────
  useEffect(() => {
    if (!hasUrgentActions || notifications.length <= 1) return;
    const interval = setInterval(() => setNotifIndex((i) => i + 1), 6000);
    return () => clearInterval(interval);
  }, [hasUrgentActions, notifications.length]);

  // ── Periodic toast reminders ───────────────────────────────────
  useEffect(() => {
    if (!hasUrgentActions || !isAuthenticated || notifications.length === 0) return;

    // First reminder after 20 seconds
    toastTimerRef.current = setTimeout(() => {
      toast.warning(notifications[0].msg, {
        description: "Go to your dashboard to avoid business interruption.",
        action: { label: "Dashboard →", onClick: () => setLocation(`/dashboard?tab=${notifications[0].tab}`) },
        duration: 9000,
      });
    }, 20000);

    // Then every 7 minutes
    let idx = 1;
    toastIntervalRef.current = setInterval(() => {
      const n = notifications[idx % notifications.length];
      toast.warning(n.msg, {
        description: "Avoid business interruption — complete this now.",
        action: { label: "Dashboard →", onClick: () => setLocation(`/dashboard?tab=${n.tab}`) },
        duration: 9000,
      });
      idx++;
    }, 7 * 60 * 1000);

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastIntervalRef.current) clearInterval(toastIntervalRef.current);
    };
  }, [hasUrgentActions, isAuthenticated]);

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
                <Button variant="ghost" size="icon" className="-ml-2 relative">
                  <Menu className="h-6 w-6" />
                  {hasUrgentActions && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:w-[350px] overflow-y-auto">
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

                      {/* ── Urgent actions (mobile) ─────────────────── */}
                      {hasUrgentActions && (
                        <>
                          <div className="h-px bg-amber-200 my-1" />
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide px-3 py-0.5 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5" /> Action Required
                          </p>
                          {sellerNeedsSubscription && (
                            <Link
                              href="/dashboard?tab=store&action=subscribe"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-medium"
                            >
                              <CreditCard className="h-4 w-4 shrink-0" />
                              <span>Pay Seller Subscription (RM 10)</span>
                            </Link>
                          )}
                          {sellerNeedsKyc && (
                            <Link
                              href="/dashboard?tab=store"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-medium"
                            >
                              <BadgeCheck className="h-4 w-4 shrink-0" />
                              <span>Verify Your Store Identity</span>
                            </Link>
                          )}
                          {spNeedsSubscription && (
                            <Link
                              href="/dashboard?tab=services&action=subscribe-sp"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-medium"
                            >
                              <CreditCard className="h-4 w-4 shrink-0" />
                              <span>Pay Service Subscription (RM 10)</span>
                            </Link>
                          )}
                          {spNeedsKyc && (
                            <Link
                              href="/dashboard?tab=services"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-medium"
                            >
                              <BadgeCheck className="h-4 w-4 shrink-0" />
                              <span>Verify Service Provider Account</span>
                            </Link>
                          )}
                          <div className="h-px bg-border my-1" />
                        </>
                      )}

                      {!sellerProfile && (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-1 pb-0.5">List on Afrinza</p>
                          <Link href="/become-seller" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                            <Store className="h-5 w-5" /> Open a Store
                          </Link>
                          <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                            <Wrench className="h-5 w-5" /> Register a Service
                          </Link>
                          <Link href="/services?tab=rooms" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                            <KeyRound className="h-5 w-5" /> List a Room for Rent
                          </Link>
                        </>
                      )}
                      <button onClick={async () => { setMobileMenuOpen(false); await signOut(); setLocation("/"); }} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium text-left text-muted-foreground">
                        <LogOut className="h-5 w-5" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md hover:bg-muted font-medium">
                        <UserCircle className="h-5 w-5 text-muted-foreground" /> Sign In / Register
                      </Link>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-1 pb-0.5">List on Afrinza</p>
                      <Link href="/become-seller" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                        <Store className="h-5 w-5" /> Open a Store
                      </Link>
                      <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                        <Wrench className="h-5 w-5" /> Register a Service
                      </Link>
                      <Link href="/services?tab=rooms" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-base rounded-md text-primary bg-primary/5 hover:bg-primary/10 font-medium">
                        <KeyRound className="h-5 w-5" /> List a Room for Rent
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
            <Link href="/services?tab=rooms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-full px-3 py-1 transition-colors whitespace-nowrap">
              <KeyRound className="w-3.5 h-3.5" /> Rent a Room
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap outline-none">
                More <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/about" className="flex items-center gap-2 cursor-pointer">
                    <Info className="w-4 h-4" /> About
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/how-it-works" className="flex items-center gap-2 cursor-pointer">
                    <HelpCircle className="w-4 h-4" /> How it Works
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <button className="relative w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1">
                      {initials}
                      {/* Orange dot when actions are pending */}
                      {hasUrgentActions && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {sellerProfile && (
                        <p className="text-xs text-primary font-medium mt-0.5 truncate">🏪 {sellerProfile.storeName}</p>
                      )}
                      {myServiceProvider.data && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5 truncate">🔧 {myServiceProvider.data.businessName || myServiceProvider.data.providerName}</p>
                      )}
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

                    {/* ── Urgent action shortcuts (desktop dropdown) ── */}
                    {hasUrgentActions && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-1 text-[11px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Action Required
                        </div>
                        {sellerNeedsSubscription && (
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=store&action=subscribe" className="flex items-center gap-2 cursor-pointer text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium">
                              <CreditCard className="w-4 h-4 shrink-0" /> Pay Seller Sub · RM 10
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {sellerNeedsKyc && (
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=store" className="flex items-center gap-2 cursor-pointer text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium">
                              <BadgeCheck className="w-4 h-4 shrink-0" /> Verify Store Identity
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {spNeedsSubscription && (
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=services&action=subscribe-sp" className="flex items-center gap-2 cursor-pointer text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium">
                              <CreditCard className="w-4 h-4 shrink-0" /> Pay Service Sub · RM 10
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {spNeedsKyc && (
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=services" className="flex items-center gap-2 cursor-pointer text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium">
                              <BadgeCheck className="w-4 h-4 shrink-0" /> Verify Service Account
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {!sellerProfile && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">List on Afrinza</div>
                        <DropdownMenuItem asChild>
                          <Link href="/become-seller" className="flex items-center gap-2 cursor-pointer">
                            <Store className="w-4 h-4" /> Open a Store
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/services" className="flex items-center gap-2 cursor-pointer">
                            <Wrench className="w-4 h-4" /> Register a Service
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/services?tab=rooms" className="flex items-center gap-2 cursor-pointer">
                            <KeyRound className="w-4 h-4" /> List a Room
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => { await signOut(); setLocation("/"); }} className="text-muted-foreground flex items-center gap-2 cursor-pointer">
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

      {/* ── Notification Banner ──────────────────────────────────────── */}
      {hasUrgentActions && !bannerDismissed && currentNotif && (
        <div className="sticky top-[calc(4rem+1px)] z-40 w-full bg-amber-500 text-white shadow-sm">
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium flex-1 leading-snug">{currentNotif.msg}</p>
            <Link
              href={`/dashboard?tab=${currentNotif.tab}`}
              className="shrink-0 text-xs font-bold underline underline-offset-2 hover:text-amber-100 whitespace-nowrap"
            >
              Fix now →
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="shrink-0 p-0.5 rounded hover:bg-amber-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar showing rotation */}
          {notifications.length > 1 && (
            <div className="h-0.5 bg-amber-400/50">
              <div
                className="h-full bg-white/60 transition-none"
                style={{ width: `${((notifIndex % notifications.length) + 1) / notifications.length * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

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
