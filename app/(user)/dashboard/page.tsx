"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, Clock, Calendar, DollarSign, LogOut, Loader2, Search, Filter, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type ParkingSession = {
  id: string;
  location_name: string;
  address: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  amount_paid: number | null;
  status: string;
};

export default function DriverDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

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
    const fetchSessions = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      // Check user role - redirect if not a driver
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role === "owner") {
        router.push("/owner/dashboard");
        return;
      } else if (profile?.role === "operator") {
        router.push("/operator/dashboard");
        return;
      }

      // Fetch parking sessions
      const { data, error } = await supabase
        .from("parking_sessions")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("check_in_time", { ascending: false });

      if (data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [router]);

  const filteredSessions = sessions.filter((session) => {
    if (filter === "active") return session.status === "active";
    if (filter === "completed") return session.status === "completed";
    return true;
  });

  const totalSpent = sessions
    .filter((s) => s.amount_paid)
    .reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Parking History</h1>
              <p className="text-sm text-slate-500 mt-1">Track your parking sessions and expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/settings")}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                onClick={() => router.push("/map")}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Find Parking
              </Button>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {loggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  Rs. {totalSpent.toFixed(0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{activeSessions}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Completed</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{completedSessions}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-slate-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Sessions
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === "active"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === "completed"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No parking sessions yet</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Start by finding a parking spot on the map
                </p>
                <Button
                  onClick={() => router.push("/map")}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Parking Now
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {session.location_name}
                            </div>
                            <div className="text-xs text-slate-500">{session.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(session.check_in_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {session.check_out_time
                          ? new Date(session.check_out_time).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {session.duration_minutes ? `${session.duration_minutes} mins` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {session.amount_paid ? `Rs. ${session.amount_paid}` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
