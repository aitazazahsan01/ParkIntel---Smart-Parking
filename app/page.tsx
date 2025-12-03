import Link from "next/link";
import { ArrowRight, Zap, MapPin, TrendingUp, Activity, ShieldCheck, Sparkles, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/10 selection:bg-indigo-500/30">

      {/* Staff Portal - Floating Badge */}
      <Link 
        href="/auth/operator/login"
        className="fixed top-20 right-6 z-50 group"
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 hover:scale-105">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center group-hover:from-indigo-700 group-hover:to-purple-800 transition-all duration-300">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
            Staff Portal
          </span>
        </div>
      </Link>

      {/* --- Enhanced Background Effects --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-pink-400/15 dark:bg-pink-600/10 rounded-full blur-[110px] animate-blob animation-delay-4000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] dark:opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-16 md:pt-20 pb-16 flex flex-col items-center">
        
        {/* 1. ENHANCED HERO SECTION */}
        <div className="text-center max-w-4xl mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Hero Title with Enhanced Gradient */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-2xl">
            The Future of <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x">
                Urban Mobility.
              </span>
              {/* Decorative underline */}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 rounded-full opacity-50 blur-sm" />
            </span>
          </h1>
          
          {/* Subtitle with better contrast */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            ParkIntel leverages <span className="text-indigo-600 dark:text-indigo-400 font-bold">deep learning</span> to forecast parking demand 24 hours in advance. 
            We connect high-intent drivers with secure, optimized spaces.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <div className="px-4 py-2 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Car className="inline h-3 w-3 mr-1" />
              Real-time Tracking
            </div>
            <div className="px-4 py-2 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="inline h-3 w-3 mr-1" />
              Smart Pricing
            </div>
          </div>
        </div>

        {/* 2. ENHANCED USER PATHS - Consistent Button Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mb-24">
          
          {/* DRIVER CARD - Enhanced UI */}
          <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 p-8 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] hover:scale-[1.02]">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-600/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon with enhanced styling */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-2 border-indigo-400/50 text-white mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                <MapPin size={28} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Find Parking
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 text-base mb-8 leading-relaxed">
                View real-time availability and AI predictions. Save time and fuel with smart parking.
              </p>
              
              {/* Consistent button layout: Sign In first, then Sign Up text */}
              <div className="mt-auto space-y-3">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02]" asChild>
                  <Link href="/login">
                    <MapPin className="mr-2 h-5 w-5" />
                    Sign In to View Map
                  </Link>
                </Button>

                <Link href="/signup/driver" className="block text-center text-sm text-slate-600 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                  New User? Create Account
                </Link>
              </div>
            </div>
          </div>

          {/* OWNER CARD - Enhanced UI with Consistent Button Layout */}
          <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 p-8 hover:border-purple-500/60 dark:hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.3)] hover:scale-[1.02]">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-600/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon with enhanced styling */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-purple-400/50 text-white mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                List Your Lot
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 text-base mb-8 leading-relaxed">
                Register your property. Use our Canvas tool to design spots and set dynamic pricing.
              </p>
              
              {/* Consistent button layout: Sign In first, then Sign Up text */}
              <div className="mt-auto space-y-3">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02]" asChild>
                  <Link href="/login">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Sign In as Owner
                  </Link>
                </Button>

                <Link href="/signup/owner" className="block text-center text-sm text-slate-600 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">
                  New Owner? Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ENHANCED FEATURES SECTION */}
        <div className="w-full max-w-6xl">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-slate-200/50 dark:border-slate-800/50 p-10 shadow-2xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 dark:border-indigo-500/30 mb-4">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Why Choose ParkIntel?</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Smart Parking Made Simple</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl mx-auto">
                Experience hassle-free parking with instant availability, live tracking, and real-time updates.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {/* Feature 1 */}
              <div className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent mb-2">Instant</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500 font-semibold">Spot Booking</div>
              </div>
              
              {/* Feature 2 */}
              <div className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent mb-2">Live</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500 font-semibold">Availability Status</div>
              </div>
              
              {/* Feature 3 */}
              <div className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500 font-semibold">Access & Support</div>
              </div>
              
              {/* Feature 4 */}
              <div className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-400 dark:to-pink-500 bg-clip-text text-transparent mb-2">&lt;1s</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500 font-semibold">Response Time</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}