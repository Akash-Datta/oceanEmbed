import * as turf from "@turf/turf";
import landGeoJSON from "../data/landMask.json";

// ============================================================
// COORDINATE FORMATTING
// ============================================================

export function formatLongitude(value) {
  let longitude = Number(value);

  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;

  if (Math.abs(longitude) < 0.000001) {
    return "0°";
  }

  const formatted = parseFloat(Math.abs(longitude).toFixed(6));

  return longitude > 0
    ? `${formatted}° E`
    : `${formatted}° W`;
}

export function formatLatitude(value) {
  const latitude = Number(value);

  if (Math.abs(latitude) < 0.000001) {
    return "0°";
  }

  const formatted = parseFloat(Math.abs(latitude).toFixed(6));

  return latitude > 0
    ? `${formatted}° N`
    : `${formatted}° S`;
}

// ============================================================
// COORDINATE PARSER
// ============================================================

export function parseCoordinate(value, type) {
  if (!value || !value.trim()) {
    return null;
  }

  let text = value.trim().toUpperCase();

  let direction = null;

  if (/[NSEW]$/.test(text)) {
    direction = text.slice(-1);
    text = text.slice(0, -1).trim();
  }

  text = text.replace(/°/g, "").trim();

  const number = parseFloat(text);

  if (Number.isNaN(number)) {
    return null;
  }

  let result = number;

  if (direction === "S" || direction === "W") {
    result = -Math.abs(number);
  }

  if (direction === "N" || direction === "E") {
    result = Math.abs(number);
  }

  if (type === "latitude") {
    if (result < -90 || result > 90) {
      return null;
    }
  }

  if (type === "longitude") {
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
  }

  return result;
}

// ============================================================
// COORDINATE SUGGESTIONS
// ============================================================

export function getCoordinateSuggestions(input, type) {
  if (!input || !input.trim()) {
    return [];
  }

  const text = input.trim().toUpperCase();

  const numericMatch = text.match(/^-?\d+(\.\d+)?/);

  if (!numericMatch) {
    return [];
  }

  const search = numericMatch[0].replace("-", "");

  const max = type === "latitude" ? 90 : 180;

  const suggestions = [];

  for (let value = 0; value <= max; value++) {
    const valueText = String(value);

    if (valueText.startsWith(search)) {
      if (type === "latitude") {
        suggestions.push({
          value: `${value}° N`,
          coordinate: value,
        });

        if (value !== 0) {
          suggestions.push({
            value: `${value}° S`,
            coordinate: -value,
          });
        }
      } else {
        suggestions.push({
          value: `${value}° E`,
          coordinate: value,
        });

        if (value !== 0) {
          suggestions.push({
            value: `${value}° W`,
            coordinate: -value,
          });
        }
      }
    }

    if (suggestions.length >= 18) {
      break;
    }
  }

  return suggestions;
}

// ============================================================
// LONGITUDE NORMALIZATION
// ============================================================

function normalizeLongitude(lng) {
  let longitude = Number(lng);

  while (longitude > 180) {
    longitude -= 360;
  }

  while (longitude < -180) {
    longitude += 360;
  }

  return longitude;
}

// ============================================================
// LAND DETECTION
// ============================================================

/*
 * IMPORTANT:
 *
 * The previous implementation used:
 *
 * turf.pointsWithinPolygon(point, landGeoJSON)
 *
 * That function is for finding POINT FEATURES inside polygons.
 *
 * Here we already have one point and want to ask:
 *
 * "Is this point inside the land polygon?"
 *
 * Therefore booleanPointInPolygon() is the correct Turf function.
 */

export function checkIfLand(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return false;
  }

  try {
    const point = turf.point([longitude, latitude]);

    /*
     * landGeoJSON can be either:
     * - Feature
     * - FeatureCollection
     * - Polygon
     * - MultiPolygon
     */

    if (!landGeoJSON) {
      console.warn("Land mask is unavailable.");
      return false;
    }

    // FeatureCollection
    if (landGeoJSON.type === "FeatureCollection") {
      for (const feature of landGeoJSON.features || []) {
        if (!feature || !feature.geometry) {
          continue;
        }

        if (
          turf.booleanPointInPolygon(
            point,
            feature
          )
        ) {
          return true;
        }
      }

      return false;
    }

    // Single Feature / Polygon / MultiPolygon
    return turf.booleanPointInPolygon(
      point,
      landGeoJSON
    );
  } catch (error) {
    console.error(
      "Land detection failed:",
      error
    );

    /*
     * If the geometry itself fails, do NOT falsely
     * classify every coordinate as land.
     */
    return false;
  }
}

// ============================================================
// SNAP LAND LOCATION TO NEAREST OCEAN
// ============================================================

// ============================================================
// SNAP LAND LOCATION TO A SAFE OCEAN LOCATION
// ============================================================

export function snapToNearestOcean(lat, lng) {
  const originalLat = Number(lat);
  const originalLng = normalizeLongitude(lng);

  if (
    !Number.isFinite(originalLat) ||
    !Number.isFinite(originalLng) ||
    originalLat < -90 ||
    originalLat > 90
  ) {
    return {
      lat: originalLat,
      lng: originalLng,
      redirected: false,
      failed: true,
    };
  }

  // ------------------------------------------------------------
  // STEP 1: Check the exact entered coordinate
  // ------------------------------------------------------------

  if (!checkIfLand(originalLat, originalLng)) {
    return {
      lat: originalLat,
      lng: originalLng,
      redirected: false,
    };
  }

  // ------------------------------------------------------------
  // STEP 2: The coordinate is definitely on land.
  //
  // Search outward in progressively larger rings.
  //
  // We use 16 directions instead of only 4/8 so that coastlines
  // and peninsulas are handled much more reliably.
  // ------------------------------------------------------------

  const directions = 16;
  const angleStep = 360 / directions;

  // Start close to the coastline.
  const startRadius = 0.1;

  // 0.1° ≈ 11 km in latitude.
  const radiusStep = 0.1;

  // Maximum search distance ≈ 330 km.
  const maxRadius = 3.0;

  // ------------------------------------------------------------
  // IMPORTANT:
  //
  // We don't accept merely "water".
  //
  // A candidate must also have a water buffer around it.
  // This prevents points sitting inside tiny coastal gaps,
  // lagoons, islands, bays, etc.
  // ------------------------------------------------------------

  const oceanSafetyRadius = 0.25;

  for (
    let radius = startRadius;
    radius <= maxRadius;
    radius += radiusStep
  ) {
    for (let angle = 0; angle < 360; angle += angleStep) {
      const radians = (angle * Math.PI) / 180;

      const candidateLat =
        originalLat + radius * Math.cos(radians);

      const candidateLng =
        originalLng + radius * Math.sin(radians);

      if (
        candidateLat < -90 ||
        candidateLat > 90
      ) {
        continue;
      }

      const normalizedCandidateLng =
        normalizeLongitude(candidateLng);

      // --------------------------------------------------------
      // Candidate itself MUST be water.
      // --------------------------------------------------------

      if (
        checkIfLand(
          candidateLat,
          normalizedCandidateLng
        )
      ) {
        continue;
      }

      // --------------------------------------------------------
      // STEP 3: Verify that the candidate has water around it.
      //
      // Check several points around the candidate.
      // If any of them are land, this is too close to the coast.
      // --------------------------------------------------------

      let safeOceanPoint = true;

      const safetyDirections = 8;
      const safetyAngleStep = 360 / safetyDirections;

      for (
        let safetyAngle = 0;
        safetyAngle < 360;
        safetyAngle += safetyAngleStep
      ) {
        const safetyRadians =
          (safetyAngle * Math.PI) / 180;

        const checkLat =
          candidateLat +
          oceanSafetyRadius * Math.cos(safetyRadians);

        const checkLng =
          normalizedCandidateLng +
          oceanSafetyRadius * Math.sin(safetyRadians);

        if (
          checkLat < -90 ||
          checkLat > 90
        ) {
          safeOceanPoint = false;
          break;
        }

        const normalizedCheckLng =
          normalizeLongitude(checkLng);

        if (
          checkIfLand(
            checkLat,
            normalizedCheckLng
          )
        ) {
          safeOceanPoint = false;
          break;
        }
      }

      // --------------------------------------------------------
      // If the candidate has a proper water buffer, accept it.
      // --------------------------------------------------------

      if (safeOceanPoint) {
        return {
          lat: parseFloat(candidateLat.toFixed(6)),
          lng: parseFloat(
            normalizedCandidateLng.toFixed(6)
          ),
          redirected: true,
          failed: false,
        };
      }
    }
  }

  // ------------------------------------------------------------
  // STEP 4: If no properly buffered ocean point was found,
  // perform a SECOND, wider search.
  //
  // This handles large land masses where 3° wasn't enough.
  // ------------------------------------------------------------

  const widerStart = 3.5;
  const widerEnd = 10.0;
  const widerStep = 0.25;

  for (
    let radius = widerStart;
    radius <= widerEnd;
    radius += widerStep
  ) {
    for (let angle = 0; angle < 360; angle += angleStep) {
      const radians = (angle * Math.PI) / 180;

      const candidateLat =
        originalLat + radius * Math.cos(radians);

      const candidateLng =
        originalLng + radius * Math.sin(radians);

      if (
        candidateLat < -90 ||
        candidateLat > 90
      ) {
        continue;
      }

      const normalizedCandidateLng =
        normalizeLongitude(candidateLng);

      if (
        checkIfLand(
          candidateLat,
          normalizedCandidateLng
        )
      ) {
        continue;
      }

      // Wider search still requires a safety buffer,
      // although slightly smaller to avoid excessive rejection.

      const wideSafetyRadius = 0.15;

      let safeOceanPoint = true;

      for (
        let safetyAngle = 0;
        safetyAngle < 360;
        safetyAngle += 45
      ) {
        const safetyRadians =
          (safetyAngle * Math.PI) / 180;

        const checkLat =
          candidateLat +
          wideSafetyRadius *
            Math.cos(safetyRadians);

        const checkLng =
          normalizedCandidateLng +
          wideSafetyRadius *
            Math.sin(safetyRadians);

        if (
          checkLat < -90 ||
          checkLat > 90
        ) {
          safeOceanPoint = false;
          break;
        }

        if (
          checkIfLand(
            checkLat,
            normalizeLongitude(checkLng)
          )
        ) {
          safeOceanPoint = false;
          break;
        }
      }

      if (safeOceanPoint) {
        return {
          lat: parseFloat(candidateLat.toFixed(6)),
          lng: parseFloat(
            normalizedCandidateLng.toFixed(6)
          ),
          redirected: true,
          failed: false,
        };
      }
    }
  }

  // ------------------------------------------------------------
  // STEP 5: No safe ocean location found.
  //
  // IMPORTANT:
  // Do NOT return 0,0.
  // Do NOT pretend the original land coordinate is ocean.
  // ------------------------------------------------------------

  return {
    lat: originalLat,
    lng: originalLng,
    redirected: false,
    failed: true,
  };
}

// ============================================================
// REGIONAL WATER BODY DETECTION
// ============================================================

/*
 * These are regional fallbacks.
 *
 * Marine Regions is still queried by LocationMarker,
 * but if its response does not contain a useful
 * named water body, these names prevent the UI
 * from unnecessarily showing "Open Ocean".
 */

export function getRegionalWaterBodyName(
  lat,
  lng
) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

  /*
   * Arabian Sea
   */
  if (
    latitude >= 5 &&
    latitude <= 30 &&
    longitude >= 50 &&
    longitude <= 78
  ) {
    return "Arabian Sea";
  }

  /*
   * Bay of Bengal
   */
  if (
    latitude >= 5 &&
    latitude <= 25 &&
    longitude > 78 &&
    longitude <= 100
  ) {
    return "Bay of Bengal";
  }

  /*
   * Andaman Sea
   */
  if (
    latitude >= 5 &&
    latitude <= 18 &&
    longitude > 96 &&
    longitude <= 101
  ) {
    return "Andaman Sea";
  }

  /*
   * Indian Ocean
   */
  if (
    latitude >= -40 &&
    latitude <= 30 &&
    longitude >= 40 &&
    longitude <= 110
  ) {
    return "Indian Ocean";
  }

  return "Indian Ocean";
}