-- Migration to add weight_with_tag to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS weight_with_tag NUMERIC(10, 3) DEFAULT 0;

-- Update the staff_items view to include the new column
CREATE OR REPLACE VIEW staff_items AS
SELECT id, name, sku, barcode, description, category_id, quantity, unit, location, image_url, min_stock_level, gross_wt, net_wt, weight_with_tag, created_at, updated_at
FROM items;
