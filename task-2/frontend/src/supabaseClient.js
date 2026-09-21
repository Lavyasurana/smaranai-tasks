import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl = (localStorage.getItem('TASK2_SUPABASE_URL') || '').trim();
  const storedKey = (localStorage.getItem('TASK2_SUPABASE_ANON_KEY') || '').trim();

  const isEnvValid = Boolean(
    envUrl &&
    envKey &&
    !envUrl.includes('your-project-ref') &&
    envKey !== 'your-anon-key-here'
  );

  let url = envUrl;
  let key = envKey;

  if (isEnvValid) {
    url = envUrl;
    key = envKey;
    if (storedKey === 'your-anon-key-here' || storedUrl.includes('your-project-ref')) {
      localStorage.removeItem('TASK2_SUPABASE_URL');
      localStorage.removeItem('TASK2_SUPABASE_ANON_KEY');
    }
  } else {
    url = (storedUrl && !storedUrl.includes('your-project-ref')) ? storedUrl : envUrl;
    key = (storedKey && storedKey !== 'your-anon-key-here') ? storedKey : envKey;
  }

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project-ref') &&
    key !== 'your-anon-key-here'
  );

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url, key) {
  localStorage.setItem('TASK2_SUPABASE_URL', url.trim());
  localStorage.setItem('TASK2_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('TASK2_SUPABASE_URL');
  localStorage.removeItem('TASK2_SUPABASE_ANON_KEY');
  window.location.reload();
}

const { url, key } = getSupabaseCredentials();

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
