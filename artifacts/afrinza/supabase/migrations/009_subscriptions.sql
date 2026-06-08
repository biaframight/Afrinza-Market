-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Subscription Payments
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_payments (
  id           SERIAL PRIMARY KEY,
  seller_id    INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  month        TEXT NOT NULL,              -- format: "YYYY-MM"
  amount       DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  receipt_url  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE (seller_id, month)                -- one payment record per seller per month
);

CREATE INDEX IF NOT EXISTS sub_payments_seller_idx  ON subscription_payments (seller_id);
CREATE INDEX IF NOT EXISTS sub_payments_status_idx  ON subscription_payments (status);
CREATE INDEX IF NOT EXISTS sub_payments_month_idx   ON subscription_payments (month);

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'sub_public_read') THEN
    EXECUTE $p$ CREATE POLICY "sub_public_read"   ON subscription_payments FOR SELECT USING (TRUE) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'sub_public_insert') THEN
    EXECUTE $p$ CREATE POLICY "sub_public_insert" ON subscription_payments FOR INSERT WITH CHECK (TRUE) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_payments' AND policyname = 'sub_public_update') THEN
    EXECUTE $p$ CREATE POLICY "sub_public_update" ON subscription_payments FOR UPDATE USING (TRUE) $p$;
  END IF;
END
$$;
