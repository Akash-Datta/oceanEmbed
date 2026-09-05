import "leaflet/dist/leaflet.css";
import { useLanguage } from "../context/LanguageContext";
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
import LanguageSelector from "../components/LanguageSelector";

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

const getFormattedDateOffset = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocaleCode = (lang) => {
  const localeMap = {
    en: "en-US",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    te: "te-IN",
    ta: "ta-IN",
    gu: "gu-IN",
    ur: "ur-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    or: "or-IN",
    as: "as-IN",
    ne: "ne-NP",
    sd: "sd-IN",
    sa: "sa-IN",
  };
  return localeMap[lang] || `${lang}-IN`;
};

export default function InteractiveMap({ onMapLoaded }) {
  const { t, language } = useLanguage();
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [currentSeaName, setCurrentSeaName] = useState("");
  const [mapInstance, setMapInstance] = useState(null);

  // Default dynamic window: 3-day interval span (e.g., -3 days ago to today)
  const [startDate, setStartDate] = useState(() => getFormattedDateOffset(-3));
  const [endDate, setEndDate] = useState(() => getFormattedDateOffset(0));

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
      setStartDate(getFormattedDateOffset(-3));
      setEndDate(getFormattedDateOffset(0));
      return;
    }

    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const localeCode = getLocaleCode(language);
    const formattedToday = today.toLocaleDateString(localeCode, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (selectedDate > today) {
      const baseMsg = t("futureDateError") || "You cannot enter future dates beyond today";
      triggerNotification(`${baseMsg} (${formattedToday}).`);
      setStartDate(getFormattedDateOffset(-3));
      setEndDate(getFormattedDateOffset(0));
      return;
    }

    const diffTime = today - selectedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Enforce the 3-day synchronization lag gap (dates within the last 3 days or future/recent restricted window)
    if (diffDays >= 0 && diffDays < 3) {
      const targetDateStr = selectedDate.toLocaleDateString(localeCode, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const restrictedMsg = t("restrictedDateError") || "Selected date is restricted: Historical archive data for dates within the last 3 days is currently pending synchronization.";
      triggerNotification(`(${targetDateStr}) ${restrictedMsg}`);
      setStartDate(getFormattedDateOffset(-3));
      setEndDate(getFormattedDateOffset(0));
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

    date.setDate(date.getDate() + 3);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = date > today ? today : date;

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    
    setEndDate(`${year}-${month}-${day}`);
  }, [startDate]);

  useEffect(() => {
    if (!position) {
      return;
    }

    setLatitude(formatLatitude(position.lat, language));
    setLongitude(formatLongitude(position.lng, language));
    setTargetPosition(position);
  }, [position, language]);

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
      triggerNotification(t("validStartDatePrompt") || "Please enter a valid starting date first.");
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
      triggerNotification(t("validLatLonPrompt") || "Please enter a valid latitude and longitude.");
      return;
    }

    try {
      const snappedResult = snapToNearestOcean(lat, lng);
      const snapped = snappedResult instanceof Promise ? await snappedResult : snappedResult;

      if (!snapped || snapped.failed) {
        triggerNotification(t("oceanLocFailed") || "Unable to find a nearby ocean location. Please try another coordinate.");
        return;
      }

      if (snapped.redirected) {
        triggerNotification(t("landRedirect") || "Land coordinate detected. Redirecting location to the nearest sea coordinates.");
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
      triggerNotification(t("oceanLocFailed") || "Unable to find a nearby ocean location. Please try another coordinate.");
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
        depth={depth}
        onSeaNameResolved={handleSeaNameResolved}
        triggerNotification={triggerNotification}
      />
      <MapController targetPosition={targetPosition} />
      <MapInitializer setMap={setMapInstance} onMapLoaded={handleMapReady} />
      <MapInvalidator trigger={showAboutPanel || showGuidelinesPanel} />
    </MapContainer>
  ), [handleMapReady, position, targetPosition, startDate, depth, handleSeaNameResolved, triggerNotification, showAboutPanel, showGuidelinesPanel]);

  return (
    <div className="ocean-page">
      <nav className="ocean-navbar">
        <div className="navbar-brand">
          <h2 className="ocean-title">{t("title")}</h2>
          <div className="ocean-subtitle">
            {t("subtitle")}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <LanguageSelector />
          <button
            className="about-authors-nav-btn"
            onClick={() => setShowGuidelinesPanel(true)}
            disabled={showGuidelinesPanel || showAboutPanel}
            style={{ opacity: (showGuidelinesPanel || showAboutPanel) ? 0.6 : 1, cursor: (showGuidelinesPanel || showAboutPanel) ? "not-allowed" : "pointer" }}
          >
            {t("webGuidelines")}
          </button>
          <button
            className="about-authors-nav-btn"
            onClick={() => setShowAboutPanel(true)}
            disabled={showAboutPanel || showGuidelinesPanel}
            style={{ opacity: (showAboutPanel || showGuidelinesPanel) ? 0.6 : 1, cursor: (showAboutPanel || showGuidelinesPanel) ? "not-allowed" : "pointer" }}
          >
            {t("aboutAuthors")}
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
                {t("argo")}
              </button>

              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboard("convformer");
                }}
              >
                {t("prediction")}
              </button>

              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboard("error");
                }}
              >
                {t("error")}
              </button>
            </div>

            <button
              className="back-to-map-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLayerMode(false);
              }}
            >
              {t("cancel")}
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