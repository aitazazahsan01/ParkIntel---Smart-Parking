"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditLotPage() {
  const router = useRouter();
  const params = useParams();
  const lotId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lot, setLot] = useState<any>(null);
  const [spots, setSpots] = useState<any[]>([]);

  // Form state
  const [lotName, setLotName] = useState("");
  const [lotAddress, setLotAddress] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [releaseBuffer, setReleaseBuffer] = useState("");

  useEffect(() => {
    const fetchLotData = async () => {
      if (!lotId) return;

      // Fetch lot details
      const { data: lotData, error: lotError } = await supabase
        .from("ParkingLots")
        .select("*")
        .eq("id", lotId)
        .single();

      if (lotError || !lotData) {
        alert("Error loading parking lot data");
        router.push("/owner/dashboard");
        return;
      }

      // Fetch associated parking spots
      const { data: spotsData } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("lot_id", lotId)
        .order("id", { ascending: true });

      setLot(lotData);
      setLotName(lotData.name || "");
      setLotAddress(lotData.address || "");
      setBasePrice(lotData.price_per_hour?.toString() || "50");
      setReleaseBuffer(lotData.release_buffer_multiplier?.toString() || "1.8");
      setSpots(spotsData || []);
      setLoading(false);
    };

    fetchLotData();
  }, [lotId, router]);

  const handleSave = async () => {
    if (!lotName || !basePrice || !releaseBuffer) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ParkingLots")
        .update({
          name: lotName,
          address: lotAddress,
          price_per_hour: parseFloat(basePrice),
          release_buffer_multiplier: parseFloat(releaseBuffer),
        })
        .eq("id", lotId);

      if (error) throw error;

      alert("✅ Parking lot updated successfully!");
      router.push("/owner/dashboard");
    } catch (error: any) {
      console.error("Update error:", error);
      alert("Error updating parking lot: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-slate-600">Loading parking lot data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white px-8 py-5 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/owner/dashboard")}
                className="text-slate-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Parking Lot</h1>
                <p className="text-sm text-slate-500">Update lot information and pricing</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Lot Information</h2>
          
          <div className="space-y-6">
            {/* Lot Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parking Lot Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="e.g., Metro Station Saddar"
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address
              </label>
              <input
                type="text"
                value={lotAddress}
                onChange={(e) => setLotAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Full address"
              />
            </div>

            {/* Price and Buffer in Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Base Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Price per Hour (Rs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="50"
                />
              </div>

              {/* Release Buffer */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Release Buffer Multiplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={releaseBuffer}
                  onChange={(e) => setReleaseBuffer(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="1.8"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Multiplier for travel time (e.g., 1.8× means 18 min for 10 min travel)
                </p>
              </div>
            </div>

            {/* Location Info (Read-only) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Location</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Latitude:</span>
                  <span className="ml-2 font-mono text-slate-900">{lot?.lat?.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Longitude:</span>
                  <span className="ml-2 font-mono text-slate-900">{lot?.lng?.toFixed(6)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                ℹ️ Location cannot be changed after creation
              </p>
            </div>

            {/* Spots Info (Read-only) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Parking Spots</h3>
              <div className="text-sm">
                <span className="text-slate-500">Total Spots:</span>
                <span className="ml-2 text-lg font-bold text-purple-600">{spots.length}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                ℹ️ To modify parking spots layout, you'll need to delete and recreate the lot
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/owner/dashboard")}
              className="text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
