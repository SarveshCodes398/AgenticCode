import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/sessionToken';
import { getUsersCollection, type UserRecord } from '@/lib/mongodb';
import { initializeUserProgress } from '@/lib/progress';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register' || action === 'login') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password) {
        return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
      }
      if (action === 'register' && password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }

      const users = await getUsersCollection();
      await users.createIndex({ email: 1 }, { unique: true });
      let user: UserRecord | null;
      let token: string;

      if (action === 'register') {
        user = {
          id: randomUUID(),
          email,
          passwordHash: hashPassword(password),
          createdAt: new Date(),
        };
        token = await createSessionToken({ id: user.id, email: user.email });
        try {
          await users.insertOne(user);
        } catch (error) {
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
          }
          throw error;
        }
        await initializeUserProgress(user.id, email);
      } else {
        user = await users.findOne({ email });
        if (!user || !verifyPassword(password, user.passwordHash)) {
          return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }
        token = await createSessionToken({ id: user.id, email: user.email });
      }

      const response = NextResponse.json({ success: true });
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return response;
    }

    if (action === 'init-progress') {
      const { userId, email } = body;
      if (!userId || !email) {
        return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
      }
      await initializeUserProgress(userId, email);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Authentication failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
