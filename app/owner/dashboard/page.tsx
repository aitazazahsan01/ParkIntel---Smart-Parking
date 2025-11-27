// app/owner/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, Car, DollarSign, Users, LogOut, Loader2, TrendingUp, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OwnerDashboard() {
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchLots = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      // Check user role - redirect if not an owner
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role === "driver") {
        router.push("/dashboard");
        return;
      } else if (profile?.role === "operator") {
        router.push("/operator/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("ParkingLots")
        .select("*")
        .eq("owner_id", userData.user.id)
        .order("id", { ascending: false });

      if (data) setLots(data);
      setLoading(false);
    };

    fetchLots();
  }, [router]);

  const totalCapacity = lots.reduce((acc, lot) => acc + (lot.capacity || 0), 0);
  const totalRevenue = lots.reduce((acc, lot) => acc + (lot.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Parking Business</h1>
              <p className="text-sm text-slate-500 mt-1">Manage locations, pricing, and operators</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/owner/settings")}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
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
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/owner/register-lot">
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Register New Lot
                  </>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-slate-500 font-medium">Total Locations</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{lots.length}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-sm text-slate-500 font-medium">Total Capacity</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{totalCapacity}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-sm text-slate-500 font-medium">Monthly Revenue</div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">Rs. {totalRevenue.toFixed(0)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-sm text-slate-500 font-medium">Occupancy Rate</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">73%</div>
          </div>
        </div>

        {/* Lots List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : lots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <MapPin size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Parking Lots Yet</h3>
              <p className="mb-8 max-w-md text-slate-500">
                Start your parking business by registering your first location. Use our canvas tool to design spots or skip to enable predictions.
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/owner/register-lot">
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Register Your First Lot
                  </>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Your Parking Locations</h2>
              <span className="text-sm text-slate-500">{lots.length} {lots.length === 1 ? 'location' : 'locations'}</span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lots.map((lot) => (
                <div key={lot.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-purple-300 hover:shadow-lg">
                  {/* Image/Banner */}
                  <div className="h-40 w-full bg-gradient-to-br from-purple-500 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute bottom-3 right-3">
                      <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-purple-900">
                        {lot.capacity || 0} Spots
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {lot.name}
                    </h3>
                    <p className="mb-4 flex items-start text-sm text-slate-500">
                      <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>{lot.address || "No address provided"}</span>
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Base Price</div>
                        <div className="text-lg font-bold text-slate-900">Rs. {lot.base_price || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Occupancy</div>
                        <div className="text-lg font-bold text-emerald-600">{lot.occupancy || 0}%</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-purple-600 hover:border-purple-300">
                        <Settings className="mr-1 h-4 w-4" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-indigo-600 hover:border-indigo-300">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
