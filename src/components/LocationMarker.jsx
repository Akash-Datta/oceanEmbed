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
  className: "custom-pointer",
  html: `
    <div class="cyber-pin-wrap">
      <div class="cyber-pin-scan"></div>
      <div class="cyber-pin-ring r1"></div>
      <div class="cyber-pin-ring r2"></div>
      <div class="cyber-pin-ring r3"></div>
      <div class="cyber-pin-emoji">📍</div>
      <div class="cyber-pin-dot"></div>
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
      <style>{`
        /* Flipped state (Right side shift with dynamically calculated downward offset) */
        .flipped-popup-right {
          bottom: auto !important;     
          top: var(--dynamic-top-offset, 20px) !important; /* Fully dynamic auto-adjustment */
          left: 46px !important;       /* Shifts the popup entirely to the right, fully clearing the pin */
          margin-left: 0 !important;   
        }
        
        /* Hide the default Leaflet tip container entirely */
        .flipped-popup-right .leaflet-popup-tip-container {
          display: none !important;
        }

        /* Generate a crisp tip projecting from the left edge pointing at the pin */
        .flipped-popup-right .leaflet-popup-content-wrapper {
          position: relative;
        }
        .flipped-popup-right .leaflet-popup-content-wrapper::before {
          content: '';
          position: absolute;
          left: -6px;           
          top: 14px;            /* Scales cleanly with the dynamic container */
          width: 12px;
          height: 12px;
          background: #ffffff;
          transform: rotate(45deg);
          border-left: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          border-radius: 2px 0 0 0;
          z-index: -1;          
          box-shadow: -2px 2px 4px rgba(0,0,0,0.04);
        }
      `}</style>

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
          <div className="map-popup-body" style={{ 
            minWidth: isMobile ? "160px" : "240px", 
            maxWidth: isMobile ? "220px" : "none", 
            padding: isMobile ? "2px" : "4px", 
            textAlign: "center", 
            fontFamily: "Inter, Arial, sans-serif" 
          }}>
            
            <div className="map-popup-title" style={{ fontSize: isMobile ? "13px" : "16px", fontWeight: "800", marginBottom: "4px", color: "#075985" }}>
              {t("exactLocation") || "📍 Location"}
            </div>

            <div
              className="map-popup-sea"
              style={{
                fontSize: isMobile ? "10px" : "12px",
                fontWeight: "700",
                color: "#0ea5e9",
                marginBottom: isMobile ? "8px" : "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                wordWrap: "break-word"
              }}
            >
              {seaName}
            </div>

            <div className="map-popup-coord-box" style={{ 
              background: "linear-gradient(135deg, rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.6))", 
              padding: isMobile ? "6px" : "10px", 
              borderRadius: "10px", 
              border: "1px solid #cbd5e1",
              boxShadow: "inset 0 1px 3px rgba(255,255,255,0.8), 0 2px 5px rgba(0,0,0,0.05)"
            }}>
              <div className="map-popup-coord-label" style={{ fontWeight: "800", marginBottom: isMobile ? "4px" : "8px", color: "#475569", fontSize: isMobile ? "8.5px" : "10px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                {t("exactCoordinate") || "EXACT COORDINATE"}
              </div>
              
              <div className="map-popup-coord-inner" style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "#ffffff", 
                padding: isMobile ? "4px 8px" : "6px 12px", 
                borderRadius: "8px", 
                border: "1px solid #e2e8f0", 
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <span className="map-popup-coord-value" style={{ fontWeight: "700", fontSize: isMobile ? "11px" : "13px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.3px" }}>
                  {formatExact(position.lat, true, t)}
                </span>
                <span className="map-popup-coord-sep" style={{ color: "#94a3b8", fontWeight: "800", margin: isMobile ? "0 3px" : "0 6px" }}>,</span>
                <span className="map-popup-coord-value" style={{ fontWeight: "700", fontSize: isMobile ? "11px" : "13px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.3px" }}>
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