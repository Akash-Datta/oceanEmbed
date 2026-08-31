import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import ControlBar from "../components/ControlBar";
import DynamicGrid from "../components/DynamicGrid";
import LocationMarker, { MapController, MapTouchController } from "../components/LocationMarker";
import TemperatureProfile from "../components/TemperatureProfile";
import DataSidePanel from "../components/DataSidePanel";
import SpatialDistribution from "../components/SpatialDistribution";
import { parseCoordinate, formatLatitude, formatLongitude } from "../utils/coordinateUtils";
import { dummyTemperatureData } from "../data/dummyOceanData";

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
    
    const newPos = { lat, lng };
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

  const surfaceTemperature = dummyTemperatureData[0]?.argo || 0;

  return (
    <div className="ocean-page">
      <h2 className="ocean-title">Spatiotemporal Ocean Temperature Profiling</h2>
      <div className="ocean-subtitle">
        Interactive marine temperature intelligence • Spatial mapping • Depth-wise profiling
      </div>

      {!showVisualization ? (
        <>
          <div className="ocean-map-wrapper">
            <MapContainer
              className="ocean-map"
              center={[15, 75]}
              zoom={5.5}
              minZoom={5}
              maxZoom={12}
              maxBounds={[[-5, 50], [30, 100]]}
              maxBoundsViscosity={1.0}
              attributionControl={false}
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
                  {/* e.stopPropagation() FIXES THE BUBBLING ISSUE */}
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
              <DataSidePanel position={position} depth={depth} onClose={() => setPosition(null)} />
            )}
          </div>

          {position && (
            <div className="analytics-section">
              <div className="analytics-card">
                <div className="analytics-header">
                  <div>
                    <h3 className="analytics-title">🌡️ Vertical Temperature Profile (0m - 1000m)</h3>
                    <p className="analytics-description">Vertical profile for {position.lat.toFixed(6)}° Lat, {position.lng.toFixed(6)}° Lng</p>
                  </div>
                  <div className="live-badge"><span className="live-dot"></span>DEMO DATA</div>
                </div>
                <div className="chart-container">
                  <TemperatureProfile selectedDepth={depth} profileData={dummyTemperatureData} />
                </div>
              </div>

              <div className="stats-column">
                <div className="stat-card">
                  <div className="stat-icon">🌡️</div>
                  <div className="stat-label">Surface Temp (ARGO)</div>
                  <div className="stat-value">{surfaceTemperature}<span className="stat-unit">°C</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🌊</div>
                  <div className="stat-label">Maximum Profile</div>
                  <div className="stat-value">1000<span className="stat-unit">m</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-label">Profile Samples</div>
                  <div className="stat-value">{dummyTemperatureData.length}<span className="stat-unit">points</span></div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <SpatialDistribution depth={depth} initialFocus={initialFocus} onBack={handleBackToMap} />
      )}
    </div>
  );
}