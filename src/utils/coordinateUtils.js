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

export function snapToNearestOcean(lat, lng) {
  const normalizedLng = normalizeLongitude(lng);

  /*
   * First check the exact coordinate.
   *
   * This is the most important check.
   */

  const originalIsLand = checkIfLand(
    lat,
    normalizedLng
  );

  if (!originalIsLand) {
    return {
      lat,
      lng: normalizedLng,
      redirected: false,
    };
  }

  /*
   * The entered coordinate is definitely land.
   *
   * Search outward in rings.
   */

  const angleStep = 20;

  const initialRadius = 0.1;
  const radiusStep = 0.1;
  const maxRadius = 10;

  for (
    let radius = initialRadius;
    radius <= maxRadius;
    radius += radiusStep
  ) {
    for (
      let angle = 0;
      angle < 360;
      angle += angleStep
    ) {
      const radians =
        (angle * Math.PI) / 180;

      /*
       * Latitude and longitude degrees are
       * not exactly the same physical distance,
       * but this is sufficient for a regional
       * ocean-location redirect.
       */

      const testLat =
        lat + radius * Math.cos(radians);

      const testLng =
        normalizedLng +
        radius * Math.sin(radians);

      if (
        testLat < -90 ||
        testLat > 90
      ) {
        continue;
      }

      const normalizedTestLng =
        normalizeLongitude(testLng);

      if (
        !checkIfLand(
          testLat,
          normalizedTestLng
        )
      ) {
        /*
         * We found water.
         *
         * Push slightly farther in the same
         * direction to avoid placing the marker
         * directly on a complicated coastline.
         */

        const safeRadius = radius + 0.15;

        const safeLat =
          lat +
          safeRadius *
            Math.cos(radians);

        const safeLng =
          normalizedLng +
          safeRadius *
            Math.sin(radians);

        if (
          safeLat < -90 ||
          safeLat > 90
        ) {
          continue;
        }

        const normalizedSafeLng =
          normalizeLongitude(safeLng);

        if (
          !checkIfLand(
            safeLat,
            normalizedSafeLng
          )
        ) {
          return {
            lat: parseFloat(
              safeLat.toFixed(6)
            ),

            lng: parseFloat(
              normalizedSafeLng.toFixed(6)
            ),

            redirected: true,
          };
        }

        /*
         * If the extra push landed back on land,
         * the first water point is still better
         * than the original land coordinate.
         */

        return {
          lat: parseFloat(
            testLat.toFixed(6)
          ),

          lng: parseFloat(
            normalizedTestLng.toFixed(6)
          ),

          redirected: true,
        };
      }
    }
  }

  /*
   * Extremely unusual fallback.
   *
   * Don't silently return 0,0 because that makes
   * it look as if the user entered the Gulf of Guinea.
   */

  return {
    lat,
    lng: normalizedLng,
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