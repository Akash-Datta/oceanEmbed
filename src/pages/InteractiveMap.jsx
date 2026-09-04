import "leaflet/dist/leaflet.css";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import ControlBar from "../components/ControlBar";
import DynamicGrid from "../components/DynamicGrid";
import LocationMarker, {
  MapController,
  MapTouchController,
} from "../components/LocationMarker";
import DataSidePanel from "../components/DataSidePanel";
import SpatialDistribution from "../components/SpatialDistribution";
import AboutAuthors from "../components/AboutAuthors";
import WebGuidelines from "../components/WebGuidelines";

import {
  parseCoordinate,
  formatLatitude,
  formatLongitude,
  snapToNearestOcean,
} from "../utils/coordinateUtils";

import "../styles/ocean.css";

function MapInvalidator({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map, trigger]);
  return null;
}

function MapInitializer({ setMap, onMapLoaded }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMap(map);
      if (onMapLoaded) {
        onMapLoaded();
      }
    }
  }, [map, setMap, onMapLoaded]);
  return null;
}

export default function InteractiveMap({ onMapLoaded }) {
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [currentSeaName, setCurrentSeaName] = useState("");
  const [mapInstance, setMapInstance] = useState(null);

  // Initialize start date by default to 4 days prior to today (e.g., August 31 when today is September 4)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Initialize end date by default to today
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [depth, setDepth] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [showVisualization, setShowVisualization] = useState(false);
  const [activeLayerMode, setActiveLayerMode] = useState(false);
  const [initialFocus, setInitialFocus] = useState(null);
  const [showAboutPanel, setShowAboutPanel] = useState(false);
  const [showGuidelinesPanel, setShowGuidelinesPanel] = useState(false);
  const [notification, setNotification] = useState(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.finishOceanBootLoader === "function"
    ) {
      window.finishOceanBootLoader();
    }
  }, []);

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleMapReady = useCallback(() => {
    setIsMapLoaded(true);
    if (onMapLoaded) {
      onMapLoaded();
    }
  }, [onMapLoaded]);

  const validateAndSetStartDate = (value) => {
    if (!value) {
      setStartDate("");
      setEndDate("");
      return;
    }

    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedToday = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (selectedDate > today) {
      triggerNotification(`You cannot enter future dates beyond today (${formattedToday}).`);
      setStartDate("");
      setEndDate("");
      return;
    }

    const diffTime = today - selectedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 2) {
      const targetDateStr = selectedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      triggerNotification(`Selected date (${targetDateStr}) is restricted: Historical archive data for this date is currently pending synchronization.`);
      setStartDate("");
      setEndDate("");
      return;
    }

    setStartDate(value);
  };

  useEffect(() => {
    if (!startDate) {
      setEndDate("");
      return;
    }

    const date = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      setEndDate("");
      return;
    }

    date.setDate(date.getDate() + 4);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    setEndDate(`${year}-${month}-${day}`);
  }, [startDate]);

  useEffect(() => {
    if (!position) {
      return;
    }

    setLatitude(formatLatitude(position.lat));
    setLongitude(formatLongitude(position.lng));
    setTargetPosition(position);
  }, [position]);

  const handleSeaNameResolved = useCallback((name) => {
    setCurrentSeaName(name);
  }, []);

  const openDashboard = (focusType) => {
    setInitialFocus(focusType);
    setShowVisualization(true);
    setActiveLayerMode(false);
  };

  const handleBackToMap = () => {
    setShowVisualization(false);
    setActiveLayerMode(false);
    setDepth("");
    setInitialFocus(null);
  };

  const handleClosePanel = () => {
    setPosition(null);
    setTargetPosition(null);
    setLatitude("");
    setLongitude("");
    setCurrentSeaName("");
  };

  const handleGo = async () => {
    if (!startDate) {
      triggerNotification("Please enter a valid starting date first.");
      return;
    }

    if (depth && !latitude && !longitude) {
      setActiveLayerMode(true);
      setPosition(null);
      setTargetPosition(null);
      return;
    }

    const lat = parseCoordinate(latitude, "latitude");
    const lng = parseCoordinate(longitude, "longitude");

    if (lat === null || lng === null) {
      triggerNotification("Please enter a valid latitude and longitude.");
      return;
    }

    try {
      const snapped = snapToNearestOcean(lat, lng);

      if (snapped.failed) {
        triggerNotification("Unable to find a nearby ocean location. Please try another coordinate.");
        return;
      }

      if (snapped.redirected) {
        triggerNotification("Land coordinate detected. Redirecting location to the nearest sea coordinates.");
      }

      const newPos = {
        lat: snapped.lat,
        lng: snapped.lng,
        isOnLand: false,
      };

      setPosition(newPos);
      setTargetPosition(newPos);
    } catch (error) {
      console.error("Ocean redirection failed:", error);
      triggerNotification("Unable to find a nearby ocean location. Please try another coordinate.");
    }
  };

  const isLocationDisabled = !startDate || Boolean(depth);

  const showSidePanel = Boolean(
    position &&
    startDate &&
    !position.isOnLand
  );

  const memoizedMapContainer = useMemo(() => (
    <MapContainer
      className="ocean-map"
      bounds={[
        [7, 56],
        [25, 99],
      ]}
      minZoom={3}
      maxZoom={12}
      zoomControl={false}
      attributionControl={false}
      worldCopyJump={true}
      maxBounds={[
        [-90, -Infinity],
        [90, Infinity],
      ]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        url={`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAP_API_KEY}`}
      />
      <MapTouchController />
      <DynamicGrid />
      <LocationMarker
        position={position}
        setPosition={setPosition}
        startDate={startDate}
        onSeaNameResolved={handleSeaNameResolved}
        triggerNotification={triggerNotification}
      />
      <MapController targetPosition={targetPosition} />
      <MapInitializer setMap={setMapInstance} onMapLoaded={handleMapReady} />
      <MapInvalidator trigger={showAboutPanel || showGuidelinesPanel} />
    </MapContainer>
  ), [handleMapReady, position, targetPosition, startDate, handleSeaNameResolved, triggerNotification, showAboutPanel, showGuidelinesPanel]);

  return (
    <div className="ocean-page">
      <nav className="ocean-navbar">
        <div className="navbar-brand">
          <h2 className="ocean-title">Spatiotemporal Ocean Temperature Profiling</h2>
          <div className="ocean-subtitle">
            Interactive marine temperature intelligence • Spatial mapping • Depth-wise profiling
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="about-authors-nav-btn"
            onClick={() => setShowGuidelinesPanel(true)}
            disabled={showGuidelinesPanel || showAboutPanel}
            style={{ opacity: (showGuidelinesPanel || showAboutPanel) ? 0.6 : 1, cursor: (showGuidelinesPanel || showAboutPanel) ? "not-allowed" : "pointer" }}
          >
            📖 Web Guidelines
          </button>
          <button
            className="about-authors-nav-btn"
            onClick={() => setShowAboutPanel(true)}
            disabled={showAboutPanel || showGuidelinesPanel}
            style={{ opacity: (showAboutPanel || showGuidelinesPanel) ? 0.6 : 1, cursor: (showAboutPanel || showGuidelinesPanel) ? "not-allowed" : "pointer" }}
          >
            👥 About Authors
          </button>
        </div>
      </nav>

      {notification && (
        <div className="ocean-notification-banner">
          <span>⚠️ {notification}</span>
        </div>
      )}

      <div className="ocean-map-wrapper">
        {memoizedMapContainer}

        {mapInstance && (
          <div className="custom-zoom-controls" onClick={(e) => e.stopPropagation()}>
            <button
              className="custom-zoom-btn"
              type="button"
              onClick={() => mapInstance.zoomIn()}
              title="Zoom In"
            >
              +
            </button>
            <button
              className="custom-zoom-btn"
              type="button"
              onClick={() => mapInstance.zoomOut()}
              title="Zoom Out"
            >
              −
            </button>
          </div>
        )}

        {activeLayerMode ? (
          <div className="map-layer-controls">
            <div className="layer-buttons">
              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboard("argo");
                }}
              >
                ARGO
              </button>

              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboard("convformer");
                }}
              >
                Prediction
              </button>

              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboard("error");
                }}
              >
                Error
              </button>
            </div>

            <button
              className="back-to-map-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLayerMode(false);
              }}
            >
              ← Cancel
            </button>
          </div>
        ) : (
          <ControlBar
            startDate={startDate}
            setStartDate={validateAndSetStartDate}
            endDate={endDate}
            depth={depth}
            setDepth={setDepth}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            handleGo={handleGo}
            isLocationDisabled={isLocationDisabled}
            showSidePanel={showSidePanel}
          />
        )}

        {showSidePanel && (
          <DataSidePanel
            position={position}
            depth={depth}
            seaName={currentSeaName}
            onClose={handleClosePanel}
          />
        )}
      </div>

      {showVisualization && (
        <SpatialDistribution
          depth={depth}
          initialFocus={initialFocus}
          onBack={handleBackToMap}
        />
      )}

      {showAboutPanel && (
        <AboutAuthors onClose={() => setShowAboutPanel(false)} />
      )}

      {showGuidelinesPanel && (
        <WebGuidelines onClose={() => setShowGuidelinesPanel(false)} />
      )}
    </div>
  );
}