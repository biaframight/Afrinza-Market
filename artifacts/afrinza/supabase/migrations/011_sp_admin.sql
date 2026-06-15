-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Admin policies for service_providers
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Allow admin to do anything on service_providers (verify, reject, delete, etc.)
DROP POLICY IF EXISTS "admin: all service_providers" ON service_providers;
CREATE POLICY "admin: all service_providers"
  ON service_providers FOR ALL
  USING  (auth.email() = 'alphuplift@gmail.com')
  WITH CHECK (auth.email() = 'alphuplift@gmail.com');

-- Allow admin to read all service_provider_subscriptions (not just their own)
DROP POLICY IF EXISTS "admin: all service_provider_subscriptions" ON service_provider_subscriptions;
CREATE POLICY "admin: all service_provider_subscriptions"
  ON service_provider_subscriptions FOR ALL
  USING  (auth.email() = 'alphuplift@gmail.com')
  WITH CHECK (auth.email() = 'alphuplift@gmail.com');
