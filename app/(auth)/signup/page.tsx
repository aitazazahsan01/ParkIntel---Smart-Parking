// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Car, Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpSelectionPage() {
  const [loading, setLoading] = useState<"driver" | "owner" | null>(null);

  const handleGoogleSignUp = async (role: "driver" | "owner") => {
    setLoading(role);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // FIX: Clean URL
        redirectTo: `${location.origin}/auth/callback`,
        // Pass role safely here
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          role: role, // <--- Passed as a parameter, not part of the redirect URL
        },
      },
    });

    if (error) {
        console.error(error);
        setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Join ParkIntel</h1>
          <p className="text-slate-500 mt-2">Choose how you want to use the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DRIVER OPTION */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-indigo-500 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Car size={28} />
                </div>
                <h3 className="mb-2 text-xl font-bold">I am a Driver</h3>
                <p className="mb-8 text-sm text-slate-500">
                    Create an account to find parking, save favorite locations, and view your parking history.
                </p>
                <Button 
                    onClick={() => handleGoogleSignUp("driver")}
                    disabled={!!loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12"
                >
                    {loading === 'driver' ? <Loader2 className="animate-spin mr-2" /> : null}
                    Sign Up with Google
                </Button>
            </div>

            {/* OWNER OPTION */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-purple-500 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <Building2 size={28} />
                </div>
                <h3 className="mb-2 text-xl font-bold">I own a Parking Lot</h3>
                <p className="mb-8 text-sm text-slate-500">
                    Register your business to manage lots, set dynamic pricing, and access owner analytics.
                </p>
                <Button 
                    onClick={() => handleGoogleSignUp("owner")}
                    disabled={!!loading}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 h-12"
                >
                    {loading === 'owner' ? <Loader2 className="animate-spin mr-2" /> : null}
                    Register Business with Google
                </Button>
            </div>

        </div>

        <div className="mt-8 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
}