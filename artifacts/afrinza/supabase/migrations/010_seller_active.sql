-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Seller Active Flag
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS sellers_is_active_idx ON sellers (is_active);
