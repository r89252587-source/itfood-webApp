-- Phase 1: Database Updates (Supabase)

-- 1. Create qr_codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    qr_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies for qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to qr_codes (needed when scanning)
CREATE POLICY "Allow public read access on qr_codes" 
    ON public.qr_codes FOR SELECT 
    USING (true);

-- Allow restaurant owners to manage their QR codes
CREATE POLICY "Allow owners to manage qr_codes" 
    ON public.qr_codes FOR ALL 
    USING (auth.uid() IN (SELECT owner_id FROM public.restaurants WHERE id = restaurant_id));

-- 2. Storage bucket for QR Code PNGs
-- Note: It's better to create buckets via the Supabase Dashboard, but here is the SQL
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr_codes', 'qr_codes', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the qr_codes bucket
CREATE POLICY "Give public access to qr_codes bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'qr_codes');
    
CREATE POLICY "Allow authenticated uploads to qr_codes bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'qr_codes' AND auth.role() = 'authenticated');
    
CREATE POLICY "Allow authenticated deletes to qr_codes bucket" ON storage.objects
    FOR DELETE USING (bucket_id = 'qr_codes' AND auth.role() = 'authenticated');

-- 3. Modify orders table (ensure table_number exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='table_number') THEN
        ALTER TABLE public.orders ADD COLUMN table_number VARCHAR(50);
    END IF;
END $$;
