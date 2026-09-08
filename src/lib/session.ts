import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    
    // Check if env vars are configured before trying to use Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return null;
    }
    
    const supabase = getServerSupabase(cookieStore as any);
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    return { userId: user.id, email: user.email };
  } catch (error) {
    // If Supabase fails for any reason (e.g., misconfiguration), default to logged out
    return null;
  }
}

export function createBlankProgress(username: string) {
  return {
    user: username,
    solved: { Easy: 0, Medium: 0, Hard: 0 },
    activeDays: 0,
    maxStreak: 0,
    badges: [],
    recentSubmissions: [],
    contributionGrid: {}
  };
}
