-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — User Profiles (Auth integration)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. Add user_id to sellers (links store to Supabase Auth user)
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS sellers_user_id_idx ON sellers(user_id);

-- 2. Add user_id to products (for direct ownership tracking)
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);

-- 3. RLS for sellers — owners can update / delete their own store
DROP POLICY IF EXISTS "sellers: owner update" ON sellers;
DROP POLICY IF EXISTS "sellers: owner delete" ON sellers;

CREATE POLICY "sellers: owner update"
  ON sellers FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "sellers: owner delete"
  ON sellers FOR DELETE
  USING (auth.uid()::text = user_id);

-- 4. RLS for products — sellers can manage their own products
DROP POLICY IF EXISTS "products: owner update" ON products;
DROP POLICY IF EXISTS "products: owner delete" ON products;

CREATE POLICY "products: owner update"
  ON products FOR UPDATE
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "products: owner delete"
  ON products FOR DELETE
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()::text)
  );
