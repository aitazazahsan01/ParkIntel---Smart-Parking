import Link from "next/link";
import { ArrowRight, Zap, MapPin, TrendingUp, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 selection:bg-indigo-500/30">
      
      {/* --- Top Navigation (Added for Operator Access) --- */}
      <nav className="relative z-50 flex w-full items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-2 font-bold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-lg">P</span>
          </div>
          ParkIntel
        </div>
        
        <div className="flex items-center gap-4">
          {/* OPERATOR LOGIN BUTTON - Distinct and accessible */}
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" asChild>
            <Link href="/operator/login">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Staff Portal
            </Link>
          </Button>
          
                  </div>
      </nav>

      {/* --- Background Glow --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/20 blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10 flex flex-col items-center">
        
        {/* 1. HERO SECTION */}
        <div className="text-center max-w-4xl mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium uppercase tracking-wider">
            <Activity size={12} /> System Operational • Lahore & Islamabad
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Urban Mobility.
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ParkIntel leverages deep learning to forecast parking demand 24 hours in advance. 
            We connect high-intent drivers with secure, optimized spaces.
          </p>
        </div>

        {/* 2. USER PATHS (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-24">
          
          {/* DRIVER CARD */}
          <div className="group relative overflow-hidden rounded-3xl bg-slate-900/50 border border-slate-800 p-8 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 mb-6">
                <MapPin size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Find Parking</h2>
              <p className="text-slate-400 text-sm mb-8">
                View real-time availability and AI predictions. Save time and fuel.
              </p>
              <div className="mt-auto space-y-3">
                
                {/* FIXED BUTTON: Using asChild for proper linking */}
                <Button className="w-full bg-white text-slate-950 hover:bg-indigo-50 font-bold h-12 rounded-xl" asChild>
                  <Link href="/map">
                    Launch Live Map
                  </Link>
                </Button>

                <Link href="/login" className="block text-center text-xs text-slate-500 hover:text-indigo-400 transition-colors">
                  Sign In (Drivers)
                </Link>
              </div>
            </div>
          </div>

          {/* OWNER CARD */}
          <div className="group relative overflow-hidden rounded-3xl bg-slate-900/50 border border-slate-800 p-8 hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 mb-6">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">List Your Lot</h2>
              <p className="text-slate-400 text-sm mb-8">
                Register your property. Use our Canvas tool to design spots and set dynamic pricing.
              </p>
              <div className="mt-auto space-y-3">
                
                {/* FIXED BUTTON: Using asChild for proper linking */}
                <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-purple-950/30 hover:border-purple-500/50 hover:text-purple-300 h-12 rounded-xl" asChild>
                  <Link href="/login">
                    Sign In to Register Lot
                  </Link>
                </Button>

                <div className="text-center text-xs text-slate-600">
                   Manage your business from the dashboard
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. APP DATA & STATS */}
        <div className="w-full max-w-5xl border-t border-slate-800 pt-16">
            <div className="text-center mb-12">
                <h3 className="text-xl font-semibold text-white">Powered by Data</h3>
                <p className="text-slate-400 text-sm">Our ML models process thousands of data points hourly.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">98%</div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Prediction Accuracy</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">15k+</div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Daily Predictions</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">24/7</div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Real-time Monitoring</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">0.5s</div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">API Latency</div>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}