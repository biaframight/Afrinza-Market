-- Afrinza — Site-wide feature flags / settings
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "site_settings_admin_write" ON site_settings
  FOR ALL USING (auth.email() = 'alphuplift@gmail.com');

-- Default: subscription feature is OFF
INSERT INTO site_settings (key, value)
VALUES ('subscription_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
