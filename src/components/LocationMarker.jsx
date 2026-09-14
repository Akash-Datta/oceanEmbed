import React, { useEffect, useRef, useState, useCallback } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

import {
  snapToNearestOcean,
  parseAndTranslateApiSeaName,
  getWaterBodyName,
} from "../utils/coordinateUtils";

import { useLanguage } from "../context/LanguageContext";

const formatExact = (val, isLat, t) => {
  const absVal = Math.abs(val).toFixed(6);
  if (val === 0) return `${absVal}°`;
  if (isLat) return val > 0 ? `${absVal}°${t("dirN") || "N"}` : `${absVal}°${t("dirS") || "S"}`;
  return val > 0 ? `${absVal}°${t("dirE") || "E"}` : `${absVal}°${t("dirW") || "W"}`;
};

const pointerIcon = L.divIcon({
  className: "oe-pin",
  html: `
    <div class="oe-pin-wrap">
      <div class="oe-pin-ring r1"></div>
      <div class="oe-pin-ring r2"></div>
      <div class="oe-pin-ring r3"></div>
      <div class="oe-pin-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21.5s-7-6.2-7-11.3a7 7 0 0 1 14 0c0 5.1-7 11.3-7 11.3Z"></path>
          <circle cx="12" cy="10" r="2.5"></circle>
        </svg>
      </div>
      <div class="oe-pin-dot"></div>
    </div>
  `,
  iconSize: [54, 54],
  iconAnchor: [27, 48],
  popupAnchor: [0, -48],
});

export default function LocationMarker({
  position,
  setPosition,
  date,
  depth,
  parameter, 
  blockLocationSelection, 
  onSeaNameResolved,
  triggerNotification,
  onDepthOnlyMapClick,
  onProfileRequest,
}) {
  const { t } = useLanguage();
  const markerRef = useRef(null);
  const map = useMap();
  const [seaName, setSeaName] = useState("");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fully dynamic calculation to prevent hiding behind input fields at extreme zoom-outs / poles
  const checkFlip = useCallback(() => {
    if (!position || !map || !markerRef.current) return;
    const popup = markerRef.current.getPopup();
    if (!popup || !popup.isOpen()) return;
    const popupNode = popup._container;
    if (!popupNode) return;

    // Calculate exact pixel distance from the marker to the top of the map container
    const pt = map.latLngToContainerPoint([position.lat, position.lng]);
    
    // Required clearance thresholds based on UI bounds
    const topThreshold = isMobile ? 160 : 220; 
    
    if (pt.y < topThreshold) {
      if (!popupNode.classList.contains('flipped-popup-right')) {
        popupNode.classList.add('flipped-popup-right');
      }
      
      // Dynamically calculate the exact space needed so it never clips under input fields
      requestAnimationFrame(() => {
        const popupHeight = popupNode.offsetHeight || 130;
        // If the marker is pushed right against the very top edge, add extra downward breathing room
        const extraPadding = pt.y < 80 ? (80 - pt.y) : 0;
        const dynamicTop = Math.max(10, 25 + extraPadding);
        popupNode.style.setProperty('--dynamic-top-offset', `${dynamicTop}px`);
      });
    } else {
      if (popupNode.classList.contains('flipped-popup-right')) {
        popupNode.classList.remove('flipped-popup-right');
        popupNode.style.removeProperty('--dynamic-top-offset');
        requestAnimationFrame(() => {
          if (popup.isOpen()) popup.update(); 
        });
      }
    }
  }, [map, position, isMobile]);

  useMapEvents({
    zoom: checkFlip,
    move: checkFlip,
    zoomend: checkFlip,
    moveend: checkFlip,
    popupopen: () => {
      setTimeout(() => {
        checkFlip();
        if (markerRef.current) markerRef.current.getPopup()?.update();
      }, 15);
    },
    async click(event) {
      if (blockLocationSelection) {
        if (depth && !parameter && !position && onDepthOnlyMapClick) {
          onDepthOnlyMapClick();
        }
        return;
      }

      if (!date) {
        triggerNotification(t("chooseDate") || "Please enter the date first.");
        return;
      }

      const clickedLat = event.latlng.lat;
      const clickedLng = event.latlng.lng;

      try {
        const snapped = snapToNearestOcean(clickedLat, clickedLng);

        if (!snapped || snapped.failed) {
          triggerNotification(
            t("oceanLocFailed") || "Unable to find a nearby ocean location. Please try another coordinate."
          );
          return;
        }

        if (snapped.redirected) {
          triggerNotification(
            t("landRedirect") || "Land coordinate detected. Redirecting to the nearest valid ocean grid."
          );
        }

        setPosition({
          lat: snapped.lat,
          lng: snapped.lng,
          isOnLand: false,
        });

        if (onProfileRequest) {
          await onProfileRequest(snapped.lat, snapped.lng);
        }
      } catch (error) {
        console.error("Ocean redirection failed:", error);
        triggerNotification(
          t("oceanLocFailed") || "Unable to find a nearby ocean location."
        );
      }
    },
  });

  useEffect(() => {
    if (!position) {
      setSeaName("");
      return;
    }

    const rawName = getWaterBodyName(position.lat, position.lng);
    const finalSeaName = parseAndTranslateApiSeaName(rawName, t);

    setSeaName(finalSeaName);
    if (onSeaNameResolved) {
      onSeaNameResolved(finalSeaName);
    }

    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
        setTimeout(checkFlip, 20); 
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [position, onSeaNameResolved, t, checkFlip]);

  if (!position) return null;

  return (
    <>
      <Marker
        key={`${position.lat}-${position.lng}`}
        ref={markerRef}
        position={[position.lat, position.lng]}
        icon={pointerIcon}
        zIndexOffset={9999}
        eventHandlers={{
          add: (event) => {
            setTimeout(() => {
              event.target.openPopup();
              checkFlip();
            }, 80);
          },
          click: (event) => {
            event.target.openPopup();
            checkFlip();
          },
        }}
      >
        <Popup autoPan={false} closeButton={true} style={{ zIndex: 9999 }}>
          <div className={`min-w-[160px] p-0.5 text-center font-sans sm:min-w-[240px] sm:p-1`}>

            <div className="mb-1 font-display text-[15px] font-bold text-ink sm:text-[17px]">
              {t("exactLocation") || "Location"}
            </div>

            <div
              className="mb-2 text-[12px] text-ink/60 sm:mb-3.5"
            >
              {seaName}
            </div>

            <div className="rounded-lg border border-ink/15 bg-ink/[0.03] p-1.5 sm:p-2.5">
              <div className="mb-1 text-[8.5px] font-bold text-ink/60 sm:mb-2 sm:text-[10px]">
                {t("exactCoordinate") || "EXACT COORDINATE"}
              </div>

              <div className="inline-flex w-full items-center justify-center rounded-lg border border-ink/10 bg-paper px-2 py-1 sm:px-3 sm:py-1.5">
                <span className="font-mono text-[11px] font-bold tracking-tight text-ink sm:text-[13px]">
                  {formatExact(position.lat, true, t)}
                </span>
                <span className="mx-[3px] font-bold text-ink/45 sm:mx-1.5">,</span>
                <span className="font-mono text-[11px] font-bold tracking-tight text-ink sm:text-[13px]">
                  {formatExact(position.lng, false, t)}
                </span>
              </div>
            </div>

          </div>
        </Popup>
      </Marker>
    </>
  );
}

export function MapController({ targetPosition }) {
  const map = useMap();

  // VOID PREVENTION: Locks the global map boundaries
  useEffect(() => {
    if (!map) return;
    const southWest = L.latLng(-85.0511, -360);
    const northEast = L.latLng(85.0511, 360);
    map.setMaxBounds(L.latLngBounds(southWest, northEast));
    map.options.maxBoundsViscosity = 1.0; 
  }, [map]);

  useEffect(() => {
    if (!targetPosition) return;
    const timer = setTimeout(() => {
      try {
        if (!map) return;
        const currentZoom = map.getZoom() || 5;

        map.flyTo([targetPosition.lat, targetPosition.lng], Math.max(currentZoom, 5), {
          duration: 1.2,
          easeLinearity: 0.25,
        });
      } catch (error) {
        try { map.setView([targetPosition.lat, targetPosition.lng], 5); } catch (e) {}
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [targetPosition, map]);
  
  return null;
}

export function MapTouchController() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.options.touchZoom = true;
    map.options.dragging = true;
    map.options.scrollWheelZoom = true;
    map.options.doubleClickZoom = true;
    if (map.dragging && !map.dragging.enabled()) map.dragging.enable();
    if (map.touchZoom && !map.touchZoom.enabled()) map.touchZoom.enable();
    if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
    if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) map.doubleClickZoom.enable();
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}