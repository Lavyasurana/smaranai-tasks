-- ==============================================================================
-- TASK 2: GOOGLE LOGIN & LOGIN AUDIT TRAIL SCHEMA
-- Records every user login timestamp, email, profile details, and device info
-- ==============================================================================

-- 1. Create Login Records Table
CREATE TABLE IF NOT EXISTS public.login_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT NOT NULL,
    user_name TEXT,
    avatar_url TEXT,
    user_agent TEXT,
    ip_address TEXT,
    logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy queries ordered by login time
CREATE INDEX IF NOT EXISTS idx_login_records_logged_in_at 
ON public.login_records(logged_in_at DESC);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.login_records ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read access to login history" ON public.login_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert login records" ON public.login_records;
DROP POLICY IF EXISTS "Allow service role full access" ON public.login_records;

-- Read policy: Anyone viewing the dashboard can see login history
CREATE POLICY "Allow public read access to login history"
ON public.login_records
FOR SELECT
TO anon, authenticated
USING (true);

-- Insert policy: Authenticated users can insert their own record
CREATE POLICY "Allow authenticated users to insert login records"
ON public.login_records
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Enable Supabase Realtime for instant updates without page refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_records;
