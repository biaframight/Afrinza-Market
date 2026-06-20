import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useAdminGetAllSellers,
  useAdminGetAllProducts,
  useAdminToggleSellerPremium,
  useAdminToggleProductSponsored,
  useAdminDeleteSeller,
  useAdminDeleteProduct,
  useAdminGetAllOrders,
  useAdminUpdateOrderStatus,
  useAdminVerifySeller,
  useAdminRejectKyc,
  useAdminRevokeVerification,
  useAdminGetSubscriptions,
  useAdminConfirmSubscription,
  useAdminRejectSubscription,
  useAdminToggleSellerActive,
  useAdminGetAllServiceProviders,
  useAdminDeleteServiceProvider,
  useAdminVerifyServiceProvider,
  useAdminRejectSpKyc,
  useAdminRevokeSpVerification,
  useAdminGetAllRoomListings,
  useAdminApproveRoomListing,
  useAdminUpdateRoomListing,
  useAdminDeleteRoomListing,
  useFeatureFlag,
  useSetFeatureFlag,
} from "@/hooks/use-marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Store, Package, Star, Trash2, Loader2, StarOff, Users, Tag,
  ShoppingBag, TrendingUp, Calendar, ChevronDown, CheckCircle, Clock, XCircle,
  BadgeCheck, Phone, UserCheck, UserX, ShieldOff, CreditCard, Power,
  KeyRound, Eye, EyeOff, Pencil, Settings, ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminOrder, RoomListing } from "@/lib/supabase-db";
import { MALAYSIA_LOCATIONS, CITIES_BY_COUNTRY, LOCATION_COUNTRIES, getCountryForCity, formatPrice, getCurrencyForCity } from "@/lib/malaysia-locations";

const ADMIN_EMAIL = "alphuplift@gmail.com";

type Tab = "orders" | "sellers" | "products" | "kyc" | "subscriptions" | "serviceproviders" | "rooms" | "settings";
type Period = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "completed", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

function filterByPeriod(orders: AdminOrder[], period: Period): AdminOrder[] {
  const start = periodStart(period);
  if (!start) return orders;
  return orders.filter((o) => new Date(o.createdAt) >= start);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function groupByDay(orders: AdminOrder[]): { label: string; count: number; revenue: number }[] {
  const map: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const key = formatShortDate(o.createdAt);
    if (!map[key]) map[key] = { count: 0, revenue: 0 };
    map[key].count += 1;
    map[key].revenue += o.total;
  }
  return Object.entries(map)
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    .slice(-14);
}

function AdminSettingsTab() {
  const subFlag = useFeatureFlag("subscription_enabled");
  const setFlag = useSetFeatureFlag();
  const enabled = subFlag.data === "true";

  const toggle = () => {
    setFlag.mutate(
      { key: "subscription_enabled", value: enabled ? "false" : "true" },
      {
        onSuccess: () => toast.success(enabled ? "Subscription feature hidden from users." : "Subscription feature is now visible to users."),
        onError: () => toast.error("Failed to update setting. Make sure 014_site_settings.sql has been run."),
      }
    );
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Feature Flags</h2>
        <p className="text-sm text-muted-foreground">Toggle features on or off site-wide. Changes take effect immediately for all users.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${enabled ? "bg-green-100" : "bg-muted"}`}>
            <CreditCard className={`w-5 h-5 ${enabled ? "text-green-600" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">RM 10 Subscription Feature</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shows subscription payment UI (QR code, receipt upload, payment prompts) to sellers, service providers, and room listers.
                  When OFF, all subscription-related UI is hidden — listings are free.
                </p>
              </div>
              <button
                onClick={toggle}
                disabled={subFlag.isLoading || setFlag.isPending}
                className="shrink-0 focus:outline-none disabled:opacity-50"
                title={enabled ? "Click to disable" : "Click to enable"}
              >
                {subFlag.isLoading || setFlag.isPending ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : enabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {enabled ? "● Visible to users" : "● Hidden from users"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠ Before enabling</p>
        <p className="text-xs">Make sure migration <code className="bg-amber-100 px-1 rounded">014_site_settings.sql</code> has been run in your Supabase SQL Editor, otherwise the toggle will have no effect.</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [tab, setTab] = useState<Tab>("orders");
  const [period, setPeriod] = useState<Period>("month");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "seller" | "product" | "serviceProvider"; id: number; name: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<{ id: number; title: string } | null>(null);
  const [editingAdminRoom, setEditingAdminRoom] = useState<RoomListing | null>(null);
  const [adminRoomForm, setAdminRoomForm] = useState({ title: "", roomType: "", pricePerMonth: "", location: "", availableFrom: "" });
  const [adminRoomCountry, setAdminRoomCountry] = useState("");
  const [adminRoomFilter, setAdminRoomFilter] = useState<"all" | "pending" | "live">("all");

  const allSellers = useAdminGetAllSellers();
  const allProducts = useAdminGetAllProducts();
  const allOrdersQ = useAdminGetAllOrders();
  const toggleSellerPremium = useAdminToggleSellerPremium();
  const toggleSellerActive = useAdminToggleSellerActive();
  const toggleProductSponsored = useAdminToggleProductSponsored();
  const deleteSeller = useAdminDeleteSeller();
  const deleteProduct = useAdminDeleteProduct();
  const updateOrderStatus = useAdminUpdateOrderStatus();
  const verifySeller = useAdminVerifySeller();
  const rejectKyc = useAdminRejectKyc();
  const revokeVerification = useAdminRevokeVerification();
  const allSubs = useAdminGetSubscriptions();
  const confirmSub = useAdminConfirmSubscription();
  const rejectSub = useAdminRejectSubscription();
  const allServiceProviders = useAdminGetAllServiceProviders();
  const deleteServiceProvider = useAdminDeleteServiceProvider();
  const verifyServiceProvider = useAdminVerifyServiceProvider();
  const rejectSpKyc = useAdminRejectSpKyc();
  const revokeSpVerification = useAdminRevokeSpVerification();
  const allRoomListings = useAdminGetAllRoomListings();
  const approveRoom = useAdminApproveRoomListing();
  const updateAdminRoom = useAdminUpdateRoomListing();
  const deleteAdminRoom = useAdminDeleteRoomListing();

  const subPendingCount = useMemo(() => (allSubs.data ?? []).filter((s) => s.status === "pending").length, [allSubs.data]);
  const spPendingCount = useMemo(() => (allServiceProviders.data ?? []).filter((sp) => sp.kycStatus === "pending").length, [allServiceProviders.data]);
  const roomPendingCount = useMemo(() => (allRoomListings.data ?? []).filter((r) => !r.isActive).length, [allRoomListings.data]);
  const adminCurrentMonth = new Date().toISOString().slice(0, 7);

  const handleConfirmSub = (id: number) => {
    confirmSub.mutate({ id }, {
      onSuccess: () => toast.success("Subscription payment confirmed!"),
      onError: () => toast.error("Failed to confirm — check Supabase policies."),
    });
  };

  const handleRejectSub = (id: number) => {
    rejectSub.mutate({ id }, {
      onSuccess: () => toast.success("Payment rejected."),
      onError: () => toast.error("Failed to reject — check Supabase policies."),
    });
  };

  const sellers = allSellers.data ?? [];
  const products = allProducts.data ?? [];
  const allOrders = allOrdersQ.data ?? [];

  const filteredOrders = useMemo(() => filterByPeriod(allOrders, period), [allOrders, period]);
  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.total, 0), [filteredOrders]);
  const completedOrders = useMemo(() => filteredOrders.filter((o) => o.status === "completed"), [filteredOrders]);
  const pendingOrders  = useMemo(() => filteredOrders.filter((o) => o.status === "pending"),   [filteredOrders]);

  const todayOrders  = useMemo(() => filterByPeriod(allOrders, "today"),  [allOrders]);
  const weekOrders   = useMemo(() => filterByPeriod(allOrders, "week"),   [allOrders]);
  const monthOrders  = useMemo(() => filterByPeriod(allOrders, "month"),  [allOrders]);
  const yearOrders   = useMemo(() => filterByPeriod(allOrders, "year"),   [allOrders]);

  const kycSellers = useMemo(() => sellers.filter((s) => s.kycStatus !== "none"), [sellers]);
  const kycPendingCount = useMemo(() => sellers.filter((s) => s.kycStatus === "pending").length, [sellers]);

  const dayGroups = useMemo(() => groupByDay(filteredOrders), [filteredOrders]);
  const maxRevenue = useMemo(() => Math.max(...dayGroups.map((g) => g.revenue), 1), [dayGroups]);

  const handleToggleActive = (id: number, current: boolean) => {
    const next = !current;
    toggleSellerActive.mutate({ id, isActive: next }, {
      onSuccess: () => toast.success(next ? "Seller activated — they are now visible." : "Seller deactivated — hidden from marketplace."),
      onError: () => toast.error("Failed to update seller status."),
    });
  };

  const handleToggleSeller = (id: number, current: boolean) => {
    toggleSellerPremium.mutate({ id, isPremium: !current }, {
      onSuccess: () => toast.success(!current ? "Store marked as Sponsored" : "Sponsor badge removed"),
      onError: () => toast.error("Failed to update — check Supabase admin policy."),
    });
  };

  const handleToggleProduct = (id: number, current: boolean) => {
    toggleProductSponsored.mutate({ id, isSponsored: !current }, {
      onSuccess: () => toast.success(!current ? "Product marked as Sponsored" : "Sponsor removed"),
      onError: () => toast.error("Failed to update — check Supabase admin policy."),
    });
  };

  const handleVerify = (id: number) => {
    verifySeller.mutate({ id }, {
      onSuccess: () => toast.success("Seller verified!"),
      onError: () => toast.error("Failed — check Supabase admin policy."),
    });
  };

  const handleRejectKyc = (id: number) => {
    rejectKyc.mutate({ id }, {
      onSuccess: () => toast.success("KYC request rejected."),
      onError: () => toast.error("Failed — check Supabase admin policy."),
    });
  };

  const handleRevokeVerification = (id: number) => {
    revokeVerification.mutate({ id }, {
      onSuccess: () => toast.success("Verification revoked."),
      onError: () => toast.error("Failed — check Supabase admin policy."),
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "seller") {
      deleteSeller.mutate({ id: confirmDelete.id }, {
        onSuccess: () => { toast.success(`Store "${confirmDelete.name}" and all linked data deleted.`); setConfirmDelete(null); },
        onError: () => toast.error("Delete failed — check Supabase admin policy."),
      });
    } else if (confirmDelete.type === "serviceProvider") {
      deleteServiceProvider.mutate({ id: confirmDelete.id }, {
        onSuccess: () => { toast.success(`Service provider "${confirmDelete.name}" deleted.`); setConfirmDelete(null); },
        onError: () => toast.error("Delete failed — check Supabase admin policy."),
      });
    } else {
      deleteProduct.mutate({ id: confirmDelete.id }, {
        onSuccess: () => { toast.success(`Product "${confirmDelete.name}" deleted.`); setConfirmDelete(null); },
        onError: () => toast.error("Delete failed — check Supabase admin policy."),
      });
    }
  };

  const handleStatusChange = (orderId: number, status: string) => {
    setUpdatingOrderId(orderId);
    updateOrderStatus.mutate({ id: orderId, status }, {
      onSuccess: () => { toast.success(`Order #${orderId} marked as ${status}`); setUpdatingOrderId(null); },
      onError: () => { toast.error("Status update failed"); setUpdatingOrderId(null); },
    });
  };

  const handleAdminRoomEdit = (room: RoomListing) => {
    setEditingAdminRoom(room);
    setAdminRoomForm({
      title: room.title,
      roomType: room.roomType,
      pricePerMonth: room.pricePerMonth != null ? String(room.pricePerMonth) : "",
      location: room.location,
      availableFrom: room.availableFrom ?? "",
    });
    setAdminRoomCountry(getCountryForCity(room.location));
  };

  const handleSaveAdminRoom = () => {
    if (!editingAdminRoom) return;
    updateAdminRoom.mutate({
      id: editingAdminRoom.id,
      updates: {
        title: adminRoomForm.title,
        roomType: adminRoomForm.roomType,
        pricePerMonth: adminRoomForm.pricePerMonth ? parseFloat(adminRoomForm.pricePerMonth) : null,
        location: adminRoomForm.location,
        availableFrom: adminRoomForm.availableFrom || null,
      },
    }, {
      onSuccess: () => { toast.success("Room listing updated!"); setEditingAdminRoom(null); },
      onError: () => toast.error("Update failed — check Supabase admin policy."),
    });
  };

  const handleDeleteAdminRoom = () => {
    if (!confirmDeleteRoom) return;
    deleteAdminRoom.mutate({ id: confirmDeleteRoom.id }, {
      onSuccess: () => { toast.success("Room listing deleted."); setConfirmDeleteRoom(null); },
      onError: () => toast.error("Delete failed — check Supabase admin policy."),
    });
  };

  if (authLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Admin Access Only</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">This area is restricted to Afrinza administrators. Please sign in with your admin account.</p>
        <Button onClick={() => setLocation("/auth")} className="rounded-full px-8 h-12 font-semibold">Sign In</Button>
      </div>
    );
  }

  const sponsoredSellers  = sellers.filter((s) => s.isPremium).length;
  const sponsoredProducts = products.filter((p) => p.isSponsored).length;

  return (
    <div className="bg-muted/10 min-h-screen pb-20">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-[#0f3460] to-[#1a1a2e] text-white py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Afrinza Admin Panel</h1>
              <p className="text-white/60 text-sm">Signed in as {user.email}</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <ShoppingBag className="w-4 h-4" />, label: "Today's Orders",  value: todayOrders.length,  sub: `RM ${todayOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
              { icon: <Calendar    className="w-4 h-4" />, label: "This Week",       value: weekOrders.length,   sub: `RM ${weekOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
              { icon: <TrendingUp  className="w-4 h-4" />, label: "This Month",      value: monthOrders.length,  sub: `RM ${monthOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
              { icon: <Star        className="w-4 h-4 text-amber-400" />, label: "This Year", value: yearOrders.length, sub: `RM ${yearOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-white/70 mb-1 text-xs">{stat.icon} {stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-8">

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-border shadow-sm overflow-x-auto w-fit">
          {([
            { id: "orders",   icon: <ShoppingBag className="w-4 h-4" />, label: `Orders (${allOrders.length})` },
            { id: "sellers",  icon: <Store       className="w-4 h-4" />, label: `Sellers (${sellers.length})` },
            { id: "products", icon: <Package     className="w-4 h-4" />, label: `Products (${products.length})` },
            { id: "kyc",           icon: <BadgeCheck  className="w-4 h-4" />, label: `KYC${kycPendingCount > 0 ? ` (${kycPendingCount} pending)` : ""}` },
            { id: "subscriptions", icon: <CreditCard  className="w-4 h-4" />, label: `Subscriptions${subPendingCount > 0 ? ` (${subPendingCount} pending)` : ""}` },
            { id: "serviceproviders", icon: <Users className="w-4 h-4" />, label: `Service Providers${spPendingCount > 0 ? ` (${spPendingCount} pending)` : ` (${(allServiceProviders.data ?? []).length})`}` },
            { id: "rooms", icon: <KeyRound className="w-4 h-4" />, label: `Rooms${roomPendingCount > 0 ? ` (${roomPendingCount} pending)` : ` (${(allRoomListings.data ?? []).length})`}` },
            { id: "settings", icon: <Settings className="w-4 h-4" />, label: "Settings" },
          ] as const).map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            ORDERS TAB
        ══════════════════════════════════════════════════════════ */}
        {tab === "orders" && (
          <div className="space-y-6">

            {/* Period filter + summary cards */}
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${period === p ? "bg-primary text-white shadow" : "bg-white border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Summary cards for selected period */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Orders",   value: filteredOrders.length,          color: "bg-blue-50 text-blue-700",   sub: PERIOD_LABELS[period] },
                { label: "Total Revenue",  value: `RM ${totalRevenue.toFixed(2)}`, color: "bg-green-50 text-green-700", sub: "Gross" },
                { label: "Completed",      value: completedOrders.length,          color: "bg-emerald-50 text-emerald-700", sub: `RM ${completedOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
                { label: "Pending",        value: pendingOrders.length,            color: "bg-amber-50 text-amber-700", sub: `RM ${pendingOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}` },
              ].map((c) => (
                <div key={c.label} className={`rounded-2xl p-5 ${c.color}`}>
                  <p className="text-xs font-semibold opacity-70 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold leading-tight">{c.value}</p>
                  <p className="text-xs opacity-60 mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Revenue bar chart */}
            {dayGroups.length > 0 && (
              <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Revenue Trend
                  <span className="text-xs text-muted-foreground font-normal">({PERIOD_LABELS[period]})</span>
                </h3>
                <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-2">
                  {dayGroups.map((g) => (
                    <div key={g.label} className="flex flex-col items-center gap-1 min-w-[36px] flex-1">
                      <div className="text-[10px] text-muted-foreground font-medium">{g.count > 0 ? g.count : ""}</div>
                      <div
                        className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                        style={{ height: `${Math.max((g.revenue / maxRevenue) * 96, 4)}px` }}
                        title={`RM ${g.revenue.toFixed(2)} — ${g.count} order${g.count !== 1 ? "s" : ""}`}
                      />
                      <div className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap mt-1 ml-1">
                        {g.label.slice(0, 6)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders table */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              {allOrdersQ.isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No orders {period !== "all" ? `for ${PERIOD_LABELS[period].toLowerCase()}` : "yet"}</p>
                  <p className="text-sm mt-1">Orders placed through checkout will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">#</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Buyer</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Phone</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Store</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Total</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Payment</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Delivery</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4 text-muted-foreground font-mono text-xs">#{order.id}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold">{order.buyerName}</div>
                            {order.buyerAddress && <div className="text-xs text-muted-foreground mt-0.5 max-w-[160px] truncate">{order.buyerAddress}</div>}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{order.buyerPhone}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {order.sellerName
                              ? <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><Store className="w-3.5 h-3.5 text-primary shrink-0" />{order.sellerName}</span>
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 font-bold text-primary whitespace-nowrap">RM {order.total.toFixed(2)}</td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{order.paymentMethod}</td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{order.deliveryMethod}</td>
                          <td className="px-5 py-4">
                            <Select
                              value={order.status}
                              onValueChange={(v) => handleStatusChange(order.id, v)}
                              disabled={updatingOrderId === order.id}
                            >
                              <SelectTrigger className={`h-7 text-xs font-semibold rounded-full border-0 px-3 w-auto min-w-[110px] ${STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground"}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SELLERS TAB
        ══════════════════════════════════════════════════════════ */}
        {tab === "sellers" && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {allSellers.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : sellers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No sellers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Store</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Owner</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Phone</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Location</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Categories</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Verified</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Active</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Sponsored</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller) => (
                      <tr key={seller.id} className={`border-b border-border/50 transition-colors ${seller.isActive ? "hover:bg-muted/20" : "bg-red-50/40 hover:bg-red-50/60"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {seller.avatarUrl ? (
                              <img src={seller.avatarUrl} alt={seller.storeName} className="w-9 h-9 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {seller.storeName[0]}
                              </div>
                            )}
                            <div>
                              <div className={`font-semibold ${!seller.isActive ? "text-muted-foreground line-through" : ""}`}>{seller.storeName}</div>
                              {seller.isPremium && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 h-4 px-1.5">Sponsored</Badge>}
                              {!seller.isActive && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 h-4 px-1.5">Inactive</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{seller.ownerName}</td>
                        <td className="px-5 py-4">
                          {seller.whatsapp ? (
                            <a
                              href={`https://wa.me/${seller.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-sm font-medium whitespace-nowrap"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {seller.whatsapp}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{seller.location}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {seller.categories.slice(0, 2).map((c) => (
                              <Badge key={c} variant="outline" className="text-[10px] h-5">{c}</Badge>
                            ))}
                            {seller.categories.length > 2 && <Badge variant="outline" className="text-[10px] h-5">+{seller.categories.length - 2}</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {seller.isVerified ? (
                            <Badge className="bg-blue-100 text-blue-700 border-transparent gap-1 text-[10px] h-5">
                              <BadgeCheck className="w-3 h-3" /> Verified
                            </Badge>
                          ) : seller.kycStatus === "pending" ? (
                            <Badge className="bg-amber-100 text-amber-700 border-transparent gap-1 text-[10px] h-5">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          ) : seller.kycStatus === "rejected" ? (
                            <Badge className="bg-red-100 text-red-700 border-transparent gap-1 text-[10px] h-5">
                              <XCircle className="w-3 h-3" /> Rejected
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        {/* Active toggle */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(seller.id, seller.isActive)}
                            disabled={toggleSellerActive.isPending}
                            title={seller.isActive ? "Deactivate seller" : "Activate seller"}
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all ${
                              seller.isActive
                                ? "bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600"
                                : "bg-red-100 text-red-500 hover:bg-green-100 hover:text-green-600"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </td>
                        {/* Sponsored toggle */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleSeller(seller.id, seller.isPremium)}
                            disabled={toggleSellerPremium.isPending}
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all ${seller.isPremium ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-500"}`}
                          >
                            {seller.isPremium ? <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Star className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setConfirmDelete({ type: "seller", id: seller.id, name: seller.storeName })}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center mx-auto transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PRODUCTS TAB
        ══════════════════════════════════════════════════════════ */}
        {tab === "products" && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {allProducts.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No products yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Product</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Seller</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Category</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Price</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Sponsored</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded-xl object-contain border border-border bg-white p-0.5" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold max-w-[200px] truncate">{product.title}</div>
                              {product.isSponsored && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 h-4 px-1.5">Sponsored</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{product.sellerName}</td>
                        <td className="px-5 py-4"><Badge variant="outline" className="text-xs">{product.category}</Badge></td>
                        <td className="px-5 py-4 font-semibold">{formatPrice(product.price, product.location)}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleProduct(product.id, product.isSponsored)}
                            disabled={toggleProductSponsored.isPending}
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all ${product.isSponsored ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-500"}`}
                          >
                            {product.isSponsored ? <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Star className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setConfirmDelete({ type: "product", id: product.id, name: product.title })}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center mx-auto transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* ══════════════════════════════════════════════════════════
            KYC TAB
        ══════════════════════════════════════════════════════════ */}
        {tab === "kyc" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Requests", value: kycSellers.length, color: "bg-blue-50 text-blue-700" },
                { label: "Pending Review", value: sellers.filter((s) => s.kycStatus === "pending").length, color: "bg-amber-50 text-amber-700" },
                { label: "Verified Sellers", value: sellers.filter((s) => s.isVerified).length, color: "bg-green-50 text-green-700" },
              ].map((c) => (
                <div key={c.label} className={`rounded-2xl p-5 ${c.color}`}>
                  <p className="text-xs font-semibold opacity-70 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold">{c.value}</p>
                </div>
              ))}
            </div>

            {/* SQL setup panel */}
            <details className="bg-slate-900 text-slate-200 rounded-2xl p-5 text-xs font-mono">
              <summary className="cursor-pointer font-sans font-semibold text-sm text-slate-300 mb-3 list-none flex items-center gap-2">
                <Shield className="w-4 h-4" /> Database Setup — Run this SQL in Supabase if you haven't yet
              </summary>
              <pre className="mt-3 whitespace-pre-wrap leading-relaxed">{`ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS kyc_status        TEXT        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS kyc_whatsapp      TEXT,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN     NOT NULL DEFAULT FALSE;`}</pre>
            </details>

            {/* KYC requests table */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              {allSellers.isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : kycSellers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <BadgeCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No KYC requests yet</p>
                  <p className="text-sm mt-1">Sellers will appear here once they submit a verification request.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Store</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground">WhatsApp (KYC)</th>
                        <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Submitted</th>
                        <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Status</th>
                        <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kycSellers.map((seller) => (
                        <tr key={seller.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {seller.avatarUrl ? (
                                <img src={seller.avatarUrl} alt={seller.storeName} className="w-9 h-9 rounded-full object-cover border border-border" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  {seller.storeName[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold flex items-center gap-1.5">
                                  {seller.storeName}
                                  {seller.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                                </div>
                                <div className="text-xs text-muted-foreground">{seller.ownerName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {seller.kycWhatsapp ? (
                              <a
                                href={`https://wa.me/${seller.kycWhatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-green-700 hover:text-green-800 font-medium"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                {seller.kycWhatsapp}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground text-xs">
                            {seller.kycSubmittedAt ? formatShortDate(seller.kycSubmittedAt) : "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {seller.isVerified ? (
                              <Badge className="bg-blue-100 text-blue-700 border-transparent gap-1">
                                <BadgeCheck className="w-3 h-3" /> Verified
                              </Badge>
                            ) : seller.kycStatus === "pending" ? (
                              <Badge className="bg-amber-100 text-amber-700 border-transparent gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-transparent gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {!seller.isVerified && seller.kycStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleVerify(seller.id)}
                                    disabled={verifySeller.isPending}
                                    title="Verify seller"
                                    className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectKyc(seller.id)}
                                    disabled={rejectKyc.isPending}
                                    title="Reject KYC"
                                    className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {seller.kycStatus === "rejected" && (
                                <button
                                  onClick={() => handleVerify(seller.id)}
                                  disabled={verifySeller.isPending}
                                  title="Verify anyway"
                                  className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              {seller.isVerified && (
                                <button
                                  onClick={() => handleRevokeVerification(seller.id)}
                                  disabled={revokeVerification.isPending}
                                  title="Revoke verification"
                                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                >
                                  <ShieldOff className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SUBSCRIPTIONS TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "subscriptions" && (
        <div className="space-y-5">

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-amber-700 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-amber-800">{subPendingCount}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-green-700 mb-1">Confirmed This Month</p>
              <p className="text-3xl font-bold text-green-800">
                {(allSubs.data ?? []).filter((s) => s.status === "confirmed" && s.month === adminCurrentMonth).length}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-blue-700 mb-1">Revenue This Month</p>
              <p className="text-3xl font-bold text-blue-800">
                RM {((allSubs.data ?? []).filter((s) => s.status === "confirmed" && s.month === adminCurrentMonth).length * 10).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-3xl border border-border shadow overflow-hidden">
            {allSubs.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : !allSubs.data?.length ? (
              <div className="py-16 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No subscription payments yet</p>
                <p className="text-sm mt-1">Payments will appear here once sellers subscribe.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left">
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Seller</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Month</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Amount</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Submitted</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Receipt</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="px-5 py-3 font-semibold text-muted-foreground text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {allSubs.data.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{sub.storeName ?? `Seller #${sub.sellerId}`}</p>
                          {sub.ownerName && <p className="text-xs text-muted-foreground">{sub.ownerName}</p>}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground font-medium">{sub.month}</td>
                        <td className="px-5 py-4 font-semibold">RM {sub.amount.toFixed(2)}</td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{formatShortDate(sub.createdAt)}</td>
                        <td className="px-5 py-4">
                          {sub.receiptUrl ? (
                            <a href={sub.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline hover:opacity-70">
                              View Receipt
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            sub.status === "confirmed" ? "bg-green-100 text-green-700"
                            : sub.status === "pending"   ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {sub.status === "pending" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleConfirmSub(sub.id)}
                                disabled={confirmSub.isPending}
                                title="Confirm payment"
                                className="w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectSub(sub.id)}
                                disabled={rejectSub.isPending}
                                title="Reject payment"
                                className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SERVICE PROVIDERS TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "serviceproviders" && (
        <div className="space-y-6">
          {/* Pending KYC requests */}
          {(allServiceProviders.data ?? []).some((sp) => sp.kycStatus === "pending") && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <h2 className="font-semibold text-base text-amber-900">Pending KYC Verification Requests</h2>
                  <p className="text-xs text-amber-700 mt-0.5">Review each request and contact the provider on WhatsApp before approving.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-100 bg-amber-50/50 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Provider</th>
                      <th className="px-5 py-3 text-left">Services</th>
                      <th className="px-5 py-3 text-left">KYC WhatsApp</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {(allServiceProviders.data ?? []).filter((sp) => sp.kycStatus === "pending").map((sp) => (
                      <tr key={sp.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{sp.providerName}</p>
                          {sp.businessName && <p className="text-xs text-muted-foreground">{sp.businessName}</p>}
                          <p className="text-xs text-muted-foreground">{sp.location}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {sp.serviceTypes.slice(0, 2).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] h-5">{s}</Badge>
                            ))}
                            {sp.serviceTypes.length > 2 && (
                              <Badge variant="outline" className="text-[10px] h-5">+{sp.serviceTypes.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {sp.kycWhatsapp ? (
                            <a
                              href={`https://wa.me/${sp.kycWhatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-sm font-medium whitespace-nowrap"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {sp.kycWhatsapp}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => verifyServiceProvider.mutate({ id: sp.id }, {
                                onSuccess: () => toast.success(`${sp.providerName} verified!`),
                                onError: () => toast.error("Failed to verify — check Supabase policies."),
                              })}
                              disabled={verifyServiceProvider.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => rejectSpKyc.mutate({ id: sp.id }, {
                                onSuccess: () => toast.success("KYC request rejected."),
                                onError: () => toast.error("Failed to reject — check Supabase policies."),
                              })}
                              disabled={rejectSpKyc.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-all border border-red-200"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All service providers */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base">All Service Providers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Deleting a provider removes their profile, SP subscriptions, and room listings.</p>
            </div>
            {allServiceProviders.isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (allServiceProviders.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">No service providers yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Provider</th>
                      <th className="px-5 py-3 text-left">Location</th>
                      <th className="px-5 py-3 text-left">WhatsApp</th>
                      <th className="px-5 py-3 text-left">Services</th>
                      <th className="px-5 py-3 text-center">KYC Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(allServiceProviders.data ?? []).map((sp) => (
                      <tr key={sp.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{sp.providerName}</p>
                          {sp.businessName && <p className="text-xs text-muted-foreground">{sp.businessName}</p>}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{sp.location}</td>
                        <td className="px-5 py-4">
                          <a
                            href={`https://wa.me/${sp.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-sm font-medium whitespace-nowrap"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {sp.whatsapp}
                          </a>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {sp.serviceTypes.slice(0, 2).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] h-5">{s}</Badge>
                            ))}
                            {sp.serviceTypes.length > 2 && (
                              <Badge variant="outline" className="text-[10px] h-5">+{sp.serviceTypes.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {sp.kycStatus === "verified" ? (
                            <Badge className="bg-blue-100 text-blue-700 border-transparent gap-1 text-[10px] h-5">
                              <BadgeCheck className="w-3 h-3" /> Verified
                            </Badge>
                          ) : sp.kycStatus === "pending" ? (
                            <Badge className="bg-amber-100 text-amber-700 border-transparent gap-1 text-[10px] h-5">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          ) : sp.kycStatus === "rejected" ? (
                            <Badge className="bg-red-100 text-red-700 border-transparent gap-1 text-[10px] h-5">
                              <XCircle className="w-3 h-3" /> Rejected
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-transparent text-[10px] h-5">No KYC</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {sp.kycStatus === "pending" && (
                              <>
                                <button
                                  onClick={() => verifyServiceProvider.mutate({ id: sp.id }, {
                                    onSuccess: () => toast.success(`${sp.providerName} verified!`),
                                    onError: () => toast.error("Failed — run migration 011_sp_admin.sql in Supabase."),
                                  })}
                                  disabled={verifyServiceProvider.isPending}
                                  title="Approve verification"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                                >
                                  <UserCheck className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => rejectSpKyc.mutate({ id: sp.id }, {
                                    onSuccess: () => toast.success("KYC rejected."),
                                    onError: () => toast.error("Failed — run migration 011_sp_admin.sql in Supabase."),
                                  })}
                                  disabled={rejectSpKyc.isPending}
                                  title="Reject KYC"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-all"
                                >
                                  <UserX className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {sp.kycStatus === "verified" && (
                              <button
                                onClick={() => revokeSpVerification.mutate({ id: sp.id }, {
                                  onSuccess: () => toast.success("Verification revoked."),
                                  onError: () => toast.error("Failed — run migration 011_sp_admin.sql in Supabase."),
                                })}
                                disabled={revokeSpVerification.isPending}
                                title="Revoke verification"
                                className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-700 flex items-center justify-center transition-all disabled:opacity-50"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDelete({ type: "serviceProvider", id: sp.id, name: sp.providerName })}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ROOMS TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "rooms" && (
        <div className="space-y-5">
          {/* Filter pills */}
          <div className="flex gap-2">
            {(["all", "pending", "live"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAdminRoomFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${adminRoomFilter === f ? "bg-primary text-white shadow" : "bg-white border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
              >
                {f === "all" ? `All (${(allRoomListings.data ?? []).length})` : f === "pending" ? `Pending (${roomPendingCount})` : `Live (${(allRoomListings.data ?? []).filter((r) => r.isActive).length})`}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base">Room Listings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Approve, edit, or remove room listings. New listings are pending until approved.</p>
            </div>
            {allRoomListings.isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (() => {
              const filtered = (allRoomListings.data ?? []).filter((r) =>
                adminRoomFilter === "all" ? true : adminRoomFilter === "pending" ? !r.isActive : r.isActive
              );
              if (filtered.length === 0) return (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <KeyRound className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No room listings{adminRoomFilter !== "all" ? ` (${adminRoomFilter})` : ""} yet.</p>
                </div>
              );
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Listing</th>
                        <th className="px-5 py-3 text-left">Location</th>
                        <th className="px-5 py-3 text-left">Lister / WhatsApp</th>
                        <th className="px-5 py-3 text-center">Price</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((room) => (
                        <tr key={room.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-foreground line-clamp-1">{room.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{room.roomType}</p>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{room.location}</td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium">{room.listerName}</p>
                            <a
                              href={`https://wa.me/${room.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-green-700 hover:text-green-800 text-xs font-medium mt-0.5"
                            >
                              <Phone className="w-3 h-3" /> {room.whatsapp}
                            </a>
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-primary text-sm">
                            {room.pricePerMonth != null ? `${getCurrencyForCity(room.location).symbol} ${room.pricePerMonth.toFixed(0)}` : "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {room.isActive ? (
                              <Badge className="bg-green-100 text-green-700 border-transparent gap-1 text-[10px] h-5">
                                <Eye className="w-3 h-3" /> Live
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 border-transparent gap-1 text-[10px] h-5">
                                <Clock className="w-3 h-3" /> Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => approveRoom.mutate({ id: room.id, approve: !room.isActive }, {
                                  onSuccess: () => toast.success(room.isActive ? "Listing deactivated." : "Listing approved — now live!"),
                                  onError: () => toast.error("Failed — run migration 012_rooms_admin.sql in Supabase."),
                                })}
                                disabled={approveRoom.isPending}
                                title={room.isActive ? "Deactivate" : "Approve"}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition-all ${room.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200" : "bg-green-600 text-white hover:bg-green-700"}`}
                              >
                                {room.isActive ? <EyeOff className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                {room.isActive ? "Deactivate" : "Approve"}
                              </button>
                              <button
                                onClick={() => handleAdminRoomEdit(room)}
                                title="Edit"
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteRoom({ id: room.id, title: room.title })}
                                title="Delete"
                                className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Admin Room Edit Dialog ─── */}
      <Dialog open={!!editingAdminRoom} onOpenChange={(open) => { if (!open) setEditingAdminRoom(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Room Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold block mb-1.5">Title</label>
              <Input value={adminRoomForm.title} onChange={(e) => setAdminRoomForm((f) => ({ ...f, title: e.target.value }))} className="h-10 bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Room Type</label>
                <Select value={adminRoomForm.roomType} onValueChange={(v) => setAdminRoomForm((f) => ({ ...f, roomType: v }))}>
                  <SelectTrigger className="h-10 bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Single Room","Master Room","Suite / Studio","Shared Room"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Price / mo (RM)</label>
                <Input type="number" min="0" value={adminRoomForm.pricePerMonth} onChange={(e) => setAdminRoomForm((f) => ({ ...f, pricePerMonth: e.target.value }))} className="h-10 bg-muted/30" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Country</label>
                <Select value={adminRoomCountry} onValueChange={(v) => { setAdminRoomCountry(v); setAdminRoomForm((f) => ({ ...f, location: "" })); }}>
                  <SelectTrigger className="h-10 bg-muted/30"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LOCATION_COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">City / State</label>
                <Select value={adminRoomForm.location} onValueChange={(v) => setAdminRoomForm((f) => ({ ...f, location: v }))} disabled={!adminRoomCountry}>
                  <SelectTrigger className="h-10 bg-muted/30"><SelectValue placeholder={adminRoomCountry ? "Select city" : "Select country first"} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(CITIES_BY_COUNTRY[adminRoomCountry] ?? []).map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold block mb-1.5">Available From</label>
                <Input type="date" value={adminRoomForm.availableFrom} onChange={(e) => setAdminRoomForm((f) => ({ ...f, availableFrom: e.target.value }))} className="h-10 bg-muted/30" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditingAdminRoom(null)} className="px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted/40 transition-all">Cancel</button>
            <button
              onClick={handleSaveAdminRoom}
              disabled={updateAdminRoom.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {updateAdminRoom.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin Room Delete Confirm ─── */}
      <AlertDialog open={!!confirmDeleteRoom} onOpenChange={(open) => !open && setConfirmDeleteRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{confirmDeleteRoom?.title}"</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdminRoom}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAdminRoom.isPending}
            >
              {deleteAdminRoom.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════
          SETTINGS TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "settings" && <AdminSettingsTab />}

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.type === "seller" ? "Delete Store?" : confirmDelete?.type === "serviceProvider" ? "Delete Service Provider?" : "Delete Product?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{confirmDelete?.name}"</strong>
              {confirmDelete?.type === "seller" && " along with all products, reviews, subscriptions, service provider profile, and room listings"}
              {confirmDelete?.type === "serviceProvider" && " along with their SP subscriptions and room listings"}
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSeller.isPending || deleteProduct.isPending || deleteServiceProvider.isPending}
            >
              {(deleteSeller.isPending || deleteProduct.isPending || deleteServiceProvider.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</>
              ) : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
