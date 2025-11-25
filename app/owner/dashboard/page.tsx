// app/owner/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, Car, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OwnerDashboard() {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      const { data, error } = await supabase
        .from("ParkingLots")
        .select("*")
        .order("id", { ascending: false });

      if (data) setLots(data);
      setLoading(false);
    };

    fetchLots();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Parking Lots</h1>
            <p className="text-slate-500">Manage your locations, pricing, and operators.</p>
          </div>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/register-lot">
              <Plus className="mr-2 h-4 w-4" />
              Register New Lot
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Car size={16} /> Total Capacity
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {lots.reduce((acc, lot) => acc + (lot.capacity || 0), 0)} Spots
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
             <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <DollarSign size={16} /> Active Revenue
            </div>
            <div className="text-2xl font-bold text-green-600">$1,240.50</div>
          </div>
           <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
             <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Users size={16} /> Active Operators
            </div>
            <div className="text-2xl font-bold text-slate-900">3</div>
          </div>
        </div>

        {/* Lots List */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading your properties...</div>
        ) : lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400">
              <MapPin size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Parking Lots Found</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500">
              You havenot registered any parking locations yet. Get started to monetize your space.
            </p>
            <Button asChild variant="outline">
              <Link href="/register-lot">Register Your First Lot</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <div key={lot.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                <div className="h-32 w-full bg-slate-100 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50"></div>
                <div className="p-5">
                  <h3 className="mb-1 text-lg font-bold text-slate-900">{lot.name}</h3>
                  <p className="mb-4 flex items-center text-xs text-slate-500">
                    <MapPin size={12} className="mr-1" /> {lot.address || "No address provided"}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="text-xs font-medium text-slate-600">
                      {lot.capacity} Spots
                    </div>
                    <div className="text-sm font-bold text-indigo-600">
                      ${lot.base_price}/hr
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}