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

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Get user location
  useEffect(() => {
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
  }, []);

  // Fetch parking lots
  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const { data, error } = await supabase
          .from("ParkingLots")
          .select("*")
          .order("id", { ascending: true });

        if (data) {
          console.log("✅ Fetched", data.length, "parking lots");
          setParkingLots(data);
        }
        if (error) {
          console.error("❌ Error fetching parking lots:", error);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParkingLots();
  }, []);

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
