
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

import IntroAnimation from "../components/IntroAnimation";

import {
  parseCoordinate,
  formatLatitude,
  formatLongitude,
  snapToNearestOcean,
} from "../utils/coordinateUtils";

import "../styles/ocean.css";


export default function InteractiveMap({ onMapLoaded }) {

  // ==========================================================
  // STATE
  // ==========================================================

  const [position, setPosition] = useState(null);

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


  const [showVisualization, setShowVisualization] =
    useState(false);

  const [activeLayerMode, setActiveLayerMode] =
    useState(false);

  const [initialFocus, setInitialFocus] =
    useState(null);


  /*
   * This becomes TRUE when Leaflet's actual
   * map instance reports that it is ready.
   */
  const [isMapLoaded, setIsMapLoaded] =
    useState(false);


  // ==========================================================
  // BOOT LOADER
  // ==========================================================
  /*
   * index.html contains the very first boot screen.
   *
   * As soon as React has mounted, remove that HTML loader.
   *
   * IntroAnimation then becomes the only visible intro.
   */

  useEffect(() => {

    if (
      typeof window !== "undefined" &&
      typeof window.finishOceanBootLoader === "function"
    ) {

      window.finishOceanBootLoader();

    }

  }, []);


  // ==========================================================
  // ACTUAL LEAFLET MAP READY HANDLER
  // ==========================================================
  /*
   * IMPORTANT:
   *
   * There is NO artificial setTimeout here.
   *
   * MapContainer calls this when the Leaflet map has
   * actually initialized.
   */

  const handleMapReady = useCallback(() => {

    console.log("Ocean map is ready.");

    setIsMapLoaded(true);

    if (onMapLoaded) {
      onMapLoaded();
    }

  }, [onMapLoaded]);


  // ==========================================================
  // START DATE -> END DATE
  // ==========================================================
  /*
   * End date is automatically set to
   * start date + 4 days.
   */

  useEffect(() => {

    if (!startDate) {

      setEndDate("");

      return;
    }


    const date =
      new Date(`${startDate}T00:00:00`);


    if (Number.isNaN(date.getTime())) {

      setEndDate("");

      return;
    }


    date.setDate(
      date.getDate() + 4
    );


    setEndDate(
      date.toISOString().split("T")[0]
    );

  }, [startDate]);


  // ==========================================================
  // SYNCHRONIZE COORDINATE INPUTS
  // ==========================================================
  /*
   * Whenever the marker position changes,
   * update latitude and longitude fields.
   */

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


  // ==========================================================
  // SEA NAME
  // ==========================================================

  const handleSeaNameResolved =
    useCallback((name) => {

      setCurrentSeaName(name);

    }, []);


  // ==========================================================
  // OPEN VISUALIZATION DASHBOARD
  // ==========================================================

  const openDashboard = (focusType) => {

    setInitialFocus(focusType);

    setShowVisualization(true);

    setActiveLayerMode(false);

  };


  // ==========================================================
  // BACK TO MAP
  // ==========================================================

  const handleBackToMap = () => {

    setShowVisualization(false);

    setActiveLayerMode(false);

    /*
     * Reset depth so the user returns to
     * the depth-selection stage.
     */

    setDepth("");

    setInitialFocus(null);

  };


  // ==========================================================
  // CLOSE DATA SIDE PANEL
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

  const handleGo = async () => {

    /*
     * --------------------------------------------------------
     * DEPTH SELECTED BUT NO COORDINATES
     * --------------------------------------------------------
     *
     * Activate the three visualization buttons.
     */

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


    // --------------------------------------------------------
    // PARSE LATITUDE
    // --------------------------------------------------------

    const lat =
      parseCoordinate(
        latitude,
        "latitude"
      );


    // --------------------------------------------------------
    // PARSE LONGITUDE
    // --------------------------------------------------------

    const lng =
      parseCoordinate(
        longitude,
        "longitude"
      );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      lat === null ||
      lng === null
    ) {

      alert(
        "Please enter a valid latitude and longitude."
      );

      return;
    }


    // --------------------------------------------------------
    // SNAP LAND COORDINATES TO NEAREST OCEAN
    // --------------------------------------------------------

    try {

      const snapped =
        await snapToNearestOcean(
          lat,
          lng
        );


      /*
       * If the user entered land,
       * inform them about the redirection.
       */

      if (snapped.redirected) {

        alert(
          "You entered land coordinates. Redirecting location to the nearest sea coordinates."
        );

      }


      const newPos = {

        lat: snapped.lat,

        lng: snapped.lng,

        isOnLand: false,

      };


      setPosition(newPos);

      setTargetPosition(newPos);

    }

    catch (error) {

      console.error(
        "Ocean redirection failed:",
        error
      );


      /*
       * Never allow the ocean-search failure
       * to crash the application.
       */

      alert(
        "Unable to find a nearby ocean location. Please try another coordinate."
      );

    }

  };


  // ==========================================================
  // CONTROL STATES
  // ==========================================================

  /*
   * Location inputs remain disabled until
   * a start date is selected.
   *
   * Once depth is selected, they become disabled
   * according to your existing workflow.
   */

  const isLocationDisabled =
    !startDate ||
    Boolean(depth);


  /*
   * Show the data panel only when:
   *
   * 1. A position exists
   * 2. A start date exists
   * 3. Position is not land
   */

  const showSidePanel =
    Boolean(
      position &&
      startDate &&
      !position.isOnLand
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="ocean-page">


      {/* ====================================================
          REACT INTRO ANIMATION
          ==================================================== */}

      <IntroAnimation
        isLoaded={isMapLoaded}
        onFinish={() => {}}
      />


      {/* ====================================================
          PAGE TITLE
          ==================================================== */}

      <h2 className="ocean-title">

        Spatiotemporal Ocean Temperature Profiling

      </h2>


      {/* ====================================================
          PAGE SUBTITLE
          ==================================================== */}

      <div className="ocean-subtitle">

        Interactive marine temperature intelligence •
        Spatial mapping • Depth-wise profiling

      </div>


      {/* ====================================================
          MAP / VISUALIZATION SWITCH
          ==================================================== */}

      {!showVisualization ? (

        <div className="ocean-map-wrapper">


          {/* ==================================================
              LEAFLET MAP
              ================================================== */}

          <MapContainer

            className="ocean-map"


            /*
             * Default view:
             * Arabian Sea + Bay of Bengal
             */

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


            /*
             * ------------------------------------------------
             * ACTUAL LEAFLET READY EVENT
             * ------------------------------------------------
             *
             * This replaces the old setTimeout().
             */

            whenReady={handleMapReady}

          >


            {/* =================================================
                BASE MAP
                ================================================= */}

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* =================================================
                MAP TOUCH CONTROLLER
                ================================================= */}

            <MapTouchController />


            {/* =================================================
                LATITUDE / LONGITUDE GRID
                ================================================= */}

            <DynamicGrid />


            {/* =================================================
                LOCATION MARKER
                ================================================= */}

            <LocationMarker

              position={position}

              setPosition={setPosition}

              onSeaNameResolved={
                handleSeaNameResolved
              }

            />


            {/* =================================================
                MAP CONTROLLER
                ================================================= */}

            <MapController
              targetPosition={targetPosition}
            />


          </MapContainer>


          {/* ==================================================
              VISUALIZATION LAYER CONTROLS
              ================================================== */}

          {activeLayerMode ? (

            <div className="map-layer-controls">


              {/* =================================================
                  LAYER BUTTONS
                  ================================================= */}

              <div className="layer-buttons">


                {/* ARGO */}

                <button

                  className="layer-btn"

                  onClick={(e) => {

                    e.stopPropagation();

                    openDashboard("argo");

                  }}

                >

                  ARGO

                </button>


                {/* CONVFORMER */}

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


                {/* ERROR */}

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


              {/* =================================================
                  CANCEL BUTTON
                  ================================================= */}

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


            /* =================================================
               NORMAL CONTROL BAR
               ================================================= */

            <ControlBar

              startDate={startDate}

              setStartDate={setStartDate}


              endDate={endDate}


              depth={depth}

              setDepth={setDepth}


              latitude={latitude}

              setLatitude={setLatitude}


              longitude={longitude}

              setLongitude={setLongitude}


              handleGo={handleGo}


              isLocationDisabled={
                isLocationDisabled
              }


              showSidePanel={
                showSidePanel
              }

            />

          )}


          {/* ==================================================
              DATA SIDE PANEL
              ================================================== */}

          {showSidePanel && (

            <DataSidePanel

              position={position}

              depth={depth}

              seaName={currentSeaName}

              onClose={handleClosePanel}

            />

          )}


        </div>

      ) : (


        /* ====================================================
           SPATIAL DISTRIBUTION DASHBOARD
           ==================================================== */

        <SpatialDistribution

          depth={depth}

          initialFocus={initialFocus}

          onBack={handleBackToMap}

        />

      )}

    </div>

  );

}

