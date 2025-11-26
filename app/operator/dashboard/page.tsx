"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2, Car, MapPin, Clock, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ParkingSpot = {
  id: string;
  spot_number: string;
  is_occupied: boolean;
  current_plate: string | null;
  check_in_time: string | null;
  lot_id: number;
};

type ParkingLot = {
  id: number;
  name: string;
  address: string;
  base_price: number;
};

export default function OperatorDashboard() {
  const router = useRouter();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"checkin" | "checkout">("checkin");
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [numberPlate, setNumberPlate] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth/operator/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchLots = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/auth/operator/login");
        return;
      }

      // Fetch all parking lots
      const { data: lotsData, error } = await supabase
        .from("ParkingLots")
        .select("*")
        .order("id", { ascending: true });

      if (lotsData && lotsData.length > 0) {
        setLots(lotsData);
        setSelectedLot(lotsData[0]);
        fetchSpots(lotsData[0].id);
      }
      setLoading(false);
    };

    fetchLots();
  }, [router]);

  const fetchSpots = async (lotId: number) => {
    const { data, error } = await supabase
      .from("parking_spots")
      .select("*")
      .eq("lot_id", lotId)
      .order("spot_number", { ascending: true });

    if (data) {
      setSpots(data);
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setNumberPlate(spot.current_plate || "");
    setModalType(spot.is_occupied ? "checkout" : "checkin");
    setShowModal(true);
  };

  const handleCheckIn = async () => {
    if (!selectedSpot || !numberPlate.trim()) return;
    
    setProcessing(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("parking_spots")
      .update({
        is_occupied: true,
        current_plate: numberPlate.toUpperCase(),
        check_in_time: now,
      })
      .eq("id", selectedSpot.id);

    if (!error && selectedLot) {
      await fetchSpots(selectedLot.id);
      setShowModal(false);
      setNumberPlate("");
    }
    setProcessing(false);
  };

  const handleCheckOut = async () => {
    if (!selectedSpot || !selectedLot) return;

    setProcessing(true);
    const checkInTime = new Date(selectedSpot.check_in_time!);
    const checkOutTime = new Date();
    const durationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
    const hours = durationMinutes / 60;
    const amount = Math.ceil(hours * selectedLot.base_price);

    const { error } = await supabase
      .from("parking_spots")
      .update({
        is_occupied: false,
        current_plate: null,
        check_in_time: null,
      })
      .eq("id", selectedSpot.id);

    // Optionally log this session to parking_sessions table
    if (!error) {
      await supabase.from("parking_sessions").insert({
        lot_id: selectedLot.id,
        spot_number: selectedSpot.spot_number,
        license_plate: selectedSpot.current_plate,
        check_in_time: selectedSpot.check_in_time,
        check_out_time: checkOutTime.toISOString(),
        duration_minutes: durationMinutes,
        amount_paid: amount,
        status: "completed",
      });

      await fetchSpots(selectedLot.id);
      setShowModal(false);
    }
    setProcessing(false);
  };

  const occupiedCount = spots.filter((s) => s.is_occupied).length;
  const availableCount = spots.length - occupiedCount;
  const occupancyRate = spots.length > 0 ? Math.round((occupiedCount / spots.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Operator Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Manage parking spots in real-time</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              variant="outline"
              className="border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300"
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

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Lot Selector */}
            {lots.length > 1 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-400 mb-2 block">Select Parking Lot</label>
                <select
                  value={selectedLot?.id || ""}
                  onChange={(e) => {
                    const lot = lots.find((l) => l.id === parseInt(e.target.value));
                    if (lot) {
                      setSelectedLot(lot);
                      fetchSpots(lot.id);
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
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
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Total Spots</span>
                      <MapPin className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">{spots.length}</div>
                  </div>

                  <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-emerald-400">Available</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{availableCount}</div>
                  </div>

                  <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-red-400">Occupied</span>
                      <Car className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-400">{occupiedCount}</div>
                  </div>

                  <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-indigo-400">Occupancy</span>
                      <DollarSign className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-bold text-indigo-400">{occupancyRate}%</div>
                  </div>
                </div>

                {/* Parking Spots Grid */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Parking Spots</h2>
                  {spots.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No parking spots configured for this lot.</p>
                      <p className="text-sm text-slate-500 mt-2">Owner needs to design spots in the canvas tool.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                      {spots.map((spot) => (
                        <button
                          key={spot.id}
                          onClick={() => handleSpotClick(spot)}
                          className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${
                            spot.is_occupied
                              ? "bg-red-950/50 border-red-800 text-red-300 hover:bg-red-900/70"
                              : "bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/70"
                          }`}
                        >
                          {spot.spot_number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal for Check In / Check Out */}
      {showModal && selectedSpot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalType === "checkin" ? "Check In Vehicle" : "Check Out Vehicle"}
            </h3>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                  selectedSpot.is_occupied
                    ? "bg-red-950/50 border border-red-800 text-red-300"
                    : "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                }`}>
                  {selectedSpot.spot_number}
                </div>
                <div>
                  <div className="text-sm text-slate-400">Spot Number</div>
                  <div className="text-lg font-bold text-white">{selectedSpot.spot_number}</div>
                </div>
              </div>

              {modalType === "checkin" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Vehicle Number Plate</label>
                  <input
                    type="text"
                    value={numberPlate}
                    onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none caret-white"
                    autoFocus
                  />
                  <p className="text-xs text-slate-500">Current time will be recorded automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">Vehicle</div>
                        <div className="font-bold text-white">{selectedSpot.current_plate}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">Check In</div>
                        <div className="font-bold text-white">
                          {selectedSpot.check_in_time
                            ? new Date(selectedSpot.check_in_time).toLocaleTimeString()
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-950/30 border border-indigo-800 rounded-lg p-4">
                    <div className="text-sm text-indigo-300 mb-1">Estimated Amount</div>
                    <div className="text-2xl font-bold text-indigo-400">
                      Rs.{" "}
                      {selectedSpot.check_in_time && selectedLot
                        ? Math.ceil(
                            ((new Date().getTime() - new Date(selectedSpot.check_in_time).getTime()) /
                              3600000) *
                              selectedLot.base_price
                          )
                        : 0}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={modalType === "checkin" ? handleCheckIn : handleCheckOut}
                className={`flex-1 ${
                  modalType === "checkin"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white`}
                disabled={processing || (modalType === "checkin" && !numberPlate.trim())}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                {processing ? "Processing..." : modalType === "checkin" ? "Confirm Check In" : "Confirm Check Out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
