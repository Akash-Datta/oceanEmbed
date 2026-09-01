import React, {
  useEffect,
  useState,
} from "react";

import {
  fetchSpatialMaps,
} from "../data/dummyOceanData";

export default function SpatialDistribution({
  depth,
  initialFocus,
  onBack,
}) {
  const [maps, setMaps] = useState({
    argo: "",
    convformer: "",
    error: "",
  });

  const [loading, setLoading] =
    useState(true);

  const [focusedMap, setFocusedMap] =
    useState(initialFocus);

  // ==========================================================
  // UPDATE FOCUS WHEN OPENED
  // ==========================================================

  useEffect(() => {
    setFocusedMap(initialFocus);
  }, [initialFocus]);

  // ==========================================================
  // LOAD MAPS
  // ==========================================================

  useEffect(() => {
    let isMounted = true;

    setLoading(true);

    setMaps({
      argo: "",
      convformer: "",
      error: "",
    });

    fetchSpatialMaps(depth)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setMaps({
          argo: data?.argo || "",
          convformer:
            data?.convformer || "",
          error: data?.error || "",
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Failed to load spatial maps:",
          error
        );

        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [depth]);

  // ==========================================================
  // OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {
    const handleOutsideClick = () => {
      setFocusedMap(null);
    };

    window.addEventListener(
      "click",
      handleOutsideClick
    );

    return () => {
      window.removeEventListener(
        "click",
        handleOutsideClick
      );
    };
  }, []);

  // ==========================================================
  // IMAGE ERROR HANDLER
  // ==========================================================

  const handleImageError = (
    event,
    name
  ) => {
    console.error(
      `Failed to load ${name} image:`,
      event.currentTarget.src
    );

    event.currentTarget.style.display =
      "none";
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="spatial-dashboard-container">

      {/* HEADER */}

      <div
        className="spatial-header"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h3 className="spatial-title">
          Spatial Temperature Distribution
          {" "}
          at{" "}
          {depth
            ? parseFloat(depth).toFixed(
                1
              )
            : "0.0"}
          m Depth
        </h3>

        <button
          className="back-to-map-btn"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
        >
          ← Back to Interactive Map
        </button>
      </div>

      {/* MAP GRID */}

      <div
        className={`spatial-grid ${
          focusedMap
            ? "has-focus"
            : ""
        }`}
      >

        {/* ==================================================
            ARGO
            ================================================== */}

        <div
          className={`spatial-card ${
            focusedMap === "argo"
              ? "focused"
              : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();

            setFocusedMap(
              focusedMap === "argo"
                ? null
                : "argo"
            );
          }}
        >
          <div className="spatial-card-header">
            <h4>
              Independent ARGO
              (Ground Truth)
            </h4>
          </div>

          <div className="spatial-image-wrapper">
            {loading ? (
              <div className="loading-text">
                Fetching Map Data...
              </div>
            ) : maps.argo ? (
              <img
                src={maps.argo}
                alt="Independent ARGO"
                className="heatmap-img"
                onError={(event) =>
                  handleImageError(
                    event,
                    "ARGO"
                  )
                }
              />
            ) : (
              <div className="loading-text">
                ARGO map unavailable
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            CONVFORMER
            ================================================== */}

        <div
          className={`spatial-card ${
            focusedMap ===
            "convformer"
              ? "focused"
              : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();

            setFocusedMap(
              focusedMap ===
                "convformer"
                ? null
                : "convformer"
            );
          }}
        >
          <div className="spatial-card-header">
            <h4>
              Convformer Prediction
            </h4>

            <div className="mock-toolbar">
              📷 🔍 ⛶
            </div>
          </div>

          <div className="spatial-image-wrapper">
            {loading ? (
              <div className="loading-text">
                Fetching Map Data...
              </div>
            ) : maps.convformer ? (
              <img
                src={maps.convformer}
                alt="Convformer Prediction"
                className="heatmap-img"
                onError={(event) =>
                  handleImageError(
                    event,
                    "Convformer"
                  )
                }
              />
            ) : (
              <div className="loading-text">
                Prediction map unavailable
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            ERROR
            ================================================== */}

        <div
          className={`spatial-card error-card ${
            focusedMap === "error"
              ? "focused"
              : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();

            setFocusedMap(
              focusedMap === "error"
                ? null
                : "error"
            );
          }}
        >
          <div className="spatial-card-header">
            <h4>
              Absolute Error
              (|Pred - Actual|)
            </h4>
          </div>

          <div className="spatial-image-wrapper error-wrapper">

            {loading ? (
              <div className="loading-text">
                Fetching Map Data...
              </div>
            ) : maps.error ? (
              <img
                src={maps.error}
                alt="Absolute Error"
                className="heatmap-img"
                onError={(event) =>
                  handleImageError(
                    event,
                    "Error"
                  )
                }
              />
            ) : (
              <div className="loading-text">
                Error map unavailable
              </div>
            )}

            <div className="mock-colorbar">
              <span>14</span>
              <span>12</span>
              <span>10</span>
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}