# 🔍 Debugging Guide for Owner Signup Issue

## Current Problem
Role is not being updated from 'driver' to 'owner' in the database after signup.

## Possible Causes & Solutions

### 1. Row Level Security (RLS) Policy Issue ⚠️

**Problem:** Supabase RLS might be blocking the UPDATE query.

**Check in Supabase:**
```sql
-- Check if RLS is enabled on profiles table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Solution - Add UPDATE Policy:**
```sql
-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 2. localStorage Getting Cleared During OAuth

**Added Fix:**
- Now storing role in **both** localStorage AND sessionStorage
- Complete-signup checks both storages (localStorage first, then sessionStorage as fallback)

### 3. Timing Issue with Profile Creation

**Check:** The profile might not exist yet when trying to update.

**Added Fix:**
- Added `.select()` to the update query to see the response
- Enhanced error logging to see exact error details

---

## 🧪 Testing Steps

### Step 1: Clear Everything
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
```

### Step 2: Start Fresh Signup
1. Go to `/signup`
2. Click **"Register Your Business"**
3. Open Browser Console (F12) - keep it open!

### Step 3: Watch Console Logs

You should see:
```
✅ Stored pendingUserRole as OWNER in localStorage
✅ Stored pendingUserRole as OWNER in sessionStorage
🔍 Verify localStorage: owner
🔍 Verify sessionStorage: owner
🔐 OAuth initiated for OWNER
```

### Step 4: After OAuth Redirect

In complete-signup page, watch for:
```
🔄 Starting complete signup process...
✅ Session found: [user-id]
📋 Retrieved pending role from localStorage: owner
📋 Final pendingRole value: owner
🔄 Updating profile role to: owner
📦 Update response data: [...]
📦 Update response error: null
✅ Profile role updated successfully to: owner
🧹 Cleared pendingUserRole from both storages
🎉 Signup complete, redirecting to appropriate dashboard
```

### Step 5: Check for Errors

**If you see:**
```
❌ Error updating role: {...}
```

Look at the error details. Common issues:

1. **"new row violates row-level security policy"**
   - Solution: Run the RLS policy SQL above in Supabase

2. **"column 'role' does not exist"**
   - Solution: Check table schema in Supabase

3. **"permission denied for table profiles"**
   - Solution: Check RLS policies

---

## 🔧 Manual Fix (If Needed)

### Check Current Role in Supabase:
1. Go to Supabase Dashboard
2. Table Editor → profiles
3. Find your user row
4. Check the `role` column

### Manually Update Role:
```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'your-email@gmail.com';
```

---

## 🎯 Verification After Fix

### Test 1: Check Database
```sql
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'your-email@gmail.com';
```
Should show: `role = 'owner'`

### Test 2: Login Again
1. Logout
2. Login with Google
3. Should redirect to `/owner/dashboard` (purple theme)
4. Should see "Register a Parking Lot" button

---

## 📝 Enhanced Logging Added

### In Signup Pages (driver/owner):
- Stores in both localStorage and sessionStorage
- Verifies storage immediately after setting
- Logs both values for confirmation

### In Complete-Signup:
- Checks both storage types (fallback mechanism)
- Logs all storage keys
- Shows exact update query response
- Shows detailed error information if update fails
- Confirms cleanup of both storages

---

## 🚨 If Still Not Working

### Check Browser Console for:
1. **Storage logs** - Did role get stored?
2. **Update logs** - Did update query execute?
3. **Error logs** - Any red errors?

### Check Supabase Logs:
1. Go to Supabase Dashboard
2. Logs → Query Performance
3. Look for UPDATE queries on profiles table
4. Check if they succeeded or failed

### Common Fix: RLS Policy
Most likely issue is RLS blocking the UPDATE. Run this SQL:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new UPDATE policy
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure SELECT policy exists
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
```

---

## ✅ Expected Final Result

1. ✅ Role stored in both localStorage and sessionStorage
2. ✅ Role successfully updated in database to 'owner'
3. ✅ Redirected to `/owner/dashboard`
4. ✅ Owner dashboard loads with purple theme
5. ✅ Future logins automatically go to owner dashboard
