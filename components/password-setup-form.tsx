"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import bcrypt from "bcryptjs";

type PasswordSetupProps = {
  onComplete?: () => void;
};

export default function PasswordSetupForm({ onComplete }: PasswordSetupProps) {
  const [step, setStep] = useState<"username" | "password">("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) return false;

    setCheckingUsername(true);
    const { data, error } = await supabase
      .rpc("check_username_available", { p_username: usernameToCheck });

    setCheckingUsername(false);
    return data === true;
  };

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError("Username must be 3-30 characters (letters, numbers, _ or -)");
      setLoading(false);
      return;
    }

    // Check availability
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      setError("Username is already taken");
      setLoading(false);
      return;
    }

    // Update username in database
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Try direct update first
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: username })
      .eq("id", userData.user.id);

    if (updateError) {
      console.error("Update username error:", updateError);
      setError(updateError.message || "Failed to update username");
      setLoading(false);
      return;
    }

    setStep("password");
    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to database
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Direct update to profiles table
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        password_hash: hashedPassword,
        has_password: true,
        last_password_change: now,
      })
      .eq("id", userData.user.id);

    if (updateError) {
      console.error("Set password error:", updateError);
      setError(updateError.message || "Failed to set password");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Call onComplete callback after 2 seconds
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 mb-2">Setup Complete!</h3>
        <p className="text-emerald-700">
          Your username and password have been saved. You can now use them to login.
        </p>
      </div>
    );
  }

  if (step === "username") {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Username</h3>
            <p className="text-sm text-slate-500">Choose a unique username for your account</p>
          </div>
        </div>

        <form onSubmit={handleSetUsername} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="johndoe"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_-]{3,30}"
            />
            <p className="text-xs text-slate-500">
              3-30 characters: letters, numbers, underscore, or hyphen
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || checkingUsername || username.length < 3}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading || checkingUsername ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {checkingUsername ? "Checking availability..." : "Continue"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Lock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Set Password</h3>
          <p className="text-sm text-slate-500">
            Username: <span className="font-semibold text-indigo-600">{username}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSetPassword} className="space-y-4">
          {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  password.length >= i * 2
                    ? password.length >= 12
                      ? "bg-emerald-500"
                      : password.length >= 8
                      ? "bg-yellow-500"
                      : "bg-red-500"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">At least 8 characters recommended</p>
        </div>

        <Button
          type="submit"
          disabled={loading || password.length < 8 || password !== confirmPassword}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Set Password
        </Button>
      </form>
    </div>
  );
}
