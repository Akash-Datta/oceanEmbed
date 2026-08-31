import React, { useState, useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import { formatLongitude, formatLatitude } from "../utils/coordinateUtils";

export default function DynamicGrid() {
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
      return {
        horizontal: [],
        vertical: [],
      };
    }

    let west = bounds.getWest();
    let east = bounds.getEast();
    const north = bounds.getNorth();
    const south = bounds.getSouth();

    if (east - west > 360) {
      west = -180;
      east = 180;
    }

    const longitudeStep = (east - west) / 12;
    const vertical = [];

    for (let i = 0; i <= 12; i++) {
      const longitude = west + longitudeStep * i;
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

    return { vertical, horizontal };
  }, [bounds]);

  return (
    <div className="dynamic-grid">
      {grid.vertical.map((item, index) => (
        <React.Fragment key={`lng-${index}`}>
          <div
            className="grid-vertical-line"
            style={{ left: `${item.x}%` }}
          />
          <div
            className="longitude-label"
            style={{ 
              left: `${item.x}%`, 
              bottom: "5px", /* Pushes the label to the bottom */
              top: "auto"    /* Prevents CSS from pulling it back to the top */
            }}
          >
            {formatLongitude(item.longitude)}
          </div>
        </React.Fragment>
      ))}

      {grid.horizontal.map((item, index) => (
        <React.Fragment key={`lat-${index}`}>
          <div
            className="grid-horizontal-line"
            style={{ top: `${item.y}%` }}
          />
          <div
            className="latitude-label"
            style={{ top: `${item.y}%` }}
          >
            {formatLatitude(item.latitude)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}