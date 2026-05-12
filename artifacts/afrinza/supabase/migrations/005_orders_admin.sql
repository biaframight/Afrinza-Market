-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Migration 005: Admin Orders Read Access
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Allow the admin account to read all orders
CREATE POLICY IF NOT EXISTS "orders: admin read"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'email' = 'alphuplift@gmail.com');

-- Allow the admin account to update order status
CREATE POLICY IF NOT EXISTS "orders: admin update"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'alphuplift@gmail.com');
