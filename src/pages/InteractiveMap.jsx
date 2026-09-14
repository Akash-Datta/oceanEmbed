import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ControlBar from "../components/ControlBar";
import DynamicGrid from "../components/DynamicGrid";
import LocationMarker, { MapController, MapTouchController } from "../components/LocationMarker";
import DataSidePanel from "../components/DataSidePanel";
import Icon from "../components/icons";
import ParameterDashboard from "../components/ParameterDashboard";
import AllHeatMapsDashboard from "../components/allHeatMapsDashboard";
import SpatialDistribution from "../components/SpatialDistribution";
import AboutAuthors from "../components/AboutAuthors";
import WebGuidelines from "../components/WebGuidelines";
import LanguageSelector from "../components/LanguageSelector";

import { parseCoordinate, formatLatitude, formatLongitude, snapToNearestOcean } from "../utils/coordinateUtils";
import { fetchVerticalProfile } from "../utils/profileApi";
import { fetchSurfacePoint } from "../utils/surfaceApi";
import { fetchAllSurfaceMaps } from "../utils/surfaceMapApi";
import { getTileUrl } from "../utils/mapTiles";

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
  const [modelProfile, setModelProfile] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMeta, setProfileMeta] = useState({ gridId: "", forecastDate: "" });
  const profileAbortRef = useRef(null);
  const [surfaceData, setSurfaceData] = useState(null);
  const [surfaceLoading, setSurfaceLoading] = useState(false);
  const [surfaceError, setSurfaceError] = useState("");
  const [surfaceMeta, setSurfaceMeta] = useState({ gridId: "", date: "", source: "" });
  const surfaceAbortRef = useRef(null);
  const surfaceMapControllerRef = useRef(null);
  
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
  const [isGridLive, setIsGridLive] = useState(false);

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

  // Synthetic grid generator (fallback when the live surface map is
  // unavailable, for out-of-range custom regions, or the depth view).
  const buildSyntheticGrid = useCallback(() => {
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
    return grid;
  }, [activeCenter, activeResolution, isCurrentLocationOutside]);

  useEffect(() => {
    if (!submittedParameter && !showAllMapsView && !showVisualization) {
      setActiveGridData(null);
      setIsGridLive(false);
      return;
    }

    if (!activeResolution) return;

    // Live whole-domain surface maps (sst/ssh/sss/sscu/sscv) via
    // GET /surface/map. Only valid inside the model domain at 0.25° —
    // custom out-of-range regions and the depth view keep synthetic data.
    const useLiveSurface = (submittedParameter || showAllMapsView) && !isCurrentLocationOutside && Boolean(date);
    if (!useLiveSurface) {
      setIsGridLive(false);
      setIsGeneratingGrid(true);

      const timer = setTimeout(() => {
        setActiveGridData(buildSyntheticGrid());
        setIsGeneratingGrid(false);
      }, 40);

      return () => clearTimeout(timer);
    }

    let cancelled = false;
    const controller = new AbortController();
    surfaceMapControllerRef.current = controller;
    setIsGeneratingGrid(true);

    (async () => {
      try {
        const live = await fetchAllSurfaceMaps({ date, signal: controller.signal });
        if (cancelled || controller.signal.aborted) return;
        setActiveGridData(live);
        setIsGridLive(true);
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.warn("Live surface map unavailable — falling back to synthetic grid:", error);
        if (cancelled || controller.signal.aborted) return;
        setActiveGridData(buildSyntheticGrid());
        setIsGridLive(false);
        triggerNotification("Live heatmap unavailable for this date — showing synthetic grid.");
      } finally {
        if (surfaceMapControllerRef.current === controller) {
          surfaceMapControllerRef.current = null;
        }
        if (!cancelled) setIsGeneratingGrid(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (surfaceMapControllerRef.current === controller) {
        surfaceMapControllerRef.current = null;
      }
    };
  }, [submittedParameter, showAllMapsView, showVisualization, activeCenter, activeResolution, isCurrentLocationOutside, date, buildSyntheticGrid, triggerNotification]);

  // Fetch the selected 0.25° model profile through the backend.
  // Uses the shared profileApi helper (same-origin /api proxy in dev, so no
  // CORS preflight; explicit CORS allowlist on the backend for cross-origin).
  // Exposes loading/error state so the side panel shows LIVE vs fallback data.
  const fetchProfile = useCallback(async (lat, lng, opts = {}) => {
    const forecastDate = opts.date ?? date;
    if (!forecastDate) {
      const msg = t("chooseDate") || "Please select the date first.";
      setProfileError(msg);
      triggerNotification(msg);
      return;
    }

    // Cancel any in-flight request so rapid map clicks can't show stale data.
    if (profileAbortRef.current) profileAbortRef.current.abort();
    const controller = new AbortController();
    profileAbortRef.current = controller;

    setProfileLoading(true);
    setProfileError("");

    try {
      const result = await fetchVerticalProfile({
        lat,
        lng,
        date: forecastDate,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setModelProfile(result.profile);
      setProfileMeta({ gridId: result.gridId, forecastDate: result.forecastDate });
      if (result.profile.length === 0) {
        const msg = "Backend returned an empty profile for this grid/date.";
        setProfileError(msg);
        triggerNotification(msg);
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Profile connection error:", error);
      if (controller.signal.aborted) return;
      setModelProfile([]);
      const msg = error?.message || "Failed to fetch temperature profile.";
      setProfileError(msg);
      triggerNotification(msg);
    } finally {
      if (profileAbortRef.current === controller) {
        profileAbortRef.current = null;
        setProfileLoading(false);
      }
    }
  }, [date, t, triggerNotification]);

  // Fetch live surface-point values (sst/sss/ssh/uo/vo) through the backend.
  // Runs alongside the vertical profile so the side panel shows LIVE surface
  // cards instead of dummyOceanData. Abortable to avoid stale map clicks.
  const fetchSurface = useCallback(async (lat, lng, opts = {}) => {
    const targetDate = opts.date ?? date;
    if (!targetDate) {
      setSurfaceError("Please select the date first.");
      return;
    }

    if (surfaceAbortRef.current) surfaceAbortRef.current.abort();
    const controller = new AbortController();
    surfaceAbortRef.current = controller;

    setSurfaceLoading(true);
    setSurfaceError("");

    try {
      const result = await fetchSurfacePoint({
        lat,
        lng,
        date: targetDate,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setSurfaceData(result.surface);
      setSurfaceMeta({ gridId: result.gridId, date: result.date, source: result.source });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Surface connection error:", error);
      if (controller.signal.aborted) return;
      setSurfaceData(null);
      setSurfaceError(error?.message || "Failed to fetch surface data.");
    } finally {
      if (surfaceAbortRef.current === controller) {
        surfaceAbortRef.current = null;
        setSurfaceLoading(false);
      }
    }
  }, [date]);

  // Fetch both profile + surface for a pinned location.
  const fetchLocationData = useCallback(async (lat, lng, opts = {}) => {
    await Promise.all([fetchProfile(lat, lng, opts), fetchSurface(lat, lng, opts)]);
  }, [fetchProfile, fetchSurface]);

  // Keep the vertical profile + surface in sync when the date changes for a pinned location.
  useEffect(() => {
    if (!position || !date) return;
    fetchProfile(position.lat, position.lng, { date });
    fetchSurface(position.lat, position.lng, { date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const retryProfile = useCallback(() => {
    if (!position) return;
    fetchProfile(position.lat, position.lng);
  }, [position, fetchProfile]);

  const retrySurface = useCallback(() => {
    if (!position) return;
    fetchSurface(position.lat, position.lng);
  }, [position, fetchSurface]);

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
    if (profileAbortRef.current) profileAbortRef.current.abort();
    if (surfaceAbortRef.current) surfaceAbortRef.current.abort();
    setModelProfile([]);
    setProfileError("");
    setProfileLoading(false);
    setProfileMeta({ gridId: "", forecastDate: "" });
    setSurfaceData(null);
    setSurfaceError("");
    setSurfaceLoading(false);
    setSurfaceMeta({ gridId: "", date: "", source: "" });
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
      if (profileAbortRef.current) profileAbortRef.current.abort();
      if (surfaceAbortRef.current) surfaceAbortRef.current.abort();
      setModelProfile([]);
      setProfileError("");
      setSurfaceData(null);
      setSurfaceError("");
    } else if (targetCoord) {
      const newPos = { lat: targetCoord.lat, lng: targetCoord.lng, isOnLand: false };
      setPosition(newPos);
      setTargetPosition(newPos);
      setActiveCenter(targetCoord);
      await fetchLocationData(targetCoord.lat, targetCoord.lng);
    }
  };

  function renderNavbarAndNotification() {
    return (
      <>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-paper/90 px-3 py-2 backdrop-blur-md sm:px-4
            dark:border-paper/10 dark:bg-ink/95"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white"
            >
              <Icon name="waves" size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-bold leading-tight text-ink dark:text-paper sm:text-lg">
                {t("title")}
              </h2>
              <div className="truncate text-[10px] font-semibold text-accent dark:text-paper/80">
                {t("subtitle")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <button
              type="button"
              className="oe-focus-visible inline-flex h-9 items-center rounded-lg border border-ink/10 bg-paper px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink/[0.06] sm:inline-flex
                dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper dark:hover:bg-paper/10"
              onClick={() => setShowGuidelinesPanel(true)}
            >
              {t("webGuidelines")}
            </button>
            <button
              type="button"
              className="oe-focus-visible inline-flex h-9 items-center rounded-lg border border-ink/10 bg-paper px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink/[0.06] sm:inline-flex
                dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper dark:hover:bg-paper/10"
              onClick={() => setShowAboutPanel(true)}
            >
              {t("aboutAuthors")}
            </button>
          </div>
        </nav>
        {notification && (
          <div
            role="status"
            className="flex items-center gap-2 border-b border-ink/10 bg-paper px-4 py-2 text-[13px] text-ink
              dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <Icon name="alert" size={14} />
            <span>{notification}</span>
          </div>
        )}
        {showAboutPanel && <AboutAuthors onClose={() => setShowAboutPanel(false)} />}
        {showGuidelinesPanel && <WebGuidelines onClose={() => setShowGuidelinesPanel(false)} />}
      </>
    );
  }

  if (showAllMapsView) {
    return (
      <div className="mx-auto box-border flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden bg-paper p-2 font-sans text-ink isolate dark:bg-ink sm:p-3">
        {renderNavbarAndNotification()}
        <AllHeatMapsDashboard 
          date={date}
          gridData={activeGridData} 
          activeResolution={activeResolution}
          isGeneratingGrid={isGeneratingGrid}
          isGridLive={isGridLive}
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
      <div className="mx-auto box-border flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden bg-paper p-2 font-sans text-ink isolate dark:bg-ink sm:p-3">
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
          isGridLive={isGridLive}
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
      <div className="mx-auto box-border flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden bg-paper p-2 font-sans text-ink isolate dark:bg-ink sm:p-3">
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
    <div className="mx-auto box-border flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden bg-paper p-2 font-sans text-ink isolate dark:bg-ink sm:p-3">
      {renderNavbarAndNotification()}

      {/* MOBILE SPECIFIC: ControlBar OUTSIDE map wrapper */}
      {isMobile && !isPanelExpanded && !showVisualization && (
        <div className="px-2 pt-2">
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

      {/* THE MAP INSTANCE */}
      <div className="relative block min-h-[40dvh] w-full flex-1 overflow-hidden rounded-lg border border-ink/15 bg-ink/[0.06] isolate dark:border-paper/10 dark:bg-ink sm:min-h-0">
        <MapContainer center={[activeCenter.lat, activeCenter.lng]} zoom={5} className="h-full w-full" minZoom={3} maxZoom={12} zoomControl={false} attributionControl={false}>
          <TileLayer url={getTileUrl(isDark)} />
          <MobileBoundsController isMobile={isMobile} isCurrentLocationOutside={isCurrentLocationOutside} />
          <MapTouchController />
          <DynamicGrid />
          <LocationMarker
            position={position} setPosition={setPosition} date={date} depth={depth} parameter={parameter}
            activeResolution={activeResolution} blockLocationSelection={blockLocationSelection}
            onSeaNameResolved={setCurrentSeaName} triggerNotification={triggerNotification}
            onProfileRequest={fetchLocationData}
          />
          <MapController targetPosition={targetPosition} />
          <ZoomLockController locked={isMapZoomLocked} />
          <MapInitializer setMap={setMapInstance} onMapLoaded={onMapLoaded} />
        </MapContainer>

        {/* DESKTOP SPECIFIC: ControlBar INSIDE map wrapper */}
        {!isMobile && !isPanelExpanded && !showVisualization && (
          <div className="absolute inset-x-4 top-4 z-control">
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
          </div>
        )}

        {mapInstance && !showVisualization && (
          <div
            className="absolute bottom-6 left-6 z-[3500] flex flex-col gap-1.5 rounded-lg border border-white/90 bg-paper/90 p-1.5 shadow-lift backdrop-blur
              dark:border-paper/10 dark:bg-ink/85"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="oe-focus-visible flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-ink/10 bg-paper text-[18px] text-ink transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-paper/15 dark:bg-paper/10 dark:text-paper dark:hover:bg-accent" type="button" disabled={isMapZoomLocked} onClick={() => mapInstance.zoomIn()} title={isMapZoomLocked ? (t("zoomLocked") || "Zoom locked while parameter/depth is selected") : "Zoom in"} aria-label="Zoom in">+</button>
            <button className="oe-focus-visible flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-ink/10 bg-paper text-[18px] text-ink transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-paper/15 dark:bg-paper/10 dark:text-paper dark:hover:bg-accent" type="button" disabled={isMapZoomLocked} onClick={() => mapInstance.zoomOut()} title={isMapZoomLocked ? (t("zoomLocked") || "Zoom locked while parameter/depth is selected") : "Zoom out"} aria-label="Zoom out">−</button>
          </div>
        )}

        {/* DESKTOP SPECIFIC: DataSidePanel INSIDE map wrapper overlaying map */}
        {!isMobile && position && !showVisualization && (
          <DataSidePanel 
            position={position} depth={depth} setDepth={setDepth} seaName={currentSeaName} profileData={modelProfile} activeResolution={activeResolution}
            profileLoading={profileLoading} profileError={profileError} profileMeta={profileMeta} onRetryProfile={retryProfile}
            surfaceData={surfaceData} surfaceLoading={surfaceLoading} surfaceError={surfaceError} surfaceMeta={surfaceMeta} onRetrySurface={retrySurface}
            onClose={() => { if (profileAbortRef.current) profileAbortRef.current.abort(); if (surfaceAbortRef.current) surfaceAbortRef.current.abort(); setPosition(null); setModelProfile([]); setProfileError(""); setProfileLoading(false); setSurfaceData(null); setSurfaceError(""); setSurfaceLoading(false); setIsPanelExpanded(false); setParameter(""); setSubmittedParameter(""); setLatitude(""); setLongitude(""); }} 
            isMobile={isMobile} onExpand={(expanded) => setIsPanelExpanded(expanded)} 
          />
        )}
      </div>

      {/* MOBILE SPECIFIC: DataSidePanel OUTSIDE map wrapper so it stacks naturally below */}
      {isMobile && position && !showVisualization && (
        <DataSidePanel 
          position={position} depth={depth} setDepth={setDepth} seaName={currentSeaName} profileData={modelProfile} activeResolution={activeResolution}
          profileLoading={profileLoading} profileError={profileError} profileMeta={profileMeta} onRetryProfile={retryProfile}
          surfaceData={surfaceData} surfaceLoading={surfaceLoading} surfaceError={surfaceError} surfaceMeta={surfaceMeta} onRetrySurface={retrySurface}
          onClose={() => { if (profileAbortRef.current) profileAbortRef.current.abort(); if (surfaceAbortRef.current) surfaceAbortRef.current.abort(); setPosition(null); setModelProfile([]); setProfileError(""); setProfileLoading(false); setSurfaceData(null); setSurfaceError(""); setSurfaceLoading(false); setIsPanelExpanded(false); setParameter(""); setSubmittedParameter(""); setLatitude(""); setLongitude(""); }} 
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
}