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
} from "@/hooks/use-marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Store, Package, Star, Trash2, Loader2, StarOff, Users, Tag,
  ShoppingBag, TrendingUp, Calendar, ChevronDown, CheckCircle, Clock, XCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AdminOrder } from "@/lib/supabase-db";

const ADMIN_EMAIL = "alphuplift@gmail.com";

type Tab = "orders" | "sellers" | "products";
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

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [tab, setTab] = useState<Tab>("orders");
  const [period, setPeriod] = useState<Period>("month");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "seller" | "product"; id: number; name: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const allSellers = useAdminGetAllSellers();
  const allProducts = useAdminGetAllProducts();
  const allOrdersQ = useAdminGetAllOrders();
  const toggleSellerPremium = useAdminToggleSellerPremium();
  const toggleProductSponsored = useAdminToggleProductSponsored();
  const deleteSeller = useAdminDeleteSeller();
  const deleteProduct = useAdminDeleteProduct();
  const updateOrderStatus = useAdminUpdateOrderStatus();

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

  const dayGroups = useMemo(() => groupByDay(filteredOrders), [filteredOrders]);
  const maxRevenue = useMemo(() => Math.max(...dayGroups.map((g) => g.revenue), 1), [dayGroups]);

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

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "seller") {
      deleteSeller.mutate({ id: confirmDelete.id }, {
        onSuccess: () => { toast.success(`Store "${confirmDelete.name}" deleted.`); setConfirmDelete(null); },
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
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Location</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Categories</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Sponsored</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller) => (
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
                              <div className="font-semibold">{seller.storeName}</div>
                              {seller.isPremium && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 h-4 px-1.5">Sponsored</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{seller.ownerName}</td>
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
                        <td className="px-5 py-4 font-semibold">RM {parseFloat(product.price).toFixed(2)}</td>
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
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.type === "seller" ? "Store" : "Product"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{confirmDelete?.name}"</strong>
              {confirmDelete?.type === "seller" && " and all of its products"}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSeller.isPending || deleteProduct.isPending}
            >
              {(deleteSeller.isPending || deleteProduct.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</>
              ) : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
