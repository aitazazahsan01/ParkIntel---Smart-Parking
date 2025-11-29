// app/owner/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, Car, DollarSign, Users, LogOut, Loader2, TrendingUp, Activity, Settings, Trash2, Edit, UserPlus, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import bcrypt from "bcryptjs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OwnerDashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingLotId, setDeletingLotId] = useState<number | null>(null);
  
  // Operator management state
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [operatorForm, setOperatorForm] = useState({ username: "", password: "", name: "" });
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [operatorCredentials, setOperatorCredentials] = useState<{ [key: string]: { username: string; password: string } }>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState<{ open: boolean; username: string; password: string }>({ open: false, username: "", password: "" });
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

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

  const handleDelete = async (lotId: number, lotName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Parking Lot",
      description: `Are you sure you want to delete "${lotName}"? This will also delete all associated parking spots.`,
      onConfirm: async () => {
        setDeletingLotId(lotId);
        try {
          // Delete the lot (spots will cascade delete due to foreign key)
          const { error } = await supabase
            .from("ParkingLots")
            .delete()
            .eq("id", lotId);

          if (error) throw error;

          // Remove from local state
          setLots(lots.filter(lot => lot.id !== lotId));
          addToast({
            title: "Success",
            description: `Parking lot "${lotName}" deleted successfully`,
            variant: "success",
          });
        } catch (error: unknown) {
          console.error("Delete error:", error);
          addToast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete parking lot",
            variant: "error",
          });
        } finally {
          setDeletingLotId(null);
        }
      },
    });
  };

  const openOperatorModal = async (lotId: number) => {
    setSelectedLotId(lotId);
    setShowOperatorModal(true);
    await fetchOperators(lotId);
  };

  const fetchOperators = async (lotId: number) => {
    setLoadingOperators(true);
    try {
      // Fetch operators from the new operators table
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from("operators")
        .select("id, username, full_name")
        .eq("owner_id", userData.user.id)
        .contains("assigned_lots", [lotId]);

      if (error) throw error;
      setOperators(data || []);
    } catch (err) {
      console.error("Error fetching operators:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load operators",
        variant: "error",
      });
    } finally {
      setLoadingOperators(false);
    }
  };

  const handleAddOperator = async () => {
    if (!operatorForm.username || !operatorForm.password) {
      addToast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "warning",
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("User not authenticated");

      // Hash password with bcryptjs
      const passwordHash = await bcrypt.hash(operatorForm.password, 10);

      if (editingOperatorId) {
        // Update existing operator
        const { data: currentOp } = await supabase
          .from("operators")
          .select("assigned_lots")
          .eq("id", editingOperatorId)
          .single();
        
        const currentLots = currentOp?.assigned_lots || [];
        const newAssignedLots = currentLots.includes(selectedLotId) 
          ? currentLots 
          : [...currentLots, selectedLotId];

        const { data: result, error: rpcError } = await supabase.rpc('update_operator_simple', {
          p_operator_id: editingOperatorId,
          p_username: operatorForm.username,
          p_full_name: operatorForm.name,
          p_password_hash: operatorForm.password ? passwordHash : null,
          p_assigned_lots: newAssignedLots,
        }) as { data: { success: boolean; error?: string } | null; error: Error | null };

        if (rpcError) throw rpcError;
        if (result && !result.success) {
          throw new Error(result.error || "Failed to update operator");
        }
        
        addToast({
          title: "Success",
          description: "Operator updated successfully",
          variant: "success",
        });
      } else {
        // Create new operator using simple function
        const { data: result, error: rpcError } = await supabase.rpc('create_operator_simple', {
          p_username: operatorForm.username,
          p_full_name: operatorForm.name,
          p_password_hash: passwordHash,
          p_owner_id: userData.user.id,
          p_lot_id: selectedLotId,
        }) as { data: { success: boolean; error?: string; operator_id?: number } | null; error: Error | null };

        if (rpcError) throw rpcError;
        
        if (result && !result.success) {
          throw new Error(result.error || "Failed to create operator");
        }
        
        // Store credentials temporarily and show modal
        if (result?.operator_id) {
          setOperatorCredentials({
            ...operatorCredentials,
            [result.operator_id]: {
              username: operatorForm.username,
              password: operatorForm.password,
            },
          });
          
          // Show credentials modal
          setShowCredentialsModal({
            open: true,
            username: operatorForm.username,
            password: operatorForm.password,
          });
        }
        
        addToast({
          title: "Success",
          description: `Operator "${operatorForm.username}" created successfully`,
          variant: "success",
        });
      }

      // Reset form and refresh
      setOperatorForm({ username: "", password: "", name: "" });
      setEditingOperatorId(null);
      if (selectedLotId) await fetchOperators(selectedLotId);
    } catch (err) {
      console.error("Error saving operator:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save operator",
        variant: "error",
      });
    }
  };

  const handleEditOperator = (operator: { id: number; username: string; full_name: string | null }) => {
    setOperatorForm({
      username: operator.username,
      password: "",
      name: operator.full_name || "",
    });
    setEditingOperatorId(operator.id.toString());
  };

  const handleDeleteOperator = async (operatorId: number, username: string) => {
    setConfirmDialog({
      open: true,
      title: "Remove Operator",
      description: `Are you sure you want to remove operator "${username}"?`,
      onConfirm: async () => {
        try {
          const { data: result, error: rpcError } = await supabase.rpc('delete_operator_simple', {
            p_operator_id: operatorId,
          }) as { data: { success: boolean; error?: string } | null; error: Error | null };

          if (rpcError) throw rpcError;
          if (result && !result.success) {
            throw new Error(result.error || "Failed to delete operator");
          }
          
          if (selectedLotId) await fetchOperators(selectedLotId);
          addToast({
            title: "Success",
            description: "Operator removed successfully",
            variant: "success",
          });
        } catch (error) {
          console.error("Error deleting operator:", error);
          addToast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete operator",
            variant: "error",
          });
        }
      },
    });
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

      if (error) {
        console.error("Error fetching lots:", error);
      }

      if (data) {
        // Fetch occupied spots count for each lot
        const lotsWithOccupancy = await Promise.all(
          data.map(async (lot) => {
            const { count } = await supabase
              .from("parking_spots")
              .select("*", { count: "exact", head: true })
              .eq("lot_id", lot.id)
              .eq("is_occupied", true);
            
            // Use total_spots if available, fallback to capacity for backward compatibility
            const totalSpots = (lot as { total_spots?: number; capacity: number }).total_spots || lot.capacity || 0;
            const occupancyRate = totalSpots > 0 ? Math.round((count || 0) / totalSpots * 100) : 0;
            return { ...lot, occupancy: occupancyRate, total_spots: totalSpots };
          })
        );
        setLots(lotsWithOccupancy);
      }
      setLoading(false);
    };

    fetchLots();
  }, [router]);

  const totalCapacity = lots.reduce((acc, lot) => acc + (lot.total_spots || 0), 0);
  const totalRevenue = lots.reduce((acc, lot) => acc + (lot.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/30 to-slate-50">
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
                  <div className="h-40 w-full bg-linear-to-br from-purple-500 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute bottom-3 right-3">
                      <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-purple-900">
                        {lot.total_spots || 0} Spots
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {lot.name}
                    </h3>
                    <p className="mb-4 flex items-start text-sm text-slate-500">
                      <MapPin size={16} className="mr-2 mt-0.5 shrink-0" />
                      <span>{lot.address || "No address provided"}</span>
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Price/Hour</div>
                        <div className="text-lg font-bold text-slate-900">Rs. {lot.price_per_hour || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Occupancy</div>
                        <div className="text-lg font-bold text-emerald-600">{lot.occupancy || 0}%</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-slate-600 hover:text-purple-600 hover:border-purple-300"
                          onClick={() => router.push(`/owner/edit-lot/${lot.id}`)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(lot.id, lot.name)}
                          disabled={deletingLotId === lot.id}
                        >
                          {deletingLotId === lot.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-4 w-4" />
                          )}
                          {deletingLotId === lot.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                        onClick={() => openOperatorModal(lot.id)}
                      >
                        <UserPlus className="mr-1 h-4 w-4" />
                        Manage Operators
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operator Management Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Manage Operators</h2>
                <p className="text-sm text-slate-500">
                  {lots.find(l => l.id === selectedLotId)?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOperatorModal(false);
                  setOperatorForm({ username: "", password: "", name: "" });
                  setEditingOperatorId(null);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Add/Edit Operator Form */}
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {editingOperatorId ? "Edit Operator" : "Add New Operator"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={operatorForm.name}
                      onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={operatorForm.username}
                      onChange={(e) => setOperatorForm({ ...operatorForm, username: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      placeholder="operator123"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={operatorForm.password}
                      onChange={(e) => setOperatorForm({ ...operatorForm, password: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      placeholder={editingOperatorId ? "Leave empty to keep current" : "Enter password"}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddOperator}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {editingOperatorId ? "Update Operator" : "Add Operator"}
                    </Button>
                    {editingOperatorId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOperatorForm({ username: "", password: "", name: "" });
                          setEditingOperatorId(null);
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Operators List */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Assigned Operators ({operators.length})
                </h3>
                {loadingOperators ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : operators.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                    <Users className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                    <p className="text-slate-600">No operators assigned yet</p>
                    <p className="text-sm text-slate-500">Add your first operator above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operators.map((operator) => (
                      <div
                        key={operator.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-purple-300"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">
                            {operator.full_name || "No name"}
                          </div>
                          <div className="text-sm text-slate-500">@{operator.username}</div>
                          {operator.email && (
                            <div className="text-xs text-slate-400">{operator.email}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const credentials = operatorCredentials[operator.id];
                              if (credentials) {
                                setShowCredentialsModal({
                                  open: true,
                                  username: credentials.username,
                                  password: credentials.password,
                                });
                              } else {
                                addToast({
                                  title: "Password Not Available",
                                  description: "Password can only be viewed once after creation for security reasons.",
                                  variant: "warning",
                                });
                              }
                            }}
                            className="text-slate-600 hover:text-indigo-600"
                            title="View credentials (only available once after creation)"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOperator(operator)}
                            className="text-slate-600 hover:text-purple-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOperator(operator.id, operator.username)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl mx-4 p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Operator Credentials</h3>
              <p className="text-sm text-slate-500">Save these credentials - they can only be viewed once!</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Username</label>
                <div className="mt-1 text-lg font-mono font-semibold text-slate-900">{showCredentialsModal.username}</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Password</label>
                <div className="mt-1 text-lg font-mono font-semibold text-slate-900">{showCredentialsModal.password}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`Username: ${showCredentialsModal.username}\nPassword: ${showCredentialsModal.password}`);
                  addToast({
                    title: "Copied!",
                    description: "Credentials copied to clipboard",
                    variant: "success",
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Copy All
              </Button>
              <Button
                onClick={() => setShowCredentialsModal({ open: false, username: "", password: "" })}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
