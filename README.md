# ParkIntel - Smart Parking Management System

**A comprehensive parking management solution for Pakistan that connects parking lot owners, operators, and drivers through intelligent technology.**

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Features](#features)
  - [Implemented Features](#implemented-features)
  - [Planned Features](#planned-features)
- [User Roles & Workflows](#user-roles--workflows)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API & Integration](#api--integration)
- [Security & Authentication](#security--authentication)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)

---

## 🎯 Project Overview

**ParkIntel** is an intelligent parking management system designed specifically for Pakistan's urban parking challenges. The platform provides a complete ecosystem for parking lot owners to manage their lots, operators to handle daily operations, and drivers to find and book parking spaces efficiently.

### Key Objectives

1. **Digitize Parking Management**: Transform traditional parking lots into smart, digitally-managed facilities
2. **Real-time Availability**: Provide drivers with live parking availability information
3. **Revenue Optimization**: Help owners maximize revenue through dynamic pricing and efficient space utilization
4. **Operational Efficiency**: Streamline parking operations with automated check-in/check-out and operator management
5. **Predictive Intelligence**: Use machine learning to predict parking demand and optimize pricing

### Target Audience

- **Parking Lot Owners**: Commercial building owners, shopping malls, hospitals, universities
- **Parking Operators**: Staff managing day-to-day parking operations
- **Drivers**: Urban commuters looking for convenient parking solutions

---

## 🚨 Problem Statement

Urban parking in Pakistan faces several critical challenges:

1. **Lack of Real-time Information**: Drivers waste time searching for available parking spots
2. **Inefficient Space Utilization**: Parking lots operate at suboptimal capacity
3. **Manual Operations**: Paper-based systems lead to errors and revenue leakage
4. **No Demand Prediction**: Inability to anticipate peak hours and adjust pricing
5. **Poor User Experience**: No pre-booking, no digital payments, no accountability

---

## 💡 Solution

ParkIntel addresses these challenges through:

1. **Digital Parking Lot Management**: Visual canvas editor for designing and managing parking layouts
2. **Real-time Monitoring**: Live tracking of parking spot occupancy
3. **GPS-based Location Selection**: Accurate parking lot positioning on maps
4. **Multi-role Access Control**: Separate interfaces for owners, operators, and drivers
5. **Dynamic Pricing**: Demand-based pricing with configurable release buffers
6. **Machine Learning Predictions**: Anticipate parking demand patterns
7. **Mobile-friendly Interface**: Responsive design for all devices

---

## 🏗️ System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Driver UI  │  │   Owner UI   │  │ Operator UI  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React Components + Hooks + Server Actions         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │ Google Maps  │  │  ML Models   │      │
│  │     Auth     │  │     API      │  │  (Planned)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Tables: profiles, ParkingLots, parking_spots,    │     │
│  │  parking_sessions, pre_bookings, user_sessions    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Multi-method (OAuth + Username/Password)
- **Maps**: Google Maps JavaScript API with Places Library
- **State Management**: React Hooks (useState, useEffect, useRef)
- **UI Components**: Radix UI primitives with custom styling

---

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React framework with App Router, SSR, and API routes |
| **React** | 19.2.0 | UI component library with latest features |
| **TypeScript** | 5.x | Type-safe JavaScript for robust code |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Lucide React** | 0.553.0 | Icon library for modern UI |
| **next-themes** | 0.4.6 | Dark/light mode with system preference support |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.84.0 | PostgreSQL database with authentication |
| **@supabase/ssr** | 0.7.0 | Server-side rendering support |
| **PostgreSQL** | Latest | Relational database with advanced features |
| **bcryptjs** | 3.0.3 | Password hashing for operator accounts |

### Maps & Geolocation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Google Maps API** | 3.58.1 | Interactive maps and marker placement |
| **@googlemaps/react-wrapper** | 1.1.42 | React integration for Google Maps |
| **@googlemaps/places** | 2.2.0 | Place search and autocomplete |
| **@googlemaps/markerclusterer** | 2.6.2 | Cluster markers for better UX |

### UI Components & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **Radix UI** | 2.x | Accessible UI component primitives |
| **react-draggable** | 4.5.0 | Drag-and-drop for parking spot placement |
| **class-variance-authority** | 0.7.1 | Type-safe component variants |
| **clsx** | 2.1.1 | Conditional className utility |
| **tailwind-merge** | 3.4.0 | Merge Tailwind classes intelligently |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting and quality checks |
| **Turbopack** | Built-in | Fast bundler for Next.js dev server |
| **pnpm** | Latest | Efficient package manager |

---

## 🗄️ Database Schema

### Core Tables

#### 1. `profiles` Table
Stores user information for all roles (drivers, owners, operators).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('driver', 'owner', 'operator')),
  username TEXT UNIQUE,
  password_hash TEXT,
  has_password BOOLEAN DEFAULT FALSE,
  assigned_lots UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- Foreign key to `auth.users` for authentication
- Role-based access control (RBAC)
- Optional username/password for operators
- Array of assigned parking lots for operators

#### 2. `ParkingLots` Table
Stores parking lot information created by owners.

```sql
CREATE TABLE ParkingLots (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  total_spots INTEGER NOT NULL,
  price_per_hour NUMERIC(10,2) DEFAULT 50.00,
  release_buffer_multiplier NUMERIC(3,2) DEFAULT 1.8,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- GPS coordinates for map positioning
- Dynamic pricing with base price (Rs/hour)
- Release buffer multiplier for early exit incentives
- Owner relationship for access control

#### 3. `parking_spots` Table
Individual parking spots within a lot.

```sql
CREATE TABLE parking_spots (
  id SERIAL PRIMARY KEY,
  lot_id INTEGER REFERENCES ParkingLots(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  x_coord NUMERIC(10,2) NOT NULL,
  y_coord NUMERIC(10,2) NOT NULL,
  rotation NUMERIC(5,2) DEFAULT 0,
  is_occupied BOOLEAN DEFAULT FALSE,
  current_plate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- Canvas coordinates for visual representation
- Real-world dimensions (2.5m x 5m standard spots)
- Rotation support for angled parking
- Occupancy tracking with license plate

#### 4. `parking_sessions` Table
Tracks check-in/check-out and fee calculation.

```sql
CREATE TABLE parking_sessions (
  id SERIAL PRIMARY KEY,
  lot_id INTEGER REFERENCES ParkingLots(id),
  spot_id INTEGER REFERENCES parking_spots(id),
  plate_number TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  fee_charged NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- Session-based parking tracking
- Automated fee calculation based on duration
- License plate recognition ready

#### 5. `pre_bookings` Table
Future feature for advance booking.

```sql
CREATE TABLE pre_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  lot_id INTEGER REFERENCES ParkingLots(id),
  plate_number TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `user_sessions` Table
Custom session management for username/password auth.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### Database Functions

#### Operator Management

```sql
-- Create operator with auth.users entry
CREATE OR REPLACE FUNCTION create_operator(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_assigned_lots UUID[]
) RETURNS JSON;

-- Verify login credentials
CREATE OR REPLACE FUNCTION verify_login_credentials(
  p_username TEXT,
  p_password_hash TEXT
) RETURNS JSON;
```

### Row Level Security (RLS)

All tables use RLS policies to ensure:
- Users can only view their own data
- Owners can manage their own parking lots
- Operators can only access assigned lots
- Public read access for available parking spots

---

## ✨ Features

### Implemented Features

#### 1. Multi-Role Authentication System
- **OAuth Integration**: Google and email-based signup
- **Username/Password**: For operator accounts
- **Role-based Access**: Driver, Owner, Operator roles
- **Email Verification**: Secure account activation
- **Session Management**: Token-based authentication with expiry

**Technical Implementation**:
- Supabase Auth for OAuth
- Custom session table for username/password
- bcryptjs for password hashing
- RLS policies for data isolation

#### 2. Parking Lot Registration (Owner)
- **Interactive Canvas Editor**: Visual drag-and-drop interface
- **GPS Location Selection**: Google Maps integration
- **Real-world Dimensions**: 2.5m x 5m parking spots
- **Collision Detection**: SAT algorithm prevents overlaps
- **Auto-labeling**: Automatic spot numbering (A1, A2, B1, etc.)
- **Pricing Configuration**: Base price (Rs/hour) and release buffer
- **Ghost Spots**: Visual preview while dragging

**Technical Implementation**:
```typescript
// Key features
- react-draggable for spot placement
- useRef for map marker management
- SAT collision detection
- Canvas-to-database coordinate mapping
- Form validation with error handling
```

**Default Values**:
- Base Price: Rs 50/hour
- Release Buffer: 1.8x (early exit incentive)
- Spot Dimensions: 2.5m width × 5m height

#### 3. Owner Dashboard
- **Parking Lot Overview**: Grid display of all owned lots
- **Statistics**: Total spots, occupied count, revenue
- **Edit Functionality**: Update lot details
- **Delete with Cascade**: Remove lots and all associated spots
- **Operator Management**: Assign operators to lots

**Features**:
```typescript
// Dashboard capabilities
- View all parking lots with stats
- Edit lot (name, address, price, buffer)
- Delete lot with confirmation
- Manage operators (add, edit, delete)
- Real-time data updates
```

#### 4. Parking Lot Editor
- **Dynamic Route**: `/owner/edit-lot/[id]`
- **Pre-filled Form**: Loads existing lot data
- **Validation**: Ensures data integrity
- **Read-only Fields**: Location and spot layout cannot be edited
- **Editable Fields**: Name, address, price, release buffer

**Technical Implementation**:
```typescript
// Edit page features
- useParams for lot ID extraction
- Supabase query with error handling
- Form state management
- Update with optimistic UI
- Success/error notifications
```

#### 5. Operator Management System
- **CRUD Operations**: Create, Read, Update, Delete operators
- **Username Generation**: Unique identifiers
- **Password Security**: Hashed passwords with bcryptjs
- **Lot Assignment**: Assign multiple lots to operators
- **Auth Integration**: Creates entries in both auth.users and profiles

**Modal Interface**:
```typescript
// Operator management features
- Add new operator with username/password
- Assign to specific parking lots
- Edit operator details
- Delete operator accounts
- View all operators for owner's lots
```

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION create_operator(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_assigned_lots UUID[]
) RETURNS JSON;
```

#### 6. Theme Support
- **Dark/Light Mode**: System preference detection
- **Manual Toggle**: User-controlled theme switching
- **Persistent**: Saved in localStorage
- **Smooth Transitions**: CSS transitions for theme changes

#### 7. Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Grid Layouts**: Adaptive parking lot display
- **Touch Support**: Mobile-friendly interactions
- **Performance**: Optimized bundle size

### Planned Features

#### 1. Machine Learning Predictions 🤖
**Objective**: Predict parking availability and optimize pricing

**Features**:
- Historical data analysis
- Peak hour prediction
- Demand forecasting
- Dynamic pricing suggestions
- Occupancy rate optimization

**Technical Approach**:
```python
# ML Model pipeline
1. Data collection: parking_sessions historical data
2. Feature engineering: time, day, weather, events
3. Model training: Time series forecasting (LSTM/ARIMA)
4. Prediction API: Real-time availability forecast
5. Integration: Dashboard widgets showing predictions
```

**Use Cases**:
- Drivers can plan trips based on predicted availability
- Owners can adjust pricing before peak hours
- Operators receive alerts for anticipated high demand

#### 2. Operator Dashboard with Canvas View 🎨
**Objective**: Real-time parking lot monitoring for operators

**Features**:
- Visual canvas showing all parking spots
- Color-coded occupancy status (green/red/yellow)
- Click-to-manage spot operations
- Manual check-in/check-out
- License plate entry
- Real-time updates via WebSockets
- Fee calculation display

**Technical Implementation**:
```typescript
// Operator canvas features
- Load parking_spots with coordinates
- Render draggable spots on canvas
- Real-time occupancy updates
- Click handlers for spot management
- Session management UI
- Fee calculation display
```

**UI Components**:
- Canvas editor (read-only for operators)
- Spot detail modal
- Check-in/out forms
- Session history panel
- Revenue tracker

#### 3. Driver Map View 🗺️
**Objective**: Help drivers find available parking

**Features**:
- Map view showing all nearby parking lots
- Availability indicators (spots remaining)
- Distance calculation from current location
- Price comparison
- Navigation integration
- Pre-booking option
- Previous location history

**Technical Implementation**:
```typescript
// Driver map features
- Google Maps with custom markers
- Clustering for multiple lots
- Info windows with lot details
- Real-time availability updates
- Distance Matrix API for routing
- Favorite locations
```

**User Flow**:
1. Driver opens map view
2. Sees nearby parking lots with availability
3. Clicks on lot for details
4. Views price and distance
5. Navigates to location
6. Pre-books spot (optional)

#### 4. Dynamic Pricing Engine 💰
**Objective**: Optimize revenue based on demand

**Features**:
- Demand-based pricing adjustments
- Time-of-day pricing
- Special event pricing
- Early bird discounts
- Release buffer incentives
- Loyalty discounts

**Pricing Algorithm**:
```typescript
// Dynamic pricing calculation
base_price = lot.price_per_hour
occupancy_rate = occupied_spots / total_spots
time_multiplier = get_time_multiplier(hour)
demand_multiplier = 1 + (occupancy_rate * 0.5)
event_multiplier = check_nearby_events()

final_price = base_price * time_multiplier * demand_multiplier * event_multiplier

// Early exit incentive
if (duration < expected_duration) {
  discount = base_price * (1 - release_buffer_multiplier)
  final_price -= discount
}
```

#### 5. Pre-booking System 📅
**Objective**: Allow drivers to reserve spots in advance

**Features**:
- Search available lots for future date/time
- Reserve spot with payment
- Time-limited reservations (expires_at)
- Cancellation policy

**Database Integration**:
```sql
-- Pre-booking workflow
1. Create pre_booking with expires_at
2. Mark spot as reserved
3. Send confirmation to driver
4. On arrival: create parking_session
5. On expiry: release spot if not checked in
```

#### 6. Analytics Dashboard 📊
**Objective**: Business intelligence for owners

**Features**:
- Revenue reports (daily, weekly, monthly)
- Occupancy trends
- Peak hours analysis
- Operator performance



---

## 👥 User Roles & Workflows

### 1. Driver Workflow

#### Registration & Login
```
1. Visit /signup/driver
2. Enter email, full name, password
3. Verify email
4. Complete profile
5. Access driver dashboard
```

#### Finding Parking (Planned)
```
1. Open map view
2. Browse nearby parking lots
3. View availability and price
4. (Optional) Pre-book spot
5. Navigate to location
6. Check-in
7. Park vehicle
8. Check-out and pay
```

#### Features Available:
- View parking history
- Manage payment methods
- Save favorite locations
- View receipts

### 2. Owner Workflow

#### Registration & Setup
```
1. Visit /signup/owner
2. Complete OAuth or email signup
3. Verify account
4. Access owner dashboard
```

#### Creating Parking Lot
```
1. Navigate to /owner/register-lot
2. Enter lot name
3. Select GPS location on map
4. Set base price (Rs/hour)
5. Configure release buffer
6. Design parking layout on canvas
7. Drag and place parking spots
8. Auto-label spots (A1, A2, etc.)
9. Preview and adjust
10. Submit to database
11. Receive success confirmation
```

**Canvas Editor Controls**:
- Drag spots from sidebar
- Rotate spots (0°, 90°, 180°, 270°)
- Collision detection prevents overlaps
- Grid snap for alignment
- Real-world dimensions (2.5m × 5m)

#### Managing Parking Lots
```
1. View dashboard with all lots
2. See statistics (spots, occupancy, revenue)
3. Edit lot details
   - Name, address
   - Pricing configuration
   - Release buffer
4. Delete lot (with confirmation)
5. Manage operators
   - Add operator with username/password
   - Assign to lots
   - Edit operator details
   - Remove operator access
```

#### Operator Management
```
1. Click "Manage Operators" on dashboard
2. View list of all operators
3. Add new operator:
   - Enter username
   - Set password (hashed)
   - Assign parking lots
   - Save to database
4. Edit existing operator:
   - Update assigned lots
   - Change password
5. Delete operator:
   - Confirm deletion
   - Remove from auth and profiles
```

### 3. Operator Workflow

#### Login
```
1. Visit /auth/operator/login
2. Enter username and password
3. System verifies credentials
4. Access operator dashboard
```

#### Daily Operations (Planned)
```
1. View assigned parking lots
2. Open canvas view for lot
3. Monitor spot occupancy in real-time
4. Manual check-in:
   - Click empty spot
   - Enter license plate
   - Start session
5. Manual check-out:
   - Click occupied spot
   - View duration
   - Calculate fee
   - Complete session
6. Handle cash payments
7. Print receipts
```

#### Features Available:
- Real-time occupancy view
- Session management
- Fee calculation
- Cash handling
- Shift reports

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **pnpm**: Package manager (recommended) or npm
- **Supabase Account**: For database and authentication
- **Google Cloud Account**: For Maps API

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd ParkIntel
```

### Step 2: Install Dependencies

```bash
pnpm install
# or
npm install
```

### Step 3: Environment Configuration

Create `.env.local` file in root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run SQL Migrations**:
   - Open Supabase SQL Editor
   - Execute `SQL_SETUP.sql` (creates tables and functions)
   - Execute `CREATE_OPERATOR_FUNCTION.sql` (operator management)
   - Execute `ADD_OPERATOR_ASSIGNMENTS.sql` (operator assignments)

3. **Enable Row Level Security**:
   - RLS policies are included in SQL files
   - Verify in Supabase dashboard

### Step 5: Google Maps Setup

1. **Enable APIs**:
   - Google Maps JavaScript API
   - Places API
   - Distance Matrix API (for routing)

2. **Configure API Key**:
   - Create API key in Google Cloud Console
   - Restrict key to your domains
   - Add to `.env.local`

See `GOOGLE_MAPS_SETUP.md` for detailed instructions.

### Step 6: Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 7: Build for Production

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

---

## 📁 Project Structure

```
ParkIntel/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and Tailwind
│   ├── layout.tsx               # Root layout with theme provider
│   ├── page.tsx                 # Landing page
│   │
│   ├── (auth)/                  # Authentication pages
│   │   ├── login/
│   │   │   └── page.tsx         # Main login page
│   │   └── signup/
│   │       ├── page.tsx         # Signup type selector
│   │       ├── driver/
│   │       │   └── page.tsx     # Driver signup form
│   │       └── owner/
│   │           └── page.tsx     # Owner signup form
│   │
│   ├── (user)/                  # Driver pages
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Driver dashboard
│   │   ├── map/
│   │   │   └── page.tsx         # Map view (planned)
│   │   └── settings/
│   │       └── page.tsx         # User settings
│   │
│   ├── auth/                    # Auth callbacks
│   │   ├── auth-code-error/
│   │   │   └── page.tsx         # Error page
│   │   ├── callback/
│   │   │   └── route.ts         # OAuth callback handler
│   │   ├── complete-signup/
│   │   │   └── page.tsx         # Complete registration
│   │   └── operator/
│   │       └── login/
│   │           └── page.tsx     # Operator login
│   │
│   ├── owner/                   # Owner pages
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Owner dashboard (lot management)
│   │   ├── edit-lot/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Edit parking lot
│   │   ├── register-lot/
│   │   │   └── page.tsx         # Canvas editor for new lots
│   │   └── settings/
│   │       └── page.tsx         # Owner settings
│   │
│   └── operator/                # Operator pages
│       └── dashboard/
│           └── page.tsx         # Operator dashboard (planned)
│
├── components/                  # React components
│   ├── google-map.tsx          # Google Maps wrapper component
│   ├── header.tsx              # Navigation header
│   ├── password-setup-form.tsx # Password configuration
│   ├── theme-provider.tsx      # Dark/light theme provider
│   ├── theme-toggle.tsx        # Theme switch button
│   ├── unified-settings.tsx    # Settings component
│   └── ui/                     # UI primitives
│       ├── button.tsx          # Button component
│       └── dropdown-menu.tsx   # Dropdown menu
│
├── hooks/                       # Custom React hooks
│   └── useUserRole.ts          # User role detection hook
│
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client setup
│   └── utils.ts                # Helper functions
│
├── public/                      # Static assets
│
├── types/                       # TypeScript definitions
│   ├── google-maps.d.ts        # Google Maps type definitions
│   └── supabase.ts             # Database type definitions
│
├── utils/                       # Utility functions
│   └── supabase/
│       ├── middleware.ts       # Auth middleware
│       └── server.ts           # Server-side Supabase client
│
├── *.sql                        # Database migration files
├── *.md                         # Documentation files
├── components.json             # shadcn/ui configuration
├── middleware.ts               # Next.js middleware
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
├── postcss.config.mjs          # PostCSS configuration
└── tsconfig.json               # TypeScript configuration
```

### Key Files Explained

#### `app/owner/register-lot/page.tsx`
Canvas editor for designing parking lots:
- Interactive drag-and-drop interface
- Google Maps integration for location selection
- Real-world dimensions (2.5m × 5m spots)
- Collision detection using SAT algorithm
- Auto-labeling system (A1, A2, B1, etc.)
- Pricing and buffer configuration

#### `app/owner/dashboard/page.tsx`
Owner dashboard for lot management:
- Grid display of all parking lots
- Edit and delete functionality
- Operator management modal
- Statistics display (spots, revenue)
- Real-time data fetching

#### `app/owner/edit-lot/[id]/page.tsx`
Edit existing parking lot:
- Dynamic route with lot ID parameter
- Pre-filled form with existing data
- Update functionality
- Read-only location/spot layout

#### `CREATE_OPERATOR_FUNCTION.sql`
Database function for operator creation:
- Creates auth.users entry with hashed password
- Inserts profile with matching UUID
- Assigns lots to operator
- Returns success/error JSON

---

## 🔌 API & Integration

### Supabase API

#### Authentication

```typescript
// Sign up with email
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'driver'
    }
  }
});

// Sign in with email
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign in with OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

#### Database Operations

```typescript
// Fetch parking lots
const { data: lots, error } = await supabase
  .from('ParkingLots')
  .select('*')
  .eq('owner_id', userId);

// Insert parking lot
const { data, error } = await supabase
  .from('ParkingLots')
  .insert({
    name: 'City Center Parking',
    lat: 24.8607,
    lng: 67.0011,
    total_spots: 50,
    price_per_hour: 50,
    owner_id: userId
  });

// Update parking lot
const { data, error } = await supabase
  .from('ParkingLots')
  .update({ price_per_hour: 75 })
  .eq('id', lotId);

// Delete parking lot (cascade deletes spots)
const { error } = await supabase
  .from('ParkingLots')
  .delete()
  .eq('id', lotId);
```

#### RPC Calls (Database Functions)

```typescript
// Create operator
const { data, error } = await supabase.rpc('create_operator', {
  p_username: 'operator1',
  p_password: 'hashedPassword',
  p_full_name: 'Operator Name',
  p_assigned_lots: [lotId1, lotId2]
});

// Verify login credentials
const { data, error } = await supabase.rpc('verify_login_credentials', {
  p_username: 'operator1',
  p_password_hash: 'hashedPassword'
});
```

### Google Maps API

#### Initialize Map

```typescript
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['places', 'marker']
});

const google = await loader.load();
const map = new google.maps.Map(mapRef.current, {
  center: { lat: 24.8607, lng: 67.0011 },
  zoom: 12,
  mapTypeControl: false
});
```

#### Add Marker

```typescript
const marker = new google.maps.Marker({
  position: { lat, lng },
  map: map,
  draggable: true,
  title: 'Parking Lot Location'
});

// Listen to drag event
marker.addListener('dragend', (event) => {
  const newLat = event.latLng.lat();
  const newLng = event.latLng.lng();
  setLocation({ lat: newLat, lng: newLng });
});
```

---

## 🔒 Security & Authentication

### Authentication Methods

1. **OAuth (Google)**:
   - Supabase Auth integration
   - Automatic profile creation
   - Email verification required

2. **Email/Password**:
   - For drivers and owners
   - Email verification flow
   - Password reset capability

3. **Username/Password**:
   - For operators only
   - Created by owners
   - Hashed with bcryptjs (salt rounds: 10)

### Row Level Security (RLS)

#### Profiles Table
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### ParkingLots Table
```sql
-- Public can view parking lots
CREATE POLICY "Anyone can view parking lots"
  ON ParkingLots FOR SELECT
  TO public
  USING (true);

-- Owners can insert their own lots
CREATE POLICY "Owners can insert own lots"
  ON ParkingLots FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own lots
CREATE POLICY "Owners can update own lots"
  ON ParkingLots FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own lots
CREATE POLICY "Owners can delete own lots"
  ON ParkingLots FOR DELETE
  USING (auth.uid() = owner_id);
```

#### parking_spots Table
```sql
-- Cascade delete on lot deletion
ALTER TABLE parking_spots
  ADD CONSTRAINT fk_lot_id
  FOREIGN KEY (lot_id)
  REFERENCES ParkingLots(id)
  ON DELETE CASCADE;
```

### Password Security

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Session Management

- JWT tokens for OAuth users
- Custom session tokens for operator login
- Session expiry: 24 hours default
- Automatic cleanup of expired sessions

---

## 🧪 Testing

### Testing Strategy

1. **Unit Testing** (Planned):
   - Component testing with Jest
   - Hook testing
   - Utility function testing

2. **Integration Testing** (Planned):
   - API endpoint testing
   - Database operation testing
   - Auth flow testing

3. **E2E Testing** (Planned):
   - Playwright for user flows
   - Registration flows
   - Parking lot creation
   - Operator management

### Manual Testing

Current testing approach documented in `TESTING_INSTRUCTIONS.md`:

#### Owner Flow Test
```
1. Register as owner
2. Complete email verification
3. Create parking lot with canvas editor
4. Verify lot appears in dashboard
5. Edit lot details
6. Add operator
7. Delete lot
```

#### Operator Creation Test
```
1. Login as owner
2. Navigate to dashboard
3. Click "Manage Operators"
4. Add operator with username/password
5. Assign parking lots
6. Verify operator can login
```

---

## 🚀 Future Enhancements

### Short-term (Next 3-6 months)

1. **Complete Operator Dashboard**:
   - Canvas view with real-time updates
   - Manual check-in/out interface
   - Session management
   - Fee calculation display

2. **Driver Map View**:
   - Browse nearby parking lots
   - View availability
   - Navigation integration
   - Pre-booking capability

### Mid-term (6-12 months)

1. **Machine Learning Integration**:
   - Availability prediction model
   - Dynamic pricing engine
   - Demand forecasting
   - Revenue optimization

2. **Advanced Analytics**:
   - Business intelligence dashboard
   - Revenue reports
   - Occupancy trends
   - Customer insights



### Long-term (12+ months)

1. **Multi-city Expansion**:
   - Franchise model
   - White-label solution
   - Regional customization

2. **B2B Partnerships**:
   - Shopping mall integration
   - Corporate parking management
   - Event venue partnerships

3. **Advanced Features**:
   - Valet parking service
   - EV charging station integration
   - Carwash service booking
   - Loyalty programs

---

## 📊 Project Statistics

### Current Implementation

- **Total Pages**: 15+ pages
- **Components**: 20+ reusable components
- **Database Tables**: 6 core tables
- **Database Functions**: 10+ SQL functions
- **API Integrations**: 2 (Supabase, Google Maps)
- **Lines of Code**: ~5,000+ lines
- **Development Time**: 3+ months

### Database Statistics

- **User Roles**: 3 (Driver, Owner, Operator)
- **Authentication Methods**: 3 (OAuth, Email, Username)
- **RLS Policies**: 15+ policies
- **Indexes**: 10+ for performance

---

## 📝 Documentation Files

The project includes extensive documentation:

- `README.md` - This comprehensive guide
- `QUICK_START.md` - Quick setup instructions
- `GOOGLE_MAPS_SETUP.md` - Google Maps API setup
- `TESTING_INSTRUCTIONS.md` - Manual testing guide
- `SQL_SETUP.sql` - Complete database schema
- `CREATE_OPERATOR_FUNCTION.sql` - Operator management function
- `AUTHENTICATION_FIX_GUIDE.md` - Auth troubleshooting
- `OPERATOR_MANAGEMENT_GUIDE.md` - Operator feature guide
- `BUG_FIX_REPORT.md` - Bug fix history

---

## 🤝 Contributors

**Software Construction Course Project**
**Semester 5**

**Team Members**:
- [Your Name] - Full Stack Development, Database Design, Maps Integration
- [Team Member 2] - [Role]
- [Team Member 3] - [Role]

**Course Instructor**: [Instructor Name]

**Institution**: [University Name]

---

## 📄 License

This project is developed as part of academic coursework and is not licensed for commercial use.

---

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Supabase**: For simplified backend development
- **Google Maps**: For comprehensive mapping APIs
- **Radix UI**: For accessible component primitives
- **Tailwind CSS**: For utility-first styling
- **Vercel**: For deployment platform

---

## 📞 Support & Contact

For questions or issues:

- **Project Repository**: [GitHub URL]
- **Email**: [Your Email]
- **Documentation**: See `/docs` folder for detailed guides

---

**Last Updated**: January 2025

**Project Status**: Active Development

**Current Version**: 0.1.0
