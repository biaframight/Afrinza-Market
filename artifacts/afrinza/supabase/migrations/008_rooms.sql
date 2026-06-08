-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Room Listings
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS room_listings (
  id              SERIAL PRIMARY KEY,
  lister_name     TEXT NOT NULL,
  whatsapp        TEXT NOT NULL,
  location        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price_per_month DECIMAL(10,2),
  room_type       TEXT NOT NULL DEFAULT 'Single Room',
  amenities       TEXT[] NOT NULL DEFAULT '{}',
  available_from  DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS room_listings_location_idx ON room_listings (location);
CREATE INDEX IF NOT EXISTS room_listings_active_idx   ON room_listings (is_active);
CREATE INDEX IF NOT EXISTS room_listings_created_idx  ON room_listings (created_at DESC);

-- Allow anyone to read active listings (public browse)
-- Allow anyone to insert (listing creation goes through WhatsApp verification)
ALTER TABLE room_listings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_listings' AND policyname = 'rooms_public_read') THEN
    EXECUTE $policy$
      CREATE POLICY "rooms_public_read" ON room_listings FOR SELECT USING (is_active = TRUE)
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_listings' AND policyname = 'rooms_public_insert') THEN
    EXECUTE $policy$
      CREATE POLICY "rooms_public_insert" ON room_listings FOR INSERT WITH CHECK (TRUE)
    $policy$;
  END IF;
END
$$;
