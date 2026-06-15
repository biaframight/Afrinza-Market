-- ============================================================
-- Afrinza Service Providers Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Service Providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  business_name TEXT,
  location TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  description TEXT,
  experience TEXT,
  service_types TEXT[] DEFAULT '{}',
  custom_service_type TEXT,
  photos TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'none',
  kyc_whatsapp TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Service Provider Subscriptions table
CREATE TABLE IF NOT EXISTS service_provider_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES service_providers(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add images column to room_listings (if it doesn't exist)
ALTER TABLE room_listings ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 4. Enable Row Level Security
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for service_providers
CREATE POLICY "Public can read active service providers"
  ON service_providers FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create service providers"
  ON service_providers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their service provider profile"
  ON service_providers FOR UPDATE USING (auth.uid() = user_id);

-- 6. RLS Policies for service_provider_subscriptions
CREATE POLICY "Owners can read their subscriptions"
  ON service_provider_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM service_providers WHERE id = provider_id AND user_id = auth.uid()
  ));

CREATE POLICY "Owners can create subscriptions"
  ON service_provider_subscriptions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM service_providers WHERE id = provider_id AND user_id = auth.uid()
  ));

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('service-photos', 'service-photos', TRUE, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('room-photos', 'room-photos', TRUE, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies for service-photos
CREATE POLICY "Public read service photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'service-photos');

CREATE POLICY "Authenticated can upload service photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-photos' AND auth.uid() IS NOT NULL);

-- 9. Storage policies for room-photos
CREATE POLICY "Public read room photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'room-photos');

CREATE POLICY "Anyone can upload room photos"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-photos');
