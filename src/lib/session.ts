import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/sessionToken';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
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
