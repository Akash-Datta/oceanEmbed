import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import {
  checkIfLand,
} from "../utils/coordinateUtils";

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
        filter: drop-shadow(
          0px 3px 3px rgba(0,0,0,0.35)
        );
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
// SEA NAME CACHE
// ============================================================

const seaNameCache = new Map();

// ============================================================
// CANONICAL WATER-BODY NAME
// ============================================================

function getCanonicalSeaName(name) {

  if (!name) {
    return null;
  }

  const upperName =
    name.toUpperCase();

  /*
   * Marine Regions sometimes returns names such as:
   *
   * "Indian part of the Bay of Bengal"
   *
   * We only want:
   *
   * "Bay of Bengal"
   */

  const knownBodies = [
    "BAY OF BENGAL",
    "ARABIAN SEA",
    "ANDAMAN SEA",
    "LACCADIVE SEA",
    "LAKSHADWEEP SEA",
    "INDIAN OCEAN",
    "RED SEA",
    "GULF OF ADEN",
    "GULF OF MANNAR",
    "PALK STRAIT",
    "STRAIT OF MALACCA",
    "SOUTH CHINA SEA",
    "EAST CHINA SEA",
    "WEST PHILIPPINE SEA",
    "PACIFIC OCEAN",
    "ATLANTIC OCEAN",
    "ARCTIC OCEAN",
    "SOUTHERN OCEAN",
  ];

  for (
    const body of knownBodies
  ) {

    if (
      upperName.includes(body)
    ) {
      return body
        .split(" ")
        .map(
          word =>
            word.charAt(0) +
            word.slice(1).toLowerCase()
        )
        .join(" ");
    }
  }

  /*
   * If Marine Regions gives us a normal
   * sea/bay/gulf/ocean name, use it.
   */

  return name;
}

// ============================================================
// FETCH SEA NAME
// ============================================================

async function resolveSeaName(
  lat,
  lng,
  signal
) {

  const cacheKey =
    `${lat.toFixed(5)},${lng.toFixed(5)}`;

  // ----------------------------------------------------------
  // CACHE
  // ----------------------------------------------------------

  if (
    seaNameCache.has(cacheKey)
  ) {
    return seaNameCache.get(
      cacheKey
    );
  }

  try {

    const response =
      await fetch(
        `https://marineregions.org/rest/getGazetteerRecordsByLatLong.json/${lat}/${lng}/`,
        {
          signal,
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    let resolvedName = null;

    if (
      Array.isArray(data) &&
      data.length > 0
    ) {

      /*
       * First try to find an actual
       * marine body.
       */

      const waterBody =
        data.find(item => {

          const name =
            (
              item?.preferredGazetteerName ||
              ""
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

      if (waterBody) {

        resolvedName =
          getCanonicalSeaName(
            waterBody.preferredGazetteerName
          );
      }
    }

    /*
     * Do NOT display "Open Ocean" as if it were
     * an identified sea.
     *
     * It is only a fallback.
     */

    if (!resolvedName) {
      resolvedName = "Unknown Water Body";
    }

    seaNameCache.set(
      cacheKey,
      resolvedName
    );

    return resolvedName;

  } catch (error) {

    /*
     * AbortError is normal when the user
     * immediately clicks another location.
     */

    if (
      error?.name === "AbortError"
    ) {
      return null;
    }

    console.warn(
      "Sea name lookup failed:",
      error
    );

    return "Unknown Water Body";
  }
}

// ============================================================
// LOCATION MARKER
// ============================================================

export default function LocationMarker({
  position,
  setPosition,
  onSeaNameResolved,
}) {

  const markerRef =
    useRef(null);

  const [seaName, setSeaName] =
    useState("");

  // ----------------------------------------------------------
  // MAP CLICK
  // ----------------------------------------------------------

  useMapEvents({

    click(event) {

      const lat =
        event.latlng.lat;

      const lng =
        event.latlng.lng;

      const isLand =
        checkIfLand(
          lat,
          lng
        );

      setPosition({
        lat,
        lng,
        isOnLand: isLand,
      });
    },

  });

  // ----------------------------------------------------------
  // RESOLVE SEA NAME
  // ----------------------------------------------------------

  useEffect(() => {

    if (!position) {
      return;
    }

    /*
     * Land locations don't need a
     * Marine Regions request.
     */

    if (position.isOnLand) {

      const landName =
        "Terrestrial Region";

      setSeaName(
        landName
      );

      if (
        onSeaNameResolved
      ) {
        onSeaNameResolved(
          landName
        );
      }

      return;
    }

    /*
     * Abort previous request if the user
     * clicks another location quickly.
     */

    const controller =
      new AbortController();

    /*
     * Clear only the old name.
     *
     * We intentionally DO NOT display
     * "Identifying water body..."
     */

    setSeaName("");

    resolveSeaName(
      position.lat,
      position.lng,
      controller.signal
    ).then(name => {

      if (!name) {
        return;
      }

      setSeaName(name);

      if (
        onSeaNameResolved
      ) {
        onSeaNameResolved(
          name
        );
      }

    });

    return () => {
      controller.abort();
    };

  }, [
    position?.lat,
    position?.lng,
    position?.isOnLand,
    onSeaNameResolved,
  ]);

  // ----------------------------------------------------------
  // AUTO OPEN POPUP
  // ----------------------------------------------------------

  useEffect(() => {

    if (!position) {
      return;
    }

    const timer =
      setTimeout(() => {

        if (
          markerRef.current
        ) {
          markerRef.current.openPopup();
        }

      }, 50);

    return () =>
      clearTimeout(timer);

  }, [
    position?.lat,
    position?.lng,
  ]);

  // ----------------------------------------------------------
  // NO POSITION
  // ----------------------------------------------------------

  if (!position) {
    return null;
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

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
        add: event => {

          setTimeout(() => {

            event.target.openPopup();

          }, 30);

        },

        click: event => {
          event.target.openPopup();
        },
      }}
    >

      <Popup
        autoPan={true}
        autoPanPadding={[
          35,
          35,
        ]}
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

          {/* TITLE */}

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

          {/* SEA NAME */}

          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#0ea5e9",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minHeight: "18px",
            }}
          >
            {seaName}
          </div>

          {/* COORDINATES */}

          <div
            style={{
              fontSize: "12px",
              lineHeight: "1.9",
              color: "#374151",
            }}
          >

            <strong>
              Latitude:
            </strong>{" "}
            {position.lat.toFixed(6)}
            °

            <br />

            <strong>
              Longitude:
            </strong>{" "}
            {position.lng.toFixed(6)}
            °

          </div>

          {/* LAND WARNING */}

          {position.isOnLand && (

            <div
              style={{
                color: "#ef4444",
                fontSize: "11px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              ⚠️ Land Area Detected
            </div>

          )}

        </div>

      </Popup>

    </Marker>
  );
}

// ============================================================
// MAP CONTROLLER
// ============================================================

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
      Math.max(
        map.getZoom(),
        5
      ),
      {
        duration: 1.2,
        easeLinearity: 0.25,
      }
    );

  }, [
    targetPosition,
    map,
  ]);

  return null;
}

// ============================================================
// TOUCH CONTROLLER
// ============================================================

export function MapTouchController() {

  const map = useMap();

  useEffect(() => {

    map.options.touchZoom = true;
    map.options.dragging = true;
    map.options.scrollWheelZoom = true;
    map.options.doubleClickZoom = true;

    map.invalidateSize();

    const timer =
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

    return () =>
      clearTimeout(timer);

  }, [map]);

  return null;
}