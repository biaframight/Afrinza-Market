/**
 * Supabase client for browser usage (client components).
 *
 * Expected database schema:
 *
 * -- Outlets owned by restaurant owners
 * CREATE TABLE outlets (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   owner_id UUID NOT NULL REFERENCES auth.users(id),
 *   name TEXT NOT NULL,
 *   address TEXT,
 *   staff_qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
 *   customer_qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Staff cleaning logs
 * CREATE TABLE cleaning_logs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   outlet_id UUID NOT NULL REFERENCES outlets(id),
 *   staff_name TEXT NOT NULL,
 *   is_bersih BOOLEAN DEFAULT false,   -- Clean
 *   is_menawan BOOLEAN DEFAULT false,  -- Attractive/tidy
 *   is_wangi BOOLEAN DEFAULT false,    -- Fragrant
 *   is_selamat BOOLEAN DEFAULT false,  -- Safe
 *   photo_url TEXT,                    -- URL from Supabase Storage or Base64
 *   logged_at TIMESTAMPTZ DEFAULT now(),
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Customer feedback submissions
 * CREATE TABLE customer_feedback (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   outlet_id UUID NOT NULL REFERENCES outlets(id),
 *   issue_type TEXT NOT NULL,  -- 'no_paper_soap' | 'wet_floor' | 'bad_odor' | 'trash_full'
 *   notes TEXT,
 *   status TEXT DEFAULT 'Pending',  -- 'Pending' | 'Resolved'
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Row Level Security (RLS) recommended:
 * -- outlets: owners can only see/edit their own outlets
 * -- cleaning_logs: public insert (staff), owners can select their outlets' logs
 * -- customer_feedback: public insert (customers), owners can select their outlets' feedback
 *
 * -- Storage:
 * -- Create a bucket named "toilet-photos" in Supabase Storage (public or with signed URLs)
 */

import { createBrowserClient } from "@supabase/ssr";

type OutletRow = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  staff_qr_token: string;
  customer_qr_token: string;
  whatsapp_number: string | null;
  created_at: string;
};

type CleaningLogRow = {
  id: string;
  outlet_id: string;
  staff_name: string;
  is_bersih: boolean;
  is_menawan: boolean;
  is_wangi: boolean;
  is_selamat: boolean;
  photo_url: string | null;
  logged_at: string;
  created_at: string;
};

type CustomerFeedbackRow = {
  id: string;
  outlet_id: string;
  issue_type: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      outlets: {
        Row: OutletRow;
        Insert: Omit<OutletRow, "id" | "created_at">;
        Update: Partial<Omit<OutletRow, "id" | "created_at">>;
      };
      cleaning_logs: {
        Row: CleaningLogRow;
        Insert: Omit<CleaningLogRow, "id" | "logged_at" | "created_at">;
        Update: Partial<Omit<CleaningLogRow, "id" | "created_at">>;
      };
      customer_feedback: {
        Row: CustomerFeedbackRow;
        Insert: Omit<CustomerFeedbackRow, "id" | "created_at">;
        Update: Partial<Omit<CustomerFeedbackRow, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

function resolveCredentials(): { url: string; key: string } | null {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (url.startsWith("eyJ") && key.startsWith("https://")) {
    [url, key] = [key, url];
  }

  if (!url.startsWith("https://")) return null;

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return resolveCredentials() !== null;
}

export function createClient() {
  const creds = resolveCredentials();

  if (!creds) {
    throw new Error(
      "Missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    );
  }

  return createBrowserClient(creds.url, creds.key);
}
