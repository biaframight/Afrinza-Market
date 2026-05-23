"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createClient, type Database } from "@/lib/supabase";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  LogOut,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Outlet = Database["public"]["Tables"]["outlets"]["Row"];
type CleaningLog = Database["public"]["Tables"]["cleaning_logs"]["Row"];
type CustomerFeedback =
  Database["public"]["Tables"]["customer_feedback"]["Row"];

const ISSUE_LABELS: Record<string, string> = {
  no_paper_soap: "No Toilet Paper/Soap",
  wet_floor: "Wet/Slippery Floor",
  bad_odor: "Bad Odor",
  trash_full: "Trash Full",
};

// NEXT_PUBLIC_BASE_PATH is injected at build time from next.config.ts
// It is "/bmw-sync" on Replit and "" when deployed standalone (e.g. Vercel).
const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export default function DashboardPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all");
  const [activeQR, setActiveQR] = useState<{
    outletId: string;
    type: "staff" | "customer";
  } | null>(null);

  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [newOutletWhatsApp, setNewOutletWhatsApp] = useState("");
  const [addingOutlet, setAddingOutlet] = useState(false);
  const [addOutletError, setAddOutletError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email ?? null);

      const { data: outletsData, error: outletsError } = await supabase
        .from("outlets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (outletsError) throw outletsError;
      const safeOutlets = (outletsData ?? []) as Outlet[];
      setOutlets(safeOutlets);

      const outletIds = safeOutlets.map((o) => o.id);
      if (outletIds.length > 0) {
        const [logsRes, feedbackRes] = await Promise.all([
          supabase
            .from("cleaning_logs")
            .select("*")
            .in("outlet_id", outletIds)
            .order("logged_at", { ascending: false })
            .limit(50),
          supabase
            .from("customer_feedback")
            .select("*")
            .in("outlet_id", outletIds)
            .order("created_at", { ascending: false }),
        ]);
        if (logsRes.error) throw logsRes.error;
        if (feedbackRes.error) throw feedbackRes.error;
        setCleaningLogs((logsRes.data ?? []) as CleaningLog[]);
        setFeedback((feedbackRes.data ?? []) as CustomerFeedback[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cleaning_logs" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customer_feedback" },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddOutlet(e: React.FormEvent) {
    e.preventDefault();
    setAddOutletError(null);
    setAddingOutlet(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");
      const staffToken = crypto.randomUUID();
      const customerToken = crypto.randomUUID();
      const { error } = await supabase.from("outlets").insert({
        owner_id: user.id,
        name: newOutletName.trim(),
        address: newOutletAddress.trim() || null,
        staff_qr_token: staffToken,
        customer_qr_token: customerToken,
        whatsapp_number: newOutletWhatsApp.trim() || null,
      });
      if (error) throw error;
      setShowAddOutlet(false);
      setNewOutletName("");
      setNewOutletAddress("");
      await fetchData();
    } catch (err: unknown) {
      setAddOutletError(
        err instanceof Error ? err.message : "Failed to add outlet.",
      );
    } finally {
      setAddingOutlet(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function dismissFeedback(id: string) {
    await supabase
      .from("customer_feedback")
      .update({ status: "Resolved" })
      .eq("id", id);
    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "Resolved" } : f)),
    );
  }

  const baseUrl = getBaseUrl();
  const pendingAlerts = feedback.filter((f) => f.status === "Pending");

  const filteredLogs = cleaningLogs.filter((log) => {
    const outlet = outlets.find((o) => o.id === log.outlet_id);
    const matchesSearch =
      reportFilter === "" ||
      log.staff_name.toLowerCase().includes(reportFilter.toLowerCase()) ||
      (outlet?.name ?? "").toLowerCase().includes(reportFilter.toLowerCase());
    const matchesOutlet =
      selectedOutlet === "all" || log.outlet_id === selectedOutlet;
    return matchesSearch && matchesOutlet;
  });

  const complianceRate =
    cleaningLogs.length > 0
      ? Math.round(
          (cleaningLogs.filter(
            (l) => l.is_bersih && l.is_menawan && l.is_wangi,
          ).length /
            cleaningLogs.length) *
            100,
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Add Outlet Modal */}
      {showAddOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => {
                setShowAddOutlet(false);
                setAddOutletError(null);
                setNewOutletName("");
                setNewOutletAddress("");
                setNewOutletWhatsApp("");
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Add New Outlet
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              QR codes will be generated automatically.
            </p>
            {addOutletError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                {addOutletError}
              </div>
            )}
            <form onSubmit={handleAddOutlet} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Outlet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  required
                  placeholder="e.g. Restoran Maju — Main Branch"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newOutletAddress}
                  onChange={(e) => setNewOutletAddress(e.target.value)}
                  placeholder="e.g. No. 12, Jalan Ampang, KL"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp Number{" "}
                  <span className="text-slate-400 font-normal">(for customer alerts)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={newOutletWhatsApp}
                    onChange={(e) => setNewOutletWhatsApp(e.target.value)}
                    placeholder="+60173346205"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Include country code, e.g. +60xxxxxxxxx</p>
              </div>
              <button
                type="submit"
                disabled={addingOutlet || !newOutletName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-2"
              >
                {addingOutlet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Outlet
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-none">
                BMW-Sync
              </h1>
              <p className="text-xs text-slate-400">Owner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden sm:block text-sm text-slate-500 truncate max-w-48">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            label="Outlets"
            value={outlets.length}
            color="emerald"
          />
          <StatCard
            icon={<ClipboardList className="w-5 h-5" />}
            label="Cleaning Logs"
            value={cleaningLogs.length}
            color="emerald"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Pending Alerts"
            value={pendingAlerts.length}
            color={pendingAlerts.length > 0 ? "amber" : "emerald"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Compliance Rate"
            value={`${complianceRate}%`}
            color={complianceRate >= 80 ? "emerald" : "amber"}
          />
        </div>

        {/* Outlets & QR Codes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              My Outlets & QR Codes
            </h2>
            <button
              onClick={() => setShowAddOutlet(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add Outlet
            </button>
          </div>
          {outlets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No outlets yet</p>
              <p className="text-sm mt-1 mb-5">
                Add your first outlet to generate QR codes for staff and customers.
              </p>
              <button
                onClick={() => setShowAddOutlet(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Add Your First Outlet
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  outlet={outlet}
                  baseUrl={baseUrl}
                  activeQR={activeQR}
                  setActiveQR={setActiveQR}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Cleaning Logs */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Recent Cleaning Logs
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {cleaningLogs.slice(0, 8).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No cleaning logs yet.
                </div>
              ) : (
                cleaningLogs.slice(0, 8).map((log) => {
                  const outlet = outlets.find((o) => o.id === log.outlet_id);
                  return (
                    <CleaningLogRow
                      key={log.id}
                      log={log}
                      outletName={outlet?.name}
                    />
                  );
                })
              )}
            </div>
          </section>

          {/* Live Alerts */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Live Alerts
              {pendingAlerts.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingAlerts.length}
                </span>
              )}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {pendingAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                  No pending alerts — all clear!
                </div>
              ) : (
                pendingAlerts.slice(0, 8).map((item) => {
                  const outlet = outlets.find((o) => o.id === item.outlet_id);
                  return (
                    <AlertRow
                      key={item.id}
                      item={item}
                      outletName={outlet?.name}
                      onDismiss={() => dismissFeedback(item.id)}
                    />
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Compliance Report Table */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Compliance Report
            </h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff or outlet…"
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">
                      Date & Time
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">
                      Outlet
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">
                      Staff
                    </th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-600">
                      Bersih
                    </th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-600">
                      Menawan
                    </th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-600">
                      Wangi
                    </th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-600">
                      Selamat
                    </th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-600">
                      Photo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const outlet = outlets.find(
                        (o) => o.id === log.outlet_id,
                      );
                      const allPassed =
                        log.is_bersih &&
                        log.is_menawan &&
                        log.is_wangi &&
                        log.is_selamat;
                      return (
                        <tr
                          key={log.id}
                          className={
                            allPassed ? "bg-emerald-50/30" : "bg-amber-50/30"
                          }
                        >
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(log.logged_at).toLocaleString("en-MY")}
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            {outlet?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.staff_name}
                          </td>
                          <PillarCell checked={log.is_bersih} />
                          <PillarCell checked={log.is_menawan} />
                          <PillarCell checked={log.is_wangi} />
                          <PillarCell checked={log.is_selamat} />
                          <td className="px-3 py-3 text-center">
                            {log.photo_url ? (
                              <a
                                href={log.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:underline text-xs"
                              >
                                <Download className="w-3 h-3" />
                                View
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing {filteredLogs.length} of {cleaningLogs.length} records ·
              Compliance rate: {complianceRate}%
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "emerald" | "amber";
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${
          color === "emerald"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-amber-100 text-amber-600"
        }`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}


function OutletCard({
  outlet,
  baseUrl,
  activeQR,
  setActiveQR,
  onRefresh,
}: {
  outlet: Outlet;
  baseUrl: string;
  activeQR: { outletId: string; type: "staff" | "customer" } | null;
  setActiveQR: (
    v: { outletId: string; type: "staff" | "customer" } | null,
  ) => void;
  onRefresh: () => void;
}) {
  const [editingWA, setEditingWA] = useState(false);
  const [waBuf, setWaBuf] = useState(outlet.whatsapp_number ?? "");
  const [waSaving, setWaSaving] = useState(false);
  const qrDownloadRef = useRef<HTMLDivElement>(null);

  async function saveWhatsApp() {
    setWaSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("outlets")
        .update({ whatsapp_number: waBuf.trim() || null })
        .eq("id", outlet.id);
      setEditingWA(false);
      onRefresh();
    } finally {
      setWaSaving(false);
    }
  }

  const staffUrl = `${baseUrl}${APP_BASE}/log/${outlet.staff_qr_token}`;
  const customerUrl = `${baseUrl}${APP_BASE}/feedback/${outlet.customer_qr_token}`;

  const showingStaff =
    activeQR?.outletId === outlet.id && activeQR?.type === "staff";
  const showingCustomer =
    activeQR?.outletId === outlet.id && activeQR?.type === "customer";

  const staffQrId = `qr-staff-${outlet.id}`;
  const customerQrId = `qr-customer-${outlet.id}`;

  const safeName = outlet.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-base">
            {outlet.name}
          </h3>
          {outlet.address && (
            <p className="text-xs text-slate-400 mt-0.5">{outlet.address}</p>
          )}
        </div>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          Active
        </span>
      </div>

      {/* WhatsApp row */}
      <div className="flex items-center gap-2 mb-3 bg-slate-50 rounded-xl px-3 py-2">
        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        {editingWA ? (
          <>
            <input
              type="tel"
              value={waBuf}
              onChange={(e) => setWaBuf(e.target.value)}
              placeholder="+60xxxxxxxxx"
              className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400"
              autoFocus
            />
            <button
              onClick={saveWhatsApp}
              disabled={waSaving}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
            >
              {waSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditingWA(false); setWaBuf(outlet.whatsapp_number ?? ""); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-xs text-slate-600 truncate">
              {outlet.whatsapp_number ?? (
                <span className="text-slate-400 italic">No WhatsApp set</span>
              )}
            </span>
            <button
              onClick={() => setEditingWA(true)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium shrink-0"
            >
              {outlet.whatsapp_number ? "Edit" : "Add"}
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() =>
            setActiveQR(
              showingStaff ? null : { outletId: outlet.id, type: "staff" },
            )
          }
          className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition ${
            showingStaff
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff QR
        </button>
        <button
          onClick={() =>
            setActiveQR(
              showingCustomer
                ? null
                : { outletId: outlet.id, type: "customer" },
            )
          }
          className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition ${
            showingCustomer
              ? "bg-slate-700 text-white border-slate-700"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-400"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Customer QR
        </button>
      </div>

      {(showingStaff || showingCustomer) && (
        <div className="mt-3 flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl">
          {/* Visible QR — display only */}
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <QRCodeCanvas
              value={showingStaff ? staffUrl : customerUrl}
              size={200}
              bgColor="#ffffff"
              fgColor={showingStaff ? "#059669" : "#1e293b"}
              level="H"
            />
          </div>

          {/* Hidden high-res canvas used exclusively for download */}
          <div
            ref={qrDownloadRef}
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", top: "-9999px", pointerEvents: "none" }}
          >
            <QRCodeCanvas
              value={showingStaff ? staffUrl : customerUrl}
              size={800}
              bgColor="#ffffff"
              fgColor={showingStaff ? "#059669" : "#1e293b"}
              level="H"
            />
          </div>

          <p className="text-xs text-slate-500 text-center break-all">
            {showingStaff ? staffUrl : customerUrl}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            {showingStaff ? "Staff Cleaning Log" : "Customer Feedback"}
          </p>
          <button
            onClick={() => {
              const canvas = qrDownloadRef.current?.querySelector("canvas");
              if (!canvas) return;
              const filename = showingStaff
                ? `bmw-sync_staff_${safeName}.png`
                : `bmw-sync_customer_${safeName}.png`;
              const a = document.createElement("a");
              a.href = canvas.toDataURL("image/png");
              a.download = filename;
              a.click();
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition ${
              showingStaff
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-700 hover:bg-slate-800 text-white"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}

function CleaningLogRow({
  log,
  outletName,
}: {
  log: CleaningLog;
  outletName?: string;
}) {
  const allPassed = log.is_bersih && log.is_menawan && log.is_wangi;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          allPassed ? "bg-emerald-100" : "bg-amber-100"
        }`}
      >
        {allPassed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 text-sm truncate">
            {log.staff_name}
          </span>
          {outletName && (
            <span className="text-xs text-slate-400 truncate hidden sm:block">
              · {outletName}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 mt-1">
          {["B", "M", "W", "S"].map((pillar, i) => {
            const checked = [
              log.is_bersih,
              log.is_menawan,
              log.is_wangi,
              log.is_selamat,
            ][i];
            return (
              <span
                key={pillar}
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  checked
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {pillar}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {log.photo_url && (
          <a
            href={log.photo_url}
            target="_blank"
            rel="noopener noreferrer"
            title="View photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={log.photo_url}
              alt="Toilet photo"
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition"
            />
          </a>
        )}
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {new Date(log.logged_at).toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  item,
  outletName,
  onDismiss,
}: {
  item: CustomerFeedback;
  outletName?: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 text-sm truncate">
          {ISSUE_LABELS[item.issue_type] ?? item.issue_type}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {outletName} ·{" "}
          {new Date(item.created_at).toLocaleString("en-MY", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {item.notes && (
          <div className="text-xs text-slate-500 italic mt-0.5 truncate">
            {item.notes}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        title="Dismiss"
        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-100 flex items-center justify-center transition flex-shrink-0"
      >
        <XCircle className="w-4 h-4 text-slate-400 hover:text-red-500" />
      </button>
    </div>
  );
}

function PillarCell({ checked }: { checked: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
      )}
    </td>
  );
}
