# Operator Management Setup Guide

## ⚠️ Important: Run SQL Migration First

Before using the operator management feature, you MUST run the SQL migration in Supabase.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
Copy and paste the entire contents of `ADD_OPERATOR_ASSIGNMENTS.sql` and click **RUN**.

This will:
- Add `assigned_lots` column to profiles table
- Create index for faster queries
- Create `create_operator()` function for adding new operators

### Step 3: Verify the Setup
The migration includes verification queries. You should see:
- ✅ Column `assigned_lots` created successfully
- ✅ Function `create_operator` created

---

## 🎯 Feature Overview

### What You Can Do:
1. **Add Operators** - Create operator accounts with username/password
2. **Edit Operators** - Update operator details
3. **View Credentials** - See operator username/password
4. **Delete Operators** - Remove operator access
5. **Multiple Assignments** - Assign multiple operators to one parking lot

### How It Works:
1. Click "Manage Operators" button on any parking lot card
2. Modal opens showing operator management interface
3. Fill in the form and click "Add Operator"
4. Operators are stored with credentials in the profiles table

---

## 📋 Operator Management UI

### Add New Operator Form:
```
Full Name: [text input]          - Optional
Username: [text input] *          - Required, unique
Password: [password input] *      - Required
[Add Operator Button]
```

### Operator List:
Each operator shows:
- Full name
- @username
- Email (auto-generated)
- Action buttons: View 👁️ | Edit ✏️ | Delete 🗑️

---

## 🔐 Security Notes

**Current Implementation:**
- Passwords are stored as plain text in `password_hash` column
- In production, these should be properly hashed using bcrypt or similar

**Recommended for Production:**
```typescript
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## 🗄️ Database Schema

### profiles table additions:
```sql
assigned_lots integer[]  -- Array of parking lot IDs
```

### Function: create_operator()
```sql
Parameters:
  - p_username TEXT
  - p_full_name TEXT  
  - p_password TEXT
  - p_lot_id INTEGER

Returns: JSON with success status
```

---

## 🚀 Usage Examples

### Add Operator:
1. Click "Manage Operators" on parking lot card
2. Fill form:
   - Full Name: "Hassan Ali"
   - Username: "Hasnain"
   - Password: "secure123"
3. Click "Add Operator"
4. Operator created with ID and assigned to current lot

### Edit Operator:
1. Click Edit button on operator card
2. Form fills with current data
3. Update fields
4. Click "Update Operator"

### View Credentials:
1. Click Eye icon
2. Alert shows username and password

### Delete Operator:
1. Click Delete button
2. Confirm deletion
3. Operator removed from system

---

## 🔧 Troubleshooting

### Error: "null value in column 'id' violates not-null constraint"
**Solution:** Run the SQL migration first. The `create_operator()` function generates proper UUIDs.

### Error: "column 'assigned_lots' does not exist"
**Solution:** Run the SQL migration to add the column.

### Error: "Username already exists"
**Solution:** Choose a different username. Each operator needs a unique username.

### Operators not showing up
**Solution:** Check that:
1. Migration ran successfully
2. Operator role is set to "operator"
3. assigned_lots array includes the lot ID

---

## 📊 Data Flow

```
Owner Dashboard
    ↓
Click "Manage Operators"
    ↓
Modal Opens
    ↓
Fill Form + Click "Add"
    ↓
call create_operator() RPC
    ↓
Generate UUID → Insert to profiles table
    ↓
Set role='operator', assigned_lots=[lot_id]
    ↓
Success! Operator can now login
```

---

## 🎨 UI Components

### Modal Structure:
- **Header**: Title + Close button
- **Add/Edit Form**: Input fields + Submit button
- **Operators List**: Cards with action buttons
- **Empty State**: Icon + message when no operators

### Button Colors:
- Add/Update: Purple (`bg-purple-600`)
- Edit: Slate/Purple hover
- View: Slate/Indigo hover  
- Delete: Red (`text-red-600`)

---

## 📱 Mobile Responsive

The modal is fully responsive:
- Max width: 3xl (48rem)
- Max height: 90vh with scroll
- Padding adjusts on mobile
- Buttons stack on small screens

---

*Created: November 29, 2025*
