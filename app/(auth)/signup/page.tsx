// app/(auth)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Car, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpSelectionPage() {
  const router = useRouter();

  const handleDriverSignup = () => {
    router.push('/signup/driver');
  };

  const handleOwnerSignup = () => {
    router.push('/signup/owner');
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="relative flex flex-1 flex-col items-center justify-center p-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Start Your Journey with{" "}
            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ParkIntel
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Join thousands who've revolutionized their parking experience
          </p>
        </div>
        
        <div className="w-full max-w-5xl">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* DRIVER CARD */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 transition-all hover:scale-[1.02] border-2 border-transparent hover:border-indigo-500 hover:shadow-2xl dark:border-slate-700/50">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-lg group-hover:shadow-indigo-500/50 transition-shadow">
                      <Car size={32} strokeWidth={2.5} />
                  </div>
                  
                  {/* Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
                    MOST POPULAR
                  </div>
                  
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">For Drivers</h3>
                  <p className="mb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
                      Never waste time searching for parking again. Find, reserve, and pay for parking spots instantly.
                  </p>
                  
                  {/* Features List */}
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Real-time parking availability
                    </li>
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Save favorite locations
                    </li>
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Track parking history
                    </li>
                  </ul>
                  
                  <Button 
                      onClick={handleDriverSignup}
                      className="w-full bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                      Get Started as Driver
                  </Button>
                </div>
            </div>

            {/* OWNER CARD */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 transition-all hover:scale-[1.02] border-2 border-transparent hover:border-purple-500 hover:shadow-2xl dark:border-slate-700/50">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                      <Building2 size={32} strokeWidth={2.5} />
                  </div>
                  
                  {/* Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-4">
                    FOR BUSINESS
                  </div>
                  
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">For Lot Owners</h3>
                  <p className="mb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
                      Maximize revenue with intelligent parking management. Monitor, analyze, and optimize your lots.
                  </p>
                  
                  {/* Features List */}
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Dynamic pricing control
                    </li>
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Real-time analytics dashboard
                    </li>
                    <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Manage multiple locations
                    </li>
                  </ul>
                  
                  <Button 
                      onClick={handleOwnerSignup}
                      className="w-full bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                      Register Your Business
                  </Button>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-6">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-medium transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                Already have an account? Sign in
            </Link>
            
            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">10K+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Active Users</div>
              </div>
              <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">500+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Parking Lots</div>
              </div>
              <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">4.8★</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">User Rating</div>
              </div>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}