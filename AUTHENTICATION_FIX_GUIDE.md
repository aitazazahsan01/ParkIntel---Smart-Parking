# 🔧 Authentication Fix Guide

## Issues Found & Fixed

### **Problem 1: Missing `owner_id` Column**
The `ParkingLots` table was missing the `owner_id` column, which prevented the owner dashboard from loading lots correctly.

### **Problem 2: No User Association**
When creating parking lots, there was no link between the lot and the user who created it.

---

## ✅ Solutions Applied

### 1. **Database Migration** (`ADD_OWNER_ID_MIGRATION.sql`)
- Added `owner_id` column to `ParkingLots` table
- Created indexes for performance
- Added Row Level Security (RLS) policies
- Owners can only see/edit their own lots
- Public can view all lots (for map feature)

### 2. **TypeScript Types Updated** (`types/supabase.ts`)
- Added `owner_id` field to ParkingLots Row, Insert, and Update types
- Added relationship to profiles table

### 3. **Register Lot Page Updated** (`app/owner/register-lot/page.tsx`)
- Now fetches current user before creating lot
- Includes `owner_id: user.id` when inserting parking lots
- Added error handling if user is not logged in

---

## 🚀 How to Apply the Fix

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `ADD_OWNER_ID_MIGRATION.sql`
4. Copy all the SQL code
5. Paste it in the SQL Editor
6. Click **Run**

### Step 2: Verify the Changes

Run this query in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ParkingLots' AND column_name = 'owner_id';
```

You should see `owner_id` with type `uuid` and `is_nullable = YES`.

### Step 3: (Optional) Update Existing Lots

If you have existing parking lots without owner_id, you can assign them:

```sql
-- Replace 'USER_UUID_HERE' with actual owner's UUID from profiles table
UPDATE "ParkingLots" 
SET owner_id = 'USER_UUID_HERE' 
WHERE owner_id IS NULL;
```

---

## 🧪 Testing the Fix

### Test 1: Owner Signup & Login
```
✅ Go to /signup
✅ Click "Register Your Business" 
✅ Sign in with Google
✅ Should redirect to /owner/dashboard (NOT /dashboard)
✅ Dashboard should be empty (no lots yet)
```

### Test 2: Create a Parking Lot
```
✅ From owner dashboard, click "Register New Lot"
✅ Design some parking spots
✅ Enter lot name and address
✅ Click "Publish Layout"
✅ Should see success message
✅ Go back to owner dashboard
✅ Should see the newly created lot
```

### Test 3: Existing Owner Login
```
✅ Logout
✅ Go to /login
✅ Sign in with Google (same owner account)
✅ Should redirect to /owner/dashboard
✅ Should see your parking lots
```

### Test 4: Driver Login (Separate Test)
```
✅ Logout
✅ Go to /signup
✅ Click "Find Parking" (driver signup)
✅ Sign in with different Google account
✅ Should redirect to /dashboard (driver dashboard)
✅ Should NOT see owner features
```

---

## 🔍 How Authentication Flow Works Now

### Owner Signup Flow:
```
1. Click "Register Your Business" → /signup/owner
   ↓
2. localStorage.setItem('pendingUserRole', 'owner')
   ↓
3. Google OAuth initiated
   ↓
4. Callback creates profile with role='driver' (default)
   ↓
5. Redirects to /auth/complete-signup
   ↓
6. Reads localStorage: 'owner'
   ↓
7. Updates profile.role = 'owner'
   ↓
8. Redirects to /owner/dashboard ✅
```

### Owner Login Flow:
```
1. Click "Continue with Google" on /login
   ↓
2. localStorage.removeItem('pendingUserRole') (clears any pending role)
   ↓
3. Google OAuth initiated
   ↓
4. Callback checks: Is existing user? YES
   ↓
5. Fetches profile.role from database: 'owner'
   ↓
6. Redirects to /owner/dashboard ✅
```

### Creating Parking Lot:
```
1. Owner clicks "Register New Lot"
   ↓
2. Designs parking spots on canvas
   ↓
3. Clicks "Publish Layout"
   ↓
4. Code fetches current user: auth.getUser()
   ↓
5. Inserts lot with owner_id: user.id
   ↓
6. Lot is now linked to owner ✅
```

### Loading Owner Dashboard:
```
1. Owner visits /owner/dashboard
   ↓
2. Code checks user.role === 'owner'
   ↓
3. Fetches lots: .eq('owner_id', user.id)
   ↓
4. Only shows owner's lots ✅
```

---

## 🛡️ Security Features

### Row Level Security (RLS)
- ✅ Public can view all lots (for map)
- ✅ Owners can only view their own lots
- ✅ Owners can only create lots linked to themselves
- ✅ Owners can only update their own lots
- ✅ Owners can only delete their own lots

### Authentication Guards
- ✅ Driver dashboard redirects owners
- ✅ Owner dashboard redirects drivers
- ✅ Register-lot page requires authentication
- ✅ Each dashboard verifies role on load

---

## 📋 Files Modified

1. ✅ `ADD_OWNER_ID_MIGRATION.sql` (NEW)
2. ✅ `types/supabase.ts` (UPDATED)
3. ✅ `app/owner/register-lot/page.tsx` (UPDATED)

---

## ⚠️ Important Notes

1. **Run the SQL migration first** before testing anything
2. Existing parking lots (if any) will have `owner_id = NULL` until you update them
3. The callback route (`app/auth/callback/route.ts`) already has correct role-based redirects
4. Make sure your Supabase environment variables are set correctly

---

## 🎯 Expected Behavior After Fix

| User Role | Signup Redirects To | Login Redirects To | Can Create Lots | Can View Own Lots |
|-----------|--------------------|--------------------|-----------------|-------------------|
| **Driver** | `/dashboard` | `/dashboard` | ❌ No | ❌ No |
| **Owner** | `/owner/dashboard` | `/owner/dashboard` | ✅ Yes | ✅ Yes |
| **Operator** | `/operator/dashboard` | `/operator/dashboard` | ❌ No | ❌ No |

---

## 🆘 Troubleshooting

### Issue: Still redirecting to wrong dashboard
**Solution:** Clear browser cache and localStorage:
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
```

### Issue: "owner_id column doesn't exist" error
**Solution:** Run the SQL migration again in Supabase

### Issue: Owner dashboard shows no lots
**Solution:** Check if lots have owner_id set:
```sql
SELECT id, name, owner_id FROM "ParkingLots";
```

### Issue: RLS policy blocks lot creation
**Solution:** Verify user is authenticated:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

---

## ✨ Next Steps

After applying this fix:
1. ✅ Run the SQL migration
2. ✅ Test owner signup flow
3. ✅ Test creating a parking lot
4. ✅ Test owner login flow
5. ✅ Verify lots appear in owner dashboard

All authentication issues should now be resolved! 🎉
