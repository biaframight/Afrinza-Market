-- ═══════════════════════════════════════════════════════════════
-- Afrinza Marketplace — Admin Policies + Cleanup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. Admin can UPDATE and DELETE any seller (toggle premium/sponsored, remove)
DROP POLICY IF EXISTS "admin: all sellers" ON sellers;
CREATE POLICY "admin: all sellers"
  ON sellers FOR ALL
  USING (auth.email() = 'alphuplift@gmail.com')
  WITH CHECK (auth.email() = 'alphuplift@gmail.com');

-- 2. Admin can UPDATE and DELETE any product
DROP POLICY IF EXISTS "admin: all products" ON products;
CREATE POLICY "admin: all products"
  ON products FOR ALL
  USING (auth.email() = 'alphuplift@gmail.com')
  WITH CHECK (auth.email() = 'alphuplift@gmail.com');

-- 3. Ensure products are deleted before their seller (foreign key safety)
--    First delete products of sample sellers, then the sellers themselves
DELETE FROM products
  WHERE seller_id IN (SELECT id FROM sellers WHERE user_id IS NULL);

DELETE FROM sellers WHERE user_id IS NULL;

-- 4. (Optional) Make sure the FK has cascade so future admin deletes clean up
--    Run only if products.seller_id doesn't already cascade:
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_seller_id_fkey;
-- ALTER TABLE products
--   ADD CONSTRAINT products_seller_id_fkey
--   FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
