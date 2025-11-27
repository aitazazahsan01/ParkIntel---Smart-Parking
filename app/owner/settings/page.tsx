import UnifiedSettings from "@/components/unified-settings";

export default function OwnerSettingsPage() {
  return <UnifiedSettings role="owner" dashboardPath="/owner/dashboard" />;
}

/*
// Old implementation - replaced with UnifiedSettings component
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, User, Shield, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordSetupForm from "@/components/password-setup-form";

export default function OwnerSettingsPageOld() {
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [signupMethod, setSignupMethod] = useState<'email' | 'google' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      // Fetch profile to check signup method
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_password, username, email")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setEmail(profile.email);
        
        // Determine signup method
        if (profile.has_password) {
          setSignupMethod('google');
          setHasPassword(true);
        } else if (profile.username) {
          // Has username but no has_password flag = email signup
          setSignupMethod('email');
          setHasPassword(true);
        } else {
          // No username, no password = Google user who hasn't set up username yet
          setSignupMethod('google');
          setHasPassword(false);
        }
        
        console.log('Settings Debug:', {
          username: profile.username,
          has_password: profile.has_password,
          signupMethod: profile.has_password ? 'google' : (profile.username ? 'email' : 'google-incomplete')
        });
      }
      setLoading(false);
    };

    checkProfile();
  }, [router]);

  const handleComplete = () => {
    setHasPassword(true);
    setSignupMethod('google');
    setTimeout(() => router.push("/owner/dashboard"), 1000);
  };

  const handleChangeUsername = async () => {
    setUpdateError(null);
    setUpdateSuccess(null);
    
    if (!newUsername.trim() || newUsername.length < 3) {
      setUpdateError("Username must be at least 3 characters long");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newUsername)) {
      setUpdateError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername.toLowerCase())
        .single();
      
      if (existingUsername) {
        setUpdateError('Username already taken. Please choose another.');
        setIsUpdating(false);
        return;
      }
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setUpdateError('User not authenticated');
        setIsUpdating(false);
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.toLowerCase() })
        .eq('id', userData.user.id);
      
      if (error) {
        setUpdateError(error.message);
        setIsUpdating(false);
        return;
      }
      
      setUsername(newUsername.toLowerCase());
      setNewUsername("");
      setShowChangeUsername(false);
      setUpdateSuccess("Username updated successfully!");
      setIsUpdating(false);
    } catch (err) {
      console.error('Error updating username:', err);
      setUpdateError('An error occurred while updating username');
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    setUpdateError(null);
    setUpdateSuccess(null);
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setUpdateError("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      setUpdateError("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setUpdateError("New passwords do not match");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      if (email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: email,
          password: currentPassword,
        });
        
        if (verifyError) {
          setUpdateError('Current password is incorrect');
          setIsUpdating(false);
          return;
        }
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setUpdateError(error.message);
        setIsUpdating(false);
        return;
      }
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowChangePassword(false);
      setUpdateSuccess("Password updated successfully!");
      setIsUpdating(false);
    } catch (err) {
      console.error('Error updating password:', err);
      setUpdateError('An error occurred while updating password');
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      // Step 1: Delete profile and related data (parking lots, etc.) first
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
        // If RPC fails, continue with sign out
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      
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
          <div className="space-y-6">
            
            {updateSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                {updateSuccess}
              </div>
            )}
            {updateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {updateError}
              </div>
            )}

            
            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
                  <p className="text-sm text-slate-500">Manage your account credentials</p>
                </div>
              </div>

              <div className="space-y-4">
        
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-slate-900">Username</div>
                        <div className="text-sm text-slate-600">
                          {username || 'Not set'}
                        </div>
                      </div>
                    </div>
                    {signupMethod === 'email' && (
                      <Button
                        onClick={() => {
                          setShowChangeUsername(!showChangeUsername);
                          setUpdateError(null);
                          setUpdateSuccess(null);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Change
                      </Button>
                    )}
                  </div>

                  {showChangeUsername && signupMethod === 'email' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                        placeholder="Enter new username"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                      />
                      <p className="text-xs text-slate-500">Lowercase letters, numbers, and underscores only</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleChangeUsername}
                          disabled={isUpdating || !newUsername}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isUpdating ? "Updating..." : "Save Username"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowChangeUsername(false);
                            setNewUsername("");
                          }}
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

            
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-slate-900">Password</div>
                        <div className="text-sm text-slate-600">
                          {signupMethod === 'email' ? 'Manage your password' : 'Your password is set'}
                        </div>
                      </div>
                    </div>
                    {signupMethod === 'email' && (
                      <Button
                        onClick={() => {
                          setShowChangePassword(!showChangePassword);
                          setUpdateError(null);
                          setUpdateSuccess(null);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Change
                      </Button>
                    )}
                  </div>

                  {showChangePassword && signupMethod === 'email' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-slate-500">Password must be at least 8 characters long</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isUpdating || !currentPassword || !newPassword || !confirmNewPassword}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isUpdating ? "Updating..." : "Save Password"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowChangePassword(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmNewPassword("");
                          }}
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PasswordSetupForm onComplete={handleComplete} />
        )}

      
        <div className="mt-8 bg-white border border-red-200 rounded-xl p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Delete Account</h2>
              <p className="text-sm text-slate-600 mt-1">
                Permanently delete your account, parking lots, and all associated data. This action cannot be undone.
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
                  <p>All your parking lots, revenue data, analytics, and account information will be permanently deleted.</p>
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
*/
