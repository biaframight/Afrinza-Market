-- ═══════════════════════════════════════════════════════════════
-- Afrinza — Migration 007: Page View Tracking
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS page_views (
  id         SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  path       TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at);
CREATE INDEX IF NOT EXISTS page_views_session_idx    ON page_views (session_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can record a visit
CREATE POLICY IF NOT EXISTS "page_views: anon insert"
  ON page_views FOR INSERT WITH CHECK (true);

-- Only admin can read
DROP POLICY IF EXISTS "page_views: admin read";
CREATE POLICY "page_views: admin read"
  ON page_views FOR SELECT
  USING (auth.jwt() ->> 'email' = 'alphuplift@gmail.com');
