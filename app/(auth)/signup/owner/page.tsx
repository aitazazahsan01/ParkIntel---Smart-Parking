// app/(auth)/signup/owner/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OwnerSignUpPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    
    try {
      // Store role as 'owner' in both localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingUserRole', 'owner');
        sessionStorage.setItem('pendingUserRole', 'owner');
        console.log('✅ Stored pendingUserRole as OWNER in localStorage');
        console.log('✅ Stored pendingUserRole as OWNER in sessionStorage');
        console.log('🔍 Verify localStorage:', localStorage.getItem('pendingUserRole'));
        console.log('🔍 Verify sessionStorage:', sessionStorage.getItem('pendingUserRole'));
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("❌ Signup Error:", error);
        setLoading(false);
      }
      
      console.log("🔐 OAuth initiated for OWNER:", data);
    } catch (err) {
      console.error("❌ Signup Exception:", err);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="relative flex flex-1 flex-col items-center justify-center p-4 py-12">
        {/* Back Button */}
        <Link 
          href="/signup" 
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        {/* Header */}
        <div className="mb-12 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl mb-8">
            <Building2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Join as a{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Lot Owner
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Maximize revenue with intelligent parking management
          </p>
        </div>
        
        {/* Signup Card */}
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 border-2 border-purple-200 dark:border-purple-800 shadow-2xl">
            {/* Badge */}
            <div className="absolute top-6 right-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                FOR BUSINESS
              </div>
            </div>

            {/* Features */}
            <div className="mb-8 space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                What you'll get:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Dynamic pricing control
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Real-time analytics dashboard
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Manage multiple locations
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Revenue optimization tools
                </li>
              </ul>
            </div>

            {/* Sign Up Button */}
            <Button 
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" opacity="0.8" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.8" />
                  </svg>
                  Register Your Business
                </>
              )}
            </Button>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
