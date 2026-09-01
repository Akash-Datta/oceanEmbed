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
// LAND MASK HELPERS
// ============================================================

function getLandFeatures() {
  if (!landGeoJSON) {
    return [];
  }

  if (landGeoJSON.type === "FeatureCollection") {
    return (landGeoJSON.features || []).filter(
      (feature) =>
        feature &&
        feature.geometry &&
        (
          feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon"
        )
    );
  }

  if (
    landGeoJSON.type === "Feature" &&
    landGeoJSON.geometry
  ) {
    return [landGeoJSON];
  }

  if (
    landGeoJSON.type === "Polygon" ||
    landGeoJSON.type === "MultiPolygon"
  ) {
    return [
      turf.feature(landGeoJSON),
    ];
  }

  return [];
}

const landFeatures = getLandFeatures();

// ============================================================
// LAND DETECTION
// ============================================================

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

  if (!landFeatures.length) {
    console.error("High-resolution land mask is unavailable.");
    return false;
  }

  const point = turf.point([
    longitude,
    latitude,
  ]);

  try {
    for (const feature of landFeatures) {
      if (
        turf.booleanPointInPolygon(
          point,
          feature,
          {
            ignoreBoundary: false,
          }
        )
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(
      "Land detection failed:",
      error
    );

    /*
     * Never classify an invalid coordinate as
     * ocean merely because the geometry failed.
     */
    return true;
  }
}

// ============================================================
// SAFE OCEAN TEST
// ============================================================

function isSafeOceanPoint(
  lat,
  lng,
  safetyRadiusKm = 35
) {
  /*
   * First and most important test:
   * candidate itself MUST be water.
   */
  if (checkIfLand(lat, lng)) {
    return false;
  }

  /*
   * Check a complete ring around the candidate.
   *
   * This prevents a marker from being placed:
   * - on a coastline
   * - on a peninsula
   * - on an island
   * - inside a tiny coastal water gap
   * - visually almost on land
   */

  const directions = 16;

  for (
    let angle = 0;
    angle < 360;
    angle += 360 / directions
  ) {
    const destination = turf.destination(
      turf.point([lng, lat]),
      safetyRadiusKm,
      angle,
      {
        units: "kilometers",
      }
    );

    const [checkLng, checkLat] =
      destination.geometry.coordinates;

    if (
      checkIfLand(
        checkLat,
        checkLng
      )
    ) {
      return false;
    }
  }

  /*
   * Extra inner ring.
   *
   * This makes the test even stricter near complicated
   * coastlines and islands.
   */

  const innerRadiusKm = 15;

  for (
    let angle = 0;
    angle < 360;
    angle += 45
  ) {
    const destination = turf.destination(
      turf.point([lng, lat]),
      innerRadiusKm,
      angle,
      {
        units: "kilometers",
      }
    );

    const [checkLng, checkLat] =
      destination.geometry.coordinates;

    if (
      checkIfLand(
        checkLat,
        checkLng
      )
    ) {
      return false;
    }
  }

  /*
   * Final direct verification.
   */
  if (checkIfLand(lat, lng)) {
    return false;
  }

  return true;
}

// ============================================================
// SNAP LAND LOCATION TO SAFE OCEAN
// ============================================================

export function snapToNearestOcean(lat, lng) {
  const originalLat = Number(lat);
  const originalLng =
    normalizeLongitude(lng);

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

  // ==========================================================
  // STEP 1
  // Exact coordinate already in water
  // ==========================================================

  if (
    !checkIfLand(
      originalLat,
      originalLng
    )
  ) {
    return {
      lat: originalLat,
      lng: originalLng,
      redirected: false,
      failed: false,
    };
  }

  // ==========================================================
  // STEP 2
  // Search progressively farther from land
  // ==========================================================

  const directions = 24;

  /*
   * Search distances in kilometres.
   *
   * This is deliberately larger than before.
   * We care more about NEVER returning a land point
   * than returning the mathematically closest point.
   */

  const searchDistances = [
    5,
    10,
    15,
    20,
    30,
    40,
    50,
    65,
    80,
    100,
    125,
    150,
    175,
    200,
    250,
    300,
    400,
    500,
    600,
    750,
    900,
    1100,
  ];

  let bestCandidate = null;

  for (
    const distance of searchDistances
  ) {
    for (
      let angle = 0;
      angle < 360;
      angle += 360 / directions
    ) {
      const destination =
        turf.destination(
          turf.point([
            originalLng,
            originalLat,
          ]),
          distance,
          angle,
          {
            units: "kilometers",
          }
        );

      const [
        candidateLng,
        candidateLat,
      ] = destination.geometry.coordinates;

      if (
        candidateLat < -90 ||
        candidateLat > 90
      ) {
        continue;
      }

      const normalizedLng =
        normalizeLongitude(
          candidateLng
        );

      /*
       * Candidate MUST be water.
       */
      if (
        checkIfLand(
          candidateLat,
          normalizedLng
        )
      ) {
        continue;
      }

      /*
       * Candidate MUST have enough water around it.
       */
      if (
        !isSafeOceanPoint(
          candidateLat,
          normalizedLng,
          35
        )
      ) {
        continue;
      }

      /*
       * Final verification immediately before
       * accepting the candidate.
       */
      if (
        checkIfLand(
          candidateLat,
          normalizedLng
        )
      ) {
        continue;
      }

      bestCandidate = {
        lat: Number(
          candidateLat.toFixed(6)
        ),
        lng: Number(
          normalizedLng.toFixed(6)
        ),
        redirected: true,
        failed: false,
      };

      break;
    }

    if (bestCandidate) {
      break;
    }
  }

  // ==========================================================
  // STEP 3
  // Return ONLY a verified ocean coordinate
  // ==========================================================

  if (bestCandidate) {
    /*
     * One final land-mask verification.
     */
    if (
      checkIfLand(
        bestCandidate.lat,
        bestCandidate.lng
      )
    ) {
      return {
        lat: originalLat,
        lng: originalLng,
        redirected: false,
        failed: true,
      };
    }

    return bestCandidate;
  }

  // ==========================================================
  // STEP 4
  // DO NOT FAKE AN OCEAN LOCATION
  // ==========================================================

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

export function getRegionalWaterBodyName(
  lat,
  lng
) {
  const latitude = Number(lat);
  const longitude =
    normalizeLongitude(lng);

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