-- Migration to add remarked_weight and remarked_at to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS remarked_weight NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS remarked_at TIMESTAMPTZ;

-- Update the staff_items view to include the new columns
DROP VIEW IF EXISTS staff_items;

CREATE VIEW staff_items AS
SELECT 
    id, 
    name, 
    sku, 
    barcode, 
    description, 
    category_id, 
    quantity, 
    unit, 
    location, 
    image_url, 
    min_stock_level, 
    label_no, 
    pcs, 
    purity, 
    gross_wt, 
    net_wt, 
    weight_with_tag,
    is_remarked,
    remarked_weight, -- New column
    remarked_at,     -- New column
    last_scanned_at,
    last_scanned_by,
    created_at, 
    updated_at
FROM public.items;
