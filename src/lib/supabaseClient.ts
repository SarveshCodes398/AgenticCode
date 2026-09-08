// src/lib/supabaseClient.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const getBrowserSupabase = () => {
  if (typeof window === 'undefined') return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
};

export const getServerSupabase = (cookieStore: {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: any) => void;
}) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — safe to ignore
        }
      },
    },
  });
};
