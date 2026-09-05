import React, { useEffect, useRef, useState } from "react";
import {
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { snapToNearestOcean, parseAndTranslateApiSeaName, formatLatitude, formatLongitude } from "../utils/coordinateUtils";
import { useLanguage } from "../context/LanguageContext";

const pointerIcon = L.divIcon({
  className: "custom-pointer",
  html: `<div style="font-size: 34px; line-height: 34px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.35)); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

// Comprehensive regional bounding-box fallbacks including all requested seas, straits, and gulfs
const getRegionalSeaFallback = (lat, lng) => {
  // Ross Sea
  if (lat >= -85 && lat <= -70 && lng >= 160 && lng <= 210) return "Ross Sea";
  // Amundsen Sea
  if (lat >= -75 && lat <= -70 && lng >= -135 && lng <= -100) return "Amundsen Sea";
  // Bellingshausen Sea
  if (lat >= -75 && lat <= -65 && lng >= -100 && lng <= -70) return "Bellingshausen Sea";
  // Weddell Sea
  if (lat >= -80 && lat <= -65 && lng >= -60 && lng <= -10) return "Weddell Sea";
  // Gulf of Bothnia
  if (lat >= 60 && lat <= 66 && lng >= 17 && lng <= 25) return "Gulf of Bothnia";
  // Tyrrhenian Sea
  if (lat >= 38 && lat <= 43 && lng >= 9 && lng <= 16) return "Tyrrhenian Sea";
  // Strait of Sicily
  if (lat >= 36 && lat <= 38 && lng >= 11 && lng <= 13) return "Strait of Sicily";
  // Adriatic Sea
  if (lat >= 40 && lat <= 45.5 && lng >= 12 && lng <= 20) return "Adriatic Sea";
  // Ligurian Sea
  if (lat >= 43 && lat <= 44.5 && lng >= 8 && lng <= 10.5) return "Ligurian Sea";
  // Gulf of Venice
  if (lat >= 45 && lat <= 45.8 && lng >= 12 && lng <= 14) return "Gulf of Venice";
  // Strait of Magellan & Southern Fjords
  if (lat >= -56 && lat <= -52 && lng >= -76 && lng <= -68) return "Strait of Magellan";
  // Beagle Channel
  if (lat >= -56 && lat <= -54 && lng >= -71 && lng <= -65) return "Beagle Channel";
  // Le Maire Strait
  if (lat >= -56 && lat <= -54 && lng >= -67 && lng <= -62) return "Le Maire Strait";
  // East China Sea
  if (lat >= 23 && lat <= 32 && lng >= 120 && lng <= 130) return "East China Sea";
  // Taiwan Strait
  if (lat >= 22 && lat <= 26 && lng >= 117 && lng <= 121) return "Taiwan Strait";
  // Karimata Strait
  if (lat >= -3 && lat <= 4 && lng >= 105 && lng <= 111) return "Karimata Strait";
  // Molucca Sea
  if (lat >= -2 && lat <= 4 && lng >= 124 && lng <= 129) return "Molucca Sea";
  // Andaman Sea
  if (lat >= 5 && lat <= 16 && lng >= 92 && lng <= 99) return "Andaman Sea";
  // Gulf of Thailand
  if (lat >= 7 && lat <= 14 && lng >= 99 && lng <= 105) return "Gulf of Thailand";
  // Java Sea
  if (lat >= -8 && lat <= -3 && lng >= 106 && lng <= 118) return "Java Sea";
  // Makassar Strait
  if (lat >= -5 && lat <= 4 && lng >= 116 && lng <= 120) return "Makassar Strait";
  // Flores Sea
  if (lat >= -9 && lat <= -5 && lng >= 117 && lng <= 125) return "Flores Sea";
  // Banda Sea
  if (lat >= -8 && lat <= -3 && lng >= 124 && lng <= 132) return "Banda Sea";
  // South China Sea
  if (lat >= 1 && lat <= 23 && lng >= 99 && lng <= 121) return "South China Sea";
  return null;
};

export default function LocationMarker({
  position,
  setPosition,
  startDate,
  depth,
  onSeaNameResolved,
  triggerNotification,
}) {
  const { language, t } = useLanguage();
  const markerRef = useRef(null);
  const [seaName, setSeaName] = useState("");
  const requestIdRef = useRef(0);

  useMapEvents({
    async click(event) {
      if (!startDate) {
        triggerNotification(t("startDatePrompt") || "Please enter the starting date first.");
        return;
      }

      if (depth) {
        return;
      }

      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      try {
        const snappedResult = snapToNearestOcean(lat, lng);
        const snapped = snappedResult instanceof Promise ? await snappedResult : snappedResult;

        if (!snapped || snapped.failed) {
          triggerNotification(t("oceanLocFailed") || "Unable to find a nearby ocean location. Please try another coordinate.");
          return;
        }

        if (snapped.redirected) {
          triggerNotification(t("landRedirect") || "Land coordinate detected. Redirecting location to the nearest sea coordinates.");
        }

        const newPos = {
          lat: snapped.lat,
          lng: snapped.lng,
          isOnLand: false,
        };

        setSeaName(t("loadingSeaName") || "Loading sea name...");
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
    const loadingText = t("loadingSeaName") || "Loading sea name...";

    setSeaName(loadingText);

    if (onSeaNameResolved) {
      onSeaNameResolved(loadingText);
    }

    const regionalMatch = getRegionalSeaFallback(position.lat, position.lng);
    if (regionalMatch) {
      const finalSeaName = parseAndTranslateApiSeaName(regionalMatch, t);
      setSeaName(finalSeaName);
      if (onSeaNameResolved) {
        onSeaNameResolved(finalSeaName);
      }
      return;
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
            const type = (item?.featureTypeName || "").toUpperCase();

            if (type.includes("COUNTRY") || type.includes("STATE") || type.includes("LAND") || type.includes("ADMIN")) {
              return false;
            }

            return (
              type.includes("WATER") ||
              type.includes("SEA") ||
              type.includes("STRAIT") ||
              type.includes("GULF") ||
              type.includes("BAY") ||
              type.includes("OCEAN") ||
              type.includes("CHANNEL") ||
              type.includes("PASSAGE") ||
              name.includes("SEA") ||
              name.includes("BAY") ||
              name.includes("GULF") ||
              name.includes("OCEAN") ||
              name.includes("STRAIT") ||
              name.includes("CHANNEL") ||
              name.includes("PASSAGE")
            );
          });

          if (waterBody?.preferredGazetteerName) {
            resolvedName = waterBody.preferredGazetteerName;
          } else {
            const validItem = data.find((item) => {
              const type = (item?.featureTypeName || "").toUpperCase();
              return !type.includes("COUNTRY") && !type.includes("STATE") && !type.includes("LAND");
            });
            if (validItem?.preferredGazetteerName) {
              resolvedName = validItem.preferredGazetteerName;
            }
          }
        }

        const finalSeaName = parseAndTranslateApiSeaName(resolvedName, t);

        setSeaName(finalSeaName);

        if (onSeaNameResolved) {
          onSeaNameResolved(finalSeaName);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const fallbackName = parseAndTranslateApiSeaName("Open Ocean", t);
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
  }, [position, onSeaNameResolved, t]);

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
            {t("exactLocation") || "📍 Exact Location"}
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: seaName === (t("loadingSeaName") || "Loading sea name...") ? "#64748b" : "#0ea5e9",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {seaName || (t("loadingSeaName") || "Loading sea name...")}
          </div>

          <div
            style={{
              fontSize: "12px",
              lineHeight: "1.9",
              color: "#374151",
            }}
          >
            <strong>{t("gridLat")}:</strong> {formatLatitude(position.lat, language)}
            <br />
            <strong>{t("gridLng")}:</strong> {formatLongitude(position.lng, language)}
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

    if (map.dragging && !map.dragging.enabled()) map.dragging.enable();
    if (map.touchZoom && !map.touchZoom.enabled()) map.touchZoom.enable();
    if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
    if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) map.doubleClickZoom.enable();

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