"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TerminalSquare, Loader2 } from "lucide-react";
// Supabase client will be initialized inside the component
import { createBrowserClient } from "@supabase/ssr";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setError("Database connection is not configured.");
        return;
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseKey);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-10 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
        <div className="text-center">
          <TerminalSquare className="mx-auto h-12 w-12 text-neon-blue drop-shadow-[0_0_8px_var(--color-neon-glow)]" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">Continue your agentic coding journey</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-sm text-error bg-error/10 border border-error/30 rounded-md p-3 text-center">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <input
                id="login-email"
                type="email"
                required
                className="relative block w-full rounded-md border border-border bg-card-hover px-3 py-2 text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="login-password"
                type="password"
                required
                className="relative block w-full rounded-md border border-border bg-card-hover px-3 py-2 text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-neon-blue px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-background disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-400">
             Don&apos;t have an account? <Link href="/register" className="text-neon-blue hover:text-white transition-colors">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
