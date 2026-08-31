import React, { useEffect, useRef } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { snapToNearestOcean } from "../utils/coordinateUtils";

// ============================================================
// POINTER ICON
// ============================================================
const pointerIcon = L.divIcon({
  className: "custom-pointer",
  html: `
    <div
      style="
        font-size: 34px;
        line-height: 34px;
        transform: translate(-50%, -100%);
        filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.35));
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      "
    >
      📍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

// ============================================================
// LOCATION MARKER
// ============================================================
export default function LocationMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(event) {
      // 1. Pass the raw click through the ocean snapper
      const snapped = snapToNearestOcean(event.latlng.lat, event.latlng.lng);
      
      // 2. Set the pin at the ocean coordinate
      setPosition({
        lat: snapped.lat,
        lng: snapped.lng,
      });
    },
  });

  useEffect(() => {
    if (!position) return;
    const timer = setTimeout(() => {
      if (markerRef.current) markerRef.current.openPopup();
    }, 50);
    return () => clearTimeout(timer);
  }, [position]);

  if (!position) return null;

  return (
    <Marker
      key={`${position.lat}-${position.lng}`}
      ref={markerRef}
      position={position}
      icon={pointerIcon}
      eventHandlers={{
        add: (event) => setTimeout(() => event.target.openPopup(), 30),
        click: (event) => event.target.openPopup(),
      }}
    >
      <Popup autoPan={true} autoPanPadding={[35, 35]} closeButton={true}>
        <div style={{ minWidth: "190px", textAlign: "center", fontFamily: "Inter, Arial, sans-serif" }}>
          <div style={{ fontSize: "15px", fontWeight: "800", marginBottom: "8px", color: "#075985" }}>
            📍 Exact Ocean Location
          </div>
          <div style={{ fontSize: "12px", lineHeight: "1.9", color: "#374151" }}>
            <strong>Latitude:</strong> {position.lat.toFixed(6)}°<br />
            <strong>Longitude:</strong> {position.lng.toFixed(6)}°
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ============================================================
// MAP CONTROLLERS (Exported for use in InteractiveMap)
// ============================================================
export function MapController({ targetPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!targetPosition) return;
    map.flyTo([targetPosition.lat, targetPosition.lng], Math.max(map.getZoom(), 5), {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [targetPosition, map]);

  return null;
}

export function MapTouchController() {
  const map = useMap();

  useEffect(() => {
    map.options.touchZoom = true;
    map.options.dragging = true;
    map.options.scrollWheelZoom = true;
    map.options.doubleClickZoom = true;
    map.invalidateSize();

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}