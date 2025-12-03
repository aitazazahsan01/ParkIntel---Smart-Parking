"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Terminal, Key, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import bcrypt from "bcryptjs";

export default function OperatorLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // First, fetch the operator record to get the stored password hash
      const { data: operators, error: fetchError } = await supabase
        .from("operators")
        .select("id, username, password_hash, full_name, owner_id, assigned_lots, is_active")
        .eq("username", username)
        .eq("is_active", true)
        .single();

      if (fetchError || !operators) {
        setErrorMsg("Invalid username or password.");
        setLoading(false);
        return;
      }

      // Verify the password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, operators.password_hash);

      if (!isPasswordValid) {
        setErrorMsg("Invalid username or password.");
        setLoading(false);
        return;
      }

      // Update last login timestamp
      await supabase
        .from("operators")
        .update({ last_login: new Date().toISOString() })
        .eq("id", operators.id);

      // Store operator info in localStorage
      const operatorData = {
        id: operators.id,
        username: operators.username,
        full_name: operators.full_name,
        owner_id: operators.owner_id,
        assigned_lots: operators.assigned_lots,
      };
      localStorage.setItem("operator", JSON.stringify(operatorData));
      
      // Redirect to operator dashboard
      router.push("/operator/dashboard");
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Header section with icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Terminal size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Operator Access
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Secure login for authorized staff members
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              ParkIntel Operators
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3.5 text-sm text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 duration-300">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-indigo-500" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-indigo-500" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-base rounded-xl shadow-xl shadow-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {loading ? (
                  <span className="relative flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="text-base">Authenticating...</span>
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-2">
                    <Terminal className="h-5 w-5" />
                    <span className="text-base tracking-wide">Sign In to Dashboard</span>
                  </span>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Secure connection • Activity monitored
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}