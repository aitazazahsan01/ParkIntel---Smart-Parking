"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2, ArrowLeft, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartParkingMap, type ParkingLot } from "@/components/google-map";

const FALLBACK_LOCATION = { lat: 33.5651, lng: 73.0169 }; // Rawalpindi/Islamabad
const NEARBY_RADIUS_KM = 5; // 10km radius for "nearby" spots

export default function MapPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated - redirect to login
        router.push("/login");
        return;
      }

      // Check user role - only drivers can access map
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "owner") {
        router.push("/owner/dashboard");
        return;
      } else if (profile?.role === "operator") {
        router.push("/operator/dashboard");
        return;
      }

      // User is authenticated and is a driver
      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Get user location
  useEffect(() => {
    if (!authChecked) return;
    const init = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationStatus("granted");
          },
          (error) => {
            console.log("Location denied, using fallback:", error);
            setUserLocation(FALLBACK_LOCATION);
            setLocationStatus("denied");
          }
        );
      } else {
        setUserLocation(FALLBACK_LOCATION);
        setLocationStatus("denied");
      }
    };
    init();
  }, [authChecked]);

  // Fetch parking lots with availability
  useEffect(() => {
    if (!authChecked) return;
    
    const fetchParkingLots = async () => {
      try {
        const { data: lotsData, error: lotsError } = await supabase
          .from("ParkingLots")
          .select("*")
          .order("id", { ascending: true });

        if (lotsError) {
          console.error("❌ Error fetching parking lots:", lotsError);
          setLoading(false);
          return;
        }

        if (lotsData) {
          console.log("✅ Fetched", lotsData.length, "parking lots");
          
          // Fetch parking spots to calculate availability
          const lotsWithAvailability = await Promise.all(
            lotsData.map(async (lot) => {
              const { data: spotsData } = await supabase
                .from("parking_spots")
                .select("is_occupied")
                .eq("lot_id", lot.id);
              
              // Fetch active pre-bookings (reserved spots)
              const { data: preBookingsData } = await supabase
                .from("pre_bookings")
                .select("id")
                .eq("lot_id", lot.id)
                .eq("status", "active")
                .gt("expires_at", new Date().toISOString());
              
              // Check if this lot has real-time tracking
              const hasRealTimeTracking = spotsData && spotsData.length > 0;
              
              if (hasRealTimeTracking) {
                // This lot HAS parking_spots entries - use real-time data
                const totalSpots = lot.total_spots || 0;
                const occupiedSpots = spotsData.filter(spot => spot.is_occupied === true).length;
                const reservedSpots = preBookingsData?.length || 0;
                // Formula: Available = Total - Occupied - Reserved
                const availableSpots = totalSpots - occupiedSpots - reservedSpots;
                
                return {
                  id: lot.id,
                  name: lot.name,
                  address: lot.address,
                  lat: lot.lat,
                  lng: lot.lng,
                  capacity: lot.total_spots,
                  base_price: lot.price_per_hour,
                  owner_id: lot.owner_id,
                  // Real-time availability data
                  total_spots: totalSpots,
                  available_spots: Math.max(0, availableSpots), // Ensure non-negative
                  occupied_spots: occupiedSpots,
                } as ParkingLot;
              } else {
                // This lot has NO parking_spots entries - use ML prediction
                return {
                  id: lot.id,
                  name: lot.name,
                  address: lot.address,
                  lat: lot.lat,
                  lng: lot.lng,
                  capacity: lot.total_spots,
                  base_price: lot.price_per_hour,
                  owner_id: lot.owner_id,
                  // No real-time data - leave undefined for ML prediction
                  // total_spots, available_spots, occupied_spots intentionally omitted
                } as ParkingLot;
              }
            })
          );
          
          setParkingLots(lotsWithAvailability);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchParkingLots();
    
    // Set up auto-refresh every 20 seconds
    const intervalId = setInterval(() => {
      console.log("🔄 Auto-refreshing parking data...");
      fetchParkingLots();
    }, 20000); // 20 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [authChecked]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Calculate nearby parking lots
  const nearbyLots = useMemo(() => {
    if (!userLocation || locationStatus === "denied") return parkingLots.length;
    
    return parkingLots.filter(lot => {
      const distance = calculateDistance(userLocation.lat, userLocation.lng, lot.lat, lot.lng);
      return distance <= NEARBY_RADIUS_KM;
    }).length;
  }, [parkingLots, userLocation, locationStatus]);

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-xl opacity-50">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
            </div>
            <Loader2 className="relative h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Preparing your parking experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Enhanced Header with Gradient */}
      <div className="relative flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 z-10 sm:px-6 sm:py-4">
        {/* Gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Animated icon */}
          <div className="relative hidden sm:block">
            <div className="absolute inset-0 blur-md opacity-60 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600" />
            </div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-slate-100 dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent sm:text-2xl">
                Discover Parking
              </h1>
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm font-medium">
                {locationStatus === "granted" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{nearbyLots}</span>
                      <span className="font-medium">spot{nearbyLots !== 1 ? 's' : ''}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">within {NEARBY_RADIUS_KM}km</span>
                    </span>
                    <span className="mx-2 text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-500">
                      <span className="font-semibold">{parkingLots.length}</span> citywide
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{parkingLots.length}</span>
                    <span> premium locations available</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2 border-red-200 dark:border-red-800/50 bg-white/50 dark:bg-slate-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Map Container with enhanced loading */}
      <div className="flex-1 relative">
        {loading || !userLocation ? (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 via-indigo-50/30 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20">
            <div className="text-center">
              <div className="relative mb-6">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 blur-2xl opacity-40">
                  <Loader2 className="h-16 w-16 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
                </div>
                {/* Main spinner */}
                <Loader2 className="relative h-16 w-16 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Loading Your Parking Map
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Finding the best spots near you...
              </p>
              <div className="mt-4 flex items-center justify-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" />
              </div>
            </div>
          </div>
        ) : (
          <SmartParkingMap
            parkingLots={parkingLots}
            userLocation={userLocation}
            fallbackLocation={FALLBACK_LOCATION}
            loadingLots={loading}
            locationStatus={locationStatus}
          />
        )}
      </div>
    </div>
  );
}
