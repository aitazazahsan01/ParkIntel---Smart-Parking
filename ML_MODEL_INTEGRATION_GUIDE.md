# 🤖 ML Model Integration Guide - ParkIntel

## 📋 Overview

ParkIntel uses a **hybrid availability system**:
- **Real-Time Data**: Shows actual available spots (e.g., "7/8") when parking lot provides live data
- **ML Predictions**: Shows predicted availability (e.g., "73%") when real-time data is unavailable

This guide explains how to integrate your trained ML model to predict parking availability based on historical patterns.

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ParkIntel Frontend                        │
│  (Next.js + React - components/google-map.tsx)              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ├─→ Check if real-time data available?
                 │
         ┌───────┴───────┐
         │ YES           │ NO
         │               │
         ▼               ▼
   ┏━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━┓
   ┃ Real-Time ┃   ┃ ML Prediction  ┃
   ┃   Data    ┃   ┃  API Call      ┃
   ┗━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━┛
         │               │
         │               ├─→ POST /api/ml/predict-availability
         │               │
         │               ▼
         │         ┏━━━━━━━━━━━━━━━┓
         │         ┃  ML Model API  ┃
         │         ┃  (Python Flask ┃
         │         ┃   or FastAPI)  ┃
         │         ┗━━━━━━━━━━━━━━━┛
         │               │
         │               ├─→ Load trained model
         │               ├─→ Fetch historical data
         │               ├─→ Make prediction
         │               │
         │               ▼
         └───────────────┴─→ Display on Map
```

---

## 🔧 Current Implementation

### File: `components/google-map.tsx`

#### 1. **Data Source Detection** (Lines ~250-290)

```typescript
const predictions = useMemo<LotPrediction[]>(() => {
  return parkingLots.map((lot) => {
    // Check if we have real-time data
    const hasRealTimeData = lot.total_spots !== undefined && 
                            lot.available_spots !== undefined && 
                            lot.occupied_spots !== undefined;
    
    if (hasRealTimeData) {
      // Use real-time availability data
      const probability = lot.available_spots / lot.total_spots;
      return {
        lotId: lot.id,
        probability,
        confidenceLabel: "Real-Time",
        source: 'real-time',
        // ...
      };
    } else {
      // TODO: Call ML API here
      // Currently using placeholder simulation
      // REPLACE THIS WITH: await fetchMLPrediction(lot)
    }
  });
}, [parkingLots, mlSimulationTick]);
```

#### 2. **ML API Integration Point** (Lines ~40-120)

```typescript
/**
 * TODO: Replace this function with actual ML model API call
 */
async function fetchMLPrediction(lot: ParkingLot): Promise<LotPrediction> {
  // TODO: Uncomment and configure when ML API is ready
  // const response = await fetch('/api/ml/predict-availability', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     lot_id: lot.id,
  //     timestamp: new Date().toISOString(),
  //     day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  //     hour: new Date().getHours(),
  //     historical_data: { /* ... */ }
  //   })
  // });
  // const mlData = await response.json();
  // return { /* parsed ML response */ };
  
  // TEMPORARY: Placeholder simulation (REMOVE WHEN MODEL IS READY)
  return {
    lotId: lot.id,
    probability: 0.73, // Fake prediction
    source: 'ml-prediction',
    modelVersion: 'placeholder-v0.1'
  };
}
```

#### 3. **UI Display Logic** (Lines ~800-840)

```typescript
{predictionLookup.get(selectedLot.id)?.source === 'real-time' ? (
  // Real-time data: Show "7/8" format
  <>{selectedLot.available_spots}/{selectedLot.total_spots}</>
) : (
  // ML prediction: Show "73%" format
  <>{(prediction.probability * 100).toFixed(0)}%</>
)}

{/* Data source badge */}
<div className={prediction.source === 'real-time' ? 'LIVE' : 'AI'}>
  {/* Green pulsing dot for LIVE, Purple for AI */}
</div>
```

---

## 🚀 Step-by-Step ML Integration

### **Phase 1: Data Collection & Model Training**

#### 1.1 Collect Historical Data

Query your Supabase database to gather training data:

```sql
-- Collect hourly occupancy patterns
SELECT 
  ps.lot_id,
  DATE_TRUNC('hour', ps.check_in_time) as hour_timestamp,
  EXTRACT(DOW FROM ps.check_in_time) as day_of_week,
  EXTRACT(HOUR FROM ps.check_in_time) as hour_of_day,
  COUNT(*) as occupied_spots,
  pl.total_spots,
  (COUNT(*)::float / pl.total_spots) as occupancy_rate
FROM parking_sessions ps
JOIN "ParkingLots" pl ON ps.lot_id = pl.id
WHERE ps.status = 'active' OR ps.status = 'completed'
GROUP BY ps.lot_id, hour_timestamp, pl.total_spots
ORDER BY hour_timestamp DESC;

-- Export this data as CSV for training
```

#### 1.2 Feature Engineering

Create features for your ML model:

```python
import pandas as pd
import numpy as np

def engineer_features(df):
    """
    Add features for ML model training
    """
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
    df['is_lunch_hour'] = df['hour'].isin([12, 13, 14]).astype(int)
    
    # Cyclical encoding for time features
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # Lag features (previous hour, previous day same hour)
    df['occupancy_lag_1h'] = df.groupby('lot_id')['occupancy_rate'].shift(1)
    df['occupancy_lag_24h'] = df.groupby('lot_id')['occupancy_rate'].shift(24)
    
    # Rolling statistics
    df['occupancy_rolling_mean_3h'] = df.groupby('lot_id')['occupancy_rate'].rolling(3).mean().reset_index(0, drop=True)
    
    return df

# Load your data
df = pd.read_csv('parking_historical_data.csv')
df = engineer_features(df)
```

#### 1.3 Train ML Model

Example using Random Forest or XGBoost:

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Features for training
features = [
    'hour_sin', 'hour_cos', 'day_sin', 'day_cos',
    'is_weekend', 'is_rush_hour', 'is_lunch_hour',
    'month', 'lot_capacity', 'occupancy_lag_1h', 
    'occupancy_lag_24h', 'occupancy_rolling_mean_3h'
]

X = df[features]
y = df['occupancy_rate']  # Target: 0-1 (percentage occupied)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=10,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(f"MAE: {mean_absolute_error(y_test, y_pred):.4f}")
print(f"R²: {r2_score(y_test, y_pred):.4f}")

# Save model
joblib.dump(model, 'parking_availability_model.pkl')
print("Model saved!")
```

---

### **Phase 2: Create ML API Backend**

#### 2.1 Flask API (Python)

Create `ml_api/app.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Load trained model
model = joblib.load('parking_availability_model.pkl')

def prepare_features(lot_id, timestamp, historical_data):
    """
    Prepare features for prediction
    """
    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    
    features = {
        'hour_sin': np.sin(2 * np.pi * dt.hour / 24),
        'hour_cos': np.cos(2 * np.pi * dt.hour / 24),
        'day_sin': np.sin(2 * np.pi * dt.weekday() / 7),
        'day_cos': np.cos(2 * np.pi * dt.weekday() / 7),
        'is_weekend': 1 if dt.weekday() >= 5 else 0,
        'is_rush_hour': 1 if dt.hour in [7, 8, 9, 17, 18, 19] else 0,
        'is_lunch_hour': 1 if dt.hour in [12, 13, 14] else 0,
        'month': dt.month,
        'lot_capacity': historical_data.get('lot_capacity', 100),
        'occupancy_lag_1h': historical_data.get('occupancy_lag_1h', 0.5),
        'occupancy_lag_24h': historical_data.get('occupancy_lag_24h', 0.5),
        'occupancy_rolling_mean_3h': historical_data.get('occupancy_rolling_mean_3h', 0.5),
    }
    
    return pd.DataFrame([features])

@app.route('/api/ml/predict-availability', methods=['POST'])
def predict_availability():
    """
    Predict parking lot availability
    """
    try:
        data = request.json
        lot_id = data['lot_id']
        timestamp = data['timestamp']
        historical_data = data.get('historical_data', {})
        
        # Prepare features
        X = prepare_features(lot_id, timestamp, historical_data)
        
        # Make prediction
        occupancy_prediction = model.predict(X)[0]
        availability_prediction = 1 - occupancy_prediction  # Convert to availability
        
        # Calculate confidence (based on prediction variance)
        confidence = 0.85  # TODO: Calculate based on model uncertainty
        confidence_label = 'High' if confidence > 0.8 else 'Medium' if confidence > 0.6 else 'Low'
        
        # Response
        response = {
            'lot_id': lot_id,
            'predicted_availability': float(availability_prediction),
            'predicted_occupancy': float(occupancy_prediction),
            'confidence': float(confidence),
            'confidence_label': confidence_label,
            'factors': {
                'time_influence': 0.3,  # TODO: Use SHAP values
                'event_influence': 0.1,
                'historical_pattern': 0.5,
                'weather_influence': 0.1,
            },
            'model_version': 'v1.0',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

#### 2.2 Install Dependencies

```bash
# ml_api/requirements.txt
flask==3.0.0
flask-cors==4.0.0
scikit-learn==1.3.2
joblib==1.3.2
pandas==2.1.4
numpy==1.26.2
```

```bash
cd ml_api
pip install -r requirements.txt
python app.py
```

---

### **Phase 3: Connect Frontend to ML API**

#### 3.1 Update `components/google-map.tsx`

Replace the placeholder function:

```typescript
// BEFORE (Current placeholder)
async function fetchMLPrediction(lot: ParkingLot): Promise<LotPrediction> {
  // TODO: Replace with actual API call
  return {
    probability: 0.73,
    source: 'ml-prediction',
    modelVersion: 'placeholder-v0.1'
  };
}

// AFTER (Actual ML API integration)
async function fetchMLPrediction(lot: ParkingLot): Promise<LotPrediction> {
  try {
    // Fetch historical data from Supabase
    const { data: historicalData } = await supabase
      .from('parking_sessions')
      .select('*')
      .eq('lot_id', lot.id)
      .order('check_in_time', { ascending: false })
      .limit(50);
    
    // Calculate lag features
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Call ML API
    const response = await fetch('http://localhost:5000/api/ml/predict-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lot_id: lot.id,
        timestamp: now.toISOString(),
        day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: now.getHours(),
        historical_data: {
          lot_capacity: lot.capacity,
          occupancy_lag_1h: calculateOccupancyAt(historicalData, oneHourAgo),
          occupancy_lag_24h: calculateOccupancyAt(historicalData, oneDayAgo),
          occupancy_rolling_mean_3h: calculateRollingMean(historicalData, 3),
        }
      })
    });
    
    if (!response.ok) throw new Error('ML API error');
    
    const mlData = await response.json();
    
    return {
      lotId: lot.id,
      probability: mlData.predicted_availability,
      confidenceLabel: mlData.confidence_label,
      dynamicPrice: calculateDynamicPrice(lot.base_price, mlData.predicted_availability),
      source: 'ml-prediction',
      lastUpdated: new Date(mlData.timestamp),
      modelVersion: mlData.model_version
    };
    
  } catch (error) {
    console.error('ML prediction failed, using fallback:', error);
    // Fallback to placeholder if API fails
    return {
      lotId: lot.id,
      probability: 0.5,
      confidenceLabel: 'Low',
      dynamicPrice: lot.base_price,
      source: 'ml-prediction',
      modelVersion: 'fallback'
    };
  }
}

// Helper function
function calculateOccupancyAt(sessions: any[], targetTime: Date): number {
  // Calculate occupancy rate at specific time
  const activeSessions = sessions.filter(s => 
    new Date(s.check_in_time) <= targetTime &&
    (!s.check_out_time || new Date(s.check_out_time) >= targetTime)
  );
  return activeSessions.length / 100; // Normalize
}
```

#### 3.2 Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_ML_API_URL=http://localhost:5000
# Production: https://your-ml-api.com
```

Update API call:

```typescript
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:5000';
const response = await fetch(`${ML_API_URL}/api/ml/predict-availability`, { /* ... */ });
```

---

## 📊 Visual Indicators

The UI automatically adapts based on data source:

### **Real-Time Data** (When available)
```
┌─────────────────────┐
│ Available      LIVE │ ← Green pulsing badge
│                     │
│      7/8            │ ← Actual spots
│                     │
└─────────────────────┘
```

### **ML Prediction** (When no real-time data)
```
┌─────────────────────┐
│ ML Prediction   AI  │ ← Purple badge
│                     │
│      73%            │ ← Predicted probability
│                     │
└─────────────────────┘
```

---

## 🧪 Testing

### Test Real-Time vs ML Logic

```typescript
// Test Case 1: Lot WITH real-time data
const lotWithRealTime = {
  id: 1,
  name: "City Center",
  total_spots: 8,
  available_spots: 7,
  occupied_spots: 1,
  // ... other fields
};
// Expected: Shows "7/8" with "LIVE" badge

// Test Case 2: Lot WITHOUT real-time data
const lotWithoutRealTime = {
  id: 2,
  name: "Mall Parking",
  capacity: 50,
  base_price: 100,
  // No total_spots, available_spots, occupied_spots
};
// Expected: Shows "73%" with "AI" badge and calls ML API
```

---

## 📈 Model Improvement Tips

1. **Feature Additions**:
   - Weather data (sunny, rainy)
   - Nearby events (concerts, sports)
   - Public holidays
   - Traffic conditions

2. **Advanced Models**:
   - LSTM/GRU for time-series
   - Ensemble methods (XGBoost + LightGBM)
   - Deep learning with attention

3. **Monitoring**:
   - Track prediction accuracy
   - Log mismatches between prediction and actual
   - Retrain monthly with new data

4. **A/B Testing**:
   - Compare ML predictions vs baseline
   - Measure user trust (conversion rate)

---

## 🚀 Deployment Checklist

- [ ] Train ML model on historical data (minimum 3 months)
- [ ] Create Flask/FastAPI backend with `/predict-availability` endpoint
- [ ] Deploy ML API (AWS EC2, Google Cloud Run, Heroku)
- [ ] Update `NEXT_PUBLIC_ML_API_URL` with production URL
- [ ] Replace `fetchMLPrediction` placeholder with actual API call
- [ ] Add error handling and fallback logic
- [ ] Monitor API latency (<200ms target)
- [ ] Set up model versioning and A/B testing
- [ ] Create dashboard to track prediction accuracy
- [ ] Implement automatic model retraining pipeline

---

## 📞 Support

For ML model integration help:
- Review `components/google-map.tsx` lines 40-290
- Check API documentation in this file
- Test with mock data first before production

**Current Status**: ✅ Hybrid system ready, ML API integration placeholder in place

