-- Add is_remarked column to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS is_remarked boolean DEFAULT false;

-- Update the staff_items view to include the new column
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
    is_remarked, -- New column
    last_scanned_at,
    last_scanned_by,
    created_at, 
    updated_at
FROM public.items;
