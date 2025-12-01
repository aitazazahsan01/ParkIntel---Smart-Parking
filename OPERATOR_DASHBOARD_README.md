# Operator Dashboard Implementation Guide

## Overview
The Operator Dashboard is a real-time parking management interface that allows operators to manage parking spots, perform check-ins/check-outs, and monitor parking lot occupancy. This document outlines the complete implementation process.

---

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Database Schema](#database-schema)
3. [Dashboard Features](#dashboard-features)
4. [Implementation Steps](#implementation-steps)
5. [UI/UX Design](#uiux-design)
6. [Troubleshooting](#troubleshooting)

---

## Authentication System

### Operator Login (Custom Authentication)
Unlike regular users who use Supabase OAuth, operators use a custom username/password authentication system.

**File:** `app/auth/operator/login/page.tsx`

### Key Implementation Steps:

#### 1. **Created Separate Operators Table**
```sql
CREATE TABLE public.operators (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  assigned_lots INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

#### 2. **Fixed RLS Policies for Login**
**File:** `FIX_OPERATOR_LOGIN_RLS.sql`

- Dropped restrictive SELECT policy that prevented login
- Created policy allowing anonymous SELECT (password verification happens in app)
- Maintained INSERT/UPDATE/DELETE protection via `owner_id = auth.uid()`

```sql
CREATE POLICY "Allow operator login access"
  ON public.operators
  FOR SELECT
  USING (true);
```

#### 3. **Implemented bcrypt Password Verification**
```typescript
// Fetch operator from database
const { data: operators } = await supabase
  .from("operators")
  .select("id, username, password_hash, full_name, owner_id, assigned_lots, is_active")
  .eq("username", username)
  .eq("is_active", true)
  .single();

// Verify password with bcrypt
const isPasswordValid = await bcrypt.compare(password, operators.password_hash);

// Store in localStorage (not Supabase auth)
localStorage.setItem("operator", JSON.stringify(operatorData));
```

#### 4. **Bypassed Middleware for Operator Routes**
**File:** `utils/supabase/middleware.ts`

Added exception for operator routes since they don't use Supabase auth:

```typescript
// Operator routes don't use Supabase auth - they use localStorage
const isOperatorRoute = request.nextUrl.pathname.startsWith('/operator') || 
                        request.nextUrl.pathname.startsWith('/auth/operator')

if (isOperatorRoute) {
  return supabaseResponse
}
```

---

## Dashboard Features

### 1. **Visual Canvas with Real-World Coordinates**
- Displays parking spots at exact database coordinates (`x_coord`, `y_coord`, `rotation`)
- Scale: 20 pixels per meter (2.5m × 5m spots = 50px × 100px)
- Absolute positioning with CSS transforms for rotation

### 2. **Color-Coded Spots**
- **Green (Emerald):** Available spots
- **Red (Rose):** Occupied spots
- Supports both light and dark themes

### 3. **Real-Time Statistics**
Four stat cards displaying:
- Total Spots
- Available (green card)
- Occupied (red card)
- Occupancy Rate % (indigo/purple card)

### 4. **Interactive Modals**

#### Check-In Modal:
- Input: Vehicle license plate
- Auto-fetch: Current timestamp
- Display: Parking rate per hour
- Action: Creates parking session in database

#### Check-Out Modal:
- Display: Vehicle plate, check-in time, duration
- Calculate: Fee based on duration × hourly rate
- Action: Updates session status to 'completed', calculates fee

### 5. **Multi-Lot Support**
- Operators can be assigned multiple parking lots
- Dropdown selector to switch between lots
- Fetches only assigned lots from `assigned_lots` array

### 6. **Auto-Refresh**
- Polls database every 30 seconds
- Manual refresh button available
- Updates spots and sessions automatically

### 7. **Fullscreen Mode**
- Toggle button to expand canvas view
- Useful for large parking lots with many spots

---

## Implementation Steps

### Step 1: Database Setup

1. **Create Operators Table**
   - Run `CREATE_OPERATORS_TABLE.sql`
   - Includes indexes for performance

2. **Fix RLS Policies**
   - Run `FIX_OPERATOR_LOGIN_RLS.sql`
   - Allows SELECT for login while maintaining security

3. **Verify Dependencies**
   - Ensure `parking_spots` table has: `x_coord`, `y_coord`, `rotation`, `is_occupied`, `current_plate`
   - Ensure `parking_sessions` table has: `spot_id`, `plate_number`, `check_in_time`, `check_out_time`, `fee_charged`, `status`

### Step 2: Authentication Implementation

1. **Create Login Page**
   - File: `app/auth/operator/login/page.tsx`
   - Install: `npm install bcryptjs @types/bcryptjs`
   - Implement username/password form
   - Add bcrypt verification
   - Store operator data in localStorage

2. **Update Middleware**
   - File: `utils/supabase/middleware.ts`
   - Add operator route bypass
   - Prevent redirect to regular login

### Step 3: Dashboard Page

1. **Create Dashboard Structure**
   - File: `app/operator/dashboard/page.tsx`
   - Define TypeScript types: `ParkingSpot`, `ParkingSession`, `ParkingLot`

2. **Authentication Check**
```typescript
useEffect(() => {
  const operatorData = localStorage.getItem("operator");
  if (!operatorData) {
    router.push("/auth/operator/login");
    return;
  }
  // Fetch lots assigned to operator...
}, []);
```

3. **Data Fetching Functions**
```typescript
const fetchSpots = async (lotId: number) => {
  const { data } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("lot_id", lotId)
    .order("label", { ascending: true });
  setSpots(data);
};

const fetchActiveSessions = async (lotId: number) => {
  const { data } = await supabase
    .from("parking_sessions")
    .select("*")
    .eq("lot_id", lotId)
    .eq("status", "active");
  setSessions(data);
};
```

### Step 4: Visual Canvas Implementation

1. **Canvas Container**
```tsx
<div 
  ref={canvasContainerRef}
  className="relative bg-slate-100 dark:bg-slate-950/50 rounded-xl border p-8 overflow-auto"
  style={{ minHeight: '600px' }}
>
```

2. **Render Spots with Absolute Positioning**
```tsx
{spots.map((spot) => (
  <button
    key={spot.id}
    onClick={() => handleSpotClick(spot)}
    style={{
      left: `${spot.x_coord}px`,
      top: `${spot.y_coord}px`,
      width: `${SPOT_W}px`,
      height: `${SPOT_H}px`,
      transform: `rotate(${spot.rotation}deg)`,
      position: 'absolute'
    }}
    className={spot.is_occupied ? 'bg-rose-500' : 'bg-emerald-500'}
  >
    {spot.label}
  </button>
))}
```

### Step 5: Check-In/Check-Out Logic

1. **Check-In Handler**
```typescript
const handleCheckIn = async () => {
  const now = new Date().toISOString();
  
  // Create parking session
  const { data: session } = await supabase
    .from("parking_sessions")
    .insert({
      lot_id: selectedLot.id,
      spot_id: selectedSpot.id,
      plate_number: numberPlate,
      check_in_time: now,
      status: "active",
    })
    .select()
    .single();

  // Update spot as occupied
  await supabase
    .from("parking_spots")
    .update({
      is_occupied: true,
      current_plate: numberPlate,
    })
    .eq("id", selectedSpot.id);
};
```

2. **Check-Out Handler**
```typescript
const handleCheckOut = async () => {
  const session = getActiveSession(selectedSpot.id);
  const now = new Date().toISOString();
  const fee = calculateFee(session.check_in_time);

  // Update session
  await supabase
    .from("parking_sessions")
    .update({
      check_out_time: now,
      fee_charged: fee,
      status: "completed",
    })
    .eq("id", session.id);

  // Release spot
  await supabase
    .from("parking_spots")
    .update({
      is_occupied: false,
      current_plate: null,
    })
    .eq("id", selectedSpot.id);
};
```

3. **Fee Calculation**
```typescript
const calculateFee = (checkInTime: string): number => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const durationHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  const rate = selectedLot.price_per_hour || selectedLot.base_price || 0;
  return Math.ceil(durationHours * rate);
};
```

### Step 6: Logout Implementation

```typescript
const handleLogout = () => {
  localStorage.removeItem("operator");
  router.push("/auth/operator/login");
};
```

---

## UI/UX Design

### Theme Support (Light & Dark)

#### Background Gradients:
```tsx
className="bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 
           dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950"
```

#### Stat Cards:
- Light: White backgrounds with colored borders
- Dark: Dark slate with colored accents
- Gradient overlays on hover

#### Parking Spots:
- Light: Bright emerald/rose with dark text
- Dark: Deep emerald/rose with light text
- Shadow effects adapt to theme

#### Modals:
- Light: White background with colored sections
- Dark: Dark slate with glass-morphism effects

### Responsive Design
- Grid layout: 1 column (mobile) → 4 columns (desktop)
- Canvas: Scrollable with min/max heights
- Fullscreen mode for better viewing

### Visual Hierarchy
1. **Header:** Logo, title, subtitle, refresh, logout
2. **Stats:** 4 cards in grid
3. **Lot Selector:** Dropdown (if multiple lots)
4. **Canvas:** Main visual display with spots
5. **Legend:** Color explanation

---

## Parking Lot Information Display

### Implementation
```tsx
<div className="flex items-center gap-3 mb-3">
  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 
                  flex items-center justify-center shadow-lg">
    <MapPin className="w-6 h-6 text-white" />
  </div>
  <div className="flex-1">
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
      {selectedLot.name || 'Unnamed Parking Lot'}
    </h2>
    {selectedLot.address && (
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5" />
        <span>{selectedLot.address}</span>
      </p>
    )}
  </div>
</div>
```

### Data Fetching
- Fetches from `ParkingLots` table with `SELECT *`
- Includes: `id`, `name`, `address`, `price_per_hour`, `lat`, `lng`, `owner_id`
- Filters by `assigned_lots` array for the operator

---

## Troubleshooting

### Issue 1: Login Redirects to Regular Login Page
**Problem:** Middleware redirects operator login to regular login.

**Solution:** Add operator route bypass in middleware:
```typescript
const isOperatorRoute = request.nextUrl.pathname.startsWith('/operator') || 
                        request.nextUrl.pathname.startsWith('/auth/operator')
if (isOperatorRoute) {
  return supabaseResponse
}
```

### Issue 2: Cannot Read Operator Table During Login
**Problem:** RLS policy blocks SELECT during login.

**Solution:** Run `FIX_OPERATOR_LOGIN_RLS.sql` to allow SELECT access.

### Issue 3: Parking Lot Name/Address Not Showing
**Problem:** Database values might be null or display is incorrect.

**Solution:** 
1. Verify database has values: `SELECT name, address FROM "ParkingLots"`
2. Check TypeScript types include `name: string | null` and `address: string | null`
3. Use fallback: `{selectedLot.name || 'Unnamed Parking Lot'}`

### Issue 4: Spots Not Positioned Correctly
**Problem:** Spots overlap or appear in wrong locations.

**Solution:**
1. Verify spots have `x_coord`, `y_coord`, `rotation` in database
2. Check scale: `PIXELS_PER_METER = 20`
3. Use CSS: `position: absolute` with `transform: rotate()`

### Issue 5: TypeScript Errors
**Problem:** Type mismatches between database schema and component types.

**Solution:** Match types exactly:
```typescript
type ParkingLot = {
  id: number;
  name: string | null;  // nullable fields
  address: string | null;
  price_per_hour?: number;  // optional fields
  // ... rest
};
```

### Issue 6: Tailwind CSS Class Conflicts
**Problem:** `bg-gradient-to-*` not working in Tailwind v4.

**Solution:** Use `bg-linear-to-*` instead:
```tsx
className="bg-linear-to-br from-indigo-500 to-purple-600"
```

---

## Dependencies

### Required NPM Packages:
```json
{
  "dependencies": {
    "next": "^16.0.3",
    "react": "^19.2.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.84.0",
    "bcryptjs": "^3.0.3",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.x",
    "tailwindcss": "^4.x"
  }
}
```

### Database Tables Required:
1. `operators` - Operator accounts
2. `ParkingLots` - Parking lot information
3. `parking_spots` - Individual parking spots with coordinates
4. `parking_sessions` - Check-in/check-out records

---

## File Structure
```
ParkIntel/
├── app/
│   ├── auth/
│   │   └── operator/
│   │       └── login/
│   │           └── page.tsx          # Operator login page
│   └── operator/
│       └── dashboard/
│           └── page.tsx               # Main operator dashboard
├── utils/
│   └── supabase/
│       └── middleware.ts              # Updated with operator bypass
├── FIX_OPERATOR_LOGIN_RLS.sql        # RLS policy fix
├── CREATE_OPERATORS_TABLE.sql        # Operators table schema
└── OPERATOR_DASHBOARD_README.md      # This file
```

---

## Key Differences from Regular User Dashboard

1. **Authentication:**
   - Regular users: Supabase OAuth (Google, Email)
   - Operators: Custom username/password with bcrypt

2. **Session Storage:**
   - Regular users: Supabase auth cookies
   - Operators: localStorage JSON object

3. **Access Control:**
   - Regular users: RLS based on `auth.uid()`
   - Operators: RLS allows SELECT, app validates credentials

4. **Routes:**
   - Regular users: Protected by middleware authentication check
   - Operators: Bypassed from middleware, handled in component

5. **Dashboard Features:**
   - Regular users: Browse, book, view history
   - Operators: Manage spots, check-in/out, real-time monitoring

---

## Security Considerations

1. **Password Hashing:** Always use bcrypt with salt rounds ≥ 10
2. **RLS Policies:** Allow SELECT for login, protect INSERT/UPDATE/DELETE
3. **Input Validation:** Sanitize license plate inputs
4. **Session Management:** Clear localStorage on logout
5. **HTTPS Only:** Never transmit credentials over HTTP
6. **Rate Limiting:** Consider implementing rate limiting on login attempts

---

## Future Enhancements

1. **Session Timeout:** Auto-logout after inactivity
2. **Audit Logs:** Track all operator actions
3. **Notifications:** Real-time alerts for new check-ins
4. **Reports:** Daily/weekly revenue and occupancy reports
5. **Multi-language:** Support for multiple languages
6. **Mobile App:** Native mobile version for operators
7. **Offline Mode:** Cache data for offline operation
8. **Analytics:** Dashboard metrics and KPIs

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review Supabase logs for RLS policy errors
- Verify database schema matches type definitions
- Test authentication flow in browser DevTools

---

**Last Updated:** December 1, 2025  
**Version:** 1.0.0  
**Author:** ParkIntel Development Team
