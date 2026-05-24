"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Droplets,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wind,
} from "lucide-react";

const BMW_PILLARS = [
  {
    key: "is_bersih" as const,
    label: "Bersih",
    sublabel: "Clean",
    icon: <Droplets className="w-6 h-6" />,
  },
  {
    key: "is_menawan" as const,
    label: "Menawan",
    sublabel: "Attractive & Tidy",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    key: "is_wangi" as const,
    label: "Wangi",
    sublabel: "Fragrant",
    icon: <Wind className="w-6 h-6" />,
  },
  {
    key: "is_selamat" as const,
    label: "Selamat",
    sublabel: "Safe",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
];

type PillarKey = (typeof BMW_PILLARS)[number]["key"];

export default function StaffLogPage() {
  const params = useParams();
  const token = params?.token as string;

  const [outletName, setOutletName] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(null);
  const [loadingOutlet, setLoadingOutlet] = useState(true);
  const [outletError, setOutletError] = useState<string | null>(null);

  const [staffName, setStaffName] = useState("");
  const [pillars, setPillars] = useState<Record<PillarKey, boolean>>({
    is_bersih: false,
    is_menawan: false,
    is_wangi: false,
    is_selamat: false,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        .eq("staff_qr_token", token)
        .single();

      if (error || !data) {
        setOutletError("Invalid or expired QR code. Please scan again.");
      } else {
        setOutletName(data.name);
        setOutletId(data.id);
      }
      setLoadingOutlet(false);
    }
    loadOutlet();
  }, [token, configured]);

  function togglePillar(key: PillarKey) {
    setPillars((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outletId) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      let photoUrl: string | null = null;

      if (photoFile) {
        const fileName = `${outletId}/${Date.now()}_${photoFile.name.replace(/\s/g, "_")}`;
        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("toilet-photos")
            .upload(fileName, photoFile, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("toilet-photos")
            .getPublicUrl(uploadData.path);
          photoUrl = urlData?.publicUrl ?? null;
        } else {
          photoUrl = photoPreview;
        }
      }

      const { error } = await supabase.from("cleaning_logs").insert({
        outlet_id: outletId,
        staff_name: staffName.trim(),
        is_bersih: pillars.is_bersih,
        is_menawan: pillars.is_menawan,
        is_wangi: pillars.is_wangi,
        is_selamat: pillars.is_selamat,
        photo_url: photoUrl,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">BMW-Sync</h2>
          <p className="text-slate-500 text-sm mb-4">
            Staff Cleaning Log — Supabase not configured yet.
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
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (outletError) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
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

  if (success) {
    return (
      <div className="min-h-screen bg-emerald-600 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Log Submitted!</h2>
          <p className="text-emerald-100 text-lg mb-2">{outletName}</p>
          <p className="text-emerald-200 text-sm">
            Thank you for keeping our facilities BMW-compliant.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setStaffName("");
              setPillars({
                is_bersih: false,
                is_menawan: false,
                is_wangi: false,
                is_selamat: false,
              });
              setPhotoFile(null);
              setPhotoPreview(null);
            }}
            className="mt-8 bg-white text-emerald-700 font-semibold px-8 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Log Another
          </button>
        </div>
      </div>
    );
  }

  const allChecked = Object.values(pillars).every(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-emerald-600 text-white px-4 pt-10 pb-6 text-center">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold">Staff Cleaning Log</h1>
        <p className="text-emerald-100 mt-1">{outletName}</p>
        <div className="flex justify-center gap-3 mt-2 text-xs font-semibold tracking-widest text-emerald-200 uppercase">
          <span>Bersih</span>
          <span>·</span>
          <span>Menawan</span>
          <span>·</span>
          <span>Wangi</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-4 pb-10 pt-6 space-y-6 max-w-lg mx-auto"
      >
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {submitError}
          </div>
        )}

        {/* Staff Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
            placeholder="Enter your full name"
            className="w-full px-4 py-3.5 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* BMW Pillars */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            BMW Compliance Checklist{" "}
            <span className="text-slate-400 font-normal">(tap to check)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BMW_PILLARS.map((pillar) => {
              const checked = pillars[pillar.key];
              return (
                <button
                  key={pillar.key}
                  type="button"
                  onClick={() => togglePillar(pillar.key)}
                  className={`relative flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all active:scale-95 tap-highlight-none ${
                    checked
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-white border-slate-200 text-slate-500 shadow-sm"
                  }`}
                >
                  {checked && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    </span>
                  )}
                  <span className={checked ? "text-white" : "text-emerald-600"}>
                    {pillar.icon}
                  </span>
                  <span className="font-bold text-base">{pillar.label}</span>
                  <span
                    className={`text-xs ${checked ? "text-emerald-100" : "text-slate-400"}`}
                  >
                    {pillar.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
          {allChecked && (
            <div className="mt-3 text-center text-sm text-emerald-700 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              All pillars checked — excellent!
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Toilet Photo{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </p>
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              {/* Overlay input covers the whole image — tap anywhere to change */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ fontSize: 0 }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              {/* Visible button UI */}
              <div className="w-full flex flex-col items-center gap-2 py-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400">
                <Camera className="w-8 h-8" />
                <span className="text-sm font-medium">Take / Upload Photo</span>
                <span className="text-xs">Camera or gallery</span>
              </div>
              {/*
                The input is absolutely positioned over the entire button area
                with opacity:0. The user physically taps the input element
                itself — no JavaScript trigger, no label link, no synthetic
                click. Works on every iOS and Android browser without exception.
              */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ fontSize: 0 }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !staffName.trim()}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-200 transition active:scale-95 tap-highlight-none"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit Log
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
