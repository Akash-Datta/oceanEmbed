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

    while (west > 180) west -= 360;
    while (west < -180) west += 360;
    while (east > 180) east -= 360;
    while (east < -180) east += 360;

    if (east <= west) {
      east += 360;
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

  const vLine = "absolute top-0 bottom-0 w-px bg-ink/[0.03]0/20 dark:bg-paper/10";
  const hLine = "absolute left-0 right-0 h-px bg-ink/[0.03]0/20 dark:bg-paper/10";
  const vSpecial = "absolute top-0 bottom-0 w-[2px] bg-accent/60 dark:bg-accent/70";
  const hSpecial = "absolute left-0 right-0 h-[2px] bg-accent/60 dark:bg-accent/70";
  const lngLabel =
    "absolute -translate-x-1/2 rounded bg-paper/90 px-1 py-px font-mono text-[9px] font-bold text-ink/80 backdrop-blur-sm dark:bg-ink/85 dark:text-paper/60";
  const latLabel =
    "absolute -translate-y-1/2 rounded bg-paper/90 px-1 py-px font-mono text-[9px] font-bold text-ink/80 backdrop-blur-sm dark:bg-ink/85 dark:text-paper/60";

  return (
    <div className="pointer-events-none absolute inset-0 z-[500]">
      {grid.vertical.map((item, index) => (
        <React.Fragment key={`lng-${index}`}>
          <div className={vLine} style={{ left: `${item.x}%` }} />
          <div
            className={lngLabel}
            style={{ left: `${item.x}%`, bottom: "5px", top: "auto" }}
          >
            {formatLongitude(item.longitude, language)}
          </div>
        </React.Fragment>
      ))}

      {grid.horizontal.map((item, index) => (
        <React.Fragment key={`lat-${index}`}>
          <div className={hLine} style={{ top: `${item.y}%` }} />
          <div
            className={latLabel}
            style={{ top: `${item.y}%` }}
          >
            {formatLatitude(item.latitude, language)}
          </div>
        </React.Fragment>
      ))}

      {grid.specialVertical.map((item, index) => (
        <React.Fragment key={`special-lng-${index}`}>
          <div
            className={vSpecial}
            style={{ left: `${item.x}%` }}
          />
          <div
            className={`${lngLabel} font-sans font-bold text-accent dark:text-paper`}
            style={{ left: `${item.x}%`, bottom: "26px", top: "auto" }}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}

      {grid.specialHorizontal.map((item, index) => (
        <React.Fragment key={`special-lat-${index}`}>
          <div
            className={hSpecial}
            style={{ top: `${item.y}%` }}
          />
          <div
            className={`${latLabel} font-sans font-bold text-accent dark:text-paper`}
            style={{ top: `${item.y}%`, left: "7px" }}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}