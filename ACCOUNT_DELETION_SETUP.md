# Account Deletion Setup Instructions

## Overview
The delete account feature allows users to permanently delete their account, including both their profile data AND their authentication user from the database.

## Required SQL Setup

### Step 1: Run the SQL Function
You need to run the `DELETE_USER_FUNCTION.sql` file in your Supabase SQL Editor to create the function that allows users to delete their own auth account.

**File to run:** `DELETE_USER_FUNCTION.sql`

**How to run:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open `DELETE_USER_FUNCTION.sql`
4. Copy and paste the entire contents
5. Click "Run" or press Ctrl+Enter

### Step 2: Verify the Function
After running the SQL, verify the function was created:

```sql
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosrc as source
FROM pg_proc 
WHERE proname = 'delete_user_account';
```

### Step 3: Test Permissions
Make sure authenticated users can execute the function:

```sql
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'delete_user_account';
```

You should see `authenticated` as a grantee with `EXECUTE` privilege.

## How It Works

### Deletion Process (Step by Step)

1. **User confirms deletion** - Types "DELETE" in the confirmation dialog
2. **Profile data deleted** - All profile records and related data (parking sessions, parking lots, etc.) are deleted via CASCADE
3. **Auth user deleted** - The `delete_user_account()` RPC function removes the user from `auth.users` table
4. **Session cleared** - User is signed out via `supabase.auth.signOut()`
5. **Redirect to home** - User is redirected to the home page

### Security Features

- **SECURITY DEFINER**: Function runs with elevated privileges to access `auth.users`
- **Authentication check**: Function verifies user is authenticated before deletion
- **Self-deletion only**: Users can only delete their own account (auth.uid())
- **Confirmation required**: User must type "DELETE" to confirm

### Database Cascade

The profile deletion will automatically cascade to related tables if you have proper foreign key constraints set up:

```sql
-- Example: Parking lots owned by user
ALTER TABLE "ParkingLots" 
ADD CONSTRAINT fk_owner 
FOREIGN KEY (owner_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Example: Parking sessions by user
ALTER TABLE parking_sessions 
ADD CONSTRAINT fk_user 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;
```

## Important Notes

⚠️ **Warning**: This action is PERMANENT and cannot be undone!

- All user data is permanently deleted
- For drivers: parking history, saved locations, preferences
- For owners: parking lots, revenue data, analytics, operator accounts
- Auth user is removed from the authentication system

## Troubleshooting

### If RPC call fails
The code includes error handling. If the RPC call fails:
1. Check if `DELETE_USER_FUNCTION.sql` was run
2. Verify function exists in Supabase
3. Check browser console for detailed error messages
4. User will still be signed out and redirected

### If profile deletion fails
- Check foreign key constraints
- Verify RLS policies allow deletion
- Ensure user is authenticated

### Regenerate TypeScript types (Optional)
After adding the function, regenerate types:

```bash
npx supabase gen types typescript --project-id wxpxlgthzkabceefsnyh --schema public > types/supabase.ts
```

## Testing

To test the delete account feature:

1. Create a test account (driver or owner)
2. Go to Settings page
3. Scroll to "Delete Account" section
4. Click "Delete My Account"
5. Type "DELETE" in the confirmation field
6. Click "Permanently Delete Account"
7. Verify:
   - Profile is deleted from `profiles` table
   - User is deleted from `auth.users` table
   - User is signed out
   - Redirected to home page

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Check browser console for errors
3. Verify SQL function was created successfully
4. Ensure RLS policies are configured correctly
