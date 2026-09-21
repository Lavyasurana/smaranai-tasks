-- ==============================================================================
-- TASK 1: SUPABASE HANDS-ON DATABASE SCHEMA
-- Features: Row-Level Security (RLS), RPC Stored Procedures, Audit Logs
-- ==============================================================================

-- 1. Create Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_private BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Notes Table
-- Drop old policies if they exist for idempotency
DROP POLICY IF EXISTS "Users can view own notes and public notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Policy A: SELECT (Read)
-- Authenticated users can view their own notes OR any public note
CREATE POLICY "Users can view own notes and public notes"
ON public.notes
FOR SELECT
TO authenticated, anon
USING (
    (auth.uid() = user_id) OR (is_private = false)
);

-- Policy B: INSERT (Create)
-- Users can only insert notes where user_id matches their authenticated auth.uid()
CREATE POLICY "Users can insert their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- Policy C: UPDATE
-- Users can only update their own notes
CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- Policy D: DELETE
-- Users can only delete their own notes
CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
);

-- ==============================================================================
-- 4. RPC (Database Stored Functions)
-- ==============================================================================

-- RPC 1: Compute real-time user statistics
CREATE OR REPLACE FUNCTION public.get_user_note_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_count INT;
    private_count INT;
    public_count INT;
    latest_date TIMESTAMPTZ;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.notes WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO private_count FROM public.notes WHERE user_id = target_user_id AND is_private = true;
    SELECT COUNT(*) INTO public_count FROM public.notes WHERE user_id = target_user_id AND is_private = false;
    SELECT MAX(created_at) INTO latest_date FROM public.notes WHERE user_id = target_user_id;

    RETURN json_build_object(
        'user_id', target_user_id,
        'total_notes', COALESCE(total_count, 0),
        'private_notes', COALESCE(private_count, 0),
        'public_notes', COALESCE(public_count, 0),
        'latest_note_created_at', latest_date,
        'queried_at', now()
    );
END;
$$;

-- RPC 2: Global community statistics
CREATE OR REPLACE FUNCTION public.get_community_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_public INT;
    active_authors INT;
BEGIN
    SELECT COUNT(*) INTO total_public FROM public.notes WHERE is_private = false;
    SELECT COUNT(DISTINCT user_id) INTO active_authors FROM public.notes;

    RETURN json_build_object(
        'public_notes_count', COALESCE(total_public, 0),
        'active_authors_count', COALESCE(active_authors, 0),
        'generated_at', now()
    );
END;
$$;

-- Explicitly grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_user_note_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_community_summary() TO authenticated, anon;

-- Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
