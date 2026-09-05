import React, { useEffect, useState } from "react";
import { fetchSpatialMaps } from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";

export default function SpatialDistribution({
  depth,
  initialFocus,
  onBack,
}) {
  const { t } = useLanguage();
  const [maps, setMaps] = useState({
    argo: "",
    convformer: "",
    error: "",
  });

  const [loading, setLoading] = useState(true);
  const [focusedMap, setFocusedMap] = useState(initialFocus);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setFocusedMap(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setMaps({ argo: "", convformer: "", error: "" });

    fetchSpatialMaps(depth)
      .then((data) => {
        if (!isMounted) return;
        setMaps({
          argo: data?.argo || "",
          convformer: data?.convformer || "",
          error: data?.error || "",
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load spatial maps:", error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [depth]);

  useEffect(() => {
    setScale(1);
  }, [focusedMap]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setFocusedMap(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleImageError = (event, name) => {
    console.error(`Failed to load ${name} image:`, event.currentTarget.src);
    event.currentTarget.style.display = "none";
  };

  const handleZoom = (delta, e) => {
    e.stopPropagation();
    setScale((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  return (
    <div className="spatial-dashboard-container animate-ocean-fade" onClick={onBack}>
      <div 
        className="spatial-dashboard-inner" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spatial-header">
          <div className="spatial-header-titles">
            <h3 className="spatial-title">
              🌊 {t("spatialTitle")}{" "}
              <span className="spatial-depth-badge">
                {depth ? parseFloat(depth).toFixed(1) : "0.0"} m
              </span>{" "}
              {t("spatialDepth")}
            </h3>
            <span className="spatial-subtitle">Interactive Marine Intelligence & Deep-Sea Profiling</span>
          </div>
          <div className="spatial-header-actions">
            {focusedMap && (
              <button className="back-to-grid-btn" onClick={() => setFocusedMap(null)}>
                ← {t("allModels")}
              </button>
            )}
            <button className="back-to-map-btn" onClick={onBack}>
              {t("backToMap")}
            </button>
          </div>
        </div>

        <div className={`spatial-grid ${focusedMap ? "has-focus" : ""}`}>
          {/* ARGO */}
          <div
            className={`spatial-card ${focusedMap === "argo" ? "focused" : ""}`}
            onClick={() => !focusedMap && setFocusedMap("argo")}
          >
            <div className="spatial-card-header">
              <h4>{t("argoTruth")}</h4>
              <div className="card-toolbar" onClick={(e) => e.stopPropagation()}>
                {focusedMap === "argo" ? (
                  <>
                    <button type="button" onClick={(e) => handleZoom(0.5, e)} title="Zoom In">+</button>
                    <button type="button" onClick={(e) => handleZoom(-0.5, e)} title="Zoom Out">−</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setScale(1); }} title="Reset">↺</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setFocusedMap("argo")} title="Expand">⛶</button>
                )}
              </div>
            </div>
            <div className="spatial-image-wrapper">
              {loading ? (
                <div className="spatial-loader">
                  <div className="ocean-spinner"></div>
                  <span>{t("fetchingMap")}</span>
                </div>
              ) : maps.argo ? (
                <div className="image-viewport">
                  <img
                    src={maps.argo}
                    alt="Independent ARGO"
                    className="heatmap-img"
                    style={{ transform: `scale(${focusedMap === "argo" ? scale : 1})` }}
                    onError={(event) => handleImageError(event, "ARGO")}
                  />
                </div>
              ) : (
                <div className="loading-text">{t("argoUnavailable")}</div>
              )}
            </div>
          </div>

          {/* CONVFORMER */}
          <div
            className={`spatial-card ${focusedMap === "convformer" ? "focused" : ""}`}
            onClick={() => !focusedMap && setFocusedMap("convformer")}
          >
            <div className="spatial-card-header">
              <h4>{t("convformerPred")}</h4>
              <div className="card-toolbar" onClick={(e) => e.stopPropagation()}>
                {focusedMap === "convformer" ? (
                  <>
                    <button type="button" onClick={(e) => handleZoom(0.5, e)} title="Zoom In">+</button>
                    <button type="button" onClick={(e) => handleZoom(-0.5, e)} title="Zoom Out">−</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setScale(1); }} title="Reset">↺</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setFocusedMap("convformer")} title="Expand">⛶</button>
                )}
              </div>
            </div>
            <div className="spatial-image-wrapper">
              {loading ? (
                <div className="spatial-loader">
                  <div className="ocean-spinner"></div>
                  <span>{t("fetchingMap")}</span>
                </div>
              ) : maps.convformer ? (
                <div className="image-viewport">
                  <img
                    src={maps.convformer}
                    alt="Convformer Prediction"
                    className="heatmap-img"
                    style={{ transform: `scale(${focusedMap === "convformer" ? scale : 1})` }}
                    onError={(event) => handleImageError(event, "Convformer")}
                  />
                </div>
              ) : (
                <div className="loading-text">{t("predUnavailable")}</div>
              )}
            </div>
          </div>

          {/* ERROR */}
          <div
            className={`spatial-card error-card ${focusedMap === "error" ? "focused" : ""}`}
            onClick={() => !focusedMap && setFocusedMap("error")}
          >
            <div className="spatial-card-header">
              <h4>{t("absoluteError")}</h4>
              <div className="card-toolbar" onClick={(e) => e.stopPropagation()}>
                {focusedMap === "error" ? (
                  <>
                    <button type="button" onClick={(e) => handleZoom(0.5, e)} title="Zoom In">+</button>
                    <button type="button" onClick={(e) => handleZoom(-0.5, e)} title="Zoom Out">−</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setScale(1); }} title="Reset">↺</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setFocusedMap("error")} title="Expand">⛶</button>
                )}
              </div>
            </div>
            <div className="spatial-image-wrapper error-wrapper">
              {loading ? (
                <div className="spatial-loader">
                  <div className="ocean-spinner"></div>
                  <span>{t("fetchingMap")}</span>
                </div>
              ) : maps.error ? (
                <div className="image-viewport">
                  <img
                    src={maps.error}
                    alt="Absolute Error"
                    className="heatmap-img"
                    style={{ transform: `scale(${focusedMap === "error" ? scale : 1})` }}
                    onError={(event) => handleImageError(event, "Error")}
                  />
                </div>
              ) : (
                <div className="loading-text">{t("errorUnavailable")}</div>
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
    </div>
  );
}