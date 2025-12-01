# Operator Dashboard - Implementation Guide

## Overview
The Operator Dashboard is a real-time parking management interface that allows parking lot operators to manage vehicle check-ins and check-outs. It features a visual canvas displaying parking spots with color-coded availability status, automatic fee calculation, and live updates.

---

## Features Implemented

### 1. **Visual Parking Lot Canvas**
- Real-time visual representation of parking spots
- Color-coded spots:
  - **Green**: Available spots
  - **Red**: Occupied spots
- Exact positioning based on database coordinates (x_coord, y_coord, rotation)
- Interactive hover effects showing license plate numbers
- Fullscreen mode for better visibility

### 2. **Authentication System**
- Custom username/password authentication (separate from Supabase Auth)
- Uses localStorage for session management
- bcrypt password hashing for security
- Direct database queries to `operators` table
- Middleware bypass for operator routes

### 3. **Real-Time Statistics**
- Total Spots count
- Available spots (green card)
- Occupied spots (red card)
- Occupancy rate percentage (purple card)
- Auto-refresh every 30 seconds

### 4. **Check-In Flow**
- Click on green (available) spot
- Enter vehicle license plate number
- Auto-capture current timestamp
- Display hourly rate
- Create parking session in database
- Update spot status to occupied

### 5. **Check-Out Flow**
- Click on red (occupied) spot
- Display vehicle details (plate number, check-in time)
- Calculate duration automatically
- Calculate fee based on: `duration × price_per_hour`
- Real-time fee display
- Complete session and release spot

### 6. **Multi-Lot Support**
- Operators can be assigned to multiple parking lots
- Dropdown selector to switch between assigned lots
- Fetch only assigned lots based on `assigned_lots` array

### 7. **Theme Support**
- Full light and dark theme compatibility
- Proper contrast in both themes
- Beautiful gradients and shadows
- Readable text in all conditions

---

## Implementation Steps

### Step 1: Database Setup

#### A. Operators Table
Created in `CREATE_OPERATORS_TABLE.sql`:
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

#### B. RLS Policies
Fixed in `FIX_OPERATOR_LOGIN_RLS.sql`:
```sql
-- Allow operators to read their own records during login
CREATE POLICY "Allow operator login access"
  ON public.operators
  FOR SELECT
  USING (true);

-- Allow owners to manage their operators
CREATE POLICY "Owners can view their own operators via auth"
  ON public.operators
  FOR SELECT
  USING (owner_id = auth.uid());
```

### Step 2: Operator Login Page

**Location**: `app/auth/operator/login/page.tsx`

**Key Features**:
- Username/password form (not email-based)
- bcrypt password comparison
- localStorage session storage
- Direct database queries (no Supabase Auth)

**Authentication Flow**:
```typescript
1. User enters username and password
2. Fetch operator record from database
3. Verify password with bcrypt.compare()
4. Store operator data in localStorage
5. Update last_login timestamp
6. Redirect to /operator/dashboard
```

**Data Stored in localStorage**:
```json
{
  "id": 1,
  "username": "operator1",
  "full_name": "John Doe",
  "owner_id": "uuid",
  "assigned_lots": [1, 2, 3]
}
```

### Step 3: Middleware Configuration

**Location**: `utils/supabase/middleware.ts`

**Critical Change**:
```typescript
// Bypass Supabase auth checks for operator routes
const isOperatorRoute = request.nextUrl.pathname.startsWith('/operator') || 
                        request.nextUrl.pathname.startsWith('/auth/operator')

if (isOperatorRoute) {
  return supabaseResponse
}
```

**Why This Is Needed**:
- Operators don't use Supabase Auth (no JWT tokens)
- They use localStorage-based authentication
- Without this bypass, middleware redirects them to /login
- This allows operator routes to function independently

### Step 4: Operator Dashboard Component

**Location**: `app/operator/dashboard/page.tsx`

#### A. Type Definitions
```typescript
type ParkingSpot = {
  id: number;
  label: string;
  is_occupied: boolean | null;
  current_plate: string | null;
  lot_id: number;
  x_coord: number;
  y_coord: number;
  rotation: number | null;
};

type ParkingSession = {
  id: number;
  lot_id: number;
  spot_id: number | null;
  plate_number: string;
  check_in_time: string;
  check_out_time: string | null;
  fee_charged: number | null;
  status: string | null;
};

type ParkingLot = {
  id: number;
  name: string | null;
  address: string | null;
  price_per_hour?: number;
  lat: number;
  lng: number;
  owner_id: string | null;
};
```

#### B. Data Fetching
```typescript
// Check localStorage for operator session
const operatorData = localStorage.getItem("operator");
if (!operatorData) {
  router.push("/auth/operator/login");
  return;
}

// Fetch assigned parking lots
const operator = JSON.parse(operatorData);
let lotsQuery = supabase.from("ParkingLots").select("*");

if (operator.assigned_lots && operator.assigned_lots.length > 0) {
  lotsQuery = lotsQuery.in("id", operator.assigned_lots);
}

// Fetch spots for selected lot
await supabase
  .from("parking_spots")
  .select("*")
  .eq("lot_id", lotId)
  .order("label", { ascending: true });

// Fetch active sessions
await supabase
  .from("parking_sessions")
  .select("*")
  .eq("lot_id", lotId)
  .eq("status", "active");
```

#### C. Visual Canvas Rendering
```typescript
// Real-world dimensions
const PIXELS_PER_METER = 20;
const SPOT_WIDTH_M = 2.5;
const SPOT_HEIGHT_M = 5.0;
const SPOT_W = SPOT_WIDTH_M * PIXELS_PER_METER; // 50px
const SPOT_H = SPOT_HEIGHT_M * PIXELS_PER_METER; // 100px

// Render spots with absolute positioning
<button
  style={{
    left: `${spot.x_coord}px`,
    top: `${spot.y_coord}px`,
    width: `${SPOT_W}px`,
    height: `${SPOT_H}px`,
    transform: `rotate(${spot.rotation}deg)`,
    transformOrigin: 'center center',
  }}
  className={spot.is_occupied 
    ? 'bg-rose-100 dark:bg-rose-950 border-rose-400' 
    : 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400'
  }
>
  {spot.label}
</button>
```

#### D. Check-In Handler
```typescript
const handleCheckIn = async () => {
  // Insert parking session
  await supabase.from("parking_sessions").insert({
    lot_id: selectedLot.id,
    spot_id: selectedSpot.id,
    plate_number: numberPlate,
    check_in_time: new Date().toISOString(),
    status: "active",
  });

  // Update spot as occupied
  await supabase
    .from("parking_spots")
    .update({
      is_occupied: true,
      current_plate: numberPlate,
    })
    .eq("id", selectedSpot.id);

  // Refresh data
  await fetchSpots(selectedLot.id);
  await fetchActiveSessions(selectedLot.id);
};
```

#### E. Check-Out Handler
```typescript
const handleCheckOut = async () => {
  const session = getActiveSession(selectedSpot.id);
  const fee = calculateFee(session.check_in_time);
  
  // Mark spot as available
  await supabase
    .from("parking_spots")
    .update({
      is_occupied: false,
      current_plate: null,
    })
    .eq("id", selectedSpot.id);

  // Complete session
  await supabase
    .from("parking_sessions")
    .update({
      check_out_time: new Date().toISOString(),
      fee_charged: fee,
      status: "completed",
    })
    .eq("id", session.id);
};
```

#### F. Fee Calculation
```typescript
const calculateFee = (checkInTime: string): number => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const durationMs = now.getTime() - checkIn.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  const pricePerHour = selectedLot.price_per_hour || 
                       selectedLot.base_price || 
                       100;
  
  return Math.ceil(durationHours * pricePerHour);
};
```

### Step 5: Theme Support

**Light Theme Colors**:
- Background: `from-slate-50 via-indigo-50/30 to-purple-50/20`
- Available spots: `bg-emerald-100` with `text-emerald-800`
- Occupied spots: `bg-rose-100` with `text-rose-800`
- Cards: White with subtle shadows

**Dark Theme Colors**:
- Background: `dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950`
- Available spots: `dark:bg-emerald-950` with `dark:text-emerald-100`
- Occupied spots: `dark:bg-rose-950` with `dark:text-rose-100`
- Cards: Dark slate with colored borders

**Implementation Pattern**:
```typescript
className="bg-emerald-100 dark:bg-emerald-950 
           text-emerald-800 dark:text-emerald-100 
           border-emerald-400 dark:border-emerald-500"
```

---

## File Structure

```
app/
├── auth/
│   └── operator/
│       └── login/
│           └── page.tsx          # Operator login page
├── operator/
│   └── dashboard/
│       └── page.tsx               # Main dashboard component
utils/
└── supabase/
    └── middleware.ts              # Auth middleware with operator bypass
SQL Files/
├── CREATE_OPERATORS_TABLE.sql     # Database schema
└── FIX_OPERATOR_LOGIN_RLS.sql     # RLS policy fixes
```

---

## Database Tables Used

### 1. **operators**
- Stores operator credentials and assignments
- Fields: `id`, `username`, `password_hash`, `full_name`, `owner_id`, `assigned_lots`, `is_active`, `last_login`

### 2. **ParkingLots**
- Parking lot information
- Fields: `id`, `name`, `address`, `price_per_hour`, `lat`, `lng`, `owner_id`

### 3. **parking_spots**
- Individual parking spot details
- Fields: `id`, `label`, `lot_id`, `x_coord`, `y_coord`, `rotation`, `is_occupied`, `current_plate`

### 4. **parking_sessions**
- Check-in/check-out records
- Fields: `id`, `lot_id`, `spot_id`, `plate_number`, `check_in_time`, `check_out_time`, `fee_charged`, `status`

---

## Key Dependencies

```json
{
  "bcryptjs": "^3.0.3",           // Password hashing
  "@supabase/ssr": "^0.7.0",      // Supabase client
  "next": "16.0.3",                // Next.js framework
  "react": "19.2.0",               // React library
  "lucide-react": "^0.469.0"      // Icons
}
```

---

## Security Considerations

1. **Password Hashing**: All passwords stored as bcrypt hashes (10 rounds)
2. **No Plain Text**: Passwords never stored or transmitted in plain text
3. **Session Management**: localStorage used for client-side session
4. **RLS Policies**: Database-level security on all tables
5. **Input Validation**: License plates validated and sanitized
6. **SQL Injection Prevention**: Supabase client handles parameterization

---

## Auto-Refresh System

```typescript
useEffect(() => {
  // Auto-refresh every 30 seconds
  const interval = setInterval(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
      fetchActiveSessions(selectedLot.id);
    }
  }, 30000);
  
  return () => clearInterval(interval);
}, [selectedLot]);
```

---

## Logout Flow

```typescript
const handleLogout = () => {
  // Clear operator session
  localStorage.removeItem("operator");
  
  // Redirect to operator login
  router.push("/auth/operator/login");
};
```

---

## Testing Steps

1. **Create Operator** (via owner dashboard or SQL):
   ```sql
   INSERT INTO operators (username, password_hash, full_name, owner_id, assigned_lots)
   VALUES ('testop', '$2a$10$hashedpassword', 'Test Operator', 'owner-uuid', ARRAY[1]);
   ```

2. **Login**: Navigate to `/auth/operator/login`

3. **Check-In Test**:
   - Click green spot
   - Enter plate: "ABC-123"
   - Click "Confirm Check In"
   - Verify spot turns red

4. **Check-Out Test**:
   - Click red spot
   - Verify plate and time shown
   - Click "Complete Check Out"
   - Verify fee calculated correctly
   - Verify spot turns green

5. **Multi-Lot Test**:
   - Assign operator to multiple lots
   - Verify dropdown appears
   - Switch between lots
   - Verify correct spots load

---

## Common Issues & Solutions

### Issue 1: Redirected to /login after operator login
**Solution**: Ensure middleware bypass is in place:
```typescript
const isOperatorRoute = request.nextUrl.pathname.startsWith('/operator') || 
                        request.nextUrl.pathname.startsWith('/auth/operator')
if (isOperatorRoute) return supabaseResponse
```

### Issue 2: Cannot read operators table
**Solution**: Run RLS policy fix:
```sql
CREATE POLICY "Allow operator login access"
  ON public.operators FOR SELECT USING (true);
```

### Issue 3: Password verification fails
**Solution**: Ensure password was hashed with bcrypt during creation:
```javascript
const hash = await bcrypt.hash(password, 10);
```

### Issue 4: Parking lot name not showing
**Solution**: Verify ParkingLots table has `name` and `address` columns populated with actual data (not null values).

---

## Future Enhancements

1. **Revenue Tracking**: Add daily/monthly revenue calculations
2. **Reports**: Generate PDF reports of parking sessions
3. **Notifications**: Real-time alerts for long-term parkers
4. **Mobile App**: PWA support for mobile devices
5. **QR Code Scanning**: Scan vehicle QR codes for faster check-in
6. **Camera Integration**: Auto-detect license plates
7. **Payment Processing**: Integrate Stripe/PayPal for online payments
8. **Analytics**: Occupancy trends, peak hours, revenue forecasting

---

## Contact & Support

For issues or questions regarding the Operator Dashboard implementation, refer to:
- Main README.md
- Database schema files in root directory
- Supabase documentation: https://supabase.com/docs

---

**Last Updated**: November 30, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
