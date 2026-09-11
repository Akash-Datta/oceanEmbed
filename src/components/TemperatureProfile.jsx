import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export default function TemperatureProfile({
  selectedDepth,
  profileData,
}) {
  const chartData = useMemo(() => {
    if (!profileData || profileData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: profileData.map((item) => item.depth_m),

      datasets: [
        // =====================================================
        // ACTUAL TEMPERATURE
        // =====================================================
        {
          label: "Actual",
          data: profileData.map((item) => item.actual),
          borderColor: "#0000FF",
          backgroundColor: "#0000FF",
          borderWidth: 2,

          pointRadius: profileData.map((item) =>
            String(item.depth_m) === String(selectedDepth) ? 6 : 3
          ),

          pointHoverRadius: 6,
          tension: 0.1,
          fill: false,
        },

        // =====================================================
        // MODEL PREDICTION
        // =====================================================
        {
          label: "Model Prediction",
          data: profileData.map((item) => item.prediction),
          borderColor: "#FF0000",
          backgroundColor: "#FF0000",
          borderWidth: 2,
          borderDash: [5, 5],

          pointRadius: profileData.map((item) =>
            String(item.depth_m) === String(selectedDepth) ? 6 : 3
          ),

          pointHoverRadius: 6,
          tension: 0.1,
          fill: false,
        },

        // =====================================================
        // Q90 - TOP OF UNCERTAINTY BAND
        // =====================================================
        {
          label: "Q90",
          data: profileData.map((item) => item.q90),
          borderColor: "rgba(255, 0, 0, 0.20)",
          backgroundColor: "rgba(255, 0, 0, 0.12)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,

          // Fill down to the next dataset (Q10)
          fill: "+1",
        },

        // =====================================================
        // Q10 - BOTTOM OF UNCERTAINTY BAND
        // =====================================================
        {
          label: "Q10",
          data: profileData.map((item) => item.q10),
          borderColor: "rgba(255, 0, 0, 0.20)",
          backgroundColor: "rgba(255, 0, 0, 0.12)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
        },
      ],
    };
  }, [profileData, selectedDepth]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    // Temperature on X-axis, depth on Y-axis
    indexAxis: "y",

    interaction: {
      intersect: false,
      mode: "index",
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e0f2fe",
        padding: 12,
        cornerRadius: 8,

        callbacks: {
          label: (context) => {
            const value = context.parsed.x;

            if (value === undefined || value === null) {
              return "";
            }

            if (context.dataset.label === "Actual") {
              return ` Actual: ${value.toFixed(2)} °C`;
            }

            if (context.dataset.label === "Model Prediction") {
              return ` Prediction: ${value.toFixed(2)} °C`;
            }

            if (context.dataset.label === "Q10") {
              return ` Q10: ${value.toFixed(2)} °C`;
            }

            if (context.dataset.label === "Q90") {
              return ` Q90: ${value.toFixed(2)} °C`;
            }

            return "";
          },

          title: (context) =>
            `Depth: ${context[0].label} m`,
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Temperature (°C)",
          color: "#94a3b8",
          font: {
            weight: "600",
          },
        },

        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },

        ticks: {
          color: "#64748b",
        },
      },

      y: {
        reverse: true,

        title: {
          display: true,
          text: "Depth (meters)",
          color: "#94a3b8",
          font: {
            weight: "600",
          },
        },

        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },

        ticks: {
          color: "#64748b",
        },
      },
    },
  };

  // ============================================================
  // NO DATA
  // ============================================================
  if (!profileData || profileData.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        No model profile data available
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <Line
          data={chartData}
          options={chartOptions}
        />
      </div>

      {/* ========================================================
          LEGEND
      ======================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "25px",
          paddingTop: "12px",
          paddingBottom: "4px",
          flexWrap: "wrap",
        }}
      >
        {/* ACTUAL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "4px",
              backgroundColor: "#0000FF",
              borderRadius: "2px",
            }}
          />

          <span
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#475569",
            }}
          >
            Actual
          </span>
        </div>

        {/* PREDICTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "0px",
              borderTop: "4px dashed #FF0000",
            }}
          />

          <span
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#475569",
            }}
          >
            Model Prediction
          </span>
        </div>

        {/* UNCERTAINTY */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "8px",
              backgroundColor: "rgba(255, 0, 0, 0.15)",
              borderRadius: "2px",
            }}
          />

          <span
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#475569",
            }}
          >
            Q10–Q90
          </span>
        </div>
      </div>
    </div>
  );
}