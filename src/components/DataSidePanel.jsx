import React, { useEffect, useMemo, useState } from "react";
import TemperatureProfile from "./TemperatureProfile";
import Icon from "./icons";
import { getLocationMetrics } from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";

const formatDir = (val, isLat, t) => {
  const snapped = Math.round(val * 4) / 4;
  const absVal = Math.abs(snapped).toFixed(2);
  if (snapped === 0) return `${absVal}°`;
  if (isLat) return snapped > 0 ? `${absVal}°${t("dirN") || "N"}` : `${absVal}°${t("dirS") || "S"}`;
  return snapped > 0 ? `${absVal}°${t("dirE") || "E"}` : `${absVal}°${t("dirW") || "W"}`;
};

const getGridCorners = (lat, lng, resolution, t) => {
  const res = parseFloat(resolution) || 0.25;
  const half = res / 2;
  return {
    ne: { lat: formatDir(lat + half, true, t), lng: formatDir(lng + half, false, t) },
    sw: { lat: formatDir(lat - half, true, t), lng: formatDir(lng - half, false, t) }
  };
};

function CornerCard({ title, dot, lat, lng }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-ink/10 bg-paper p-2.5 dark:border-paper/10 dark:bg-paper/[0.05]">
      <div className="mb-2 flex w-full items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold text-ink/70 dark:text-paper/70">{title}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </div>
      <div className="flex w-full flex-col gap-1">
        {[
          ["Lat", lat],
          ["Lng", lng],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-2 py-1 dark:bg-paper/[0.05]">
            <span className="text-[11px] font-semibold text-ink/60 dark:text-paper/60">{label}</span>
            <span className="font-mono text-[12px] text-ink dark:text-paper" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DataSidePanel({
  position,
  depth,
  setDepth,
  seaName,
  profileData = [],
  activeResolution,
  profileLoading = false,
  profileError = "",
  profileMeta = {},
  onRetryProfile,
  surfaceData = null,
  surfaceLoading = false,
  surfaceError = "",
  surfaceMeta = {},
  onRetrySurface,
  onClose,
  isMobile = false,
  onExpand,
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileDepthOpen, setIsMobileDepthOpen] = useState(false);

  const { snappedLat, snappedLng, metrics } = useMemo(() => {
    if (!position) {
      return { snappedLat: 0, snappedLng: 0, metrics: null };
    }
    const sLat = Math.round(position.lat / 0.25) * 0.25;
    const sLng = Math.round(position.lng / 0.25) * 0.25;
    const data = getLocationMetrics(sLat, sLng);
    return { snappedLat: sLat, snappedLng: sLng, metrics: data };
  }, [position?.lat, position?.lng]);

  // Live surface values from GET /surface/point via backend /api/surface.
  // Falls back to regional dummy metrics when backend is unreachable.
  const isSurfaceLive = Boolean(
    surfaceData &&
    Number.isFinite(Number(surfaceData.sst)) &&
    Number.isFinite(Number(surfaceData.sss)) &&
    Number.isFinite(Number(surfaceData.ssh ?? surfaceData.zos))
  );
  const displaySurface = useMemo(() => {
    if (isSurfaceLive) {
      return {
        sst: Number(surfaceData.sst),
        sss: Number(surfaceData.sss),
        ssh: Number(surfaceData.ssh ?? surfaceData.zos),
        uo: Number(surfaceData.uo),
        vo: Number(surfaceData.vo),
      };
    }
    return metrics?.surfaceData || { sst: NaN, sss: NaN, ssh: NaN, uo: NaN, vo: NaN };
  }, [isSurfaceLive, surfaceData, metrics]);

  const fmt = (v, digits = 2) => (Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : "—");

  // Escape closes the drawer (WCAG 2.1.1 keyboard access).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chartProfileData = useMemo(() => {
    if (!Array.isArray(profileData) || profileData.length === 0) return [];

    // Accept the backend response directly if it is already normalized,
    // otherwise map depth_m/actual/prediction into the existing chart schema.
    return profileData
      .map((item) => ({
        depth: Number(item.depth ?? item.depth_m),
        argo: Number(item.argo ?? item.actual),
        transformer: Number(item.transformer ?? item.prediction),
        q10: item.q10,
        q90: item.q90,
      }))
      .filter((item) =>
        Number.isFinite(item.depth) &&
        Number.isFinite(item.argo) &&
        Number.isFinite(item.transformer)
      );
  }, [profileData]);

  const corners = useMemo(() => {
    return getGridCorners(snappedLat, snappedLng, activeResolution, t);
  }, [snappedLat, snappedLng, activeResolution, t]);

  if (!position || !metrics) {
    return null;
  }

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpand) onExpand(newExpandedState);
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

  const depthOptions = [];
  for (let value = 0; value <= 1000; value += 50) {
    depthOptions.push(value);
  }

  const sectionTitle = "mb-2 mt-0 font-display text-[15px] font-bold text-ink dark:text-paper";

  return (
    <div
      role="complementary"
      aria-label={t("gridLocationData")}
      className={
        isMobile
          ? "relative flex w-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-lift dark:border-paper/10 dark:bg-ink"
          : isExpanded
          ? "absolute inset-0 z-panel flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper/95 shadow-lift dark:border-paper/10 dark:bg-ink/95"
          : "absolute bottom-4 right-4 top-4 z-panel flex w-[clamp(300px,24vw,380px)] flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper/95 shadow-lift dark:border-paper/10 dark:bg-ink/95"
      }
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 dark:border-paper/10">
        <div className="flex items-center gap-2">
          <Icon name="grid" size={14} className="text-accent" />
          <h4 className="m-0 font-display text-[16px] font-bold text-ink dark:text-paper">{t("gridLocationData")}</h4>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <button
              type="button"
              onClick={toggleExpand}
              className="oe-focus-visible flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-transparent text-ink/70 hover:bg-ink/[0.05]
                dark:border-paper/15 dark:text-paper/70 dark:hover:bg-paper/10"
              title={isExpanded ? "Collapse" : "Expand"}
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
              aria-expanded={isExpanded}
            >
              <Icon name={isExpanded ? "minus" : "plus"} size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="oe-focus-visible flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-transparent text-ink/70 hover:bg-ink/[0.05]
              dark:border-paper/15 dark:text-paper/70 dark:hover:bg-paper/10"
            title="Close"
            aria-label="Close panel"
          >
            <Icon name="close" size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-[14px] text-ink/80 dark:text-paper/60">
        {(profileMeta?.gridId || profileMeta?.forecastDate) && (
          <div className="mb-2.5 font-mono text-[11px] text-ink/50 dark:text-paper/50" style={{ fontVariantNumeric: "tabular-nums" }}>
            {profileMeta?.gridId ? `${profileMeta.gridId}` : ""}
            {profileMeta?.gridId && profileMeta?.forecastDate ? " · " : ""}
            {profileMeta?.forecastDate ? `${profileMeta.forecastDate}` : ""}
            {profileLoading ? " · fetching…" : ""}
          </div>
        )}
        <div className="mb-4 border-b border-ink/10 pb-3 dark:border-paper/10">
          <div className="text-[12px] text-ink/60 dark:text-paper/60">
            {t("waterBody")}
          </div>
          <strong className={`font-display text-[19px] font-bold ${isLoading ? "text-ink/50" : "text-ink dark:text-paper"}`}>
            {displaySeaName}
          </strong>
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <div className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="compass" size={13} className="text-accent" />
                <span className="text-[12px] font-semibold text-ink/70 dark:text-paper/70">
                  {t("gridCorners") || "Grid boundaries"}
                </span>
              </div>
              <div className="font-mono text-[11px] text-ink/50 dark:text-paper/50">
                ±{activeResolution}°
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CornerCard title={`${t("dirNE") || "NE"} corner`} dot="bg-accent" lat={corners.ne.lat} lng={corners.ne.lng} />
              <CornerCard title={`${t("dirSW") || "SW"} corner`} dot="bg-ink/30 dark:bg-paper/40" lat={corners.sw.lat} lng={corners.sw.lng} />
            </div>
          </div>

          {depth && (
            <div className="flex items-baseline justify-between border-b border-ink/10 pb-2 dark:border-paper/10">
              <span className="text-[13px] text-ink/70 dark:text-paper/70">{t("depth")}</span>
              <span className="font-mono text-[15px] text-ink tabular-nums dark:text-paper">{depth} m</span>
            </div>
          )}
        </div>

        {isMobile && setDepth && (
          <div className="relative mb-4">
            <label className="mb-1.5 block text-[12px] font-bold text-accent dark:text-paper">
              {t("depth") || "Depth (m)"}
            </label>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isMobileDepthOpen}
              onClick={() => setIsMobileDepthOpen(!isMobileDepthOpen)}
              className="oe-focus-visible flex w-full items-center justify-between rounded-lg border border-ink/10 bg-paper px-3 py-2.5 text-left text-[14px] font-semibold text-ink
                dark:border-paper/20 dark:bg-paper/[0.07] dark:text-paper"
            >
              <span>{depth !== "" && depth !== undefined ? `${depth} m` : (t("selectDepth") || "Select depth")}</span>
              <Icon name="chevronDown" size={13} className={`opacity-75 transition-transform ${isMobileDepthOpen ? "rotate-180" : ""}`} />
            </button>

            {isMobileDepthOpen && (
              <>
                <div className="fixed inset-0 z-[9998]" onClick={() => setIsMobileDepthOpen(false)} />
                <div role="listbox" className="absolute inset-x-0 top-[calc(100%+4px)] z-dropdown max-h-44 overflow-y-auto rounded-lg border border-ink/10 bg-paper p-1.5 shadow-lift dark:border-paper/20 dark:bg-paper/[0.07]">
                  <div
                    role="option"
                    aria-selected={depth === ""}
                    onClick={() => { setDepth(""); setIsMobileDepthOpen(false); }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"
                  >
                    {t("selectDepth") || "Select depth"}
                  </div>
                  {depthOptions.map((d) => (
                    <div
                      key={d}
                      role="option"
                      aria-selected={depth !== "" && Number(depth) === d}
                      onClick={() => { setDepth(d); setIsMobileDepthOpen(false); }}
                      className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold ${depth !== "" && Number(depth) === d ? "bg-accent text-white dark:bg-accent" : "text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"}`}
                    >
                      {d} m
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <hr className="my-4 border-t border-ink/10 dark:border-paper/10" />
        <h5 className={sectionTitle}>{t("surfaceParameters")}</h5>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={`oe-live-badge ${surfaceLoading ? "is-fallback" : isSurfaceLive ? "is-live" : "is-fallback"}`}>
            {surfaceLoading ? "◌ Fetching live surface…" : isSurfaceLive ? `● Live · surface · ${surfaceMeta?.source || "model"}` : "○ Fallback · dummy data"}
          </span>
          {(surfaceMeta?.gridId || surfaceMeta?.date) && (
            <span className="font-mono text-[11px] text-ink/50 dark:text-paper/50">
              {surfaceMeta?.gridId ? `${surfaceMeta.gridId}` : ""}
              {surfaceMeta?.gridId && surfaceMeta?.date ? " · " : ""}
              {surfaceMeta?.date ? `${surfaceMeta.date}` : ""}
            </span>
          )}
        </div>
        {surfaceError && !isSurfaceLive && (
          <div className="mb-2 border-l-2 border-accent pl-3">
            <div className="mb-1 text-[12px] text-ink dark:text-paper">
              Surface backend unavailable — showing fallback. {surfaceError}
            </div>
            {onRetrySurface && (
              <button
                type="button"
                onClick={onRetrySurface}
                className="oe-focus-visible rounded-lg border border-ink/15 px-2.5 py-1 text-[12px] font-semibold text-ink hover:bg-ink/[0.05]
                  dark:border-paper/20 dark:text-paper dark:hover:bg-paper/10"
              >
                Retry surface
              </button>
            )}
          </div>
        )}
        <div className={`mb-5 overflow-hidden rounded-lg border border-ink/10 dark:border-paper/10 ${surfaceLoading ? "opacity-60" : ""}`}>
          {[
            { icon: "thermometer", label: t("sstLabel"), value: fmt(displaySurface.sst), unit: "°C" },
            { icon: "droplet", label: t("sssLabel"), value: fmt(displaySurface.sss), unit: "PSU" },
            { icon: "waves", label: t("sshLabel"), value: fmt(displaySurface.ssh, 3), unit: "m" },
            { icon: "compass", label: t("uoLabel"), value: fmt(displaySurface.uo, 3), unit: "m/s" },
            { icon: "arrowUp", label: t("voLabel"), value: fmt(displaySurface.vo, 3), unit: "m/s" },
          ].map((row, i, arr) => (
            <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i < arr.length - 1 ? "border-b border-ink/10 dark:border-paper/10" : ""}`}>
              <dt className="flex items-center gap-2 text-[13px] text-ink/70 dark:text-paper/70">
                <Icon name={row.icon} size={13} className="text-accent" />
                {row.label}
              </dt>
              <dd className="m-0 font-mono text-[15px] text-ink tabular-nums dark:text-paper">
                {row.value} <span className="text-[12px] text-ink/50 dark:text-paper/50">{row.unit}</span>
              </dd>
            </div>
          ))}
        </div>

        <hr className="my-4 border-t border-ink/10 dark:border-paper/10" />
        <h5 className={sectionTitle}>{t("verticalProfile")}</h5>
        <div
          className="rounded-lg border border-ink/10 p-2 dark:border-paper/10"
          style={{ height: isExpanded ? "460px" : "270px", transition: "height 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <TemperatureProfile
            selectedDepth={depth}
            profileData={chartProfileData}
            fallbackData={metrics.profileData}
            isLive={chartProfileData.length > 0}
            loading={profileLoading}
            error={profileError}
            onRetry={onRetryProfile}
            isExpanded={isExpanded}
          />
        </div>
      </div>
    </div>
  );
}
