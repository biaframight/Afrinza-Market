-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Job Listings (post + admin approval flow)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_listings (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  poster_name   TEXT NOT NULL,
  company_name  TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  email         TEXT,
  location      TEXT NOT NULL,
  job_title     TEXT NOT NULL,
  job_type      TEXT NOT NULL DEFAULT 'Full-time',
  category      TEXT NOT NULL DEFAULT 'Other',
  salary_range  TEXT,
  description   TEXT NOT NULL,
  requirements  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_listings_location_idx ON job_listings (location);
CREATE INDEX IF NOT EXISTS job_listings_active_idx   ON job_listings (is_active);
CREATE INDEX IF NOT EXISTS job_listings_created_idx  ON job_listings (created_at DESC);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Public: only see approved (active) listings
CREATE POLICY "jobs_public_read" ON job_listings
  FOR SELECT USING (is_active = TRUE);

-- Owner: can always see their own listings (active OR pending)
CREATE POLICY "jobs_owner_read" ON job_listings
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admin: can see everything
CREATE POLICY "jobs_admin_read" ON job_listings
  FOR SELECT USING (auth.email() = 'alphuplift@gmail.com');

-- Signed-in users can post a job (new posts always require approval, enforced in app layer)
CREATE POLICY "jobs_owner_insert" ON job_listings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Owner: can update/delete their own listing
CREATE POLICY "jobs_owner_update" ON job_listings
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "jobs_owner_delete" ON job_listings
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admin: full update/delete access
CREATE POLICY "jobs_admin_update" ON job_listings
  FOR UPDATE USING (auth.email() = 'alphuplift@gmail.com');

CREATE POLICY "jobs_admin_delete" ON job_listings
  FOR DELETE USING (auth.email() = 'alphuplift@gmail.com');
