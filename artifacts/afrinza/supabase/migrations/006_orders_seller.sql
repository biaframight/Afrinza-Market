-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Migration 006: Add seller info to orders table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS seller_id   INTEGER,
  ADD COLUMN IF NOT EXISTS seller_name TEXT;
