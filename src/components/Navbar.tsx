import Link from 'next/link';
import { TerminalSquare, Trophy, UserCircle2, LogIn, UserPlus } from 'lucide-react';
import { getSession } from '@/lib/session';

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="sticky top-0 z-50 flex h-14 w-full items-center border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/60">
      <div className="flex items-center gap-2 mr-8">
        <TerminalSquare className="h-6 w-6 text-neon-blue" />
        <span className="text-lg font-bold tracking-tight text-white drop-shadow-[0_0_8px_var(--color-neon-glow)]">
          AgenticCode
        </span>
      </div>
      
      <div className="flex flex-1 items-center space-x-6 text-sm font-medium text-gray-300">
        {session && (
          <>
            <Link href="/" className="transition-colors hover:text-white">
              Problems
            </Link>
            <Link href="/profile" className="flex items-center gap-1 transition-colors hover:text-white">
              <Trophy className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm font-medium">
        {session ? (
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors" title="Profile">
            <UserCircle2 className="h-6 w-6" />
          </Link>
        ) : (
          <>
            <Link href="/login" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
              <LogIn className="h-4 w-4" /> Login
            </Link>
            <Link href="/register" className="flex items-center gap-1 rounded bg-neon-blue/10 px-3 py-1.5 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue hover:text-black transition-colors">
              <UserPlus className="h-4 w-4" /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
