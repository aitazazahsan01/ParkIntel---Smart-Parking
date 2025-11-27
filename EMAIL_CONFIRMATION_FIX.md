# Email Confirmation & Login Fix

## Issues Fixed

### 1. **Duplicate Profile Creation Error (409)**
**Problem:** When users signed up with email/password, the code tried to create a profile immediately. But Supabase requires email confirmation first, so the profile couldn't be created until after confirmation. When users confirmed their email and the callback tried to create the profile again, it failed with "duplicate key" error.

**Solution:** 
- Store username in `user_metadata` during signup
- Only create profile AFTER email confirmation via the callback route
- Callback route now reads username from metadata and creates profile with it

### 2. **Invalid Login Credentials After Signup**
**Problem:** Users tried to login immediately after signup, but their email wasn't confirmed yet. Supabase Auth rejects login attempts from unconfirmed users with "Invalid login credentials" error.

**Solution:**
- Show clearer success message: "Please check your email inbox and click the confirmation link"
- Clear the form after successful signup so users don't accidentally try to login
- Improved error messages in login to indicate email confirmation is required

### 3. **406 Errors on Some Usernames**
**Problem:** The RLS policy we added allows anonymous SELECT on profiles, but it needs to be refreshed/reapplied in Supabase.

**Solution:** Run the SQL from `FIX_LOGIN_RLS_POLICY.sql` again if you still see 406 errors.

## How Email Signup Works Now

### Signup Flow (Email Confirmation Enabled):
```
1. User fills signup form with username, email, password
2. Click "Sign Up" → supabase.auth.signUp() called
3. User metadata stored: { full_name, username, role }
4. Supabase sends confirmation email
5. Success message shown: "Check your email..."
6. Form cleared to prevent accidental login attempts

After Email Confirmation:
7. User clicks link in email
8. Redirected to /auth/callback
9. Callback creates profile using metadata
10. User redirected to dashboard
11. User can now login with username or email
```

### Signup Flow (Email Confirmation Disabled):
```
1. User fills signup form
2. Click "Sign Up" → supabase.auth.signUp()
3. Session created immediately (authData.session exists)
4. Profile created right away with username
5. User redirected to dashboard
6. Can login immediately
```

## Changes Made

### 1. Driver Signup (`app/(auth)/signup/driver/page.tsx`)
- Added `username` to user metadata in signUp options
- Only create profile if `authData.session` exists (email confirmation disabled)
- Show detailed success message with instructions
- Clear form after successful signup
- Better error handling

### 2. Owner Signup (`app/(auth)/signup/owner/page.tsx`)
- Same changes as driver signup

### 3. Auth Callback (`app/auth/callback/route.ts`)
- Read `username` from `user.user_metadata.username`
- Include username when creating profile
- Better logging for debugging

### 4. Login Page (`app/(auth)/login/page.tsx`)
- Improved error messages:
  - "Email not confirmed" → Clear message about checking inbox
  - "Invalid credentials" → Mention email confirmation requirement
- Better user feedback

## Testing

### Test Email Signup:
1. Go to driver or owner signup
2. Choose "Sign up with Email"
3. Fill form with new username and email
4. Click "Sign Up"
5. **Expected:** Green success message appears, form clears
6. Check your email for confirmation link
7. Click confirmation link in email
8. **Expected:** Redirected to dashboard
9. Logout and try to login with the username you created
10. **Expected:** Login works!

### Test Immediate Login (if email confirmation disabled):
1. Sign up with email
2. **Expected:** Immediately redirected to dashboard
3. Logout
4. Login with username
5. **Expected:** Login works!

## Troubleshooting

### "Invalid login credentials" after signup
- **Cause:** Email not confirmed yet
- **Fix:** Check inbox for confirmation email and click the link

### "Duplicate key" error during signup
- **Cause:** Profile already exists (you signed up before)
- **Fix:** Try logging in instead, or use a different email

### 406 errors on username lookup
- **Cause:** RLS policy not applied or needs refresh
- **Fix:** Run SQL from `FIX_LOGIN_RLS_POLICY.sql` in Supabase SQL Editor

### Username login not working for some users
- **Cause:** Profile wasn't created with username (old signups)
- **Fix:** Those users need to set their username in Settings page

## Key Learnings

1. **User metadata is preserved** across email confirmation
2. **Don't create profile before email confirmation** - let callback handle it
3. **Clear forms after signup** to prevent confusion
4. **Show detailed messages** so users know what to do next
5. **RLS policies need to allow anon reads** for username lookup during login
