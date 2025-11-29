"use client";

import React, { useState, useRef, useEffect } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { Plus, Save, Trash2, RotateCw, MoveDiagonal, Settings, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Make sure this path is correct for your project

// --- REAL WORLD DIMENSIONS ---
// Scale: 1 meter = 20 pixels
const PIXELS_PER_METER = 20;
const SPOT_WIDTH_M = 2.5;
const SPOT_HEIGHT_M = 5.0;

const SPOT_W = SPOT_WIDTH_M * PIXELS_PER_METER; // 50px
const SPOT_H = SPOT_HEIGHT_M * PIXELS_PER_METER; // 100px

type Point = { x: number; y: number };

type UISpot = {
  id: number;
  label: string;
  x: number;
  y: number;
  rotation: number;
};

// --- GEOMETRY HELPERS (SAT Algorithm) ---

// 1. Get the 4 corners of a rotated rectangle
const getRotatedCorners = (x: number, y: number, rotation: number): Point[] => {
  const cx = x + SPOT_W / 2;
  const cy = y + SPOT_H / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: x, y: y },                   // Top-Left
    { x: x + SPOT_W, y: y },          // Top-Right
    { x: x + SPOT_W, y: y + SPOT_H }, // Bottom-Right
    { x: x, y: y + SPOT_H },          // Bottom-Left
  ];

  return corners.map((p) => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  }));
};

// 2. Project polygon onto an axis
const project = (corners: Point[], axis: Point) => {
  let min = Infinity;
  let max = -Infinity;
  for (const p of corners) {
    const proj = p.x * axis.x + p.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
};

// 3. Check if two polygons overlap using Separating Axis Theorem
const doPolygonsIntersect = (polyA: Point[], polyB: Point[]) => {
  const polygons = [polyA, polyB];
  
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      // Get edge
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      
      // Get normal (axis)
      const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x };
      
      // Normalize axis (optional but good for precision)
      const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      const axis = { x: normal.x / len, y: normal.y / len };

      // Project both
      const projA = project(polyA, axis);
      const projB = project(polyB, axis);

      // Check for gap
      if (projA.max < projB.min || projB.max < projA.min) {
        return false; // Gap found, no collision
      }
    }
  }
  return true; // No gaps found on any axis
};

// --- COMPONENT ---

const DraggableSpot = ({
  spot,
  isSelected,
  onDragStop,
  onSelect,
  isGhost = false,
  onClickGhost,
}: {
  spot: UISpot;
  isSelected?: boolean;
  onDragStop?: (e: DraggableEvent, data: DraggableData) => void;
  onSelect?: () => void;
  isGhost?: boolean;
  onClickGhost?: () => void;
}) => {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: spot.x, y: spot.y }}
      onStop={onDragStop}
      onStart={onSelect}
      disabled={isGhost}
    >
      <div
        ref={nodeRef}
        onClick={isGhost ? onClickGhost : undefined}
        className={`absolute z-10 ${isGhost ? "z-0" : isSelected ? "z-30" : "z-10"}`}
        style={{
          width: `${SPOT_W}px`,
          height: `${SPOT_H}px`,
          cursor: isGhost ? "pointer" : "move",
        }}
      >
        <div
          className={`flex h-full w-full items-center justify-center rounded-md border-2 text-[10px] font-bold shadow-sm transition-all duration-200 ${
            isGhost
              ? "border-dashed border-indigo-400 bg-indigo-50 text-indigo-400 opacity-70 hover:opacity-100"
              : isSelected
              ? "border-indigo-600 bg-indigo-100 text-indigo-800 shadow-md"
              : "border-slate-400 bg-white text-slate-600 hover:border-indigo-400"
          }`}
          style={{
            transform: `rotate(${spot.rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          {isGhost ? `+` : spot.label}
          {!isGhost && <div className="absolute top-1 h-1 w-6 rounded-full bg-slate-300" />}
        </div>
      </div>
    </Draggable>
  );
};

export default function ParkingPage() {
  const router = useRouter();
  const [spots, setSpots] = useState<UISpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  
  // Initial Canvas: 20m x 20m (400px x 400px)
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [ghostSpot, setGhostSpot] = useState<UISpot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inputs
  const [lotName, setLotName] = useState("");
  const [lotAddress, setLotAddress] = useState("");
  const [basePrice, setBasePrice] = useState<string>("50");
  const [releaseBuffer, setReleaseBuffer] = useState<string>("1.8");
  
  // Map selection states
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapMarkerRef = useRef<google.maps.Marker | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // --- VALIDATION LOGIC ---
  const isPositionValid = (testSpot: UISpot, excludeId?: number) => {
    const cornersA = getRotatedCorners(testSpot.x, testSpot.y, testSpot.rotation);

    // 1. Wall Boundaries (Check all 4 corners)
    for (const p of cornersA) {
      if (p.x < 0 || p.y < 0) return false;
      if (p.x > canvasSize.width || p.y > canvasSize.height) return false;
    }

    // 2. Polygon Collision with other spots
    for (const other of spots) {
      if (other.id === excludeId) continue;
      const cornersB = getRotatedCorners(other.x, other.y, other.rotation);
      if (doPolygonsIntersect(cornersA, cornersB)) return false;
    }
    return true;
  };

  // --- HANDLERS ---

  // Auto-Complete Ghost Spot
  useEffect(() => {
    if (spots.length < 1) { setGhostSpot(null); return; }
    
    const lastSpot = spots[spots.length - 1];
    let suggestion: UISpot | null = null;

    if (spots.length === 1) {
        suggestion = { ...lastSpot, id: -1, x: lastSpot.x + SPOT_W + 10, label: `A-${nextId}` };
    } else {
        const prevSpot = spots[spots.length - 2];
        const dx = lastSpot.x - prevSpot.x;
        const dy = lastSpot.y - prevSpot.y;
        suggestion = {
            id: -1,
            label: `A-${nextId}`,
            x: lastSpot.x + dx,
            y: lastSpot.y + dy,
            rotation: lastSpot.rotation
        };
    }

    if (suggestion && isPositionValid(suggestion)) {
        setGhostSpot(suggestion);
    } else {
        setGhostSpot(null);
    }
  }, [spots, nextId, canvasSize]); 

  // Delete Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedSpotId === null) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT') return;
        setSpots((prev) => prev.filter((spot) => spot.id !== selectedSpotId));
        setSelectedSpotId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSpotId]);

  const addSpot = () => {
    let foundX = 0, foundY = 0, found = false;
    // Try a simple 10x10 grid search starting from top-left
    for(let r=0; r<20; r++) {
        for(let c=0; c<20; c++) {
            const tx = 20 + c * (SPOT_W + 10);
            const ty = 20 + r * (SPOT_H + 10);
            if(isPositionValid({ id: -1, label:'', x: tx, y: ty, rotation: 0 })) {
                foundX = tx; foundY = ty; found = true;
                break;
            }
        }
        if(found) break;
    }

    if (!found) {
        setErrorMsg("Canvas Full! Expand dimensions.");
        setTimeout(() => setErrorMsg(null), 3000);
        return;
    }

    setSpots([...spots, { id: nextId, label: `A-${nextId}`, x: foundX, y: foundY, rotation: 0 }]);
    setNextId(nextId + 1);
  };

  const handleDragStop = (id: number, data: DraggableData) => {
    const original = spots.find(s => s.id === id);
    if (!original) return;

    const proposed = { ...original, x: data.x, y: data.y };

    if (isPositionValid(proposed, id)) {
        setSpots(prev => prev.map(s => s.id === id ? proposed : s));
        setErrorMsg(null);
    } else {
        setSpots(prev => [...prev]); // Snap back
        setErrorMsg("Overlap or Out of Bounds!");
        setTimeout(() => setErrorMsg(null), 2000);
    }
  };

  const rotateSpot = (id: number) => {
    const spot = spots.find(s => s.id === id);
    if(!spot) return;

    const newRot = (spot.rotation + 45) % 360;
    const proposed = { ...spot, rotation: newRot };

    if(isPositionValid(proposed, id)) {
        setSpots(prev => prev.map(s => s.id === id ? proposed : s));
    } else {
        setErrorMsg("Rotation blocked by obstacle!");
        setTimeout(() => setErrorMsg(null), 2000);
    }
  };

  // Canvas Resizing
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    isResizing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const doDrag = (dragEvent: MouseEvent) => {
        if (!isResizing.current || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(200, dragEvent.clientX - rect.left);
        const h = Math.max(200, dragEvent.clientY - rect.top);
        setCanvasSize({ width: w, height: h });
    };
    const stopDrag = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!showMapModal || !mapContainerRef.current) return;
    
    const initMap = () => {
      if (!window.google || !mapContainerRef.current) return;
      
      const defaultCenter = selectedLocation || { lat: 33.5651, lng: 73.0169 };
      
      const map = new google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 15,
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
      
      mapRef.current = map;
      
      // Add click listener to map
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          // Remove old marker if it exists (only one marker allowed)
          if (mapMarkerRef.current) {
            mapMarkerRef.current.setMap(null);
            mapMarkerRef.current = null;
          }
          
          // Create new marker
          const newMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP,
          });
          
          // Store the new marker in ref
          mapMarkerRef.current = newMarker;
          setSelectedLocation({ lat, lng });
          
          // Update location when marker is dragged
          newMarker.addListener('dragend', () => {
            const pos = newMarker.getPosition();
            if (pos) {
              setSelectedLocation({ lat: pos.lat(), lng: pos.lng() });
            }
          });
        }
      });
      
      // If there's already a selected location, add marker
      if (selectedLocation) {
        const marker = new google.maps.Marker({
          position: selectedLocation,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });
        
        mapMarkerRef.current = marker;
        
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            setSelectedLocation({ lat: pos.lat(), lng: pos.lng() });
          }
        });
      }
    };
    
    // Wait for Google Maps to load
    const checkGoogleMaps = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleMaps);
        initMap();
      }
    }, 100);
    
    return () => {
      clearInterval(checkGoogleMaps);
      // Clean up marker when modal closes
      if (mapMarkerRef.current) {
        mapMarkerRef.current.setMap(null);
        mapMarkerRef.current = null;
      }
    };
  }, [showMapModal]);

  const handleOpenMapModal = () => {
    if (!lotName) {
      alert("Please enter a Parking Lot Name first.");
      return;
    }
    if (spots.length === 0) {
      alert("Please add at least one parking spot before selecting location.");
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      alert("Please enter a valid Base Price (must be greater than 0).");
      return;
    }
    if (!releaseBuffer || parseFloat(releaseBuffer) < 1) {
      alert("Please enter a valid Release Buffer multiplier (must be at least 1.0).");
      return;
    }
    setShowMapModal(true);
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      alert("Please select a location on the map by clicking.");
      return;
    }
    setShowMapModal(false);
    // Proceed to save
    handleSave();
  };

  // --- SUPABASE SAVING LOGIC ---
  const handleSave = async () => {
    if (!lotName) {
        alert("Please enter a Parking Lot Name first.");
        return;
    }
    if (spots.length === 0) {
        alert("Please add at least one parking spot.");
        return;
    }
    if (!selectedLocation) {
        alert("Please select a location on the map.");
        return;
    }

    setIsSaving(true);

    try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error("User Error:", userError);
            alert("You must be logged in to create a parking lot.");
            setIsSaving(false);
            return;
        }

        // 1. Create the Parking Lot with owner_id and location
        const { data: lotData, error: lotError } = await supabase
            .from('ParkingLots') 
            .insert({ 
                name: lotName, 
                address: lotAddress || 'Address not provided',
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                total_spots: spots.length, // Total capacity
                price_per_hour: parseFloat(basePrice), // User-defined price
                release_buffer_multiplier: parseFloat(releaseBuffer), // User-defined buffer
                owner_id: user.id    // Link to the current user
            })
            .select()
            .single();

        if (lotError) {
            console.error("Supabase Lot Error:", lotError);
            console.error("Full error details:", JSON.stringify(lotError, null, 2));
            
            // Handle specific error cases
            if (lotError.code === '23505') {
                if (lotError.message && lotError.message.includes('ParkingLots_pkey')) {
                    alert("⚠️ DATABASE ERROR: Parking Lot ID Sequence Out of Sync\n\n" +
                          "TO FIX THIS:\n" +
                          "1. Open Supabase SQL Editor\n" +
                          "2. Run the file: FIX_PARKINGLOTS_SEQUENCE.sql\n" +
                          "3. Try creating your parking lot again\n\n" +
                          "This happens when the auto-increment ID counter gets reset.");
                } else {
                    alert("A parking lot with this name already exists. Please use a different name.");
                }
            } else if (lotError.code === '42501') {
                alert("Permission denied. Please make sure you are logged in as an owner.");
            } else if (lotError.message) {
                alert("Error creating parking lot: " + lotError.message);
            } else {
                alert("Error creating parking lot. Please check console for details.");
            }
            
            setIsSaving(false);
            return;
        }
        
        if (!lotData || !lotData.id) {
            alert("Failed to create parking lot. Please try again.");
            setIsSaving(false);
            return;
        }
        
        const lotId = lotData.id;

        // 2. Create the Spots
        const spotsToInsert = spots.map(spot => ({
            lot_id: lotId,
            label: spot.label,
            x_coord: Math.round(spot.x),
            y_coord: Math.round(spot.y),
            rotation: spot.rotation,
            is_occupied: false
        }));

        const { error: spotsError } = await supabase
            .from('parking_spots')
            .insert(spotsToInsert);

        if (spotsError) {
            console.error("Supabase Spot Error:", spotsError);
            alert("Error creating parking spots: " + spotsError.message);
            setIsSaving(false);
            return;
        }

        // Success! Clear the form and show success message
        setSuccessMsg(`Parking Lot "${lotName}" saved successfully with ${spots.length} spots!`);
        
        // Reset the form
        setLotName("");
        setLotAddress("");
        setBasePrice("50");
        setReleaseBuffer("1.8");
        setSpots([]);
        setNextId(1);
        setSelectedSpotId(null);
        setGhostSpot(null);
        setSelectedLocation(null);
        
        // Redirect to dashboard after showing success message
        setTimeout(() => {
            router.push('/owner/dashboard');
        }, 2000);

    } catch (error: any) {
        console.error("Unexpected Error:", error);
        alert("Unexpected error: " + (error.message || "Please check console"));
    } finally {
        setIsSaving(false);
    }
  };  

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col border-b bg-white px-8 py-5 shadow-sm z-40 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-indigo-900">
            Architect Your <span className="text-indigo-600">Smart Parking Zone</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Design efficient layouts with real-world dimensions.
            {errorMsg && (
                <span className="ml-3 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 animate-pulse border border-red-200">
                    <AlertCircle size={12} /> {errorMsg}
                </span>
            )}
            {successMsg && (
                <span className="ml-3 inline-flex items-center gap-1 rounded bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700 animate-pulse border border-green-300 shadow-sm">
                    ✅ {successMsg}
                </span>
            )}
          </p>
        </div>
        
        <div className="mt-4 flex flex-col gap-3 md:mt-0 md:flex-row md:items-center">
            {/* Lot Name Input */}
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="font-medium text-slate-500 mr-2 text-xs">NAME:</span>
                <input 
                    className="bg-transparent text-sm outline-none w-32 text-slate-800 font-medium placeholder:font-normal" 
                    placeholder="e.g. City Center"
                    value={lotName}
                    onChange={e => setLotName(e.target.value)}
                />
            </div>

            {/* Lot Address Input */}
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <MapPin size={14} className="text-slate-500 mr-2" />
                <input 
                    className="bg-transparent text-sm outline-none w-48 text-slate-800" 
                    placeholder="Full Address..."
                    value={lotAddress}
                    onChange={e => setLotAddress(e.target.value)}
                />
            </div>

            {/* Base Price Input */}
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="font-medium text-slate-500 mr-2 text-xs">PRICE:</span>
                <input 
                    type="number"
                    step="10"
                    min="0"
                    className="bg-transparent text-sm outline-none w-20 text-slate-800 font-medium" 
                    placeholder="50"
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                />
                <span className="text-xs text-slate-500 ml-1">Rs/hr</span>
            </div>

            {/* Release Buffer Input */}
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="font-medium text-slate-500 mr-2 text-xs">BUFFER:</span>
                <input 
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="bg-transparent text-sm outline-none w-16 text-slate-800 font-medium" 
                    placeholder="1.8"
                    value={releaseBuffer}
                    onChange={e => setReleaseBuffer(e.target.value)}
                />
                <span className="text-xs text-slate-500 ml-1">×</span>
            </div>

            <div className="h-8 w-px bg-slate-300 mx-1 hidden md:block"></div>

            {/* Select Location & Publish Button */}
            <button 
                onClick={handleOpenMapModal} 
                disabled={isSaving}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {selectedLocation ? (
                  <>
                    <Save size={16} />
                    Publish Layout
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    Select Location
                  </>
                )}
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-72 border-r bg-white p-5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 overflow-y-auto flex flex-col gap-6">
           
           {/* Dimensions Panel */}
           <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
             <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Settings size={14} /> Area Dimensions
             </h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Width (px)</label>
                    <input 
                        type="number" 
                        className="w-20 rounded border border-slate-300 p-1 text-right text-sm"
                        value={Math.round(canvasSize.width)}
                        onChange={(e) => setCanvasSize(p => ({...p, width: Number(e.target.value)}))}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Height (px)</label>
                    <input 
                        type="number" 
                        className="w-20 rounded border border-slate-300 p-1 text-right text-sm"
                        value={Math.round(canvasSize.height)}
                        onChange={(e) => setCanvasSize(p => ({...p, height: Number(e.target.value)}))}
                    />
                </div>
                <div className="text-[10px] text-slate-400 text-center mt-1">
                    Min: 200x200px | 1m = 20px
                </div>
             </div>
           </div>

           {/* Add Button */}
            <button
              onClick={addSpot}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 py-4 font-bold text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-400 hover:shadow-md"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-200 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus size={14} strokeWidth={3} />
              </div>
              Add Parking Spot
            </button>

          {/* Editing Panel */}
          {selectedSpotId !== null ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-200 rounded-xl border border-indigo-100 bg-white p-4 shadow-lg ring-1 ring-indigo-50">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-600">
                Selected: {spots.find((s) => s.id === selectedSpotId)?.label}
              </h3>
              
              <label className="text-[10px] font-bold text-slate-400">LABEL ID</label>
              <input 
                className="mb-4 mt-1 w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
                value={spots.find((s) => s.id === selectedSpotId)?.label || ''}
                onChange={(e) => {
                    const val = e.target.value;
                    setSpots(prev => prev.map(s => s.id === selectedSpotId ? {...s, label: val} : s));
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => rotateSpot(selectedSpotId)}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 active:translate-y-0.5"
                >
                  <RotateCw size={18} />
                  Rotate +45°
                </button>
                <button
                  onClick={() => {
                      setSpots(prev => prev.filter(s => s.id !== selectedSpotId));
                      setSelectedSpotId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border border-red-100 bg-red-50 py-3 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 hover:border-red-200 active:translate-y-0.5"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
             <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-400">Select a car to edit details</p>
             </div>
          )}
        </aside>

        {/* --- MAIN CANVAS --- */}
        <main className="relative flex-1 overflow-auto bg-slate-100 p-10" 
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setSelectedSpotId(null);
                    setGhostSpot(null);
                }
            }}
        >
          <div className="relative inline-block">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 transition-all ease-out duration-75"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                    backgroundSize: "20px 20px", // 1 meter grid dots
                }}
                onClick={(e) => {
                    if(e.target === e.currentTarget) setSelectedSpotId(null);
                }}
              >
                {/* Measurement Indicators */}
                <div className="absolute top-0 left-0 -mt-6 text-xs font-mono text-slate-400">0m</div>
                <div className="absolute top-0 left-full -ml-4 -mt-6 text-xs font-mono text-slate-400">{(canvasSize.width/20).toFixed(0)}m</div>
                <div className="absolute top-full left-0 -ml-8 -mt-3 text-xs font-mono text-slate-400">{(canvasSize.height/20).toFixed(0)}m</div>

                {/* Resize Handle */}
                <div 
                    onMouseDown={startResizing}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 cursor-nwse-resize rounded-tl-xl shadow-lg z-50 flex items-center justify-center transition-colors"
                    title="Drag to resize area"
                >
                    <MoveDiagonal size={16} className="text-white" />
                </div>

                {spots.map((spot) => (
                <DraggableSpot
                    key={spot.id}
                    spot={spot}
                    isSelected={selectedSpotId === spot.id}
                    onSelect={() => {
                        setSelectedSpotId(spot.id);
                        setSpots(prev => [...prev.filter(s => s.id !== spot.id), spot]);
                    }}
                    onDragStop={(e, data) => handleDragStop(spot.id, data)}
                />
                ))}

                {ghostSpot && (
                    <DraggableSpot 
                        spot={ghostSpot} 
                        isGhost={true}
                        onClickGhost={() => {
                            const newRealSpot = { ...ghostSpot, id: nextId };
                            setSpots([...spots, newRealSpot]);
                            setNextId(nextId + 1);
                        }}
                    />
                )}
            </div>
          </div>
        </main>
      </div>

      {/* MAP SELECTION MODAL */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[600px] m-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Select Parking Location</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Click on the map to place your parking lot marker
                  </p>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              
              {selectedLocation && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <MapPin size={14} className="text-emerald-600" />
                  <span className="font-mono">
                    Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full pt-28 pb-20"></div>

            {/* Modal Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {selectedLocation 
                    ? "Location selected! Click confirm to save." 
                    : "Click anywhere on the map to select your parking location"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLocation}
                    disabled={!selectedLocation || isSaving}
                    className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Confirm & Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}