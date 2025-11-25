// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// FIX: Changed from "@/hooks/useUserRole" to relative path for better compatibility
import { useUserRole } from "../../hooks/useUserRole";
import { Loader2 } from "lucide-react";

export default function DashboardRouter() {
  const { role, loading, user } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    // If we are still fetching the role, do nothing yet
    if (loading) return;

    // If not logged in, redirect to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // ROUTING LOGIC based on user role
    if (role === "owner") {
      router.replace("/owner/dashboard");
    } else if (role === "driver") {
      router.replace("/map");
    } else if (role === "operator") {
      router.replace("/operator/dashboard");
    } else {
      // Fallback for users with no role (defaults to driver map)
      router.replace("/map");
    }
  }, [role, loading, user, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="mt-4 text-sm font-medium text-slate-500">
        Accessing your secure workspace...
      </p>
    </div>
  );
}