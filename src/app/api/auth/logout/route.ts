import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = getServerSupabase(cookieStore as any);
  if (supabase) {
    await supabase.auth.signOut();
  }
  
  const response = NextResponse.redirect(new URL('/login', request.url));
  return response;
}
