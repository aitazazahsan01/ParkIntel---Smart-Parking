"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PublicLoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-white">
      
      <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome to ParkIntel</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to find parking or manage your lot.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-6 text-base bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800 transition-all"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 dark:bg-slate-950">Or</span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Are you a parking attendant?{" "}
          <Link href="/operator/login" className="text-indigo-600 hover:underline dark:text-indigo-400 font-bold">
            Access Staff Portal
          </Link>
        </div>
      </div>
    </div>
  );
}