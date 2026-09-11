import "leaflet/dist/leaflet.css";

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
}