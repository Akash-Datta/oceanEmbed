import "leaflet/dist/leaflet.css";
<<<<<<< HEAD

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
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

import {
  parseCoordinate,
  formatLatitude,
  formatLongitude,
  snapToNearestOcean,
} from "../utils/coordinateUtils";

import "../styles/ocean.css";

export default function InteractiveMap({ onMapLoaded }) {
  // ============================================================
  // MODEL PROFILE DATA
  // ============================================================
  const [modelProfile, setModelProfile] = useState([]);

  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [currentSeaName, setCurrentSeaName] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [depth, setDepth] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [showVisualization, setShowVisualization] =
    useState(false);

  const [activeLayerMode, setActiveLayerMode] =
    useState(false);

  const [initialFocus, setInitialFocus] =
    useState(null);

  const [showAboutPanel, setShowAboutPanel] =
    useState(false);

  const [notification, setNotification] =
    useState(null);

  const [isMapLoaded, setIsMapLoaded] =
    useState(false);

  // ============================================================
  // BOOT LOADER
  // ============================================================
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.finishOceanBootLoader === "function"
    ) {
      window.finishOceanBootLoader();
    }
  }, []);

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const triggerNotification = (message) => {
    setNotification(message);

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ============================================================
  // MAP READY
  // ============================================================
  const handleMapReady = useCallback(() => {
    setIsMapLoaded(true);

    if (onMapLoaded) {
      onMapLoaded();
    }
  }, [onMapLoaded]);

  // ============================================================
  // END DATE = START DATE + 4 DAYS
  // ============================================================
  useEffect(() => {
    if (!startDate) {
      setEndDate("");
      return;
    }

    const date = new Date(
      `${startDate}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      setEndDate("");
      return;
    }

    date.setDate(date.getDate() + 4);

    setEndDate(
      date.toISOString().split("T")[0]
    );
  }, [startDate]);

  // ============================================================
  // UPDATE LAT/LNG FIELDS WHEN MARKER MOVES
  // ============================================================
  useEffect(() => {
    if (!position) {
      return;
    }

    setLatitude(
      formatLatitude(position.lat)
    );

    setLongitude(
      formatLongitude(position.lng)
    );
  }, [position]);

  // ============================================================
  // SEA NAME
  // ============================================================
  const handleSeaNameResolved =
    useCallback((name) => {
      setCurrentSeaName(name);
    }, []);

  // ============================================================
  // FETCH MODEL PROFILE
  // ============================================================
  const fetchProfile = async (lat, lng) => {
    if (!startDate) {
      triggerNotification(
        "Please enter the starting date first."
      );
      return;
    }

    // ----------------------------------------------------------
    // Model grid = 0.25° × 0.25°
    // ----------------------------------------------------------
    const swLat =
      Math.floor(lat / 0.25) * 0.25;

    const swLon =
      Math.floor(lng / 0.25) * 0.25;

    const gridId =
      `box_${swLat.toFixed(2)}_${swLon.toFixed(2)}`;

    console.log(
      "Profile request location:",
      lat,
      lng
    );

    console.log(
      "Grid ID:",
      gridId
    );

    console.log(
      "Forecast date:",
      startDate
    );

    try {
      const response = await fetch(
        "http://localhost:8000/api/profile",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            grid_id: gridId,
            forecast_date: startDate,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Profile data:",
        data
      );

      // --------------------------------------------------------
      // Backend returned an error
      // --------------------------------------------------------
      if (
        !response.ok ||
        data.status !== "success"
      ) {
        console.error(
          "Profile API error:",
          data
        );

        setModelProfile([]);

        triggerNotification(
          data.error ||
            "Failed to fetch temperature profile."
        );

        return;
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------
      setModelProfile(
        data.profile || []
      );

    } catch (error) {
      console.error(
        "Profile connection error:",
        error
      );

      setModelProfile([]);

      triggerNotification(
        "Unable to connect to the ocean model."
      );
    }
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  const openDashboard = (
    focusType
  ) => {
    setInitialFocus(focusType);
    setShowVisualization(true);
    setActiveLayerMode(false);
  };

  // ============================================================
  // BACK TO MAP
  // ============================================================
  const handleBackToMap = () => {
    setShowVisualization(false);
    setActiveLayerMode(false);
    setDepth("");
    setInitialFocus(null);
  };

  // ============================================================
  // CLOSE LOCATION PANEL
  // ============================================================
  const handleClosePanel = () => {
    setPosition(null);
    setTargetPosition(null);

    setLatitude("");
    setLongitude("");

    setCurrentSeaName("");

    // Clear old graph data
    setModelProfile([]);
  };

  // ============================================================
  // GO BUTTON
  // ============================================================
  const handleGo = async () => {
    if (!startDate) {
      triggerNotification(
        "Please enter the starting date first."
      );
      return;
    }

    // ----------------------------------------------------------
    // Depth-only visualization mode
    // ----------------------------------------------------------
    if (
      depth &&
      !latitude &&
      !longitude
    ) {
      setActiveLayerMode(true);

      setPosition(null);
      setTargetPosition(null);

      return;
    }

    // ----------------------------------------------------------
    // Parse coordinates
    // ----------------------------------------------------------
    const lat = parseCoordinate(
      latitude,
      "latitude"
    );

    const lng = parseCoordinate(
      longitude,
      "longitude"
    );

    if (
      lat === null ||
      lng === null
    ) {
      triggerNotification(
        "Please enter a valid latitude and longitude."
      );
      return;
    }

    try {
      // --------------------------------------------------------
      // Snap to nearest ocean
      // --------------------------------------------------------
      const snapped =
        snapToNearestOcean(
          lat,
          lng
        );

      if (snapped.failed) {
        triggerNotification(
          "Unable to find a nearby ocean location. Please try another coordinate."
        );

        return;
      }

      if (snapped.redirected) {
        triggerNotification(
          "Land coordinate detected. Redirecting location to the nearest sea coordinates."
        );
      }

      // --------------------------------------------------------
      // Set marker
      // --------------------------------------------------------
      const newPos = {
        lat: snapped.lat,
        lng: snapped.lng,
        isOnLand: false,
      };

      setPosition(newPos);
      setTargetPosition(newPos);

      // --------------------------------------------------------
      // Fetch model profile
      // --------------------------------------------------------
      await fetchProfile(
        snapped.lat,
        snapped.lng
      );

    } catch (error) {
      console.error(
        "Ocean redirection failed:",
        error
      );

      triggerNotification(
        "Unable to find a nearby ocean location. Please try another coordinate."
      );
    }
  };

  // ============================================================
  // UI CONDITIONS
  // ============================================================
  const isLocationDisabled =
    !startDate ||
    Boolean(depth);

  const showSidePanel =
    Boolean(
      position &&
      startDate &&
      !position.isOnLand
    );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="ocean-page">

      {/* ======================================================
          NAVBAR
      ====================================================== */}
      <nav className="ocean-navbar">

        <div className="navbar-brand">

          <h2 className="ocean-title">
            Spatiotemporal Ocean Temperature Profiling
          </h2>

          <div className="ocean-subtitle">
            Interactive marine temperature intelligence •
            Spatial mapping • Depth-wise profiling
          </div>

        </div>

        <button
          className="about-authors-nav-btn"
          onClick={() =>
            setShowAboutPanel(true)
          }
        >
          👥 About Authors
        </button>

      </nav>

      {/* ======================================================
          NOTIFICATION
      ====================================================== */}
      {notification && (
        <div className="ocean-notification-banner">

          <span>
            ⚠️ {notification}
          </span>

        </div>
      )}

      {/* ======================================================
          MAP
      ====================================================== */}
      <div className="ocean-map-wrapper">

        <MapContainer
          className="ocean-map"

          bounds={[
            [7, 56],
            [25, 99],
          ]}

          minZoom={3}
          maxZoom={12}

          attributionControl={false}

          worldCopyJump={true}

          maxBounds={[
            [-90, -Infinity],
            [90, Infinity],
          ]}

          maxBoundsViscosity={1.0}

          whenReady={handleMapReady}
        >

          <TileLayer
            url={`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAP_API_KEY}`}
          />

          <MapTouchController />

          <DynamicGrid />

          {/* ==================================================
              LOCATION MARKER
          ================================================== */}
          <LocationMarker
            position={position}

            setPosition={
              setPosition
            }

            startDate={
              startDate
            }

            onSeaNameResolved={
              handleSeaNameResolved
            }

            triggerNotification={
              triggerNotification
            }

            onProfileRequest={
              fetchProfile
            }
          />

          <MapController
            targetPosition={
              targetPosition
            }
          />

        </MapContainer>

        {/* ====================================================
            LAYER MODE
        ==================================================== */}
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

          /* ==================================================
             CONTROL BAR
          ================================================== */

          <ControlBar
            startDate={
              startDate
            }

            setStartDate={
              setStartDate
            }

            endDate={
              endDate
            }

            depth={
              depth
            }

            setDepth={
              setDepth
            }

            latitude={
              latitude
            }

            setLatitude={
              setLatitude
            }

            longitude={
              longitude
            }

            setLongitude={
              setLongitude
            }

            handleGo={
              handleGo
            }

            isLocationDisabled={
              isLocationDisabled
            }

            showSidePanel={
              showSidePanel
            }
          />

        )}

        {/* ====================================================
            LOCATION DATA PANEL
        ==================================================== */}
        {showSidePanel && (

          <DataSidePanel
            position={
              position
            }

            depth={
              depth
            }

            seaName={
              currentSeaName
            }

            profileData={
              modelProfile
            }

            onClose={
              handleClosePanel
            }
          />

        )}

      </div>

      {/* ======================================================
          SPATIAL VISUALIZATION
      ====================================================== */}
      {showVisualization && (

        <SpatialDistribution
          depth={
            depth
          }

          initialFocus={
            initialFocus
          }

          onBack={
            handleBackToMap
          }
        />

      )}

      {/* ======================================================
          ABOUT AUTHORS
      ====================================================== */}
      {showAboutPanel && (

        <AboutAuthors
          onClose={() =>
            setShowAboutPanel(false)
          }
        />

      )}

    </div>
  );
=======
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ControlBar from "../components/ControlBar";
import DynamicGrid from "../components/DynamicGrid";
import LocationMarker, { MapController, MapTouchController } from "../components/LocationMarker";
import DataSidePanel from "../components/DataSidePanel";
import ParameterDashboard from "../components/ParameterDashboard";
import AllHeatMapsDashboard from "../components/allHeatMapsDashboard";
import SpatialDistribution from "../components/SpatialDistribution";
import AboutAuthors from "../components/AboutAuthors";
import WebGuidelines from "../components/WebGuidelines";
import LanguageSelector from "../components/LanguageSelector";

import { parseCoordinate, formatLatitude, formatLongitude, snapToNearestOcean } from "../utils/coordinateUtils";
import { getTileUrl } from "../utils/mapTiles";
import "../styles/ocean.css";
import "../styles/cyberpunk.css";

const getFormattedDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isOutsideBounds = (lat, lng) => {
  const latMin = 0.0;
  const latMax = 24.75;
  const lonMin = 50.0;
  const lonMax = 89.75; 
  return lat < latMin || lat > latMax || lng < lonMin || lng > lonMax;
};

// Controls mobile-specific initialization limits
function MobileBoundsController({ isMobile, isCurrentLocationOutside }) {
  const map = useMap();
  useEffect(() => {
    if (isMobile && !isCurrentLocationOutside) {
      // Expanded bounds to cover Arabian Peninsula, South India, and Andaman/Nicobar
      const bounds = [[0.0, 50.0], [24.75, 95.0]];
      map.fitBounds(bounds, { padding: [5, 5], animate: false });
    }
  }, [isMobile, isCurrentLocationOutside, map]);
  return null;
}

export default function InteractiveMap({ onMapLoaded }) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.finishOceanBootLoader === "function") window.finishOceanBootLoader();
  }, []);

  const [mapInstance, setMapInstance] = useState(null);
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  
  const [date, setDate] = useState("2017-01-01");
  const [activeCenter, setActiveCenter] = useState({ lat: 12.375, lng: 69.875 });

  const [parameter, setParameter] = useState("");
  const [submittedParameter, setSubmittedParameter] = useState("");
  const [depth, setDepth] = useState("");
  
  const [userResolution, setUserResolution] = useState("");
  
  const [currentSeaName, setCurrentSeaName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notification, setNotification] = useState(null);
  
  const [showAllMapsView, setShowAllMapsView] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [initialFocus, setInitialFocus] = useState(null);
  const [showAboutPanel, setShowAboutPanel] = useState(false);
  const [showGuidelinesPanel, setShowGuidelinesPanel] = useState(false);

  const [isGeneratingGrid, setIsGeneratingGrid] = useState(false);
  const [activeGridData, setActiveGridData] = useState(null);

  const triggerNotification = useCallback((message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const todayStr = getFormattedDate(new Date());
  
  const currentCoordsForCheck = useMemo(() => {
    if (position) return { lat: position.lat, lng: position.lng };
    if (latitude !== "" && longitude !== "") {
      const parsedLat = parseCoordinate(latitude, "latitude");
      const parsedLng = parseCoordinate(longitude, "longitude");
      if (parsedLat !== null && parsedLng !== null) return { lat: parsedLat, lng: parsedLng };
    }
    return activeCenter;
  }, [position, latitude, longitude, activeCenter]);

  const isCurrentLocationOutside = isOutsideBounds(currentCoordsForCheck.lat, currentCoordsForCheck.lng);
  const minDate = isCurrentLocationOutside ? undefined : "2017-01-01";
  const maxDate = isCurrentLocationOutside ? todayStr : "2018-12-31";

  const activeResolution = isCurrentLocationOutside ? parseFloat(userResolution) || 0.25 : 0.25;

  const isMapZoomLocked = Boolean(parameter) || Boolean(depth);
  const blockLocationSelection = Boolean(parameter) || (Boolean(depth) && !position);

  useEffect(() => {
    if (isCurrentLocationOutside) {
      setDate(todayStr);
    } else {
      if (date < "2017-01-01" || date > "2018-12-31") setDate("2017-01-01");
    }
  }, [isCurrentLocationOutside]);

  const resolveCurrentCenter = useCallback(() => {
    if (position) return { lat: position.lat, lng: position.lng };
    if (latitude !== "" && longitude !== "") {
      const lat = parseCoordinate(latitude, "latitude");
      const lng = parseCoordinate(longitude, "longitude");
      if (lat !== null && lng !== null) return { lat, lng };
    }
    if (mapInstance) {
      const c = mapInstance.getCenter();
      const normLng = (((c.lng + 180) % 360) + 360) % 360 - 180;
      return { lat: parseFloat(c.lat.toFixed(4)), lng: parseFloat(normLng.toFixed(4)) };
    }
    return activeCenter;
  }, [position, latitude, longitude, mapInstance, activeCenter]);

  useEffect(() => {
    if (position) {
      setActiveCenter({ lat: position.lat, lng: position.lng });
    }
  }, [position]);

  useEffect(() => {
    if (!submittedParameter && !showAllMapsView && !showVisualization) {
      setActiveGridData(null);
      return;
    }
    
    if (!activeResolution) return;

    setIsGeneratingGrid(true);

    const timer = setTimeout(() => {
      let centerLat = activeCenter.lat;
      let centerLng = activeCenter.lng;
      let latSpan = 24.75;
      let lngSpan = 39.75;
      const res = activeResolution;

      if (!isCurrentLocationOutside) {
        centerLat = 12.375;
        centerLng = 69.875;
        latSpan = 24.75;
        lngSpan = 39.75;
      } else {
        const centerLatRad = (centerLat * Math.PI) / 180;
        latSpan = 25.338 * Math.cos(centerLatRad);
        lngSpan = 39.75;
      }

      const latMin = Math.max(-85, centerLat - (latSpan / 2));
      const latMax = Math.min(85, centerLat + (latSpan / 2));
      const lngMin = Math.max(-180, centerLng - (lngSpan / 2));
      const lngMax = Math.min(180, centerLng + (lngSpan / 2));

      const grid = [];
      for (let lat = latMin; lat <= latMax + 0.0001; lat += res) {
        for (let lng = lngMin; lng <= lngMax + 0.0001; lng += res) {
          grid.push({
            lat: parseFloat(lat.toFixed(3)),
            lng: parseFloat(lng.toFixed(3)),
            sst: parseFloat((25 + 10 * Math.cos(lat * Math.PI / 180)).toFixed(2)),
            ssh: parseFloat((0.5 + 0.3 * Math.sin(lat * Math.PI / 90)).toFixed(2)),
            sss: parseFloat((34 + 2 * Math.cos(lng * Math.PI / 180)).toFixed(2)),
            sscu: parseFloat((0.1 * Math.sin(lat * Math.PI / 45)).toFixed(2)),
            sscv: parseFloat((0.1 * Math.cos(lng * Math.PI / 45)).toFixed(2))
          });
        }
      }
      setActiveGridData(grid);
      setIsGeneratingGrid(false);
    }, 40);

    return () => clearTimeout(timer);
  }, [submittedParameter, showAllMapsView, showVisualization, activeCenter, activeResolution, isCurrentLocationOutside]);

  const handleRecenter = () => {
    const defaultLat = 12.375; 
    const defaultLng = 69.875;
    const defaultZoom = 5;

    if (mapInstance) {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      
      const isAtDefault = Math.abs(center.lat - defaultLat) < 0.05 && Math.abs(center.lng - defaultLng) < 0.05 && zoom === defaultZoom && !position && !depth && !parameter;
      if (isAtDefault) {
        triggerNotification(t("alreadyOnDefaultMap") || "You are already on the default map view.");
        return;
      }
    }

    setDate("2017-01-01");
    setPosition(null);
    setTargetPosition(null);
    setActiveCenter({ lat: defaultLat, lng: defaultLng });
    setLatitude("");
    setLongitude("");
    
    setDepth("");
    setParameter("");
    setSubmittedParameter("");

    if (mapInstance) {
      if (isMobile) {
        // Expanded mobile reset bounds
        mapInstance.fitBounds([[0.0, 50.0], [24.75, 95.0]], { padding: [5, 5], animate: true });
      } else {
        mapInstance.flyTo([defaultLat, defaultLng], defaultZoom, { duration: 1.5 });
      }
    }
    triggerNotification(t("mapRefreshed") || "Map centered to default region.");
  };

  useEffect(() => {
    if (!position) return;
    setLatitude(formatLatitude(position.lat, language));
    setLongitude(formatLongitude(position.lng, language));
    setTargetPosition(position);
  }, [position, language]);

  const handleGo = async () => {
    if (parameter && isCurrentLocationOutside && !userResolution) {
      triggerNotification(t("selectResolution") || "Please select a resolution first.");
      return;
    }

    if (!date) { triggerNotification(t("chooseDate") || "Please select a date."); return; }

    let targetCoord = null;

    if (latitude !== "" && longitude !== "") {
      const lat = parseCoordinate(latitude, "latitude");
      const lng = parseCoordinate(longitude, "longitude");
      if (lat === null || lng === null) {
        triggerNotification(t("validLatLonPrompt") || "Please enter valid coordinates.");
        return;
      }
      try {
        const snapped = await snapToNearestOcean(lat, lng);
        if (!snapped || snapped.failed) {
          triggerNotification("This location is landlocked with no nearby ocean or sea within range.");
          return;
        }
        if (snapped.redirected) {
          triggerNotification("Land coordinate detected! Automatically redirecting to nearest sea grid.");
        }
        targetCoord = { lat: snapped.lat, lng: snapped.lng };
      } catch (error) {
        triggerNotification("This location is landlocked with no nearby ocean or sea within range.");
        return;
      }
    }

    if (depth && latitude === "" && longitude === "") {
      setInitialFocus("argo");
      setShowVisualization(true);
      setPosition(null);
      setTargetPosition(null);
      return;
    }

    if (parameter) {
      const chosenCenter = targetCoord || resolveCurrentCenter();
      setActiveCenter(chosenCenter);
      setSubmittedParameter(parameter);
      setPosition(null);
      setTargetPosition(null);
    } else if (targetCoord) {
      const newPos = { lat: targetCoord.lat, lng: targetCoord.lng, isOnLand: false };
      setPosition(newPos);
      setTargetPosition(newPos);
      setActiveCenter(targetCoord);
    }
  };

  function renderNavbarAndNotification() {
    return (
      <>
        <nav className="ocean-navbar">
          <div className="navbar-brand">
            <h2 className="ocean-title">{t("title")}</h2>
            <div className="ocean-subtitle">{t("subtitle")}</div>
          </div>
          <div className="navbar-actions">
            <ThemeToggle />
            <LanguageSelector />
            <button className="about-authors-nav-btn" onClick={() => setShowGuidelinesPanel(true)}>{t("webGuidelines")}</button>
            <button className="about-authors-nav-btn" onClick={() => setShowAboutPanel(true)}>{t("aboutAuthors")}</button>
          </div>
        </nav>
        {notification && <div className="ocean-notification-banner"><span>⚠️ {notification}</span></div>}
        {showAboutPanel && <AboutAuthors onClose={() => setShowAboutPanel(false)} />}
        {showGuidelinesPanel && <WebGuidelines onClose={() => setShowGuidelinesPanel(false)} />}
      </>
    );
  }

  if (showAllMapsView) {
    return (
      <div className={`ocean-page ${isDark ? "dark-cyber" : ""}`}>
        {renderNavbarAndNotification()}
        <AllHeatMapsDashboard 
          date={date}
          gridData={activeGridData} 
          activeResolution={activeResolution}
          onSelectParameter={(paramId) => {
            setSubmittedParameter(paramId);
            setShowAllMapsView(false);
          }} 
          onBack={() => setShowAllMapsView(false)} 
        />
      </div>
    );
  }

  if (submittedParameter) {
    return (
      <div className={`ocean-page ${isDark ? "dark-cyber" : ""}`}>
        {renderNavbarAndNotification()}
        <ParameterDashboard 
          date={date}
          parameter={submittedParameter} 
          gridData={activeGridData} 
          activeResolution={activeResolution}
          userResolution={userResolution}
          setUserResolution={setUserResolution}
          isCurrentLocationOutside={isCurrentLocationOutside}
          isGeneratingGrid={isGeneratingGrid}
          onShowAllMaps={() => setShowAllMapsView(true)}
          onBack={() => { setSubmittedParameter(""); setParameter(""); }} 
          triggerNotification={triggerNotification}
          notification={notification}
        />
      </div>
    );
  }

  if (showVisualization) {
    return (
      <div className={`ocean-page ${isDark ? "dark-cyber" : ""}`}>
        {renderNavbarAndNotification()}
        <SpatialDistribution
          depth={depth}
          initialFocus={initialFocus}
          gridData={activeGridData}
          activeResolution={activeResolution}
          isGeneratingGrid={isGeneratingGrid}
          onBack={() => { setShowVisualization(false); setDepth(""); }}
        />
      </div>
    );
  }

  return (
    <div className={`ocean-page ${isDark ? "dark-cyber" : ""}`}>
      {renderNavbarAndNotification()}

      {/* GLOBAL UNIFORM MOBILE BUTTON SIZING OVERRIDE */}
      <style>{`
        @media (max-width: 700px) {
          .navbar-actions {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .navbar-actions .language-selector-container,
          .navbar-actions .about-authors-nav-btn {
            height: 34px !important;
            min-height: 34px !important;
            max-height: 34px !important;
            box-sizing: border-box !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 10px !important;
            font-size: 11px !important;
            border-radius: 8px !important;
            line-height: normal !important;
            vertical-align: middle !important;
          }
          .navbar-actions select,
          .navbar-actions .language-dropdown,
          .navbar-actions button {
            height: 100% !important;
            min-height: 34px !important;
            max-height: 34px !important;
            font-size: 11px !important;
            padding: 0 8px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* MOBILE SPECIFIC: ControlBar OUTSIDE map wrapper */}
      {isMobile && !isPanelExpanded && !showVisualization && (
        <div className="mobile-controls-wrapper">
          <ControlBar
            isSidePanelOpen={!!position} date={date} setDate={setDate} depth={depth} userResolution={userResolution}
            setUserResolution={setUserResolution} isCurrentLocationOutside={isCurrentLocationOutside} triggerNotification={triggerNotification}
            setDepth={(val) => { setDepth(val); if(val){ setParameter(""); setSubmittedParameter(""); } }}
            parameter={parameter} 
            setParameter={(val) => {
              if (val === "all") { setDepth(""); setActiveCenter(resolveCurrentCenter()); setPosition(null); setTargetPosition(null); setShowAllMapsView(true); }
              else { setParameter(val); if(val){ setDepth(""); setActiveCenter(resolveCurrentCenter()); setPosition(null); setTargetPosition(null); } }
            }}
            latitude={latitude} setLatitude={(val) => { setLatitude(val); if(val) setDepth(""); }} 
            longitude={longitude} setLongitude={(val) => { setLongitude(val); if(val) setDepth(""); }}
            handleGo={handleGo} handleRecenter={handleRecenter} minDate={minDate} maxDate={maxDate}
          />
        </div>
      )}

      {/* MOBILE MAP STABILITY CSS */}
      <style>{`
        @media (max-width: 700px) {
          .ocean-map-wrapper {
            flex: 1; /* Automatically absorb available vertical space precisely */
            position: relative;
            display: block;
            min-height: 40vh; /* Reduced to prevent over-extension causing gap below */
          }
          .ocean-map {
            position: absolute !important;
            inset: 0;
            height: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* THE MAP INSTANCE */}
      <div className="ocean-map-wrapper">
        <MapContainer center={[activeCenter.lat, activeCenter.lng]} zoom={5} className="ocean-map" minZoom={3} maxZoom={12} zoomControl={false} attributionControl={false}>
          <TileLayer url={getTileUrl(isDark)} />
          <MobileBoundsController isMobile={isMobile} isCurrentLocationOutside={isCurrentLocationOutside} />
          <MapTouchController />
          <DynamicGrid />
          <LocationMarker
            position={position} setPosition={setPosition} date={date} depth={depth} parameter={parameter}
            activeResolution={activeResolution} blockLocationSelection={blockLocationSelection}
            onSeaNameResolved={setCurrentSeaName} triggerNotification={triggerNotification}
          />
          <MapController targetPosition={targetPosition} />
          <ZoomLockController locked={isMapZoomLocked} />
          <MapInitializer setMap={setMapInstance} onMapLoaded={onMapLoaded} />
        </MapContainer>

        {/* DESKTOP SPECIFIC: ControlBar INSIDE map wrapper */}
        {!isMobile && !isPanelExpanded && !showVisualization && (
          <ControlBar
            isSidePanelOpen={!!position} date={date} setDate={setDate} depth={depth} userResolution={userResolution}
            setUserResolution={setUserResolution} isCurrentLocationOutside={isCurrentLocationOutside} triggerNotification={triggerNotification}
            setDepth={(val) => { setDepth(val); if (val) { setParameter(""); setSubmittedParameter(""); } }}
            parameter={parameter} 
            setParameter={(val) => {
              if (val === "all") { setDepth(""); setActiveCenter(resolveCurrentCenter()); setPosition(null); setTargetPosition(null); setShowAllMapsView(true); } 
              else { setParameter(val); if (val) { setDepth(""); setActiveCenter(resolveCurrentCenter()); setPosition(null); setTargetPosition(null); } }
            }}
            latitude={latitude} setLatitude={(val) => { setLatitude(val); if (val) setDepth(""); }} 
            longitude={longitude} setLongitude={(val) => { setLongitude(val); if (val) setDepth(""); }}
            handleGo={handleGo} handleRecenter={handleRecenter} minDate={minDate} maxDate={maxDate}
          />
        )}

        {mapInstance && !showVisualization && (
          <div className="custom-zoom-controls" onClick={(e) => e.stopPropagation()}>
            <button className="custom-zoom-btn" type="button" disabled={isMapZoomLocked} onClick={() => mapInstance.zoomIn()} style={{ opacity: isMapZoomLocked ? 0.4 : 1, cursor: isMapZoomLocked ? "not-allowed" : "pointer" }} title={isMapZoomLocked ? (t("zoomLocked") || "Zoom locked while parameter/depth is selected") : undefined}>+</button>
            <button className="custom-zoom-btn" type="button" disabled={isMapZoomLocked} onClick={() => mapInstance.zoomOut()} style={{ opacity: isMapZoomLocked ? 0.4 : 1, cursor: isMapZoomLocked ? "not-allowed" : "pointer" }} title={isMapZoomLocked ? (t("zoomLocked") || "Zoom locked while parameter/depth is selected") : undefined}>−</button>
          </div>
        )}

        {/* DESKTOP SPECIFIC: DataSidePanel INSIDE map wrapper overlaying map */}
        {!isMobile && position && !showVisualization && (
          <DataSidePanel 
            position={position} depth={depth} setDepth={setDepth} seaName={currentSeaName} activeResolution={activeResolution}
            onClose={() => { setPosition(null); setIsPanelExpanded(false); setDepth(""); setParameter(""); setSubmittedParameter(""); setLatitude(""); setLongitude(""); }} 
            isMobile={isMobile} onExpand={(expanded) => setIsPanelExpanded(expanded)} 
          />
        )}
      </div>

      {/* MOBILE SPECIFIC: DataSidePanel OUTSIDE map wrapper so it stacks naturally below */}
      {isMobile && position && !showVisualization && (
        <DataSidePanel 
          position={position} depth={depth} setDepth={setDepth} seaName={currentSeaName} activeResolution={activeResolution}
          onClose={() => { setPosition(null); setIsPanelExpanded(false); setDepth(""); setParameter(""); setSubmittedParameter(""); setLatitude(""); setLongitude(""); }} 
          isMobile={isMobile} onExpand={(expanded) => setIsPanelExpanded(expanded)} 
        />
      )}
    </div>
  );
}

function MapInitializer({ setMap, onMapLoaded }) {
  const map = useMap();
  const loadedRef = useRef(false);
  useEffect(() => {
    if (map && !loadedRef.current) {
      setMap(map);
      loadedRef.current = true;
      if (onMapLoaded) onMapLoaded();
    }
  }, [map, setMap, onMapLoaded]);
  return null;
}

function ZoomLockController({ locked }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (locked) {
      if (map.scrollWheelZoom) map.scrollWheelZoom.disable();
      if (map.doubleClickZoom) map.doubleClickZoom.disable();
      if (map.touchZoom) map.touchZoom.disable();
      if (map.boxZoom) map.boxZoom.disable();
      if (map.keyboard) map.keyboard.disable();
      if (map.tap) map.tap.disable();
    } else {
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    if (map.dragging && !map.dragging.enabled()) map.dragging.enable();
  }, [locked, map]);
  return null;
>>>>>>> origin/main
}