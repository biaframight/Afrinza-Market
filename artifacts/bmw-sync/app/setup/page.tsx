import { ShieldCheck, Database, Key, ExternalLink, AlertTriangle } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">BMW-Sync</h1>
          <p className="text-slate-500 mt-1">Toilet Hygiene Compliance System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Setup Required</h2>
              <p className="text-sm text-slate-500">Supabase credentials not configured</p>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6">
            BMW-Sync requires a Supabase project for authentication and data storage.
            Follow these steps to get started:
          </p>

          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Create a Supabase project</p>
                <p className="text-slate-500 text-sm mt-0.5">Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a free project.</p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Set environment variables</p>
                <p className="text-slate-500 text-sm mt-0.5">Add these to your environment secrets:</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <code className="text-xs text-emerald-700 font-mono">NEXT_PUBLIC_SUPABASE_URL</code>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <code className="text-xs text-emerald-700 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-1.5">Find these in Supabase → Project Settings → API.</p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Create the database tables</p>
                <p className="text-slate-500 text-sm mt-0.5">Run this SQL in Supabase → SQL Editor:</p>
              </div>
            </li>
          </ol>

          <div className="mt-4 bg-slate-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre">{`-- Outlets
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  staff_qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  customer_qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cleaning logs
CREATE TABLE cleaning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  staff_name TEXT NOT NULL,
  is_bersih BOOLEAN DEFAULT false,
  is_menawan BOOLEAN DEFAULT false,
  is_wangi BOOLEAN DEFAULT false,
  is_selamat BOOLEAN DEFAULT false,
  photo_url TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer feedback
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  issue_type TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (optional but recommended)
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own outlets
CREATE POLICY "owners_own_outlets" ON outlets
  FOR ALL USING (owner_id = auth.uid());

-- Public can look up outlets by QR token (needed for QR scanning)
-- Safe: tokens are random UUIDs, guessing is not feasible
CREATE POLICY "public_token_lookup" ON outlets
  FOR SELECT TO anon USING (true);

-- Public can insert logs/feedback; owners can select for their outlets
CREATE POLICY "insert_cleaning_logs" ON cleaning_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "read_cleaning_logs" ON cleaning_logs
  FOR SELECT USING (
    outlet_id IN (SELECT id FROM outlets WHERE owner_id = auth.uid())
  );
CREATE POLICY "insert_customer_feedback" ON customer_feedback
  FOR INSERT WITH CHECK (true);
CREATE POLICY "read_customer_feedback" ON customer_feedback
  FOR SELECT USING (
    outlet_id IN (SELECT id FROM outlets WHERE owner_id = auth.uid())
  );
CREATE POLICY "update_customer_feedback" ON customer_feedback
  FOR UPDATE USING (
    outlet_id IN (SELECT id FROM outlets WHERE owner_id = auth.uid())
  );

-- Storage bucket for toilet photos
-- Create manually in Supabase → Storage → New bucket → "toilet-photos"`}</pre>
          </div>

          <div className="mt-6 flex items-start gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <Database className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold">After setup</p>
              <p className="text-emerald-700 text-xs mt-0.5">Restart the app after setting environment variables and insert outlet records via Supabase for the owner&apos;s user ID.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          BMW Mandate 2026 · Municipal Council Compliance Platform
        </p>
      </div>
    </div>
  );
}
