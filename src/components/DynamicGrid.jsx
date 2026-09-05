import React, { useState, useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import { formatLongitude, formatLatitude } from "../utils/coordinateUtils";
import { useLanguage } from "../context/LanguageContext";

export default function DynamicGrid() {
  const { t, language } = useLanguage();
  const map = useMap();
  const [bounds, setBounds] = useState(map.getBounds());

  const updateBounds = () => {
    setBounds(map.getBounds());
  };

  useEffect(() => {
    map.on("moveend", updateBounds);
    map.on("zoomend", updateBounds);

    return () => {
      map.off("moveend", updateBounds);
      map.off("zoomend", updateBounds);
    };
  }, [map]);

  const grid = useMemo(() => {
    if (!bounds) {
      return { vertical: [], horizontal: [], specialVertical: [], specialHorizontal: [] };
    }

    let west = bounds.getWest();
    let east = bounds.getEast();
    const north = bounds.getNorth();
    const south = bounds.getSouth();

    // Normalize and wrap longitudes cleanly to prevent axis scrambling
    while (west > 180) west -= 360;
    while (west < -180) west += 360;
    while (east > 180) east -= 360;
    while (east < -180) east += 360;

    if (east <= west) {
      east += 360; // Ensure proper West-to-East progression across the 180° meridian
    }

    const longitudeStep = (east - west) / 12;
    const vertical = [];
    for (let i = 0; i <= 12; i++) {
      let longitude = west + longitudeStep * i;
      if (longitude > 180) longitude -= 360;
      if (longitude < -180) longitude += 360;
      const x = (i / 12) * 100;
      vertical.push({ longitude, x });
    }

    const latitudeStep = (north - south) / 6;
    const horizontal = [];
    for (let i = 0; i <= 6; i++) {
      const latitude = north - latitudeStep * i;
      const y = (i / 6) * 100;
      horizontal.push({ latitude, y });
    }

    // Special Reference Lines with translation support
    const specialLngs = [
      { lng: 0, label: t("primeMeridian") || "Prime Meridian (0°)" },
      { lng: 180, label: t("idlLabel") || "180° Longitude (IDL)" },
      { lng: -180, label: t("idlLabel") || "180° Longitude (IDL)" },
    ];

    const specialLats = [
      { lat: 0, label: t("equatorLabel") || "Equator (0°)" },
      { lat: 23.5, label: t("tropicCancer") || "Tropic of Cancer (23.5° N)" },
      { lat: -23.5, label: t("tropicCapricorn") || "Tropic of Capricorn (23.5° S)" },
    ];

    const specialVertical = [];
    specialLngs.forEach((item) => {
      let targetLng = item.lng;
      if (west <= targetLng && targetLng <= east) {
        const x = ((targetLng - west) / (east - west)) * 100;
        specialVertical.push({ ...item, x });
      }
    });

    const specialHorizontal = [];
    specialLats.forEach((item) => {
      if (item.lat >= south && item.lat <= north) {
        const y = ((north - item.lat) / (north - south)) * 100;
        specialHorizontal.push({ ...item, y });
      }
    });

    return { vertical, horizontal, specialVertical, specialHorizontal };
  }, [bounds, t]);

  return (
    <div className="dynamic-grid">
      {grid.vertical.map((item, index) => (
        <React.Fragment key={`lng-${index}`}>
          <div className="grid-vertical-line" style={{ left: `${item.x}%` }} />
          <div
            className="longitude-label"
            style={{ left: `${item.x}%`, bottom: "5px", top: "auto" }}
          >
            {formatLongitude(item.longitude, language)}
          </div>
        </React.Fragment>
      ))}

      {grid.horizontal.map((item, index) => (
        <React.Fragment key={`lat-${index}`}>
          <div className="grid-horizontal-line" style={{ top: `${item.y}%` }} />
          <div className="latitude-label" style={{ top: `${item.y}%` }}>
            {formatLatitude(item.latitude, language)}
          </div>
        </React.Fragment>
      ))}

      {grid.specialVertical.map((item, index) => (
        <React.Fragment key={`special-lng-${index}`}>
          <div
            className="grid-vertical-line special-line"
            style={{ left: `${item.x}%` }}
          />
          <div
            className="longitude-label special-label"
            style={{ left: `${item.x}%`, bottom: "26px", top: "auto" }}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}

      {grid.specialHorizontal.map((item, index) => (
        <React.Fragment key={`special-lat-${index}`}>
          <div
            className="grid-horizontal-line special-line"
            style={{ top: `${item.y}%` }}
          />
          <div
            className="latitude-label special-label"
            style={{ top: `${item.y}%`, left: "7px" }}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}