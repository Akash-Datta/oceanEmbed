import "leaflet/dist/leaflet.css";

import React, {
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

import IntroAnimation from "../components/IntroAnimation";

import ParticlesBackground from "../components/ParticlesTemp";

import {
  parseCoordinate,
  formatLatitude,
  formatLongitude,
  snapToNearestOcean,
} from "../utils/coordinateUtils";

import "../styles/ocean.css";

// ============================================================
// INTERACTIVE MAP
// ============================================================

export default function InteractiveMap() {
  const [position, setPosition] =
    useState(null);

  const [targetPosition, setTargetPosition] =
    useState(null);

  const [currentSeaName, setCurrentSeaName] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [depth, setDepth] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [
    showVisualization,
    setShowVisualization,
  ] = useState(false);

  const [
    activeLayerMode,
    setActiveLayerMode,
  ] = useState(false);

  const [initialFocus, setInitialFocus] =
    useState(null);

  // ==========================================================
  // INTRO / MAP LOADING
  // ==========================================================

  const [mapReady, setMapReady] =
    useState(false);

  const [
    minimumIntroTimePassed,
    setMinimumIntroTimePassed,
  ] = useState(false);

  /*
   * Minimum time for the multilingual intro.
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumIntroTimePassed(true);
    }, 3200);

    return () =>
      clearTimeout(timer);
  }, []);

  /*
   * Intro finishes only after:
   *
   * 1. Map is ready
   * 2. Minimum intro time has passed
   */

  const introFinished =
    mapReady &&
    minimumIntroTimePassed;

  // ==========================================================
  // CONTROL STATES
  // ==========================================================

  const isLocationDisabled =
    !startDate || Boolean(depth);

  const showSidePanel = Boolean(
    position &&
      startDate &&
      !position.isOnLand
  );

  // ==========================================================
  // DATE LOGIC
  // ==========================================================

  useEffect(() => {
    if (!startDate) {
      setEndDate("");
      return;
    }

    const date = new Date(
      `${startDate}T00:00:00`
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      setEndDate("");
      return;
    }

    /*
     * Your updated requirement:
     *
     * End date = Start date + 4 days
     */

    date.setDate(
      date.getDate() + 4
    );

    setEndDate(
      date
        .toISOString()
        .split("T")[0]
    );
  }, [startDate]);

  // ==========================================================
  // UPDATE INPUT COORDINATES
  // ==========================================================

  useEffect(() => {
    if (!position) {
      return;
    }

    setLatitude(
      formatLatitude(
        position.lat
      )
    );

    setLongitude(
      formatLongitude(
        position.lng
      )
    );
  }, [position]);

  // ==========================================================
  // OPEN DASHBOARD
  // ==========================================================

  const openDashboard = (
    focusType
  ) => {
    setInitialFocus(
      focusType
    );

    setShowVisualization(
      true
    );

    setActiveLayerMode(
      false
    );
  };

  // ==========================================================
  // BACK TO MAP
  // ==========================================================

  const handleBackToMap = () => {
    /*
     * Return completely to the original
     * map-selection state.
     */

    setShowVisualization(
      false
    );

    setActiveLayerMode(
      false
    );

    setInitialFocus(null);

    /*
     * IMPORTANT:
     * Reset depth.
     */

    setDepth("");

    /*
     * Clear selected location.
     */

    setPosition(null);

    setTargetPosition(null);

    setLatitude("");

    setLongitude("");

    setCurrentSeaName("");
  };

  // ==========================================================
  // CLOSE SIDE PANEL
  // ==========================================================

  const handleClosePanel = () => {
    setPosition(null);

    setTargetPosition(null);

    setLatitude("");

    setLongitude("");

    setCurrentSeaName("");
  };

  // ==========================================================
  // GO BUTTON
  // ==========================================================

  const handleGo = () => {
    /*
     * If depth is selected without coordinates,
     * switch to the three-map layer controls.
     */

    if (
      depth &&
      !latitude &&
      !longitude
    ) {
      setActiveLayerMode(true);

      setPosition(null);

      return;
    }

    const lat =
      parseCoordinate(
        latitude,
        "latitude"
      );

    const lng =
      parseCoordinate(
        longitude,
        "longitude"
      );

    if (
      lat === null ||
      lng === null
    ) {
      alert(
        "Please enter a valid latitude and longitude."
      );

      return;
    }

    /*
     * Check and redirect land coordinates.
     */

    const snapped =
      snapToNearestOcean(
        lat,
        lng
      );

    /*
     * LAND LOCATION
     */

    if (snapped.redirected) {
      alert(
        "You entered land coordinates. Redirecting location to the nearest sea coordinates."
      );
    }

    /*
     * If the search failed, don't silently
     * create a fake ocean location.
     */

    if (snapped.failed) {
      alert(
        "The entered location appears to be on land, but a nearby ocean location could not be found. Please enter a nearby sea coordinate."
      );

      return;
    }

    const newPosition = {
      lat: snapped.lat,
      lng: snapped.lng,
      isOnLand: false,
    };

    setPosition(
      newPosition
    );

    setTargetPosition(
      newPosition
    );
  };

  // ==========================================================
  // MAP READY CALLBACK
  // ==========================================================

  const handleMapReady = () => {
    setMapReady(true);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="ocean-page">

      {/* =====================================================
          PARTICLE BACKGROUND
          ===================================================== */}

      <ParticlesBackground />

      {/* =====================================================
          INTRO
          ===================================================== */}

      {!introFinished && (
        <IntroAnimation
          isLoaded={mapReady}
          onFinish={() => {
            setMinimumIntroTimePassed(
              true
            );
          }}
        />
      )}

      {/* =====================================================
          TITLE
          ===================================================== */}

      <h2 className="ocean-title">
        Spatiotemporal Ocean
        Temperature Profiling
      </h2>

      <div className="ocean-subtitle">
        Interactive marine temperature
        intelligence • Spatial mapping •
        Depth-wise profiling
      </div>

      {/* =====================================================
          MAP / VISUALIZATION
          ===================================================== */}

      {!showVisualization ? (
        <div className="ocean-map-wrapper">

          <MapContainer
            className="ocean-map"

            bounds={[
              [6, 56],
              [27, 98],
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
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapTouchController />

            <DynamicGrid />

            <LocationMarker
              position={position}
              setPosition={setPosition}
              onSeaNameResolved={
                (name) =>
                  setCurrentSeaName(
                    name
                  )
              }
            />

            <MapController
              targetPosition={
                targetPosition
              }
            />

          </MapContainer>

          {/* =================================================
              LAYER CONTROLS
              ================================================= */}

          {activeLayerMode ? (
            <div className="map-layer-controls">

              <div className="layer-buttons">

                <button
                  className="layer-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    openDashboard(
                      "argo"
                    );
                  }}
                >
                  ARGO
                </button>

                <button
                  className="layer-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    openDashboard(
                      "convformer"
                    );
                  }}
                >
                  Prediction
                </button>

                <button
                  className="layer-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    openDashboard(
                      "error"
                    );
                  }}
                >
                  Error
                </button>

              </div>

              <button
                className="back-to-map-btn"
                onClick={(e) => {
                  e.stopPropagation();

                  setActiveLayerMode(
                    false
                  );
                }}
              >
                ← Cancel
              </button>

            </div>
          ) : (
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

              depth={depth}

              setDepth={setDepth}

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

          {/* =================================================
              SIDE PANEL
              ================================================= */}

          {showSidePanel && (
            <DataSidePanel
              position={position}
              depth={depth}
              seaName={
                currentSeaName
              }
              onClose={
                handleClosePanel
              }
            />
          )}

        </div>
      ) : (

        /* ===================================================
           SPATIAL DISTRIBUTION
           =================================================== */

        <SpatialDistribution
          depth={depth}
          initialFocus={
            initialFocus
          }
          onBack={
            handleBackToMap
          }
        />

      )}

    </div>
  );
}