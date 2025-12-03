/// <reference types="google.maps" />
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { MapPin, Navigation2, ShieldCheck, X, Search, Car, Clock, Banknote, Crosshair, ZoomIn, ZoomOut, Bookmark } from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export interface ParkingLot {
  id: number;
  name: string | null;
  address: string | null;
  lat: number;
  lng: number;
  capacity: number;
  base_price: number;
  owner_id?: string | null;
  // Real availability data from database
  total_spots?: number;
  available_spots?: number;
  occupied_spots?: number;
}

export interface TravelEstimate {
  distanceText: string;
  durationText: string;
  durationValue: number; // seconds
}

export interface PreBooking {
  id: string;
  lotId: number;
  lotName: string;
  plateNumber: string;
  pricePerHour: number;
  reservationFee: number;
  createdAt: number;
  expiresAt: number;
  holdMinutes: number;
  travelMinutes: number;
}

interface SmartParkingMapProps {
  parkingLots: ParkingLot[];
  userLocation: google.maps.LatLngLiteral | null;
  fallbackLocation: google.maps.LatLngLiteral;
  loadingLots: boolean;
  locationStatus: "pending" | "granted" | "denied";
}

interface LotPrediction {
  lotId: number;
  probability: number; // 0-1
  confidenceLabel: string;
  dynamicPrice: number;
  // ML model metadata
  source: 'real-time' | 'ml-prediction'; // Track data source
  lastUpdated?: Date;
  modelVersion?: string;
}

// ============================================
// ML MODEL API INTEGRATION PLACEHOLDER
// ============================================
/**
 * TODO: Replace this function with actual ML model API call
 * 
 * Expected ML Model API Endpoint:
 * POST /api/ml/predict-availability
 * 
 * Request Body:
 * {
 *   lot_id: number,
 *   timestamp: ISO8601 string,
 *   day_of_week: string,
 *   hour: number,
 *   historical_data: {
 *     avg_occupancy_same_hour: number,
 *     avg_occupancy_same_day: number,
 *     nearby_events: Event[],
 *     weather_conditions: object,
 *     holiday_flag: boolean
 *   }
 * }
 * 
 * Response:
 * {
 *   lot_id: number,
 *   predicted_availability: number, // 0-1 (0=full, 1=empty)
 *   confidence: number, // 0-1
 *   confidence_label: 'High' | 'Medium' | 'Low',
 *   factors: {
 *     time_influence: number,
 *     event_influence: number,
 *     historical_pattern: number,
 *     weather_influence: number
 *   },
 *   model_version: string,
 *   timestamp: ISO8601 string
 * }
 * 
 * Features to train ML model on:
 * - Hour of day (0-23)
 * - Day of week (0-6)
 * - Month of year (1-12)
 * - Is weekend (boolean)
 * - Is holiday (boolean)
 * - Weather conditions (sunny, rainy, etc.)
 * - Nearby events (concerts, matches, festivals)
 * - Historical occupancy patterns
 * - Lot capacity
 * - Lot location (lat, lng, area type)
 * - Seasonal trends
 */
async function fetchMLPrediction(lot: ParkingLot): Promise<LotPrediction> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/ml/predict-availability', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     lot_id: lot.id,
  //     timestamp: new Date().toISOString(),
  //     day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  //     hour: new Date().getHours(),
  //     historical_data: {
  //       // Pull from your database
  //     }
  //   })
  // });
  // const mlData = await response.json();
  // return {
  //   lotId: lot.id,
  //   probability: mlData.predicted_availability,
  //   confidenceLabel: mlData.confidence_label,
  //   dynamicPrice: calculateDynamicPrice(lot.base_price, mlData.predicted_availability),
  //   source: 'ml-prediction',
  //   lastUpdated: new Date(mlData.timestamp),
  //   modelVersion: mlData.model_version
  // };
  
  // TEMPORARY: Placeholder ML simulation logic (REMOVE WHEN MODEL IS READY)
  const now = new Date();
  const hourFactor = Math.cos((now.getHours() / 24) * Math.PI * 2);
  const dayFactor = now.getDay() === 0 || now.getDay() === 6 ? 0.15 : 0;
  const capacityScore = Math.min(1, lot.capacity / 150);
  const baseScore = 0.5 + capacityScore * 0.3 - dayFactor;
  const timeInfluence = hourFactor * 0.15;
  const probability = Math.min(0.97, Math.max(0.08, baseScore - timeInfluence + Math.random() * 0.1));
  
  return {
    lotId: lot.id,
    probability,
    confidenceLabel: probability >= 0.75 ? "High" : probability <= 0.35 ? "Low" : "Medium",
    dynamicPrice: Math.max(50, Math.round(lot.base_price * (1 + (0.6 - probability) * 0.35))),
    source: 'ml-prediction',
    lastUpdated: new Date(),
    modelVersion: 'placeholder-v0.1'
  };
}
// ============================================
// END ML MODEL API INTEGRATION PLACEHOLDER
// ============================================

const STORAGE_KEY = "parkintel-prebookings";
const MAX_BOOKINGS = 2;

const CLUSTER_COLORS = ["#2563eb", "#7c3aed", "#f97316"];

export function SmartParkingMap({
  parkingLots,
  userLocation,
  fallbackLocation,
  loadingLots,
  locationStatus,
}: SmartParkingMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | undefined>(undefined);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [travelEstimate, setTravelEstimate] = useState<TravelEstimate | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preBookings, setPreBookings] = useState<PreBooking[]>([]);
  const [plateInput, setPlateInput] = useState("");
  const [mlSimulationTick, setMlSimulationTick] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [placePredictions, setPlacePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  // Load pre-bookings from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreBooking[];
        setPreBookings(parsed.filter((booking: PreBooking) => booking.expiresAt > Date.now()));
      } catch (err) {
        console.warn("Failed to parse stored bookings", err);
      }
    }
  }, []);

  // Persist bookings whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preBookings));
  }, [preBookings]);

  // Auto release bookings after expiry
  useEffect(() => {
    const timer = setInterval(() => {
      setPreBookings((current) => current.filter((booking: PreBooking) => booking.expiresAt > Date.now()));
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Kick ML placeholder tick to animate predictions slightly
  useEffect(() => {
    const interval = setInterval(() => setMlSimulationTick((tick) => tick + 1), 90_000);
    return () => clearInterval(interval);
  }, []);

  const selectedLot = useMemo(
    () => parkingLots.find((lot) => lot.id === selectedLotId) ?? null,
    [parkingLots, selectedLotId]
  );

  const predictions = useMemo<LotPrediction[]>(() => {
    return parkingLots.map((lot) => {
      // Check if we have real-time data
      const hasRealTimeData = lot.total_spots !== undefined && 
                              lot.available_spots !== undefined && 
                              lot.occupied_spots !== undefined;
      
      if (hasRealTimeData) {
        // Use real-time availability data
        const totalSpots = lot.total_spots || 1;
        const availableSpots = lot.available_spots || 0;
        const probability = availableSpots / totalSpots;
        
        return {
          lotId: lot.id,
          probability,
          confidenceLabel: "Real-Time",
          dynamicPrice: lot.base_price, // Use base price for real-time data
          source: 'real-time' as const,
          lastUpdated: new Date(),
        } satisfies LotPrediction;
      } else {
        // Use ML prediction (placeholder simulation)
        // TODO: Call actual ML API here via fetchMLPrediction(lot)
        const now = new Date();
        const hourFactor = Math.cos((now.getHours() / 24) * Math.PI * 2);
        const dayFactor = now.getDay() === 0 || now.getDay() === 6 ? 0.15 : 0;
        const capacityScore = Math.min(1, lot.capacity / 150);
        const baseScore = 0.5 + capacityScore * 0.3 - dayFactor;
        const timeInfluence = hourFactor * 0.15;
        const mlShake = (mlSimulationTick % 7) * 0.01;
        const probability = Math.min(0.97, Math.max(0.08, baseScore - timeInfluence + mlShake));
        
        return {
          lotId: lot.id,
          probability,
          confidenceLabel: probability >= 0.75 ? "High" : probability <= 0.35 ? "Low" : "Medium",
          dynamicPrice: Math.max(50, Math.round(lot.base_price * (1 + (0.6 - probability) * 0.35))),
          source: 'ml-prediction' as const,
          lastUpdated: new Date(),
          modelVersion: 'placeholder-v0.1',
        } satisfies LotPrediction;
      }
    });
  }, [parkingLots, mlSimulationTick]);

  const predictionLookup = useMemo(() => {
    const map = new Map<number, LotPrediction>();
    predictions.forEach((prediction) => map.set(prediction.lotId, prediction));
    return map;
  }, [predictions]);

  const initializeMap = useCallback(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || !window.google) return;

    const center = userLocation ?? fallbackLocation;
    const map = new google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      maxZoom: 18,
      minZoom: 10,
    });

    mapRef.current = map;
    
    // Initialize Google Places services
    if (window.google && window.google.maps && window.google.maps.places) {
      const autoService = new google.maps.places.AutocompleteService();
      const placeService = new google.maps.places.PlacesService(map);
      setAutocompleteService(autoService);
      setPlacesService(placeService);
      console.log("✅ Google Places API initialized successfully");
      console.log("   - AutocompleteService:", !!autoService);
      console.log("   - PlacesService:", !!placeService);
    } else {
      console.error("❌ Google Places API not available!");
      console.log("   - window.google:", !!window.google);
      console.log("   - window.google.maps:", !!(window.google && window.google.maps));
      console.log("   - window.google.maps.places:", !!(window.google && window.google.maps && window.google.maps.places));
    }
    
    setIsMapReady(true);
    console.log("✅ Map initialized");
  }, [fallbackLocation, userLocation]);

  // Initialize Google Map once scripts are ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    let interval: ReturnType<typeof setInterval> | null = null;

    if (!window.google) {
      interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval!);
          initializeMap();
        }
      }, 100);
    } else {
      initializeMap();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeMap]);

  // Create and maintain user location marker - ALWAYS visible on top
  const createUserLocationMarker = useCallback(() => {
    if (!mapRef.current || !userLocation || typeof window === "undefined" || !window.google) {
      return;
    }

    const map = mapRef.current;

    // Remove old marker if exists
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    console.log("📍 Creating user location marker at:", userLocation);
    
    // Create distinctive pulsing user location marker with MAXIMUM visibility
    const userIconSvg = `
      <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer glow ring -->
        <circle cx="28" cy="28" r="24" fill="#4285F4" opacity="0.15">
          <animate attributeName="r" values="20;26;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- Middle pulsing ring -->
        <circle cx="28" cy="28" r="18" fill="#4285F4" opacity="0.3">
          <animate attributeName="r" values="16;20;16" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- Outer white border -->
        <circle cx="28" cy="28" r="12" fill="#ffffff" stroke="#4285F4" stroke-width="3"/>
        <!-- Inner blue circle -->
        <circle cx="28" cy="28" r="8" fill="#4285F4"/>
        <!-- Center white dot -->
        <circle cx="28" cy="28" r="3" fill="#ffffff"/>
      </svg>
    `;
    
    // Create marker with MAXIMUM z-index and visibility settings
    userMarkerRef.current = new google.maps.Marker({
      position: userLocation,
      map,
      zIndex: 999999, // MAXIMUM z-index to ensure always on top
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(userIconSvg),
        scaledSize: new google.maps.Size(56, 56), // Larger size for better visibility
        anchor: new google.maps.Point(28, 28),
      },
      title: "📍 Your Current Location",
      optimized: false, // CRITICAL: Disable optimization for SVG animation
      clickable: false, // Prevent marker from intercepting clicks
    });

    console.log("✅ User location marker created with maximum visibility");
  }, [userLocation]);

  // Update user location marker when location or map changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !userLocation) {
      console.log("⏳ User marker waiting...", { isMapReady, hasMap: !!mapRef.current, hasLocation: !!userLocation });
      return;
    }

    createUserLocationMarker();
    mapRef.current.panTo(userLocation);

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, isMapReady, createUserLocationMarker]);

  // Google Places Autocomplete search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 3) {
      setPlacePredictions([]);
      setShowSearchResults(false);
      return;
    }

    if (!autocompleteService) {
      console.warn("⚠️ Autocomplete service not initialized yet. Please wait for map to load.");
      return;
    }

    console.log("🔍 Searching for:", query);

    // Use Google Places Autocomplete API
    try {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          // Bias results towards Pakistan (can be changed or removed for worldwide search)
          componentRestrictions: { country: 'pk' },
          // Alternative: use location bias instead of restrictions
          // location: new google.maps.LatLng(33.6844, 73.0479), // Islamabad
          // radius: 50000, // 50km radius
        },
        (predictions, status) => {
          console.log("📡 API Response - Status:", status);
          console.log("📡 API Response - Predictions:", predictions?.length || 0);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPlacePredictions(predictions.slice(0, 6)); // Limit to 6 results
            setShowSearchResults(true);
            console.log("✅ Showing", predictions.length, "results");
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPlacePredictions([]);
            setShowSearchResults(false);
            console.log("ℹ️ No results found for:", query);
          } else if (status === google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
            console.error("❌ UNKNOWN_ERROR from Places API");
            console.error("   This usually means:");
            console.error("   1. Places API not enabled in Google Cloud Console");
            console.error("   2. API key doesn't have Places API permission");
            console.error("   3. Billing not enabled for your Google Cloud project");
            console.error("   4. API quota exceeded");
            console.error("   ");
            console.error("   Action required:");
            console.error("   → Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com");
            console.error("   → Enable 'Places API (New)'");
            console.error("   → Check billing is enabled");
            setErrorMessage("Places API error. Please check console for details.");
            setTimeout(() => setErrorMessage(null), 5000);
            setPlacePredictions([]);
            setShowSearchResults(false);
          } else {
            setPlacePredictions([]);
            setShowSearchResults(false);
            console.log("❌ API Error. Status:", status);
          }
        }
      );
    } catch (error) {
      console.error("❌ Exception while calling Places API:", error);
      setErrorMessage("Search error. Please try again.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [autocompleteService]);

  const handleSelectLocation = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!mapRef.current || !placesService) return;
    
    // Get place details to get coordinates
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
          const location = place.geometry.location;
          mapRef.current?.panTo(location);
          mapRef.current?.setZoom(15);
          setSearchQuery(place.name || prediction.description);
          setShowSearchResults(false);
          setStatusMessage(`Showing: ${place.name || prediction.description}`);
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          setErrorMessage("Could not find location details");
          setTimeout(() => setErrorMessage(null), 3000);
        }
      }
    );
  }, [placesService]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const requestTravelEstimate = useCallback(
    (lot: ParkingLot) => {
      if (typeof window === "undefined" || !window.google) return;
      if (!userLocation) {
        setTravelEstimate(null);
        return;
      }

      // Calculate straight-line distance using geometry library
      const origin = new google.maps.LatLng(userLocation.lat, userLocation.lng);
      const destination = new google.maps.LatLng(lot.lat, lot.lng);
      const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(origin, destination);
      
      // Realistic city driving estimation for Rawalpindi/Islamabad:
      // - Road distance is typically 1.6-1.8x straight line (using 1.7x)
      // - Average city speed: 25-30 km/h during peak, 35-40 km/h off-peak
      // - Adding 30% traffic buffer for signals, congestion, parking lot entry
      const roadDistanceMultiplier = 1.7;
      const estimatedDrivingMeters = distanceMeters * roadDistanceMultiplier;
      const distanceKm = estimatedDrivingMeters / 1000;
      
      // Use lower average speed for city traffic (25 km/h) + 30% buffer
      const averageSpeedKmh = 25;
      const trafficBuffer = 1.3; // 30% extra time for traffic, signals, finding parking
      const baseDurationMinutes = (distanceKm / averageSpeedKmh) * 60;
      const durationMinutes = Math.max(5, Math.round(baseDurationMinutes * trafficBuffer)); // minimum 5 minutes
      
      setTravelEstimate({
        distanceText: distanceKm >= 1 ? `${distanceKm.toFixed(1)} km` : `${Math.round(distanceMeters)} m`,
        durationText: durationMinutes >= 60 
          ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min`
          : `${durationMinutes} min`,
        durationValue: durationMinutes * 60, // convert to seconds
      });
    },
    [userLocation]
  );

  // Function to get parking marker scale based on zoom level
  const getParkingMarkerScale = useCallback((zoom: number) => {
    if (zoom >= 16) return 14;  // Close zoom - larger markers
    if (zoom >= 14) return 12;  // Normal zoom
    if (zoom >= 12) return 10;  // Zooming out
    if (zoom >= 10) return 8;   // Far zoom
    return 6;                    // Very far zoom - small markers
  }, []);

  const attachMarkers = useCallback(() => {
    if (typeof window === "undefined" || !mapRef.current || !window.google) return;

    // Clear old markers
    markersRef.current.forEach((marker: google.maps.Marker) => marker.setMap(null));
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const map = mapRef.current;
    const currentZoom = map.getZoom() ?? 13;
    const markerScale = getParkingMarkerScale(currentZoom);

    parkingLots.forEach((lot) => {
      const prediction = predictionLookup.get(lot.id);
      
      // Determine availability ratio based on data source
      let availabilityRatio: number;
      if (prediction?.source === 'real-time') {
        // Real-time data: Calculate from actual spots
        const totalSpots = lot.total_spots || lot.capacity || 1;
        const availableSpots = lot.available_spots || 0;
        availabilityRatio = availableSpots / totalSpots;
      } else {
        // ML prediction: Use probability
        availabilityRatio = prediction?.probability ?? 0.5;
      }
      
      // Color coding:
      // Green: >50% available (plenty of spots)
      // Orange: 20-50% available (moderate availability)
      // Red: <20% available (nearly full)
      const color = availabilityRatio > 0.5 ? "#22c55e" : availabilityRatio > 0.2 ? "#f97316" : "#ef4444";

      const marker = new google.maps.Marker({
        position: { lat: lot.lat, lng: lot.lng },
        map,
        title: lot.name ?? "Parking Lot",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: markerScale,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedLotId(lot.id);
        requestTravelEstimate(lot);
      });

      markersRef.current.push(marker);
    });

    // Listen for zoom changes to update marker sizes
    const zoomListener = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom() ?? 13;
      const newScale = getParkingMarkerScale(zoom);
      
      markersRef.current.forEach((marker) => {
        const currentIcon = marker.getIcon() as google.maps.Symbol;
        if (currentIcon && currentIcon.fillColor) {
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: newScale,
            fillColor: currentIcon.fillColor,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          });
        }
      });
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers: markersRef.current,
      // Algorithm options - more aggressive clustering at low zoom levels
      algorithmOptions: {
        maxZoom: 13, // Cluster at zoom 13 and below (more aggressive)
        radius: 100,  // Larger radius = more markers cluster together
      },
      renderer: {
        render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
          // Size based on count - compact clusters
          const size = Math.min(36, 24 + Math.log2(count) * 3);
          const color = count > 10 ? "#7c3aed" : count > 5 ? "#2563eb" : "#22c55e";
          
          const svg = window.btoa(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="white" opacity="0.95"/>
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="${color}"/>
              <text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" font-size="${Math.max(10, size * 0.35)}" font-weight="600" fill="white">${count}</text>
            </svg>
          `);
          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;base64,${svg}`,
              scaledSize: new google.maps.Size(size, size),
              anchor: new google.maps.Point(size/2, size/2),
            },
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          });
        },
      },
    });

    console.log("✅ Added", markersRef.current.length, "parking markers with clustering");
    
    // CRITICAL: Recreate user location marker AFTER parking markers to ensure it's on top
    if (userLocation && isMapReady) {
      setTimeout(() => {
        createUserLocationMarker();
        console.log("🔄 User marker recreated after parking markers");
      }, 100);
    }
  }, [parkingLots, predictionLookup, requestTravelEstimate, userLocation, isMapReady, createUserLocationMarker]);

  useEffect(() => {
    if (!isMapReady || parkingLots.length === 0) {
      console.log("⏳ Waiting for map or parking lots...", { isMapReady, lotsCount: parkingLots.length });
      return;
    }
    console.log("🚀 Attaching markers now...");
    attachMarkers();
  }, [attachMarkers, isMapReady, parkingLots]);

  useEffect(() => {
    if (selectedLot) {
      requestTravelEstimate(selectedLot);
    }
  }, [selectedLot, requestTravelEstimate]);

  const handlePreBook = async () => {
    if (!selectedLot) return;
    if (!plateInput.trim()) {
      setErrorMessage("Please provide a vehicle plate number");
      return;
    }

    if (
      preBookings.length >= MAX_BOOKINGS &&
      !preBookings.some((booking: PreBooking) => booking.lotId === selectedLot.id)
    ) {
      setErrorMessage(`You already hold ${MAX_BOOKINGS} active reservations`);
      return;
    }

    if (preBookings.some((booking: PreBooking) => booking.lotId === selectedLot.id)) {
      setErrorMessage("This lot is already reserved. Try another lot or release it first.");
      return;
    }

    const prediction = predictionLookup.get(selectedLot.id);
    const pricePerHour = prediction?.dynamicPrice ?? selectedLot.base_price;
    const reservationFee = Math.round(pricePerHour * 0.20);
    const travelMinutes = travelEstimate ? Math.ceil(travelEstimate.durationValue / 60) : 20;
    // Hold duration is 2x travel time (owner-configurable in future)
    const graceMinutes = travelMinutes * 2;
    const expiresAt = Date.now() + graceMinutes * 60 * 1000;

    const booking: PreBooking = {
      id: crypto.randomUUID?.() ?? `booking-${Date.now()}`,
      lotId: selectedLot.id,
      lotName: selectedLot.name ?? "Parking Lot",
      plateNumber: plateInput.trim().toUpperCase(),
      pricePerHour,
      reservationFee,
      createdAt: Date.now(),
      expiresAt,
      holdMinutes: graceMinutes,
      travelMinutes,
    };

    setPreBookings((current) => [...current, booking]);
    setPlateInput("");
    setStatusMessage(`✓ Reserved at ${booking.lotName} for ${graceMinutes} minutes (Fee: Rs. ${reservationFee})`);
    setErrorMessage(null);
    
    // Auto-dismiss success message
    setTimeout(() => setStatusMessage(null), 5000);

    // Save pre-booking to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Normalize plate number: uppercase and remove all spaces for consistent matching
      const normalizedPlate = booking.plateNumber.replace(/\s+/g, '');
      await supabase.from("pre_bookings").insert({
        lot_id: booking.lotId,
        plate_number: normalizedPlate,
        reservation_fee: reservationFee,
        status: "active",
        expires_at: new Date(booking.expiresAt).toISOString(),
        user_id: user?.id || null,
      });
      console.log("Pre-booking saved with plate:", normalizedPlate);
    } catch (err) {
      console.error("Pre-booking save failed:", err);
    }
  };

  const navigateToLot = () => {
    if (!selectedLot) return;
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : "";
    const destination = `${selectedLot.lat},${selectedLot.lng}`;
    const routingUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&origin=${origin}`;
    window.open(routingUrl, "_blank");
  };

  const [showBookingModal, setShowBookingModal] = useState(false);

  const recenterToUserLocation = () => {
    if (!mapRef.current) return;
    
    if (!userLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            mapRef.current?.panTo(newLocation);
            mapRef.current?.setZoom(15);
          },
          () => {
            setErrorMessage("Please enable location access to use this feature");
          }
        );
      } else {
        setErrorMessage("Geolocation is not supported by your browser");
      }
    } else {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0" ref={mapContainerRef} />

      {/* Search bar with custom dropdown */}
      <div className="search-container pointer-events-auto absolute left-4 right-4 top-4 z-10 sm:left-6 sm:right-auto sm:top-5 sm:w-80 md:w-96">
        <div className="relative">
          <div className="group flex items-center gap-3 rounded-2xl border border-white/50 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400">
            <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.length >= 3 && setShowSearchResults(placePredictions.length > 0)}
              placeholder="Search any location..."
              className="w-full border-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPlacePredictions([]);
                  setShowSearchResults(false);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Search results dropdown - Google Places predictions */}
          {showSearchResults && placePredictions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
              {placePredictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectLocation(prediction)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 mt-0.5">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map controls - elegant floating buttons */}
      <div className="pointer-events-auto absolute right-4 top-4 z-10 flex flex-col gap-2 sm:right-5 sm:top-5">
        <button
          onClick={() => {
            if (!mapRef.current) return;
            mapRef.current.setZoom((mapRef.current.getZoom() ?? 13) + 1);
          }}
          className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:scale-105 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] active:scale-95"
          title="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            if (!mapRef.current) return;
            mapRef.current.setZoom((mapRef.current.getZoom() ?? 13) - 1);
          }}
          className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:scale-105 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] active:scale-95"
          title="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <div className="my-1 h-px bg-slate-200" />
        <button
          onClick={recenterToUserLocation}
          className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:scale-105 hover:bg-indigo-600 hover:text-white hover:shadow-[0_6px_20px_rgba(79,70,229,0.3)] active:scale-95"
          title="My location"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {/* Toast messages - modern floating design */}
      {(statusMessage || errorMessage) && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4 sm:top-24">
          <div
            className={clsx(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4",
              errorMessage
                ? "border-red-200 bg-red-50/95 text-red-700"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-700"
            )}
          >
            <span>{errorMessage ?? statusMessage}</span>
            <button
              onClick={() => {
                setStatusMessage(null);
                setErrorMessage(null);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 transition-colors hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Location status - elegant floating badge */}
      {locationStatus === "denied" && (
        <div className="pointer-events-none absolute bottom-24 left-4 z-10 sm:bottom-auto sm:left-auto sm:right-20 sm:top-20">
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-sm font-medium text-amber-800 shadow-lg backdrop-blur-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200">
              <MapPin className="h-4 w-4 text-amber-700" />
            </div>
            <span>Showing Rawalpindi/Islamabad</span>
          </div>
        </div>
      )}

      {/* Active bookings badge - floating pill - clickable */}
      {preBookings.length > 0 && (
        <div className="pointer-events-auto absolute left-4 top-20 z-10 sm:left-6 sm:top-18">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2.5 rounded-full border border-indigo-200 bg-indigo-50/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-indigo-100/95 hover:border-indigo-300 hover:shadow-xl active:scale-95 cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {preBookings.length}
            </div>
            <span className="text-sm font-medium text-indigo-700">
              Active {preBookings.length > 1 ? 'Bookings' : 'Booking'}
            </span>
            <Bookmark className="h-4 w-4 text-indigo-500" />
          </button>
        </div>
      )}

      {/* Selected lot card - premium floating design */}
      {selectedLot && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-10 max-h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[440px] sm:-translate-x-1/2 lg:w-[480px]">
          <div className="flex max-h-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            {/* Gradient header accent */}
            <div className="h-1.5 shrink-0 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            {/* Close button */}
            <button
              onClick={() => setSelectedLotId(null)}
              className="absolute right-4 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto p-5 sm:p-6">
              {/* Header with availability indicator */}
              <div className="flex items-start gap-3">
                <div className={clsx(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  (predictionLookup.get(selectedLot.id)?.probability ?? 0.5) > 0.7
                    ? "bg-emerald-100 text-emerald-600"
                    : (predictionLookup.get(selectedLot.id)?.probability ?? 0.5) > 0.35
                    ? "bg-amber-100 text-amber-600"
                    : "bg-red-100 text-red-600"
                )}>
                  <Car className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{selectedLot.name ?? "Parking Lot"}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedLot.address ?? "Address not provided"}</span>
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-50 to-green-50 p-3 transition-all duration-200 hover:shadow-md sm:p-4">
                  <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-emerald-200/30" />
                  <p className="relative flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    {predictionLookup.get(selectedLot.id)?.source === 'real-time' ? (
                      <>
                        <span className="hidden sm:inline">Available</span>
                        <span className="sm:hidden">Avail</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">ML Prediction</span>
                        <span className="sm:hidden">Predict</span>
                      </>
                    )}
                  </p>
                  <p className="relative mt-1 text-xl font-bold text-emerald-900 sm:text-2xl">
                    {predictionLookup.get(selectedLot.id)?.source === 'real-time' ? (
                      // Real-time data: Show "7/8" format
                      <>{selectedLot.available_spots}/{selectedLot.total_spots}</>
                    ) : (
                      // ML prediction: Show "73%" format
                      <>{((predictionLookup.get(selectedLot.id)?.probability ?? 0.5) * 100).toFixed(0)}%</>
                    )}
                  </p>
                  {/* Data source badge */}
                  <div className={`relative mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    predictionLookup.get(selectedLot.id)?.source === 'real-time' 
                      ? 'bg-emerald-200 text-emerald-800' 
                      : 'bg-purple-200 text-purple-800'
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      predictionLookup.get(selectedLot.id)?.source === 'real-time' 
                        ? 'bg-emerald-600 animate-pulse' 
                        : 'bg-purple-600'
                    }`} />
                    {predictionLookup.get(selectedLot.id)?.source === 'real-time' ? 'LIVE' : 'AI'}
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-50 to-indigo-50 p-3 transition-all duration-200 hover:shadow-md sm:p-4">
                  <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-blue-200/30" />
                  <p className="relative flex items-center gap-1.5 text-xs font-medium text-blue-700">
                    <Clock className="h-3 w-3" />
                    <span>ETA</span>
                  </p>
                  <p className="relative mt-1 text-xl font-bold text-blue-900 sm:text-2xl">{travelEstimate?.durationText ?? "--"}</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-50 to-orange-50 p-3 transition-all duration-200 hover:shadow-md sm:p-4">
                  <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-amber-200/30" />
                  <p className="relative flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <Banknote className="h-3 w-3" />
                    <span>Price/hr</span>
                  </p>
                  <p className="relative mt-1 text-xl font-bold text-amber-900 sm:text-2xl">
                    Rs {predictionLookup.get(selectedLot.id)?.dynamicPrice ?? selectedLot.base_price}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex gap-3">
                <Button 
                  onClick={navigateToLot} 
                  variant="outline" 
                  className="flex-1 gap-2 rounded-xl border-slate-200 py-2.5 text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Navigation2 className="h-4 w-4" />
                  Navigate
                </Button>
                <Button 
                  onClick={() => setShowBookingModal(true)} 
                  className="flex-1 gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-2.5 text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Reserve Spot
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-booking modal - premium design */}
      {showBookingModal && selectedLot && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative m-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Gradient header */}
            <div className="relative bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 pb-8 pt-6">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setPlateInput("");
                  setErrorMessage(null);
                }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Reserve Your Spot</h3>
                  <p className="text-sm text-white/80">{selectedLot.name ?? "Parking Lot"}</p>
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="px-6 pb-6 pt-5">
              <div className="space-y-4">
                {/* Plate input */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Car className="h-4 w-4 text-slate-500" />
                    Vehicle Plate Number
                  </label>
                  <input
                    value={plateInput}
                    onChange={(event) => setPlateInput(event.target.value)}
                    placeholder="ABC-1234"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-bold uppercase tracking-widest text-slate-900 transition-all duration-200 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* Hold duration info */}
                <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Hold Duration</span>
                    </div>
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold text-white">
                      {travelEstimate ? `${Math.ceil(travelEstimate.durationValue / 60) * 2} min` : `40 min`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-indigo-600/80">
                    Auto-calculated: 2× estimated travel time {travelEstimate && `(${travelEstimate.durationText} × 2)`}
                  </p>
                </div>

                {/* Reservation fee info */}
                <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Banknote className="h-4 w-4" />
                      <span className="font-medium">Pre-booking Fee</span>
                    </div>
                    <span className="rounded-full bg-amber-600 px-3 py-1 text-sm font-bold text-white">
                      Rs. {Math.round((predictionLookup.get(selectedLot.id)?.dynamicPrice ?? selectedLot.base_price) * 0.20)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-amber-600/80">
                    20% of hourly rate (Rs. {predictionLookup.get(selectedLot.id)?.dynamicPrice ?? selectedLot.base_price}/hr) - Charged now
                  </p>
                </div>

                {/* Policy info */}
                <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                      <ShieldCheck className="h-4 w-4 text-amber-700" />
                    </div>
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold">Booking Policy</p>
                      <p className="mt-1 leading-relaxed">
                        Maximum {MAX_BOOKINGS} active bookings allowed. Your reserved spot will auto-release if you don&apos;t arrive within the hold duration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <Button
                onClick={() => {
                  handlePreBook();
                  setShowBookingModal(false);
                }}
                className="mt-6 w-full rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-3 text-base font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                Confirm Reservation
              </Button>
              
              <p className="mt-3 text-center text-xs text-slate-500">
                By reserving, you agree to our booking terms
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay - elegant design */}
      {loadingLots && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Finding parking spots</p>
              <p className="mt-1 text-sm text-slate-500">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
