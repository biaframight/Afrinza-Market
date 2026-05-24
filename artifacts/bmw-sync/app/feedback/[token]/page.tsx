"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Droplets,
  ExternalLink,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Wind,
} from "lucide-react";

const ISSUES = [
  {
    key: "no_paper_soap",
    label: "No Toilet Paper / Soap",
    icon: <Droplets className="w-7 h-7" />,
    color: "blue",
  },
  {
    key: "wet_floor",
    label: "Wet / Slippery Floor",
    icon: <AlertTriangle className="w-7 h-7" />,
    color: "amber",
  },
  {
    key: "bad_odor",
    label: "Bad Odor",
    icon: <Wind className="w-7 h-7" />,
    color: "purple",
  },
  {
    key: "trash_full",
    label: "Trash Full / Overflowing",
    icon: <Trash2 className="w-7 h-7" />,
    color: "red",
  },
];

const COLOR_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    activeBg: string;
    activeText: string;
  }
> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
    activeText: "text-white",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    activeBg: "bg-amber-500",
    activeText: "text-white",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    activeBg: "bg-purple-600",
    activeText: "text-white",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    activeBg: "bg-red-600",
    activeText: "text-white",
  },
};

export default function CustomerFeedbackPage() {
  const params = useParams();
  const token = params?.token as string;

  const FALLBACK_WA = "60173346205";

  const [outletName, setOutletName] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(null);
  const [outletWhatsApp, setOutletWhatsApp] = useState<string | null>(null);
  const [loadingOutlet, setLoadingOutlet] = useState(true);
  const [outletError, setOutletError] = useState<string | null>(null);

  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoadingOutlet(false);
      return;
    }
    async function loadOutlet() {
      if (!token) return;
      const supabase = createClient();

      const { data, error } = await supabase
        .from("outlets")
        .select("id, name")
        .eq("customer_qr_token", token)
        .single();

      if (error || !data) {
        setOutletError("Invalid or expired QR code. Please scan again.");
        setLoadingOutlet(false);
        return;
      }

      setOutletName(data.name);
      setOutletId(data.id);

      try {
        const { data: waData } = await supabase
          .from("outlets")
          .select("whatsapp_number")
          .eq("id", data.id)
          .single();
        const waRow = waData as { whatsapp_number?: string | null } | null;
        setOutletWhatsApp(waRow?.whatsapp_number ?? null);
      } catch {
        // column not yet added — fallback number will be used
      }

      setLoadingOutlet(false);
    }
    loadOutlet();
  }, [token, configured]);

  function buildWhatsAppUrl(issueLabel: string): string {
    const rawNumber = (outletWhatsApp ?? FALLBACK_WA)
      .replace(/^\+/, "")
      .replace(/\s/g, "");
    const timestamp = new Date().toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      dateStyle: "short",
      timeStyle: "short",
    });
    const msgLines = [
      `🚨 *BMW-Sync Alert*`,
      `Outlet: ${outletName}`,
      `Issue: ${issueLabel}`,
      `Time: ${timestamp}`,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
      ``,
      `Please take action immediately.`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(msgLines)}`;
  }

  function handleSubmit() {
    if (!outletId || !selectedIssue) return;
    setSubmitError(null);
    setSubmitting(true);

    const issueLabel =
      ISSUES.find((i) => i.key === selectedIssue)?.label ?? selectedIssue;

    // Build the WhatsApp URL now — all data is already loaded, no async needed
    const waUrl = buildWhatsAppUrl(issueLabel);

    // Fire the DB insert in the background — don't await it.
    // The alert to the owner is the priority; the record will land in Supabase
    // within seconds regardless of when the user's browser closes.
    const supabase = createClient();
    supabase
      .from("customer_feedback")
      .insert({
        outlet_id: outletId,
        issue_type: selectedIssue,
        notes: notes.trim() || null,
        status: "Pending",
      })
      .then(({ error }) => {
        if (error) console.error("[bmw-sync] feedback insert failed:", error);
      });

    // Navigate the current page to WhatsApp immediately.
    // This is a synchronous navigation — no new tab, no popup blocker.
    // On Android/iOS it will deep-link into the WhatsApp app.
    // On desktop it opens wa.me in the same tab.
    window.location.href = waUrl;
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">BMW-Sync</h2>
          <p className="text-slate-500 text-sm mb-4">
            Customer Feedback — Supabase not configured yet.
          </p>
          <a
            href="/bmw-sync/setup"
            className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm hover:underline"
          >
            View Setup Guide <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (loadingOutlet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (outletError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Invalid QR Code
          </h2>
          <p className="text-slate-500 text-sm">{outletError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white px-4 pt-10 pb-6 text-center">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold">Customer Feedback</h1>
        <p className="text-slate-300 mt-1">{outletName}</p>
        <p className="text-slate-400 text-xs mt-2">
          Help us keep this toilet clean and comfortable
        </p>
      </div>

      <div className="px-4 pb-10 pt-6 max-w-lg mx-auto space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {submitError}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            What is the issue? <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ISSUES.map((issue) => {
              const colors = COLOR_MAP[issue.color];
              const active = selectedIssue === issue.key;
              return (
                <button
                  key={issue.key}
                  type="button"
                  onClick={() => setSelectedIssue(active ? null : issue.key)}
                  className={`relative flex flex-col items-center gap-3 py-6 px-3 rounded-2xl border-2 transition-all active:scale-95 tap-highlight-none ${
                    active
                      ? `${colors.activeBg} border-transparent shadow-lg ${colors.activeText}`
                      : `bg-white ${colors.border} ${colors.text} shadow-sm`
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 opacity-80" />
                    </span>
                  )}
                  <span className={active ? "opacity-90" : ""}>
                    {issue.icon}
                  </span>
                  <span className="text-sm font-semibold text-center leading-tight">
                    {issue.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Additional Notes{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue in more detail…"
            rows={3}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm resize-none"
          />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-emerald-800 text-sm">
            Tapping <strong>Submit</strong> will open WhatsApp and send an
            instant alert to the outlet manager.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedIssue}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition active:scale-95 tap-highlight-none"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Opening WhatsApp…
            </>
          ) : (
            <>
              Submit &amp; Alert Owner
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          BMW Mandate 2026 · Anonymous · Your feedback helps improve hygiene
        </p>
      </div>
    </div>
  );
}
