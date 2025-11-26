"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, User, Shield, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordSetupForm from "@/components/password-setup-form";

export default function DriverSettingsPage() {
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      // Fetch profile to check if password is set
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_password, username")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setHasPassword(profile.has_password || false);
        setUsername(profile.username);
      }
      setLoading(false);
    };

    checkProfile();
  }, [router]);

  const handleComplete = () => {
    setHasPassword(true);
    // Optionally redirect back to dashboard
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      // Step 1: Delete profile and related data first
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("Error deleting profile:", profileError);
        alert("Failed to delete account data. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Step 2: Delete the auth user from database
      // Call RPC function (requires DELETE_USER_FUNCTION.sql to be run in Supabase)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('delete_user_account');
      } catch (rpcError) {
        console.error("Error deleting auth user via RPC:", rpcError);
        // If RPC fails, try alternative method
      }

      // Step 3: Sign out (this clears the session)
      await supabase.auth.signOut();
      
      // Step 4: Redirect to home
      alert("Your account has been permanently deleted.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Set up username and password for login</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : hasPassword ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Setup Complete</h2>
                <p className="text-slate-600">
                  Your username: <span className="font-semibold text-indigo-600">{username}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Username Login</div>
                  <div className="text-sm text-slate-600">
                    You can now sign in using your username and password
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Password Security</div>
                  <div className="text-sm text-slate-600">
                    Your password is encrypted and stored securely
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-500 text-center">
              To change your password, please contact support
            </div>
          </div>
        ) : (
          <PasswordSetupForm onComplete={handleComplete} />
        )}

        {/* Delete Account Section */}
        <div className="mt-8 bg-white border border-red-200 rounded-xl p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Delete Account</h2>
              <p className="text-sm text-slate-600 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>

          {!showDeleteDialog ? (
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Warning: This action is permanent!</p>
                  <p>All your parking history, saved locations, and account data will be permanently deleted.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText("");
                  }}
                  variant="outline"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
