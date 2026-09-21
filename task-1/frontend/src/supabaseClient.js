import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage fallback
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem('TASK1_SUPABASE_URL');
  const storedKey = localStorage.getItem('TASK1_SUPABASE_ANON_KEY');

  const url = storedUrl || envUrl;
  const key = storedKey || envKey;

  const isConfigured = Boolean(
    url &&
    key &&
    url !== 'https://your-project-ref.supabase.co' &&
    key !== 'your-anon-key-here'
  );

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url, key) {
  localStorage.setItem('TASK1_SUPABASE_URL', url.trim());
  localStorage.setItem('TASK1_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('TASK1_SUPABASE_URL');
  localStorage.removeItem('TASK1_SUPABASE_ANON_KEY');
  window.location.reload();
}

const { url, key } = getSupabaseCredentials();

// Provide fallback dummy client if not yet configured so app never crashes
export const supabase = createClient(
  url || 'https://placeholder-project.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
