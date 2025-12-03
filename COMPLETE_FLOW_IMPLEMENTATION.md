# Complete Pre-Booking to Session Flow Implementation Guide

## Overview
This document explains the complete flow from driver pre-booking → operator check-in → operator check-out → driver dashboard updates.

## 🔄 Complete Flow

### 1. **Driver Pre-Books a Parking Spot**
**Location:** `/map` page → Reserve Spot button

```
Driver Actions:
1. Searches for parking on map
2. Clicks on parking lot marker
3. Enters vehicle plate number
4. Clicks "Reserve Spot"

Database Changes:
✅ INSERT INTO pre_bookings (
    user_id,           -- Driver's UUID from auth
    lot_id,           -- Selected parking lot
    plate_number,     -- Normalized (uppercase, no spaces)
    status,           -- 'active'
    expires_at,       -- Current time + hold duration
    reservation_fee   -- 20% of hourly rate
)
```

**Key Code:** `components/google-map.tsx` → `handlePreBook()` function

### 2. **Operator Checks In the Vehicle**
**Location:** `/operator/dashboard` page

```
Operator Actions:
1. Views parking lot layout with colored spots
2. Clicks on a spot (green=available, yellow=reserved, red=occupied)
3. Enters plate number in modal
4. Clicks "Check In"

Database Changes:
✅ UPDATE parking_spots SET 
    is_occupied = true,
    current_plate = 'ABC123'
    WHERE id = spot_id;

✅ INSERT INTO parking_sessions (
    lot_id,
    spot_id,
    plate_number,      -- Normalized
    check_in_time,     -- Current timestamp
    status,            -- 'active'
    user_id           -- AUTO-LINKED by trigger!
);

✅ UPDATE pre_bookings SET 
    status = 'converted'
    WHERE lot_id = X 
    AND plate_number = 'ABC123'
    AND status = 'active';
```

**Magic Happens:** The `link_session_to_user()` trigger automatically:
- Finds the pre_booking with matching lot_id + plate_number
- Extracts the user_id
- Links it to the parking_session
- **This connects the session to the driver!**

**Key Code:** `app/operator/dashboard/page.tsx` → `handleCheckIn()` function

### 3. **Operator Checks Out the Vehicle**
**Location:** `/operator/dashboard` page

```
Operator Actions:
1. Clicks on occupied spot (red)
2. Reviews session details
3. Sees calculated fee
4. Clicks "Check Out"

Database Changes:
✅ UPDATE parking_spots SET 
    is_occupied = false,
    current_plate = NULL
    WHERE id = spot_id;

✅ UPDATE parking_sessions SET 
    check_out_time = NOW(),
    fee_charged = calculated_fee,
    status = 'completed'
    WHERE id = session_id;
```

**Fee Calculation:**
```typescript
Base Fee = (hours × price_per_hour)
Discounted Fee (if pre-booked) = Base Fee - reservation_fee
Final Fee = max(Discounted Fee, reservation_fee)
```

**Key Code:** `app/operator/dashboard/page.tsx` → `handleCheckOut()` function

### 4. **Driver Dashboard Updates**
**Location:** `/dashboard` page

```
Driver Sees:
1. Active Sessions (status='active', check_out_time=NULL)
   - Shows "Currently Parked" with live duration
   - Location name and address
   - Check-in time

2. Completed Sessions (status='completed', check_out_time!=NULL)
   - Shows in history table
   - Duration calculated
   - Amount paid displayed

3. Active Reservations (pre_bookings with status='active')
   - Countdown timer showing minutes remaining
   - Reservation fee displayed
   - Option to cancel

4. Statistics
   - Total Spent: SUM(fee_charged) from completed sessions
   - Active Sessions: COUNT where status='active'
   - Completed: COUNT where status='completed'

Real-Time Updates:
✅ Listens to parking_sessions table changes
✅ Listens to pre_bookings table changes
✅ Auto-refreshes when operator checks in/out
```

**Key Code:** `app/(user)/dashboard/page.tsx` → `fetchSessions()` + real-time subscriptions

## 📊 Database Schema Changes Required

### Required SQL Script
Run `DATABASE_USER_SESSIONS_INTEGRATION.sql` which includes:

1. **Add user_id column to parking_sessions**
   ```sql
   ALTER TABLE public.parking_sessions
   ADD COLUMN user_id uuid NULL;
   ```

2. **Create automatic linking trigger**
   ```sql
   CREATE FUNCTION link_session_to_user()
   -- Automatically finds user_id from pre_bookings
   -- Sets it on the session when created
   ```

3. **Update RLS Policies**
   - Drivers can view own sessions
   - Operators can view/insert/update sessions for assigned lots
   - Proper foreign key constraints

4. **Create indexes for performance**
   - idx_parking_sessions_user_id
   - idx_parking_sessions_status
   - idx_parking_sessions_user_status

## 🔐 RLS Policies Summary

### parking_sessions Table

| Policy Name | Action | Audience | Logic |
|------------|--------|----------|-------|
| Drivers can view own parking sessions | SELECT | Drivers | user_id = auth.uid() |
| Operators can view sessions for assigned lots | SELECT | Operators | lot_id in assigned_lots |
| Operators can insert sessions | INSERT | Operators | lot_id in assigned_lots |
| Operators can update sessions | UPDATE | Operators | lot_id in assigned_lots |

### pre_bookings Table (Already Set Up)

| Policy Name | Action | Audience | Logic |
|------------|--------|----------|-------|
| Authenticated users can view all pre_bookings | SELECT | All | true |
| Users can insert own pre_bookings | INSERT | Drivers | user_id = auth.uid() |
| Users can update own pre_bookings | UPDATE | Drivers | user_id = auth.uid() |
| Operators can update pre_bookings | UPDATE | Operators | lot_id in assigned_lots |

## 🚀 Implementation Steps

### Step 1: Run SQL Script
```bash
# In Supabase SQL Editor:
1. Open DATABASE_USER_SESSIONS_INTEGRATION.sql
2. Copy entire content
3. Run in SQL Editor
4. Verify: Check "Verification Queries" section at bottom
```

### Step 2: Code Already Updated
✅ Driver dashboard (`app/(user)/dashboard/page.tsx`)
- Fetches sessions with JOIN to ParkingLots
- Real-time subscriptions enabled
- Proper formatting and calculations

✅ Operator dashboard (`app/operator/dashboard/page.tsx`)
- Check-in already normalizes plate numbers
- Already converts pre_bookings
- Trigger will auto-link user_id

✅ Map component (`components/google-map.tsx`)
- Pre-booking already saves to database
- Plate numbers normalized correctly

### Step 3: Test the Flow

**Test Scenario:**
```
1. Driver Login → Go to /map
2. Reserve parking spot
   - Expected: pre_bookings row created with user_id
   
3. Operator Login → Go to /operator/dashboard
4. Check in the vehicle (use same plate number)
   - Expected: 
     * parking_session created
     * user_id auto-linked by trigger
     * pre_booking status = 'converted'
   
5. Driver refreshes dashboard
   - Expected: See active session appear
   - Expected: Reservation disappears (converted)
   
6. Operator checks out vehicle
   - Expected: 
     * Session updated with check_out_time
     * Fee calculated and saved
     * Status = 'completed'
   
7. Driver dashboard updates
   - Expected: 
     * Active sessions count decreases
     * Completed sessions count increases
     * Total spent increases
     * Session appears in history table
```

## 🐛 Troubleshooting

### Issue: Sessions not appearing in driver dashboard
**Check:**
```sql
-- Verify session has user_id
SELECT id, lot_id, plate_number, user_id, status
FROM parking_sessions
WHERE plate_number = 'ABC123'
ORDER BY check_in_time DESC LIMIT 5;

-- If user_id is NULL, trigger didn't fire
-- Verify trigger exists:
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'parking_sessions';
```

**Fix:** Manually link existing sessions:
```sql
UPDATE parking_sessions ps
SET user_id = pb.user_id
FROM pre_bookings pb
WHERE ps.lot_id = pb.lot_id
  AND ps.plate_number = pb.plate_number
  AND ps.user_id IS NULL;
```

### Issue: Pre-booking not converting
**Check:**
```sql
-- Verify plate number format matches
SELECT plate_number FROM pre_bookings WHERE status = 'active';
SELECT plate_number FROM parking_sessions WHERE status = 'active';

-- Both should be normalized: UPPERCASE, no spaces
```

**Fix:** Operator check-in normalizes plate numbers automatically.

### Issue: RLS blocking queries
**Check:**
```sql
-- Test as user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'USER_UUID_HERE';

SELECT * FROM parking_sessions WHERE user_id = 'USER_UUID_HERE';
```

**Fix:** Run RLS policy creation from SQL script.

## 📈 Performance Considerations

### Indexes Created
- `idx_parking_sessions_user_id` - Fast user lookups
- `idx_parking_sessions_status` - Fast status filtering  
- `idx_parking_sessions_user_status` - Composite for dashboard queries
- `idx_pre_bookings_user_id` - Fast reservation lookups

### Real-Time Subscriptions
- Efficient: Only subscribes to user's own data
- Auto-cleanup: Unsubscribes on component unmount
- Minimal load: Only refetches on actual changes

## ✅ Verification Checklist

- [ ] SQL script executed successfully
- [ ] user_id column exists in parking_sessions
- [ ] Trigger `link_session_to_user_trigger` exists
- [ ] RLS policies created for parking_sessions
- [ ] Indexes created successfully
- [ ] Test pre-booking flow works
- [ ] Test operator check-in links user_id
- [ ] Test driver dashboard shows sessions
- [ ] Test real-time updates work
- [ ] Test fee calculation correct
- [ ] Test completed sessions appear in history

## 🎯 Expected Results

After implementation:
1. ✅ Driver pre-books → sees reservation in dashboard
2. ✅ Operator checks in → driver sees active session immediately
3. ✅ Operator checks out → driver sees completed session with fee
4. ✅ Dashboard stats update in real-time
5. ✅ No manual linking required - all automatic!

---

## Summary

The key innovation is the **automatic trigger** that links sessions to users:
- No code changes needed in operator dashboard
- Trigger does the heavy lifting
- Works for both pre-booked and walk-in customers
- Maintains data integrity
- Enables complete driver tracking

**Result:** Complete visibility for drivers from reservation → parking → payment! 🎉
