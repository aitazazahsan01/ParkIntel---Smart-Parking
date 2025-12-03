"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2, Car, MapPin, Clock, DollarSign, AlertCircle, CheckCircle2, Maximize2, Minimize2, RefreshCw, TrendingUp, Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ParkingSpot = {
  id: number;
  label: string;
  is_occupied: boolean | null;
  current_plate: string | null;
  lot_id: number;
  x_coord: number;
  y_coord: number;
  rotation: number | null;
  created_at?: string;
  status?: 'available' | 'reserved' | 'occupied';
  reserved_plate?: string | null;
};

type ParkingSession = {
  id: number;
  lot_id: number;
  spot_id: number | null;
  plate_number: string;
  check_in_time: string;
  check_out_time: string | null;
  fee_charged: number | null;
  status: string | null;
  created_at?: string;
};

type PreBooking = {
  id: string;
  lot_id: number;
  plate_number: string;
  reservation_fee: number | null;
  status: string;
  expires_at: string;
  created_at: string;
  user_id: string | null;
};

type ParkingLot = {
  id: number;
  name: string | null;
  address: string | null;
  price_per_hour?: number;
  base_price?: number;
  release_buffer_multiplier?: number;
  total_spots?: number;
  capacity?: number;
  lat: number;
  lng: number;
  owner_id: string | null;
};

export default function OperatorDashboard() {
  const router = useRouter();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"checkin" | "checkout">("checkin");
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [numberPlate, setNumberPlate] = useState("");
  const [processing, setProcessing] = useState(false);
  const [hadPreBooking, setHadPreBooking] = useState(false);
  const [reservations, setReservations] = useState<PreBooking[]>([]);
  const [showReservations, setShowReservations] = useState(false);
  
  // Canvas ref for spot rendering
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Real-world dimensions (same as register-lot page)
  const PIXELS_PER_METER = 20;
  const SPOT_WIDTH_M = 2.5;
  const SPOT_HEIGHT_M = 5.0;
  const SPOT_W = SPOT_WIDTH_M * PIXELS_PER_METER; // 50px
  const SPOT_H = SPOT_HEIGHT_M * PIXELS_PER_METER; // 100px

  const handleLogout = () => {
    setLoggingOut(true);
    // Clear operator data from localStorage
    localStorage.removeItem("operator");
    router.push("/auth/operator/login");
  };

  const fetchSpots = async (lotId: number) => {
    const { data } = await supabase
      .from("parking_spots")
      .select("*")
      .eq("lot_id", lotId)
      .order("label", { ascending: true });

    if (data) {
      // Fetch ONLY active, non-expired pre-bookings for this lot
      // Exclude 'converted', 'expired', and 'cancelled' bookings
      const now = new Date().toISOString();
      
      const { data: allPreBookings, error: preBookingError } = await supabase
        .from("pre_bookings")
        .select("plate_number, expires_at, status")
        .eq("lot_id", lotId)
        .eq("status", "active")
        .gte("expires_at", now);

      if (preBookingError) {
        console.error("❌ Error fetching pre-bookings:", preBookingError);
      }
      
      // Double-check: filter out any non-active bookings (safety check)
      const validPreBookings = allPreBookings?.filter(b => b.status === 'active') || [];

      // Mark spots with status
      // For each active pre-booking, mark one available spot as reserved
      const hasActivePreBookings = validPreBookings && validPreBookings.length > 0;
      let reservedSpotsMarked = 0;
      const reservedSpotsNeeded = validPreBookings?.length || 0;
      
      if (reservedSpotsNeeded > 0) {
        console.log("📋 Marking reserved spots:", reservedSpotsNeeded, "reservations found");
        console.log("Active plates:", validPreBookings.map(b => b.plate_number).join(", "));
      }
      
      const spotsWithStatus = data.map((spot) => {
        if (spot.is_occupied) {
          return {
            ...spot,
            status: 'occupied' as const,
          };
        } else if (hasActivePreBookings && reservedSpotsMarked < reservedSpotsNeeded && !spot.is_occupied) {
          // Mark available spots as reserved (one per active pre-booking)
          reservedSpotsMarked++;
          const reservationForThisSpot = validPreBookings[reservedSpotsMarked - 1];
          console.log(`  ➜ Spot ${spot.label} marked RESERVED for plate: ${reservationForThisSpot?.plate_number}`);
          return {
            ...spot,
            status: 'reserved' as const,
            reserved_plate: reservationForThisSpot?.plate_number || null,
          };
        } else {
          return {
            ...spot,
            status: 'available' as const,
          };
        }
      });
      
      setSpots(spotsWithStatus as ParkingSpot[]);
    }
  };
  
  const fetchActiveSessions = async (lotId: number) => {
    const { data } = await supabase
      .from("parking_sessions")
      .select("*")
      .eq("lot_id", lotId)
      .eq("status", "active")
      .order("check_in_time", { ascending: false });

    if (data) {
      setSessions(data as ParkingSession[]);
    }
  };

  const fetchReservations = async (lotId: number) => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("pre_bookings")
      .select("*")
      .eq("lot_id", lotId)
      .eq("status", "active")
      .gte("expires_at", now)
      .order("expires_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching reservations:", error);
    }

    if (data) {
      setReservations(data);
    } else {
      setReservations([]);
    }
  };
  
  const handleRefresh = async () => {
    if (!selectedLot) return;
    setRefreshing(true);
    await fetchSpots(selectedLot.id);
    await fetchActiveSessions(selectedLot.id);
    await fetchReservations(selectedLot.id);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    const fetchLots = async () => {
      // Check if operator is logged in via localStorage
      const operatorData = localStorage.getItem("operator");
      if (!operatorData) {
        router.push("/auth/operator/login");
        return;
      }

      const operator = JSON.parse(operatorData);
      
      // If operator has assigned lots, fetch only those; otherwise fetch all
      let lotsQuery = supabase.from("ParkingLots").select("*");
      
      if (operator.assigned_lots && operator.assigned_lots.length > 0) {
        lotsQuery = lotsQuery.in("id", operator.assigned_lots);
      }
      
      const { data: lotsData } = await lotsQuery.order("id", { ascending: true });

      if (lotsData && lotsData.length > 0) {
        setLots(lotsData as ParkingLot[]);
        setSelectedLot(lotsData[0] as ParkingLot);
        fetchSpots(lotsData[0].id);
        fetchActiveSessions(lotsData[0].id);
        fetchReservations(lotsData[0].id);
      }
      setLoading(false);
    };

    fetchLots();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      const currentLot = JSON.parse(localStorage.getItem('currentLotId') || '0');
      if (currentLot) {
        fetchSpots(currentLot);
        fetchActiveSessions(currentLot);
        fetchReservations(currentLot);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  // Store lot ID for auto-refresh
  useEffect(() => {
    if (selectedLot) {
      localStorage.setItem('currentLotId', selectedLot.id.toString());
    }
  }, [selectedLot]);

  const handleSpotClick = async (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setModalType(spot.is_occupied ? "checkout" : "checkin");
    
    // If spot is reserved, pre-fill the plate number from reservation
    if (spot.status === 'reserved' && spot.reserved_plate) {
      setNumberPlate(spot.reserved_plate);
      setHadPreBooking(true);
    } else if (spot.is_occupied) {
      // If checking out, check for pre-booking
      setNumberPlate(spot.current_plate || "");
      if (selectedLot) {
        const session = sessions.find((s) => s.spot_id === spot.id && s.status === "active");
        if (session) {
          const { data: preBooking } = await supabase
            .from("pre_bookings")
            .select("id")
            .eq("lot_id", selectedLot.id)
            .eq("plate_number", session.plate_number)
            .eq("status", "converted")
            .maybeSingle();
          setHadPreBooking(!!preBooking);
        } else {
          setHadPreBooking(false);
        }
      }
    } else {
      setNumberPlate("");
      setHadPreBooking(false);
    }
    
    setShowModal(true);
  };

  const handleCheckIn = async () => {
    if (!selectedSpot || !numberPlate.trim() || !selectedLot) return;
    
    setProcessing(true);
    const now = new Date().toISOString();

    // Normalize plate number: uppercase and remove all spaces for consistent matching
    const normalizedPlate = numberPlate.toUpperCase().trim().replace(/\s+/g, '');
    
    console.log("=== CHECK IN PROCESS ===");
    console.log("Original plate:", numberPlate);
    console.log("Normalized plate:", normalizedPlate);
    console.log("Lot ID:", selectedLot.id);
    console.log("Current time:", now);

    // Check if this spot was pre-booked by this vehicle
    const { data: preBooking, error: preBookingError } = await supabase
      .from("pre_bookings")
      .select("id, reservation_fee, plate_number, status, expires_at")
      .eq("lot_id", selectedLot.id)
      .eq("plate_number", normalizedPlate)
      .eq("status", "active")
      .gte("expires_at", now)
      .maybeSingle();

    console.log("Pre-booking lookup result:", preBooking);
    if (preBookingError) console.error("Pre-booking lookup error:", preBookingError);

    // Update spot as occupied
    const { error: spotError } = await supabase
      .from("parking_spots")
      .update({
        is_occupied: true,
        current_plate: normalizedPlate,
      })
      .eq("id", selectedSpot.id);

    if (spotError) {
      console.error("Error updating spot:", spotError);
      setProcessing(false);
      return;
    }

    // Create parking session
    const { error: sessionError } = await supabase
      .from("parking_sessions")
      .insert({
        lot_id: selectedLot.id,
        spot_id: selectedSpot.id,
        plate_number: normalizedPlate,
        check_in_time: now,
        status: "active",
      });

    if (!sessionError) {
      // If this was a reserved spot, ALWAYS convert the pre-booking
      // This ensures the reservation count decreases after check-in
      if (selectedSpot?.status === 'reserved' || preBooking) {
        console.log("Converting pre-booking for reserved spot check-in...");
        
        // Search for ANY active pre-booking for this lot and plate (ignore expiry for conversion)
        const { data: matchingBookings, error: searchError } = await supabase
          .from("pre_bookings")
          .select("id, plate_number, status")
          .eq("lot_id", selectedLot.id)
          .eq("plate_number", normalizedPlate)
          .eq("status", "active");
        
        console.log("Found matching bookings:", matchingBookings);
        if (searchError) console.error("Error searching for bookings:", searchError);
        
        if (matchingBookings && matchingBookings.length > 0) {
          // Convert all matching pre-bookings
          for (const booking of matchingBookings) {
            console.log("Converting booking ID:", booking.id);
            const { error: updateError } = await supabase
              .from("pre_bookings")
              .update({ status: "converted" })
              .eq("id", booking.id);
            
            if (updateError) {
              console.error("❌ Error updating pre-booking status:", updateError);
            } else {
              console.log("✓ Pre-booking converted successfully:", booking.id);
            }
          }
          
          // Verify conversion immediately
          const { data: verifyData } = await supabase
            .from("pre_bookings")
            .select("id, status")
            .eq("id", matchingBookings[0].id)
            .single();
          console.log("🔍 Verification - Status after update:", verifyData?.status);
        } else {
          console.warn("⚠️ No matching active pre-booking found to convert for plate:", normalizedPlate);
          console.log("This means either: 1) plate mismatch, 2) already converted, or 3) not a reserved check-in");
        }
      }
      
      // Wait longer to ensure database updates are fully committed and replicated
      console.log("⏳ Waiting 1 second for database commit...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh all data
      console.log("🔄 Refreshing dashboard after check-in...");
      await fetchSpots(selectedLot.id);
      await fetchActiveSessions(selectedLot.id);
      await fetchReservations(selectedLot.id);
      
      setShowModal(false);
      setNumberPlate("");
    } else {
      console.error("❌ Error creating session:", sessionError);
    }
    
    setProcessing(false);
  };

  const getActiveSession = (spotId: number) => {
    return sessions.find(s => s.spot_id === spotId && s.status === "active");
  };

  const calculateFee = (checkInTime: string, includeReservationFee: boolean = false) => {
    if (!selectedLot) return 0;
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const durationMs = now.getTime() - checkIn.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Calculate dynamic price based on current availability
    const basePrice = selectedLot.price_per_hour || selectedLot.base_price || 50;
    const totalSpots = spots.length || 1;
    const occupiedSpots = spots.filter(s => s.is_occupied).length;
    const availableSpots = totalSpots - occupiedSpots;
    const availability = availableSpots / totalSpots;
    
    // Dynamic pricing: Higher availability = Lower price, Lower availability = Higher price
    const pricePerHour = Math.max(50, Math.round(basePrice * (1 + (0.6 - availability) * 0.35)));
    
    // Round UP to next full hour (ceiling) - minimum 1 hour
    const hoursToCharge = Math.max(1, Math.ceil(durationHours));
    let fee = hoursToCharge * pricePerHour;
    
    // Add 20% reservation fee if spot was pre-booked
    if (includeReservationFee) {
      fee += Math.round(pricePerHour * 0.20);
    }
    
    return fee;
  };

  const handleCheckOut = async () => {
    if (!selectedSpot || !selectedLot) return;

    const session = getActiveSession(selectedSpot.id);
    if (!session) return;

    setProcessing(true);
    const now = new Date().toISOString();
    
    console.log("=== CHECKOUT PROCESS ===");
    console.log("Spot ID:", selectedSpot.id, "| Label:", selectedSpot.label);
    console.log("Plate:", session.plate_number);
    
    // Check if this vehicle had a pre-booking (to add 20% fee)
    const { data: preBooking } = await supabase
      .from("pre_bookings")
      .select("id, reservation_fee")
      .eq("lot_id", selectedLot.id)
      .eq("plate_number", session.plate_number)
      .eq("status", "converted")
      .maybeSingle();
    
    const hadPreBooking = !!preBooking;
    const fee = calculateFee(session.check_in_time, hadPreBooking);
    console.log("Fee calculated:", fee, "| Had pre-booking:", hadPreBooking);

    // Update spot as available
    const { error: spotError } = await supabase
      .from("parking_spots")
      .update({
        is_occupied: false,
        current_plate: null,
      })
      .eq("id", selectedSpot.id);

    if (spotError) {
      console.error("❌ Error updating spot:", spotError);
      setProcessing(false);
      return;
    }

    // Update session as completed
    const { error: sessionError } = await supabase
      .from("parking_sessions")
      .update({
        check_out_time: now,
        fee_charged: fee,
        status: "completed",
      })
      .eq("id", session.id);

    if (!sessionError) {
      console.log("✓ Checkout completed successfully");
      console.log("🔄 Refreshing dashboard after checkout...");
      await fetchSpots(selectedLot.id);
      await fetchActiveSessions(selectedLot.id);
      await fetchReservations(selectedLot.id);
      setShowModal(false);
    } else {
      console.error("❌ Error updating session:", sessionError);
    }
    
    setProcessing(false);
  };

  const occupiedCount = spots.filter((s) => s.status === 'occupied').length;
  const reservedCount = reservations.length; // Count of active pre-bookings
  const availableCount = spots.filter((s) => s.status === 'available').length;
  const occupancyRate = spots.length > 0 ? Math.round((occupiedCount / spots.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 text-slate-800 dark:text-slate-200">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-slate-200/50 dark:shadow-indigo-500/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Operator Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Real-time parking management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setShowReservations(true)}
                variant="outline"
                size="sm"
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
              >
                <Clock className="mr-2 h-4 w-4" />
                Reservations ({reservations.length})
              </Button>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="outline"
                size="sm"
                className="border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-300"
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

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 animate-spin"></div>
              <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-6 text-lg">Loading parking lot data...</p>
          </div>
        ) : (
          <>
            {/* Lot Selector */}
            {lots.length > 1 && (
              <div className="mb-6 bg-white/80 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200 dark:border-slate-800/50 rounded-2xl p-4 shadow-sm">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Select Parking Lot
                </label>
                <select
                  value={selectedLot?.id || ""}
                  onChange={(e) => {
                    const lot = lots.find((l) => l.id === parseInt(e.target.value));
                    if (lot) {
                      setSelectedLot(lot);
                      fetchSpots(lot.id);
                      fetchActiveSessions(lot.id);
                      fetchReservations(lot.id);
                    }
                  }}
                  className="w-full px-5 py-3 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} - {lot.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedLot && (
              <>
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                  {/* Total Spots */}
                  <div className="group relative overflow-hidden bg-linear-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-slate-600/50 transition-all hover:shadow-xl shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Spots</span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{spots.length}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Parking spaces</div>
                    </div>
                  </div>

                  {/* Available */}
                  <div className="group relative overflow-hidden bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all hover:shadow-xl shadow-sm hover:shadow-emerald-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Available</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{availableCount}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-600">Ready to use</div>
                    </div>
                  </div>

                  {/* Occupied */}
                  <div className="group relative overflow-hidden bg-linear-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 backdrop-blur-sm border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6 hover:border-rose-300 dark:hover:border-rose-700/50 transition-all hover:shadow-xl shadow-sm hover:shadow-rose-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-rose-700 dark:text-rose-400">Occupied</span>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                          <Car className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-1">{occupiedCount}</div>
                      <div className="text-xs text-rose-700 dark:text-rose-600">Currently parked</div>
                    </div>
                  </div>

                  {/* Reserved */}
                  <div className="group relative overflow-hidden bg-linear-to-br from-amber-50 to-yellow-100/50 dark:from-amber-950/40 dark:to-yellow-900/20 backdrop-blur-sm border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 hover:border-amber-300 dark:hover:border-amber-700/50 transition-all hover:shadow-xl shadow-sm hover:shadow-amber-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Reserved</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">{reservedCount}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-600">Pre-booked</div>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="group relative overflow-hidden bg-linear-to-br from-indigo-50 to-purple-100/50 dark:from-indigo-950/40 dark:to-purple-900/20 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-6 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all hover:shadow-xl shadow-sm hover:shadow-indigo-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Occupancy</span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{occupancyRate}%</div>
                      <div className="text-xs text-indigo-700 dark:text-indigo-600">Utilization rate</div>
                    </div>
                  </div>
                </div>

                {/* Canvas View - Visual Parking Lot */}
                <div className={`relative bg-white/80 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 transition-all shadow-sm ${isFullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-slate-900' : ''}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                            {selectedLot.name || 'Unnamed Parking Lot'}
                          </h2>
                          {selectedLot.address && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{selectedLot.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Click on any spot to check in/out vehicles • Live updates every 30s
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {spots.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Parking Spots</h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        This parking lot doesn&apos;t have any spots configured yet. The owner needs to design the layout using the canvas editor.
                      </p>
                    </div>
                  ) : (
                    <div 
                      ref={canvasContainerRef}
                      className="relative bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50 p-8 overflow-auto"
                      style={{ 
                        minHeight: '600px',
                        maxHeight: isFullscreen ? 'calc(100vh - 280px)' : '800px'
                      }}
                    >
                      {/* Parking Spots with Absolute Positioning */}
                      {spots.map((spot) => {
                        return (
                          <button
                            key={spot.id}
                            onClick={() => handleSpotClick(spot)}
                            className={`absolute group cursor-pointer transition-all duration-300 hover:z-50 ${
                              spot.is_occupied ? 'hover:scale-105' : 'hover:scale-105'
                            }`}
                            style={{
                              left: `${spot.x_coord}px`,
                              top: `${spot.y_coord}px`,
                              width: `${SPOT_W}px`,
                              height: `${SPOT_H}px`,
                              transform: `rotate(${spot.rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <div
                              className={`relative w-full h-full rounded-lg border-3 flex flex-col items-center justify-center font-bold text-xs shadow-lg transition-all ${
                                spot.status === 'occupied'
                                  ? 'bg-linear-to-br from-rose-100 to-rose-200 dark:from-rose-950/80 dark:to-rose-900/60 border-rose-400 dark:border-rose-500/60 text-rose-800 dark:text-rose-100 shadow-rose-300/40 dark:shadow-rose-500/20 hover:shadow-rose-400/60 dark:hover:shadow-rose-500/40'
                                  : spot.status === 'reserved'
                                  ? 'bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-950/80 dark:to-amber-900/60 border-amber-400 dark:border-amber-500/60 text-amber-800 dark:text-amber-100 shadow-amber-300/40 dark:shadow-amber-500/20 hover:shadow-amber-400/60 dark:hover:shadow-amber-500/40'
                                  : 'bg-linear-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/80 dark:to-emerald-900/60 border-emerald-400 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-100 shadow-emerald-300/40 dark:shadow-emerald-500/20 hover:shadow-emerald-400/60 dark:hover:shadow-emerald-500/40'
                              }`}
                            >
                              {/* Spot Label */}
                              <div className={`text-sm font-extrabold mb-1 ${
                                spot.status === 'occupied' ? 'text-rose-900 dark:text-rose-200' :
                                spot.status === 'reserved' ? 'text-amber-900 dark:text-amber-200' :
                                'text-emerald-900 dark:text-emerald-200'
                              }`}>
                                {spot.label}
                              </div>
                              
                              {/* Status Icon */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                spot.status === 'occupied' ? 'bg-rose-300 dark:bg-rose-500/30' :
                                spot.status === 'reserved' ? 'bg-amber-300 dark:bg-amber-500/30' :
                                'bg-emerald-300 dark:bg-emerald-500/30'
                              }`}>
                                {spot.status === 'occupied' ? (
                                  <Car className="w-3 h-3" />
                                ) : spot.status === 'reserved' ? (
                                  <Clock className="w-3 h-3" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                              </div>
                              
                              {/* Plate Number (if occupied) */}
                              {spot.status === 'occupied' && spot.current_plate && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-0.5 bg-white dark:bg-slate-900/90 border border-rose-300 dark:border-rose-500/30 rounded text-[10px] font-mono text-rose-700 dark:text-rose-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  {spot.current_plate}
                                </div>
                              )}
                              
                              {/* Plate Number (if reserved) */}
                              {spot.status === 'reserved' && spot.reserved_plate && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-0.5 bg-white dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/30 rounded text-[10px] font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  {spot.reserved_plate}
                                </div>
                              )}
                              
                              {/* Hover Effect Glow */}
                              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                                spot.status === 'occupied'
                                  ? 'bg-rose-500/10 ring-2 ring-rose-400 dark:ring-rose-500/30'
                                  : spot.status === 'reserved'
                                  ? 'bg-amber-500/10 ring-2 ring-amber-400 dark:ring-amber-500/30'
                                  : 'bg-emerald-500/10 ring-2 ring-emerald-400 dark:ring-emerald-500/30'
                              }`}></div>
                            </div>
                          </button>
                        );
                      })}
                      
                      {/* Legend */}
                      <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Legend</div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-linear-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900 border border-emerald-400 dark:border-emerald-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 border border-amber-400 dark:border-amber-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Reserved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-linear-to-br from-rose-100 to-rose-200 dark:from-rose-950 dark:to-rose-900 border border-rose-400 dark:border-rose-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Occupied</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Enhanced Modal for Check In / Check Out */}
      {showModal && selectedSpot && selectedLot && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl shadow-slate-300/20 dark:shadow-indigo-500/10 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b ${
              modalType === "checkin" 
                ? selectedSpot?.status === 'reserved'
                  ? "border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20"
                  : "border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-rose-200 dark:border-rose-800/30 bg-rose-50 dark:bg-rose-950/20"
            } rounded-t-3xl`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold flex items-center gap-3 ${
                  modalType === "checkin" 
                    ? selectedSpot?.status === 'reserved'
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}>
                  {modalType === "checkin" ? (
                    <>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedSpot?.status === 'reserved'
                          ? "bg-amber-100 dark:bg-amber-500/20"
                          : "bg-emerald-100 dark:bg-emerald-500/20"
                      }`}>
                        <CheckCircle2 className={`w-6 h-6 ${
                          selectedSpot?.status === 'reserved'
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`} />
                      </div>
                      Check In Vehicle
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                        <Car className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      Check Out Vehicle
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  disabled={processing}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Spot Info Card */}
              <div className={`mb-6 p-5 rounded-2xl border-2 ${
                selectedSpot.is_occupied
                  ? "bg-linear-to-br from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/30 border-rose-300 dark:border-rose-800/50"
                  : selectedSpot.status === 'reserved'
                  ? "bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-300 dark:border-amber-800/50"
                  : "bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-800/50"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg ${
                    selectedSpot.is_occupied
                      ? "bg-rose-200 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 shadow-rose-300/50 dark:shadow-rose-500/20"
                      : selectedSpot.status === 'reserved'
                      ? "bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-amber-300/50 dark:shadow-amber-500/20"
                      : "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-emerald-300/50 dark:shadow-emerald-500/20"
                  }`}>
                    {selectedSpot.label}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Parking Spot</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSpot.label}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-500 mt-1">
                      {selectedSpot.is_occupied ? "Currently Occupied" : selectedSpot.status === 'reserved' ? "Reserved" : "Available"}
                    </div>
                  </div>
                </div>
              </div>

              {modalType === "checkin" ? (
                /* Check In Form */
                <div className="space-y-4">
                  {selectedSpot?.status === 'reserved' && selectedSpot?.reserved_plate ? (
                    /* Reserved Spot - Show pre-booked vehicle info */
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-amber-900 dark:text-amber-300">Pre-booked Vehicle</div>
                          <div className="text-xs text-amber-700 dark:text-amber-500">Reserved spot</div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Vehicle Plate Number</div>
                        <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                          {selectedSpot.reserved_plate}
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                          <span className="font-semibold">Note:</span> 20% reservation fee (Rs. {Math.round((selectedLot.price_per_hour || selectedLot.base_price || 50) * 0.20)}) will be added to final checkout
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Available Spot - Manual entry */
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Vehicle Number Plate
                      </label>
                      <input
                        type="text"
                        value={numberPlate}
                        onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                        placeholder="e.g., ABC-1234"
                        className="w-full px-5 py-4 bg-white dark:bg-slate-950/80 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Check-in time: <span className="text-slate-900 dark:text-white font-semibold">{new Date().toLocaleTimeString()}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Rate: <span className={`font-semibold ${selectedSpot?.status === 'reserved' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Rs. {selectedLot.price_per_hour} per hour</span></span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Check Out Summary */
                <div className="space-y-4">
                  {(() => {
                    const session = getActiveSession(selectedSpot.id);
                    const checkInTime = session ? new Date(session.check_in_time) : null;
                    const currentTime = new Date();
                    const durationMs = checkInTime ? currentTime.getTime() - checkInTime.getTime() : 0;
                    const durationHours = durationMs / (1000 * 60 * 60);
                    const durationMinutes = Math.floor(durationMs / (1000 * 60));
                    const hoursToCharge = Math.max(1, Math.ceil(durationHours));
                    const fee = session ? calculateFee(session.check_in_time, hadPreBooking) : 0;
                    
                    return (
                      <>
                        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-slate-600 dark:text-slate-500 mb-1 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                Vehicle
                              </div>
                              <div className="font-bold text-lg text-slate-900 dark:text-white font-mono">{selectedSpot.current_plate}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-600 dark:text-slate-500 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Check In Time
                              </div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {checkInTime ? checkInTime.toLocaleTimeString() : "-"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Duration</span>
                              <span className="text-slate-900 dark:text-white font-semibold">
                                {Math.floor(durationHours)}h {durationMinutes % 60}m
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Rate</span>
                              <span className="text-slate-900 dark:text-white font-semibold">Rs. {selectedLot.price_per_hour} per hour</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Hours Charged</span>
                              <span className="text-slate-900 dark:text-white font-semibold">{hoursToCharge} {hoursToCharge === 1 ? 'hour' : 'hours'}</span>
                            </div>
                            {hadPreBooking && (
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                                <span className="text-sm text-amber-600 dark:text-amber-400">Reservation Fee (20%)</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">+ Rs. {Math.round((selectedLot.price_per_hour || selectedLot.base_price || 50) * 0.20)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-linear-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/30 border-2 border-indigo-300 dark:border-indigo-700/50 rounded-2xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Total Amount</div>
                              <div className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                Rs. {fee}
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 dark:shadow-indigo-500/30">
                              <DollarSign className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1 h-12 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={modalType === "checkin" ? handleCheckIn : handleCheckOut}
                className={`flex-1 h-12 font-semibold text-lg shadow-lg transition-all ${
                  modalType === "checkin"
                    ? selectedSpot?.status === 'reserved'
                      ? "bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-amber-300/50 dark:shadow-amber-500/30"
                      : "bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-300/50 dark:shadow-emerald-500/30"
                    : "bg-linear-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-rose-300/50 dark:shadow-rose-500/30"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={processing || (modalType === "checkin" && !numberPlate.trim())}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {modalType === "checkin" ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirm Check In
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-5 w-5" />
                        Complete Check Out
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reservations Modal */}
      {showReservations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="sticky top-0 bg-linear-to-r from-amber-500 to-orange-500 p-6 border-b border-amber-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Clock className="h-7 w-7" />
                    Active Reservations
                  </h2>
                  <p className="text-amber-100 text-sm mt-1">Pre-booked parking spots awaiting arrival</p>
                </div>
                <button
                  onClick={() => setShowReservations(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {reservations.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">No active reservations</p>
                  <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">Reserved spots will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => {
                    const expiresAt = new Date(reservation.expires_at);
                    const now = new Date();
                    const minutesRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
                    const isExpiringSoon = minutesRemaining <= 10;

                    return (
                      <div
                        key={reservation.id}
                        className={`border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
                          isExpiringSoon
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                            : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isExpiringSoon ? 'bg-red-500' : 'bg-amber-500'
                            }`}>
                              <Car className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                {reservation.plate_number}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                Reserved at {new Date(reservation.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                            isExpiringSoon
                              ? 'bg-red-500 text-white'
                              : minutesRemaining <= 20
                              ? 'bg-orange-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {minutesRemaining}m remaining
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Reservation Fee
                            </div>
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                              Rs. {reservation.reservation_fee || 0}
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires At
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {expiresAt.toLocaleTimeString()}
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Status
                            </div>
                            <div className={`text-sm font-bold ${
                              isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {isExpiringSoon ? 'Expiring Soon' : 'Active'}
                            </div>
                          </div>
                        </div>

                        {isExpiringSoon && (
                          <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700 dark:text-red-300">
                              <span className="font-semibold">Urgent:</span> This reservation will expire in {minutesRemaining} minutes. Customer should arrive soon.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
