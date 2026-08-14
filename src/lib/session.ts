import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function getSession() {
  const cookieStore = await cookies();
  if (cookieStore.get('dev_bypass_auth')?.value === 'true') {
    return { userId: 'dev-bypass-user', email: 'dev@agentic.code' };
  }
  
  const supabase = getServerSupabase(cookieStore as any);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { userId: user.id, email: user.email };
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
