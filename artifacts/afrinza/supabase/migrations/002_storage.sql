-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Product Image Storage
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Create the product-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public bucket)
CREATE POLICY IF NOT EXISTS "product-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow anonymous uploads (Phase 1 — tighten once auth is added)
CREATE POLICY IF NOT EXISTS "product-images: anon upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Allow updates/deletes (for future seller dashboard)
CREATE POLICY IF NOT EXISTS "product-images: anon update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "product-images: anon delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
