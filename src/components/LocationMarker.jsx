import React, { useEffect, useRef, useState } from "react";
import {
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { snapToNearestOcean } from "../utils/coordinateUtils";

const pointerIcon = L.divIcon({
  className: "custom-pointer",
  html: `<div style="font-size: 34px; line-height: 34px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.35)); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

export default function LocationMarker({
  position,
  setPosition,
  startDate,
  onSeaNameResolved,
  triggerNotification,
}) {
  const markerRef = useRef(null);
  const [seaName, setSeaName] = useState("");
  const requestIdRef = useRef(0);

  useMapEvents({
    click(event) {
      if (!startDate) {
        triggerNotification("Please enter the starting date first.");
        return;
      }

      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      try {
        const snapped = snapToNearestOcean(lat, lng);

        if (snapped.failed) {
          triggerNotification("Unable to find a nearby ocean location. Please try another coordinate.");
          return;
        }

        if (snapped.redirected) {
          triggerNotification("Land coordinate detected. Redirecting location to the nearest sea coordinates.");
        }

        const newPos = {
          lat: snapped.lat,
          lng: snapped.lng,
          isOnLand: false,
        };

        setSeaName("Loading sea name...");
        setPosition(newPos);
      } catch (error) {
        console.error("Ocean redirection failed:", error);
      }
    },
  });

  useEffect(() => {
    if (!position) {
      setSeaName("");
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    const loadingText = "Loading sea name...";

    setSeaName(loadingText);

    if (onSeaNameResolved) {
      onSeaNameResolved(loadingText);
    }

    const controller = new AbortController();

    const fetchSeaName = async () => {
      try {
        const response = await fetch(
          `https://marineregions.org/rest/getGazetteerRecordsByLatLong.json/${position.lat}/${position.lng}/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Marine Regions API returned ${response.status}`);
        }

        const data = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        let resolvedName = "Open Ocean";

        if (Array.isArray(data) && data.length > 0) {
          const waterBody = data.find((item) => {
            const name = (item?.preferredGazetteerName || "").toUpperCase();
            return (
              name.includes("SEA") ||
              name.includes("BAY") ||
              name.includes("GULF") ||
              name.includes("OCEAN") ||
              name.includes("STRAIT") ||
              name.includes("CHANNEL")
            );
          });

          if (waterBody?.preferredGazetteerName) {
            resolvedName = waterBody.preferredGazetteerName;
          }
        }

        setSeaName(resolvedName);

        if (onSeaNameResolved) {
          onSeaNameResolved(resolvedName);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const fallbackName = "Open Ocean";
        setSeaName(fallbackName);

        if (onSeaNameResolved) {
          onSeaNameResolved(fallbackName);
        }
      }
    };

    fetchSeaName();

    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, onSeaNameResolved]);

  if (!position) {
    return null;
  }

  return (
    <Marker
      key={`${position.lat}-${position.lng}`}
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={pointerIcon}
      eventHandlers={{
        add: (event) => {
          setTimeout(() => {
            event.target.openPopup();
          }, 30);
        },
        click: (event) => {
          event.target.openPopup();
        },
      }}
    >
      <Popup autoPan={true} autoPanPadding={[35, 35]} closeButton={true}>
        <div
          style={{
            minWidth: "190px",
            textAlign: "center",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: "800",
              marginBottom: "4px",
              color: "#075985",
            }}
          >
            📍 Exact Location
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: seaName === "Loading sea name..." ? "#64748b" : "#0ea5e9",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {seaName || "Loading sea name..."}
          </div>

          <div
            style={{
              fontSize: "12px",
              lineHeight: "1.9",
              color: "#374151",
            }}
          >
            <strong>Latitude:</strong> {position.lat.toFixed(6)}°
            <br />
            <strong>Longitude:</strong> {position.lng.toFixed(6)}°
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapController({ targetPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!targetPosition) {
      return;
    }

    map.flyTo(
      [targetPosition.lat, targetPosition.lng],
      Math.max(map.getZoom(), 5),
      {
        duration: 1.2,
        easeLinearity: 0.25,
      }
    );
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

    return () => {
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}