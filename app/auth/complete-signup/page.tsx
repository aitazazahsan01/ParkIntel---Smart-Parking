"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function CompleteSignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "error">("processing");

  useEffect(() => {
    const completeSignup = async () => {
      try {
        console.log("🔄 Starting complete signup process...");
        
        // Wait a bit for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get current session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error getting session:", sessionError);
          setStatus("error");
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        if (!session) {
          console.log("❌ No session found, redirecting to login");
          setStatus("error");
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log("✅ Session found:", session.user.id);
        
        const user = session.user;
        
        // Get the pending role from localStorage or sessionStorage (fallback)
        let pendingRole = localStorage.getItem('pendingUserRole');
        if (!pendingRole) {
          pendingRole = sessionStorage.getItem('pendingUserRole');
          console.log("📋 Retrieved pending role from sessionStorage:", pendingRole);
        } else {
          console.log("📋 Retrieved pending role from localStorage:", pendingRole);
        }
        
        console.log("📋 Final pendingRole value:", pendingRole);
        console.log("📋 All localStorage keys:", Object.keys(localStorage));
        console.log("📋 All sessionStorage keys:", Object.keys(sessionStorage));

        // Check current profile role before update
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log("📋 Current profile role before update:", currentProfile?.role);

        // If there's a pending role, update the profile
        if (pendingRole && (pendingRole === 'driver' || pendingRole === 'owner' || pendingRole === 'operator')) {
          console.log("🔄 Attempting to update profile role to:", pendingRole);
          
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id)
            .select();

          console.log("📦 Update response data:", updateData);
          console.log("📦 Update response error:", updateError);

          if (updateError) {
            console.error("❌ Error updating role:", updateError);
            console.error("❌ Error code:", updateError.code);
            console.error("❌ Error message:", updateError.message);
            console.error("❌ Error details:", updateError.details);
            console.error("❌ Error hint:", updateError.hint);
            
            // Show user-friendly error
            alert(`Failed to set user role: ${updateError.message}. Please contact support.`);
            setStatus("error");
            setTimeout(() => router.push('/auth/auth-code-error'), 2000);
            return;
          }

          console.log("✅ Profile role updated successfully to:", pendingRole);
          
          // Verify the update worked
          const { data: verifyProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          console.log("✅ Verified profile role after update:", verifyProfile?.role);
          
          // Clear the pending role from both storages
          localStorage.removeItem('pendingUserRole');
          sessionStorage.removeItem('pendingUserRole');
          console.log("🧹 Cleared pendingUserRole from both storages");
          
          // Redirect based on role
          console.log("🎉 Signup complete, redirecting to appropriate dashboard");
          if (pendingRole === 'owner') {
            router.push('/owner/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          console.log("ℹ️ No pending role to update (likely existing user login)");
          
          // Get the user's current role from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          // Redirect based on their existing role
          if (profile?.role === 'owner') {
            router.push('/owner/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error("❌ Complete signup error:", error);
        setStatus("error");
        setTimeout(() => router.push('/auth/auth-code-error'), 2000);
      }
    };

    completeSignup();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center space-y-4">
        {status === "processing" ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Completing your signup...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Setting up your account
            </p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
