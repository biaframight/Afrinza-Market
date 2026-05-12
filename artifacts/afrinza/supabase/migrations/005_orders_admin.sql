-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Migration 005: Admin Orders Read & Update Access
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- NOTE: CREATE POLICY does not support IF NOT EXISTS — drop first.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "orders: admin read" ON orders;
CREATE POLICY "orders: admin read"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'email' = 'alphuplift@gmail.com');

DROP POLICY IF EXISTS "orders: admin update" ON orders;
CREATE POLICY "orders: admin update"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'alphuplift@gmail.com');
