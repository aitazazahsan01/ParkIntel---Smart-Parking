"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartParkingMap, type ParkingLot } from "@/components/google-map";

const FALLBACK_LOCATION = { lat: 33.5651, lng: 73.0169 }; // Rawalpindi/Islamabad

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
              
              // Check if this lot has real-time tracking
              const hasRealTimeTracking = spotsData && spotsData.length > 0;
              
              if (hasRealTimeTracking) {
                // This lot HAS parking_spots entries - use real-time data
                const totalSpots = lot.total_spots || 0;
                const occupiedSpots = spotsData.filter(spot => spot.is_occupied === true).length;
                const availableSpots = totalSpots - occupiedSpots;
                
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
                  available_spots: availableSpots,
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

    fetchParkingLots();
  }, [authChecked]);

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-10 sm:px-6 sm:py-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Find Parking</h1>
            <p className="text-xs text-slate-500 sm:text-sm">{parkingLots.length} locations available</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
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

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading || !userLocation ? (
          <div className="flex items-center justify-center h-full bg-slate-100">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading map...</p>
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
