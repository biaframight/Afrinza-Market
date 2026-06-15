-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Room Payment Receipts
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS room_payments (
  id          SERIAL PRIMARY KEY,
  room_id     INTEGER NOT NULL REFERENCES room_listings(id) ON DELETE CASCADE,
  receipt_url TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE room_payments ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a payment receipt (public insert)
CREATE POLICY "room_payments_public_insert" ON room_payments
  FOR INSERT WITH CHECK (TRUE);

-- Only admin can read and update payment records
CREATE POLICY "room_payments_admin_read" ON room_payments
  FOR SELECT USING (auth.email() = 'alphuplift@gmail.com');

CREATE POLICY "room_payments_admin_update" ON room_payments
  FOR UPDATE USING (auth.email() = 'alphuplift@gmail.com');
