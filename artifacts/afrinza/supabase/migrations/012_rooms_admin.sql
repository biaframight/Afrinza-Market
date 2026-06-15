-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Room Listings: Owner tracking + Approval flow + Admin RLS
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing columns
ALTER TABLE room_listings ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE room_listings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. New listings should default to NOT active (requires admin approval)
ALTER TABLE room_listings ALTER COLUMN is_active SET DEFAULT FALSE;

-- 3. Replace the single public-read policy with granular ones
DROP POLICY IF EXISTS "rooms_public_read" ON room_listings;

-- Public: only see approved (active) listings
CREATE POLICY "rooms_public_read" ON room_listings
  FOR SELECT USING (is_active = TRUE);

-- Owner: can always see their own listings (active OR pending)
CREATE POLICY "rooms_owner_read" ON room_listings
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admin: can see everything
CREATE POLICY "rooms_admin_read" ON room_listings
  FOR SELECT USING (auth.email() = 'alphuplift@gmail.com');

-- 4. UPDATE policies (were completely missing)
CREATE POLICY "rooms_owner_update" ON room_listings
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "rooms_admin_update" ON room_listings
  FOR UPDATE USING (auth.email() = 'alphuplift@gmail.com');

-- 5. DELETE policies (were completely missing)
CREATE POLICY "rooms_owner_delete" ON room_listings
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "rooms_admin_delete" ON room_listings
  FOR DELETE USING (auth.email() = 'alphuplift@gmail.com');
