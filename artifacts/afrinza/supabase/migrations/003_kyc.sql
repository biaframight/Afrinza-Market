-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — KYC (Know Your Customer) migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS kyc_status        TEXT        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS kyc_whatsapp      TEXT,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN     NOT NULL DEFAULT FALSE;

-- kyc_status values: 'none' | 'pending' | 'verified' | 'rejected'
-- kyc_whatsapp: the WhatsApp number the seller submitted for verification
-- kyc_submitted_at: timestamp of the KYC request
-- is_verified: set to TRUE by admin after successful verification

-- ─── RLS policies for KYC (run if RLS is enabled on sellers) ─────

-- Sellers can update their own KYC request (when status is 'none' or 'rejected')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sellers' AND policyname = 'sellers_submit_kyc'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "sellers_submit_kyc" ON sellers
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END
$$;
