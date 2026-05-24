"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

const ADMIN_EMAIL = "biaframight@gmail.com";

type OutletRow = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  whatsapp_number: string | null;
  created_at: string;
  staff_qr_token: string;
  customer_qr_token: string;
};

type OwnerGroup = {
  owner_id: string;
  outlets: OutletRow[];
  logCount: number;
  feedbackCount: number;
};

const SETUP_SQL = `-- Run these in your Supabase SQL Editor to grant admin access
-- Only needs to be run once.

-- 1. Allow admin to read ALL outlets (not just their own)
CREATE POLICY "admin_read_all_outlets" ON outlets
  FOR SELECT TO authenticated
  USING (auth.email() = '${ADMIN_EMAIL}' OR owner_id = auth.uid());

-- 2. Allow admin to delete any outlet
CREATE POLICY "admin_delete_outlets" ON outlets
  FOR DELETE TO authenticated
  USING (auth.email() = '${ADMIN_EMAIL}' OR owner_id = auth.uid());

-- 3. Allow admin to delete cleaning_logs for any outlet
CREATE POLICY "admin_delete_logs" ON cleaning_logs
  FOR DELETE TO authenticated
  USING (
    outlet_id IN (
      SELECT id FROM outlets
      WHERE auth.email() = '${ADMIN_EMAIL}' OR owner_id = auth.uid()
    )
  );

-- 4. Allow admin to delete customer_feedback for any outlet
CREATE POLICY "admin_delete_feedback" ON customer_feedback
  FOR DELETE TO authenticated
  USING (
    outlet_id IN (
      SELECT id FROM outlets
      WHERE auth.email() = '${ADMIN_EMAIL}' OR owner_id = auth.uid()
    )
  );`;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ownerGroups, setOwnerGroups] = useState<OwnerGroup[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showSetupSQL, setShowSetupSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  // Confirm-delete modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "outlet" | "owner";
    outletId?: string;
    ownerId?: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    setUserEmail(user.email);

    // Fetch ALL outlets (requires admin RLS policy)
    const { data: outletsData, error: outletsErr } = await supabase
      .from("outlets")
      .select("*")
      .order("created_at", { ascending: false });

    if (outletsErr) {
      setError(
        outletsErr.message.includes("policy")
          ? "RLS policies not set up yet. See the SQL setup panel below."
          : outletsErr.message,
      );
      setShowSetupSQL(true);
      setLoading(false);
      return;
    }

    const outlets = (outletsData ?? []) as OutletRow[];

    // Group by owner_id
    const groupMap: Record<string, OutletRow[]> = {};
    for (const o of outlets) {
      if (!groupMap[o.owner_id]) groupMap[o.owner_id] = [];
      groupMap[o.owner_id].push(o);
    }

    // Fetch log + feedback counts per outlet
    const outletIds = outlets.map((o) => o.id);
    let logCounts: Record<string, number> = {};
    let feedbackCounts: Record<string, number> = {};

    if (outletIds.length > 0) {
      const [logsRes, fbRes] = await Promise.all([
        supabase
          .from("cleaning_logs")
          .select("outlet_id")
          .in("outlet_id", outletIds),
        supabase
          .from("customer_feedback")
          .select("outlet_id")
          .in("outlet_id", outletIds),
      ]);

      for (const row of logsRes.data ?? []) {
        logCounts[row.outlet_id] = (logCounts[row.outlet_id] ?? 0) + 1;
      }
      for (const row of fbRes.data ?? []) {
        feedbackCounts[row.outlet_id] =
          (feedbackCounts[row.outlet_id] ?? 0) + 1;
      }
    }

    const groups: OwnerGroup[] = Object.entries(groupMap).map(
      ([owner_id, ownerOutlets]) => ({
        owner_id,
        outlets: ownerOutlets,
        logCount: ownerOutlets.reduce(
          (sum, o) => sum + (logCounts[o.id] ?? 0),
          0,
        ),
        feedbackCount: ownerOutlets.reduce(
          (sum, o) => sum + (feedbackCounts[o.id] ?? 0),
          0,
        ),
      }),
    );

    setOwnerGroups(groups);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const supabase = createClient();

    try {
      if (deleteTarget.type === "outlet" && deleteTarget.outletId) {
        const oid = deleteTarget.outletId;
        await supabase.from("cleaning_logs").delete().eq("outlet_id", oid);
        await supabase.from("customer_feedback").delete().eq("outlet_id", oid);
        const { error } = await supabase
          .from("outlets")
          .delete()
          .eq("id", oid);
        if (error) throw error;
      } else if (deleteTarget.type === "owner" && deleteTarget.ownerId) {
        const ownerOutlets =
          ownerGroups
            .find((g) => g.owner_id === deleteTarget.ownerId)
            ?.outlets.map((o) => o.id) ?? [];

        for (const oid of ownerOutlets) {
          await supabase.from("cleaning_logs").delete().eq("outlet_id", oid);
          await supabase
            .from("customer_feedback")
            .delete()
            .eq("outlet_id", oid);
        }
        const { error } = await supabase
          .from("outlets")
          .delete()
          .eq("owner_id", deleteTarget.ownerId);
        if (error) throw error;
      }

      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalOutlets = ownerGroups.reduce(
    (s, g) => s + g.outlets.length,
    0,
  );
  const totalOwners = ownerGroups.length;
  const totalLogs = ownerGroups.reduce((s, g) => s + g.logCount, 0);
  const totalFeedback = ownerGroups.reduce((s, g) => s + g.feedbackCount, 0);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
      </div>
    );
  }

  // ─── Access Denied ───────────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            This area is restricted to the system administrator only.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">
                Admin Console
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/40 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Owners", value: totalOwners, icon: <Users className="w-5 h-5" />, color: "text-blue-400" },
            { label: "Outlets", value: totalOutlets, icon: <Building2 className="w-5 h-5" />, color: "text-emerald-400" },
            { label: "Cleaning Logs", value: totalLogs, icon: <ClipboardList className="w-5 h-5" />, color: "text-amber-400" },
            { label: "Feedback", value: totalFeedback, icon: <MessageSquare className="w-5 h-5" />, color: "text-purple-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800 rounded-2xl px-5 py-4 border border-slate-700"
            >
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Owner groups */}
        <div>
          <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest mb-4">
            Registered Owners &amp; Outlets
          </h2>

          {ownerGroups.length === 0 && !error ? (
            <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-500 border border-slate-700">
              No outlets registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {ownerGroups.map((group, idx) => {
                const isOpen = expanded[group.owner_id] ?? true;
                const short = group.owner_id.slice(0, 8).toUpperCase();
                return (
                  <div
                    key={group.owner_id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
                  >
                    {/* Owner row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [group.owner_id]: !isOpen,
                          }))
                        }
                        className="text-slate-400 hover:text-white transition"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">
                            Owner #{short}
                          </span>
                          <span className="text-slate-500 text-xs font-mono">
                            {group.owner_id}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {group.outlets.length} outlet
                          {group.outlets.length !== 1 ? "s" : ""} ·{" "}
                          {group.logCount} logs · {group.feedbackCount} feedback
                        </div>
                      </div>

                      {/* Remove owner button */}
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "owner",
                            ownerId: group.owner_id,
                            label: `Owner #${short} (${group.outlets.length} outlet${group.outlets.length !== 1 ? "s" : ""})`,
                          })
                        }
                        className="flex items-center gap-1.5 bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white border border-red-700/40 hover:border-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Remove Owner
                      </button>
                    </div>

                    {/* Outlets list */}
                    {isOpen && (
                      <div className="border-t border-slate-700">
                        {group.outlets.map((outlet) => (
                          <div
                            key={outlet.id}
                            className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-750"
                          >
                            <div className="w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {outlet.name}
                              </div>
                              <div className="text-slate-500 text-xs truncate">
                                {outlet.address ?? "No address"} ·{" "}
                                {outlet.whatsapp_number ?? "No WhatsApp"} ·
                                Added{" "}
                                {new Date(outlet.created_at).toLocaleDateString(
                                  "en-MY",
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: "outlet",
                                  outletId: outlet.id,
                                  label: outlet.name,
                                })
                              }
                              className="flex items-center gap-1 text-slate-500 hover:text-red-400 hover:bg-red-900/30 text-xs px-2.5 py-1.5 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SQL Setup Panel */}
        <div className="bg-slate-800 border border-amber-500/30 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSetupSQL((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Required Supabase SQL Policies
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Run once in your Supabase SQL Editor to enable admin access
                </p>
              </div>
            </div>
            {showSetupSQL ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showSetupSQL && (
            <div className="border-t border-slate-700 px-5 pb-5">
              <div className="relative mt-4">
                <pre className="bg-slate-900 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {SETUP_SQL}
                </pre>
                <button
                  onClick={copySQL}
                  className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-3">
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  supabase.com/dashboard
                </a>{" "}
                → your project → SQL Editor → paste and run the above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-red-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-white font-bold text-lg mb-1">
              {deleteTarget.type === "owner"
                ? "Remove Owner"
                : "Delete Outlet"}
            </h3>
            <p className="text-slate-400 text-sm mb-1">
              This will permanently delete{" "}
              <strong className="text-white">{deleteTarget.label}</strong>
              {deleteTarget.type === "owner"
                ? " and ALL their outlets"
                : ""}
              .
            </p>
            <p className="text-red-400 text-xs mb-6">
              All cleaning logs and customer feedback for{" "}
              {deleteTarget.type === "owner" ? "these outlets" : "this outlet"}{" "}
              will also be deleted. This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
