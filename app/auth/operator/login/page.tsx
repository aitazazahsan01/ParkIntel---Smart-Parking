"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Terminal, Key, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OperatorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Invalid Credentials. Access Denied.");
      setLoading(false);
    } else {
      // Successful login
      router.push("/operator/dashboard"); // We will build this later
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-mono text-slate-200">
      
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
        
        <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-red-500/10 text-red-500">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-widest text-white">Restricted Access</h1>
            <p className="text-xs text-slate-500">Authorized Personnel Only • ParkIntel Ops</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Operator ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
              <input
                type="email"
                required
                className="w-full rounded border border-slate-800 bg-slate-950 py-2.5 pl-10 text-sm text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="staff@parkintel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Access Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
              <input
                type="password"
                required
                className="w-full rounded border border-slate-800 bg-slate-950 py-2.5 pl-10 text-sm text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-wider font-bold h-11"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Authenticate
          </Button>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-600">
          System activity is monitored and logged. <br /> 
          IP Address Recorded.
        </div>
      </div>
    </div>
  );
}