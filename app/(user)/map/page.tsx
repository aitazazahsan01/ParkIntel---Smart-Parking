"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      {/* Header with Logout */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find Parking</h1>
          <p className="text-sm text-slate-500">Discover available spots near you</p>
        </div>
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          {loggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
      
      {/* Map Content */}
      <div className="h-[calc(100vh-88px)] bg-gray-200">
        {/* Your <MainMap /> component will go here */}
        <div className="flex items-center justify-center h-full text-slate-500">
          Map will load here...
        </div>
      </div>
    </div>
  );
}