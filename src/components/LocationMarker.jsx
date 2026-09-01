import React, { useEffect, useRef, useState } from "react";
import {
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { checkIfLand } from "../utils/coordinateUtils";

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

export default function LocationMarker({
  position,
  setPosition,
  onSeaNameResolved,
}) {
  const markerRef = useRef(null);

  const [seaName, setSeaName] = useState("");

  /*
   * Prevent an old API request from updating the current marker.
   */
  const requestIdRef = useRef(0);

  useMapEvents({
    click(event) {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      let isLand = false;

      try {
        isLand = checkIfLand(lat, lng);
      } catch (error) {
        console.error("Land detection failed:", error);

        /*
         * If the huge GeoJSON somehow fails, don't crash the app.
         * Treat it as water and allow the marker to work.
         */
        isLand = false;
      }

      /*
       * Reset the sea-name state immediately.
       */
      setSeaName(
        isLand
          ? "Terrestrial Region"
          : "Loading sea name..."
      );

      setPosition({
        lat,
        lng,
        isOnLand: isLand,
      });
    },
  });

  useEffect(() => {
    if (!position) {
      setSeaName("");
      return;
    }

    /*
     * Every new position gets a new request ID.
     * This prevents an old request from overwriting a newer click.
     */
    const currentRequestId = ++requestIdRef.current;

    /*
     * LAND:
     * No API call is necessary.
     */
    if (position.isOnLand) {
      const landName = "Terrestrial Region";

      setSeaName(landName);

      if (onSeaNameResolved) {
        onSeaNameResolved(landName);
      }

      return;
    }

    /*
     * WATER:
     * Immediately show a loading message.
     */
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
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Marine Regions API returned ${response.status}`
          );
        }

        const data = await response.json();

        /*
         * If the user clicked somewhere else while the request
         * was running, ignore this response.
         */
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        let resolvedName = "Open Ocean";

        if (Array.isArray(data) && data.length > 0) {
          const waterBody = data.find((item) => {
            const name = (
              item?.preferredGazetteerName || ""
            ).toUpperCase();

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
            resolvedName =
              waterBody.preferredGazetteerName;
          }
        }

        setSeaName(resolvedName);

        if (onSeaNameResolved) {
          onSeaNameResolved(resolvedName);
        }
      } catch (error) {
        /*
         * Abort errors are expected when the user clicks another
         * location. Don't display them as failures.
         */
        if (error.name === "AbortError") {
          return;
        }

        console.warn(
          "Sea name lookup failed:",
          error
        );

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        /*
         * API failure should NOT leave the UI permanently
         * stuck on "Loading sea name..."
         */
        const fallbackName = "Open Ocean";

        setSeaName(fallbackName);

        if (onSeaNameResolved) {
          onSeaNameResolved(fallbackName);
        }
      }
    };

    fetchSeaName();

    /*
     * Automatically open the popup.
     */
    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    position,
    onSeaNameResolved,
  ]);

  if (!position) {
    return null;
  }

  return (
    <Marker
      key={`${position.lat}-${position.lng}`}
      ref={markerRef}
      position={[
        position.lat,
        position.lng,
      ]}
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
      <Popup
        autoPan={true}
        autoPanPadding={[35, 35]}
        closeButton={true}
      >
        <div
          style={{
            minWidth: "190px",
            textAlign: "center",
            fontFamily:
              "Inter, Arial, sans-serif",
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
              color:
                seaName === "Loading sea name..."
                  ? "#64748b"
                  : "#0ea5e9",
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
            <strong>Latitude:</strong>{" "}
            {position.lat.toFixed(6)}°
            <br />

            <strong>Longitude:</strong>{" "}
            {position.lng.toFixed(6)}°
          </div>

          {position.isOnLand && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "11px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              Land Area Detected
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function MapController({
  targetPosition,
}) {
  const map = useMap();

  useEffect(() => {
    if (!targetPosition) {
      return;
    }

    map.flyTo(
      [
        targetPosition.lat,
        targetPosition.lng,
      ],
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