# 🔧 Role Update Issue - Complete Fix

## Problem
When users sign up as "Owner" or "Driver", the role in the database is always saved as "driver" instead of the correct role.

## Root Causes

1. **RLS Policy Issue**: The `profiles` table Row Level Security policies might be blocking the role update
2. **localStorage Persistence**: The `pendingUserRole` might not be persisting correctly through the OAuth redirect
3. **Timing Issue**: The complete-signup page might be running before localStorage is fully accessible

---

## ✅ Complete Fix Applied

### 1. **Fixed RLS Policies** (`FIX_ROLE_UPDATE_ISSUE.sql`)
- Dropped all conflicting policies
- Created new comprehensive policies:
  - `Service can insert profiles` - Allows callback to create profiles
  - `Users can update own profile` - Allows users to update their role
  - `Users can view own profile` - Allows users to read their profile
  - `Users can delete own profile` - Allows account deletion
- Granted proper permissions to authenticated users

### 2. **Enhanced Complete Signup Page**
- Added profile role verification before update
- Added detailed error logging with error code, message, and hints
- Added verification after update to confirm success
- Shows user-friendly alert if update fails

### 3. **Improved Signup Pages (Driver & Owner)**
- Clear any existing `pendingUserRole` before setting new one
- Set role in both localStorage and sessionStorage
- Verify the values were set correctly
- Log confirmation with emoji indicators

---

## 🚀 How to Apply the Fix

### Step 1: Run the SQL Migration

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy all content from `FIX_ROLE_UPDATE_ISSUE.sql`
4. Paste and click **Run**
5. Verify you see 4 policies in the output

### Step 2: Clear Browser Storage (Important!)

Before testing, clear your browser storage:

**Option A - Chrome DevTools:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Clear storage** on the left
4. Check all boxes
5. Click **Clear site data**

**Option B - Browser Console:**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 3: Test the Fix

---

## 🧪 Testing Steps

### Test 1: Owner Signup
```
1. ✅ Go to http://localhost:3000/signup
2. ✅ Click "Register Your Business" (Owner option)
3. ✅ Open Browser Console (F12)
4. ✅ Click "Continue with Google"
5. ✅ In console, verify you see:
   - "✅ Stored pendingUserRole as OWNER"
   - "🔍 Verify localStorage: owner"
   - "🔍 Verify sessionStorage: owner"
   - "🔍 Values match: true"
6. ✅ Complete Google OAuth
7. ✅ In complete-signup, verify console shows:
   - "📋 Final pendingRole value: owner"
   - "🔄 Attempting to update profile role to: owner"
   - "✅ Profile role updated successfully to: owner"
   - "✅ Verified profile role after update: owner"
8. ✅ Should redirect to /owner/dashboard
9. ✅ Check Supabase profiles table - role should be "owner"
```

### Test 2: Driver Signup
```
1. ✅ Logout (if logged in)
2. ✅ Clear browser storage again
3. ✅ Go to http://localhost:3000/signup
4. ✅ Click "Find Parking" (Driver option)
5. ✅ Open Browser Console (F12)
6. ✅ Click "Continue with Google"
7. ✅ In console, verify you see:
   - "✅ Stored pendingUserRole as DRIVER"
   - "🔍 Verify localStorage: driver"
   - "🔍 Verify sessionStorage: driver"
   - "🔍 Values match: true"
8. ✅ Complete Google OAuth
9. ✅ In complete-signup, verify console shows:
   - "📋 Final pendingRole value: driver"
   - "🔄 Attempting to update profile role to: driver"
   - "✅ Profile role updated successfully to: driver"
   - "✅ Verified profile role after update: driver"
10. ✅ Should redirect to /dashboard
11. ✅ Check Supabase profiles table - role should be "driver"
```

### Test 3: Verify Database
```sql
-- Run this in Supabase SQL Editor to check roles
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔍 Debugging Console Logs

### Expected Console Output (Owner Signup):

**On /signup/owner page (after clicking Google button):**
```
✅ Stored pendingUserRole as OWNER
🔍 Verify localStorage: owner
🔍 Verify sessionStorage: owner
🔍 Values match: true
🔐 OAuth initiated for OWNER: {...}
```

**On /auth/complete-signup page:**
```
🔄 Starting complete signup process...
✅ Session found: <user-id>
📋 Retrieved pending role from localStorage: owner
📋 Final pendingRole value: owner
📋 All localStorage keys: Array ["pendingUserRole"]
📋 All sessionStorage keys: Array ["pendingUserRole"]
📋 Current profile role before update: driver
🔄 Attempting to update profile role to: owner
📦 Update response data: [{ id: "...", role: "owner", ... }]
📦 Update response error: null
✅ Profile role updated successfully to: owner
✅ Verified profile role after update: owner
🎉 Signup complete, redirecting to appropriate dashboard
```

### Expected Console Output (Driver Signup):

Same as above but with "driver" instead of "owner".

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Error updating role" in console
**Symptoms:**
```
❌ Error updating role: {...}
❌ Error code: 42501
❌ Error message: new row violates row-level security policy
```

**Solution:**
- Run `FIX_ROLE_UPDATE_ISSUE.sql` again
- Make sure RLS policies were created successfully
- Check if you're using the correct Supabase project

### Issue 2: pendingUserRole is null
**Symptoms:**
```
📋 Final pendingRole value: null
ℹ️ No pending role to update
```

**Solution:**
- Clear browser storage completely
- Make sure you clicked signup from `/signup/owner` or `/signup/driver`, not from `/login`
- Check if localStorage is blocked by browser privacy settings
- Try in incognito/private mode

### Issue 3: Still shows "driver" role
**Symptoms:**
- Console shows role updated to "owner"
- But database still shows "driver"

**Solution:**
```sql
-- Check if multiple profiles exist for same email
SELECT id, email, role FROM profiles 
WHERE email = 'your-email@gmail.com';

-- If multiple exist, delete old ones
DELETE FROM profiles 
WHERE id = 'old-profile-id-here';
```

### Issue 4: Redirects to wrong dashboard
**Symptoms:**
- Owner redirected to driver dashboard
- Driver redirected to owner dashboard

**Solution:**
1. Check the role in database first
2. If role is correct but redirect is wrong, check `app/auth/callback/route.ts`
3. Make sure the role-based redirect logic is there (it should be)

---

## 📊 Database Check Queries

### Check profiles table structure:
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### Check RLS policies:
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### Check if RLS is enabled:
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
```

---

## 🎯 Expected Final State

After applying all fixes:

| Action | localStorage | Database Role | Redirects To |
|--------|-------------|---------------|--------------|
| Signup as Owner | `pendingUserRole: owner` | `role: owner` | `/owner/dashboard` |
| Signup as Driver | `pendingUserRole: driver` | `role: driver` | `/dashboard` |
| Login as Owner | (cleared) | `role: owner` | `/owner/dashboard` |
| Login as Driver | (cleared) | `role: driver` | `/dashboard` |

---

## 📝 Files Modified

1. ✅ `FIX_ROLE_UPDATE_ISSUE.sql` (NEW) - Fixes RLS policies
2. ✅ `app/auth/complete-signup/page.tsx` (UPDATED) - Better error handling
3. ✅ `app/(auth)/signup/driver/page.tsx` (UPDATED) - Better localStorage handling
4. ✅ `app/(auth)/signup/owner/page.tsx` (UPDATED) - Better localStorage handling

---

## ✨ What Changed

### Before Fix:
- ❌ All users got `role: driver` in database
- ❌ No error messages when update failed
- ❌ RLS policies might block updates
- ❌ localStorage not verified

### After Fix:
- ✅ Owners get `role: owner`, Drivers get `role: driver`
- ✅ Detailed error logging in console
- ✅ RLS policies allow proper updates
- ✅ localStorage values verified before OAuth
- ✅ Profile role verified after update

---

## 🆘 Still Having Issues?

1. **Clear everything and start fresh:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   // Then delete your profile from Supabase
   // And sign up again
   ```

2. **Check Supabase logs:**
   - Go to Supabase Dashboard
   - Click on your project
   - Go to "Logs" section
   - Look for any errors during profile update

3. **Test with a different email:**
   - Sometimes old profiles cause conflicts
   - Try signing up with a completely new Google account

4. **Verify environment variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

---

## ✅ Success Checklist

After applying the fix, you should be able to:

- ☐ Sign up as Owner → Role in DB is "owner"
- ☐ Sign up as Driver → Role in DB is "driver"
- ☐ Owner redirects to `/owner/dashboard`
- ☐ Driver redirects to `/dashboard`
- ☐ Console shows no errors
- ☐ localStorage shows correct role before OAuth
- ☐ Complete-signup logs show successful update

All done! 🎉
