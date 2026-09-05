import React, {
  useMemo,
  useState,
} from "react";

import TemperatureProfile from "./TemperatureProfile";
import {
  getLocationMetrics,
} from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";

export default function DataSidePanel({
  position,
  depth,
  seaName,
  onClose,
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const { snappedLat, snappedLng, metrics } = useMemo(() => {
    if (!position) {
      return { snappedLat: 0, snappedLng: 0, metrics: null };
    }

    const sLat = Math.round(position.lat / 0.25) * 0.25;
    const sLng = Math.round(position.lng / 0.25) * 0.25;

    const data = getLocationMetrics(sLat, sLng);
    return { snappedLat: sLat, snappedLng: sLng, metrics: data };
  }, [position?.lat, position?.lng]);

  if (!position || !metrics) {
    return null;
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getTranslatedSeaName = (name) => {
    if (!name || name === "Loading sea name...") return t("loadingSeaName");
    const lower = name.toLowerCase();
    if (lower.includes("bengal")) return t("bayOfBengal");
    if (lower.includes("arabian")) return t("arabianSea");
    if (lower.includes("indian")) return t("indianOcean");
    return name;
  };

  const displaySeaName = getTranslatedSeaName(seaName);
  const isLoading = !seaName || seaName === "Loading sea name...";

  return (
    <div
      className={`side-data-panel ${
        isExpanded ? "expanded" : ""
      }`}
    >
      <div className="panel-header">
        <h4>{t("gridLocationData")}</h4>

        <div className="panel-actions">
          <button
            onClick={toggleExpand}
            className="action-btn expand-btn"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "🗗" : "⛶"}
          </button>

          <button
            onClick={onClose}
            className="action-btn close-btn"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="panel-content">
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 10px",
            background: "rgba(14, 165, 233, 0.08)",
            borderRadius: "6px",
            borderLeft: "3px solid #0ea5e9",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#64748b",
              display: "block",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {t("waterBody")}
          </span>

          <strong
            style={{
              color: isLoading ? "#64748b" : "#0369a1",
              fontSize: "13px",
              letterSpacing: "0.3px",
            }}
          >
            {displaySeaName}
          </strong>
        </div>

        <p>
          <strong>{t("gridLat")}:</strong> {snappedLat.toFixed(2)}°
        </p>

        <p>
          <strong>{t("gridLng")}:</strong> {snappedLng.toFixed(2)}°
        </p>

        {depth && (
          <p>
            <strong>{t("depth")}:</strong> {depth} m
          </p>
        )}

        <hr />

        <h5>{t("surfaceParameters")}</h5>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "block",
                fontWeight: "bold",
              }}
            >
              {t("sstLabel")}
            </span>

            <strong
              style={{
                color: "#0f172a",
                fontSize: "15px",
              }}
            >
              {metrics.surfaceData.sst} °C
            </strong>
          </div>

          <div
            style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "block",
                fontWeight: "bold",
              }}
            >
              {t("sssLabel")}
            </span>

            <strong
              style={{
                color: "#0f172a",
                fontSize: "15px",
              }}
            >
              {metrics.surfaceData.sss} PSU
            </strong>
          </div>

          <div
            style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "block",
                fontWeight: "bold",
              }}
            >
              {t("sshLabel")}
            </span>

            <strong
              style={{
                color: "#0f172a",
                fontSize: "15px",
              }}
            >
              {metrics.surfaceData.ssh} m
            </strong>
          </div>

          <div
            style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "block",
                fontWeight: "bold",
              }}
            >
              {t("uoLabel")}
            </span>

            <strong
              style={{
                color: "#0f172a",
                fontSize: "15px",
              }}
            >
              {metrics.surfaceData.uo} m/s
            </strong>
          </div>

          <div
            style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "10px",
              borderRadius: "8px",
              gridColumn: "span 2",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "block",
                fontWeight: "bold",
              }}
            >
              {t("voLabel")}
            </span>

            <strong
              style={{
                color: "#0f172a",
                fontSize: "15px",
              }}
            >
              {metrics.surfaceData.vo} m/s
            </strong>
          </div>
        </div>

        <hr />

        <h5>{t("verticalProfile")}</h5>

        <div
          style={{
            height: isExpanded ? "400px" : "220px",
            transition: "height 0.3s",
          }}
        >
          <TemperatureProfile
            selectedDepth={depth}
            profileData={metrics.profileData}
          />
        </div>
      </div>
    </div>
  );
}