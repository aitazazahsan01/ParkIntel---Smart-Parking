"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, Clock, Calendar, DollarSign, LogOut, Loader2, Search, Filter, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

type Reservation = {
  id: string;
  lot_id: number;
  plate_number: string;
  reservation_fee: number | null;
  status: string;
  expires_at: string;
  created_at: string;
  lot_name?: string;
  lot_address?: string;
};

export default function DriverDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  const handleCancelReservation = (reservationId: string) => {
    setReservationToCancel(reservationId);
    setConfirmDialogOpen(true);
  };

  const confirmCancelReservation = async () => {
    if (!reservationToCancel) return;

    const { error } = await supabase
      .from("pre_bookings")
      .update({ status: "cancelled" })
      .eq("id", reservationToCancel);

    if (!error) {
      setReservations(reservations.filter((r) => r.id !== reservationToCancel));
    } else {
      alert("Failed to cancel reservation");
    }

    setReservationToCancel(null);
  };

  useEffect(() => {
    const fetchSessions = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      // Store user ID in state for subscriptions
      setUserId(userData.user.id);

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

      // Fetch parking sessions with lot information
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("parking_sessions")
        .select(`
          id,
          lot_id,
          spot_id,
          plate_number,
          check_in_time,
          check_out_time,
          fee_charged,
          status,
          created_at,
          ParkingLots:lot_id (
            name,
            address
          )
        `)
        .eq("user_id", userData.user.id)
        .order("check_in_time", { ascending: false });

      if (sessionsError) {
        console.error("❌ Error fetching sessions:", sessionsError);
      }

      if (sessionsData) {
        // Format sessions with lot information
        const formattedSessions = sessionsData.map((session: any) => {
          const checkInTime = new Date(session.check_in_time);
          const checkOutTime = session.check_out_time ? new Date(session.check_out_time) : null;
          const durationMinutes = checkOutTime 
            ? Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000)
            : null;

          return {
            id: session.id.toString(),
            location_name: session.ParkingLots?.name || "Unknown Location",
            address: session.ParkingLots?.address || "N/A",
            check_in_time: session.check_in_time,
            check_out_time: session.check_out_time,
            duration_minutes: durationMinutes,
            amount_paid: session.fee_charged,
            status: session.status,
          };
        });

        console.log("✅ Fetched", formattedSessions.length, "parking sessions");
        setSessions(formattedSessions);
      }

      // Fetch active reservations
      const now = new Date().toISOString();
      console.log("=== Driver Dashboard: Fetching Reservations ===");
      console.log("Current time (UTC):", now);
      console.log("Current time (local):", new Date().toLocaleString());
      
      const { data: reservationsData, error: resError } = await supabase
        .from("pre_bookings")
        .select(`
          *,
          ParkingLots:lot_id (name, address)
        `)
        .eq("user_id", userData.user.id)
        .eq("status", "active")
        .gte("expires_at", now)
        .order("created_at", { ascending: false });

      console.log("Fetched reservations:", reservationsData);
      console.log("Reservation count:", reservationsData?.length || 0);
      if (resError) console.error("Error fetching reservations:", resError);

      if (reservationsData) {
        const formattedReservations = reservationsData.map((res: any) => ({
          ...res,
          lot_name: res.ParkingLots?.name,
          lot_address: res.ParkingLots?.address,
        }));
        console.log("Formatted reservations:", formattedReservations);
        setReservations(formattedReservations);
      }

      setLoading(false);
    };

    fetchSessions();

    // Set up real-time subscriptions only after userId is available
    if (!userId) return;

    // Set up real-time subscription for parking sessions
    const sessionsChannel = supabase
      .channel('driver-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Real-time session update:', payload);
          // Refetch sessions when changes occur
          fetchSessions();
        }
      )
      .subscribe();

    // Set up real-time subscription for pre-bookings
    const bookingsChannel = supabase
      .channel('driver-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pre_bookings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Real-time booking update:', payload);
          // Refetch reservations when changes occur
          fetchSessions();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [router, userId]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>
      {/* Header */}
      <div className="relative border-b border-slate-200/80 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50">
        {/* Gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />
        <div className="mx-auto max-w-7xl px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-slate-100 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">Your Parking Journey</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Every mile saved, every moment counted ✨</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
          <div className="group bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  Rs. {totalSpent.toFixed(0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{activeSessions}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completed</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{completedSessions}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Reservations */}
        {reservations.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Reservations</h2>
                <p className="text-sm text-slate-600">Your pre-booked parking spots</p>
              </div>
            </div>

            <div className="grid gap-4">
              {reservations.map((reservation) => {
                const expiresAt = new Date(reservation.expires_at);
                const now = new Date();
                const minutesRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
                const isExpiringSoon = minutesRemaining <= 10;

                return (
                  <div
                    key={reservation.id}
                    className={`bg-white rounded-xl border-2 p-5 transition-all ${
                      isExpiringSoon ? 'border-red-300' : 'border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-900">
                            {reservation.lot_name || "Parking Lot"}
                          </div>
                          <div className="text-sm text-slate-600">{reservation.lot_address}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Vehicle: <span className="font-mono font-semibold">{reservation.plate_number}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`px-4 py-2 rounded-full font-bold text-sm mb-2 ${
                          isExpiringSoon ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {minutesRemaining}m remaining
                        </div>
                        <Button
                          onClick={() => handleCancelReservation(reservation.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Reservation Fee</div>
                        <div className="text-lg font-bold text-amber-600">
                          Rs. {reservation.reservation_fee || 0}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Reserved At</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {new Date(reservation.created_at).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Expires At</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {expiresAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {isExpiringSoon && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <span className="font-semibold">Hurry!</span> Your reservation expires in {minutesRemaining} minutes. Please arrive soon.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="relative z-10 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-sm overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-slate-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Sessions
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === "active"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === "completed"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {session.location_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{session.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(session.check_in_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {session.check_out_time
                          ? new Date(session.check_out_time).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {session.duration_minutes ? `${session.duration_minutes} mins` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Cancel Reservation"
        description="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep it"
        variant="destructive"
        onConfirm={confirmCancelReservation}
      />
    </div>
  );
}
