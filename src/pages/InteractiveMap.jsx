import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import ControlBar from "../components/ControlBar";
import DynamicGrid from "../components/DynamicGrid";
import LocationMarker, { MapController, MapTouchController } from "../components/LocationMarker";
import DataSidePanel from "../components/DataSidePanel";
import SpatialDistribution from "../components/SpatialDistribution";
import { parseCoordinate, formatLatitude, formatLongitude, snapToNearestOcean } from "../utils/coordinateUtils";

import "../styles/ocean.css";

export default function InteractiveMap() {
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [depth, setDepth] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [showVisualization, setShowVisualization] = useState(false);
  const [activeLayerMode, setActiveLayerMode] = useState(false);
  const [initialFocus, setInitialFocus] = useState(null);

  const showSidePanel = Boolean(position && startDate);
  const isLocationDisabled = !startDate || Boolean(depth);

  // EXACT 3-DAY GAP PRESERVED
  useEffect(() => {
    if (!startDate) return setEndDate("");
    const date = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return setEndDate("");
    date.setDate(date.getDate() + 3); 
    setEndDate(date.toISOString().split("T")[0]);
  }, [startDate]);

  useEffect(() => {
    if (position) {
      setLatitude(formatLatitude(position.lat));
      setLongitude(formatLongitude(position.lng));
    }
  }, [position]);

  const handleGo = () => {
    if (depth && !latitude && !longitude) {
      setActiveLayerMode(true);
      setPosition(null); 
      return;
    }

    const lat = parseCoordinate(latitude, "latitude");
    const lng = parseCoordinate(longitude, "longitude");

    if (lat === null || lng === null) {
      alert("Please enter a valid latitude and longitude.");
      return;
    }
    
    const snapped = snapToNearestOcean(lat, lng);
    
    if (snapped.lat !== lat || snapped.lng !== lng) {
      alert("Location is on land. Redirecting to nearest ocean coordinate.");
    }

    const newPos = { lat: snapped.lat, lng: snapped.lng };
    setPosition(newPos);
    setTargetPosition(newPos);
  };

  const openDashboard = (focusType) => {
    setInitialFocus(focusType);
    setShowVisualization(true);
    setActiveLayerMode(false);
  };

  const handleBackToMap = () => {
    setShowVisualization(false);
    setActiveLayerMode(false); 
  };

  const handleClosePanel = () => {
    setPosition(null);
    setTargetPosition(null);
    setLatitude("");
    setLongitude("");
  };

  return (
    <div className="ocean-page">
      <h2 className="ocean-title">Spatiotemporal Ocean Temperature Profiling</h2>
      <div className="ocean-subtitle">
        Interactive marine temperature intelligence • Spatial mapping • Depth-wise profiling
      </div>

      {!showVisualization ? (
        <div className="ocean-map-wrapper">
          <MapContainer
            className="ocean-map"
            center={[15, 75]}   /* RESTORED: Bay of Bengal / Arabian Sea Focus */
            zoom={5.5}          /* RESTORED: Original Zoom Level */
            minZoom={3}
            maxZoom={12}
            attributionControl={false}
            worldCopyJump={true} 
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTouchController />
            <DynamicGrid />
            <LocationMarker position={position} setPosition={setPosition} />
            <MapController targetPosition={targetPosition} />
          </MapContainer>

          {activeLayerMode ? (
            <div className="map-layer-controls">
              <div className="layer-buttons">
                <button className="layer-btn" onClick={(e) => { e.stopPropagation(); openDashboard('argo'); }}>ARGO</button>
                <button className="layer-btn" onClick={(e) => { e.stopPropagation(); openDashboard('convformer'); }}>Prediction</button>
                <button className="layer-btn" onClick={(e) => { e.stopPropagation(); openDashboard('error'); }}>Error</button>
              </div>
              <button className="back-to-map-btn" onClick={(e) => { e.stopPropagation(); setActiveLayerMode(false); }}>
                ← Cancel
              </button>
            </div>
          ) : (
            <ControlBar
              startDate={startDate} setStartDate={setStartDate}
              endDate={endDate} depth={depth} setDepth={setDepth}
              latitude={latitude} setLatitude={setLatitude}
              longitude={longitude} setLongitude={setLongitude}
              handleGo={handleGo} isLocationDisabled={isLocationDisabled}
              showSidePanel={showSidePanel} 
            />
          )}
          
          {showSidePanel && (
            <DataSidePanel position={position} depth={depth} onClose={handleClosePanel} />
          )}
        </div>
      ) : (
        <SpatialDistribution depth={depth} initialFocus={initialFocus} onBack={handleBackToMap} />
      )}
    </div>
  );
}