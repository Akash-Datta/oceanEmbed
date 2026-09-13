import React, { useMemo } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title as ChartTitle, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { dummyTemperatureData } from "../data/dummyOceanData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

const depthRulerPlugin = {
  id: 'depthRuler',
  afterDraw(chart) {
    const options = chart.options.plugins?.depthRuler;
    if (!options) return;

    const { selectedDepth, profileData, isExpanded } = options;
    if (!selectedDepth || !profileData || profileData.length === 0) return;

    const targetDepth = parseFloat(selectedDepth);
    let argoTemp, convTemp, yPos, xPosArgo, xPosConv;

    const metaArgo = chart.getDatasetMeta(0);
    const metaConv = chart.getDatasetMeta(1);
    if (!metaArgo || !metaArgo.data || metaArgo.data.length === 0) return;

    const exactIndex = profileData.findIndex(d => Number(d.depth) === targetDepth);

    if (exactIndex !== -1) {
      argoTemp = profileData[exactIndex].argo.toFixed(1);
      convTemp = profileData[exactIndex].transformer.toFixed(1);
      yPos = metaArgo.data[exactIndex].y;
    } else {
      let lowerIndex = -1;
      let upperIndex = -1;

      for (let i = 0; i < profileData.length - 1; i++) {
        if (Number(profileData[i].depth) < targetDepth && Number(profileData[i+1].depth) > targetDepth) {
          lowerIndex = i;
          upperIndex = i + 1;
          break;
        }
      }

      if (lowerIndex === -1 || upperIndex === -1) return; 

      const lower = profileData[lowerIndex];
      const upper = profileData[upperIndex];
      
      const ratio = (targetDepth - Number(lower.depth)) / (Number(upper.depth) - Number(lower.depth));

      argoTemp = (lower.argo + ratio * (upper.argo - lower.argo)).toFixed(1);
      convTemp = (lower.transformer + ratio * (upper.transformer - lower.transformer)).toFixed(1);
      
      yPos = metaArgo.data[lowerIndex].y + ratio * (metaArgo.data[upperIndex].y - metaArgo.data[lowerIndex].y);
      xPosArgo = metaArgo.data[lowerIndex].x + ratio * (metaArgo.data[upperIndex].x - metaArgo.data[lowerIndex].x);
      xPosConv = metaConv.data[lowerIndex].x + ratio * (metaConv.data[upperIndex].x - metaConv.data[lowerIndex].x);
    }

    const { ctx, chartArea: { top, bottom, left, right } } = chart;
    ctx.save();
    
    ctx.beginPath();
    ctx.setLineDash([6, 6]); 
    ctx.moveTo(left, yPos);
    ctx.lineTo(right, yPos);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155'; 
    ctx.stroke();
    ctx.setLineDash([]); 

    if (exactIndex === -1) {
      ctx.beginPath();
      ctx.arc(xPosArgo, yPos, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#0000FF';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(xPosConv, yPos, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.beginPath();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px Inter, Arial, sans-serif';
      
      const labelText = `${targetDepth}`;
      const textWidth = ctx.measureText(labelText).width;
      const padX = 6;
      const boxWidth = textWidth + padX * 2;
      const boxHeight = 18;
      const boxX = left - boxWidth - 6; 
      const boxY = yPos - boxHeight / 2;
      
      ctx.fillStyle = '#ef4444'; 
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
      } else {
        ctx.rect(boxX, boxY, boxWidth, boxHeight); 
      }
      ctx.fill();
      
      ctx.fillStyle = '#ffffff'; 
      ctx.fillText(labelText, left - 6 - padX, yPos);
    }

    const isHovering = chart.tooltip && chart.tooltip._active && chart.tooltip._active.length > 0;
    const shouldShowFixedBox = !isHovering || isExpanded; 

    if (shouldShowFixedBox) {
      const dataBoxWidth = 145;
      const dataBoxHeight = 56;
      const dataBoxX = right - dataBoxWidth - 10;
      let dataBoxY = yPos - dataBoxHeight - 8;
      
      if (dataBoxY < top) {
        dataBoxY = yPos + 8;
        if (dataBoxY + dataBoxHeight > bottom) {
          dataBoxY = top + 5;
        }
      }

      ctx.beginPath();
      ctx.rect(dataBoxX, dataBoxY, dataBoxWidth, dataBoxHeight);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillText(`Depth: ${targetDepth} m`, dataBoxX + 12, dataBoxY + 20);

      ctx.fillStyle = '#0000FF'; 
      ctx.font = 'bold 11px Inter, Arial, sans-serif';
      ctx.fillText(`ARGO: ${argoTemp} °C`, dataBoxX + 12, dataBoxY + 36);

      ctx.fillStyle = '#FF0000'; 
      ctx.fillText(`Pred: ${convTemp} °C`, dataBoxX + 12, dataBoxY + 50);
    }

    ctx.restore();
  }
};

export default function TemperatureProfile({
  selectedDepth,
  profileData,
  fallbackData,
  isLive = false,
  loading = false,
  error = "",
  onRetry,
  isExpanded,
}) {
  const liveData = Array.isArray(profileData) ? profileData : [];
  const fallback = Array.isArray(fallbackData) && fallbackData.length > 0
    ? fallbackData
    : dummyTemperatureData;
  const hasLive = liveData.length > 0;
  const dataToUse = hasLive ? liveData : fallback;

  const hasUncertainty = useMemo(
    () => dataToUse.some((d) => Number.isFinite(Number(d.q10)) && Number.isFinite(Number(d.q90))),
    [dataToUse]
  );

  const chartData = useMemo(() => {
    const datasets = [
      {
        label: "ARGO Actual",
        data: dataToUse.map((item) => item.argo),
        borderColor: "#0000FF",
        backgroundColor: "#0000FF",
        borderWidth: 2,
        pointRadius: dataToUse.map((item) => String(item.depth) === String(selectedDepth) ? 6 : 3),
        tension: 0.1,
        fill: false,
      },
      {
        label: "Transformer Prediction",
        data: dataToUse.map((item) => item.transformer),
        borderColor: "#FF0000",
        backgroundColor: "#FF0000",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: dataToUse.map((item) => String(item.depth) === String(selectedDepth) ? 6 : 3),
        tension: 0.1,
        fill: false,
      },
    ];
    if (hasUncertainty) {
      datasets.push({
        label: "q10",
        data: dataToUse.map((item) => (Number.isFinite(Number(item.q10)) ? Number(item.q10) : null)),
        borderColor: "rgba(239, 68, 68, 0.45)",
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        borderWidth: 1,
        borderDash: [2, 3],
        pointRadius: 0,
        tension: 0.1,
        fill: "+1",
      });
      datasets.push({
        label: "q90",
        data: dataToUse.map((item) => (Number.isFinite(Number(item.q90)) ? Number(item.q90) : null)),
        borderColor: "rgba(239, 68, 68, 0.45)",
        backgroundColor: "rgba(239, 68, 68, 0.0)",
        borderWidth: 1,
        borderDash: [2, 3],
        pointRadius: 0,
        tension: 0.1,
        fill: false,
      });
    }
    return {
      labels: dataToUse.map((item) => item.depth),
      datasets,
    };
  }, [selectedDepth, dataToUse, hasUncertainty]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', 
    interaction: { intersect: false, mode: "index" },
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
        caretPadding: 6,
        filter: (item) => item.dataset.label === "ARGO Actual" || item.dataset.label === "Transformer Prediction",
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.x} °C`,
          title: (context) => `Depth: ${context[0].label} m`,
        },
      },
      depthRuler: { selectedDepth, profileData: dataToUse, isExpanded }
    },
    scales: {
      x: {
        title: { display: true, text: "Temperature (°C)", color: "#94a3b8", font: { weight: "600" } },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#64748b" },
      },
      y: {
        reverse: true, 
        title: { display: true, text: "Depth (meters)", color: "#94a3b8", font: { weight: "600" } },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#64748b" },
      },
    },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}>
        <div className="cyber-loader-text">◈ Fetching live profile from backend ◈</div>
        <div className="cyber-loader-bar" style={{ width: '80%' }} />
        <div style={{ fontSize: '11px', color: '#64748b' }}>POST /api/profile …</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: '999px',
            color: isLive ? '#065f46' : '#92400e',
            background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${isLive ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
          }}
        >
          {isLive ? `● Live · backend · ${liveData.length} levels` : '○ Fallback · dummy data'}
        </span>
        {hasUncertainty && isLive && (
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>q10–q90 band shown</span>
        )}
      </div>
      {error && !hasLive && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '8px 10px', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>
            Backend unavailable — showing fallback. {error}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{ fontSize: '11px', fontWeight: 800, color: '#fff', background: '#0284c7', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}
            >
              Retry backend
            </button>
          )}
        </div>
      )}
      {error && hasLive && (
        <div style={{ fontSize: '10px', color: '#b45309', marginBottom: '4px' }}>{error}</div>
      )}
      {!hasLive && !error && (
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
          Waiting for backend data — showing regional fallback.
        </div>
      )}
      <div style={{ flexGrow: 1, minHeight: 0 }}>
        <Line data={chartData} options={chartOptions} plugins={[depthRulerPlugin]} />
      </div>
      <div className="profile-legend">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '4px', backgroundColor: '#0000FF', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>ARGO Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '0px', borderTop: '4px dashed #FF0000' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>Transformer Prediction</span>
        </div>
      </div>
    </div>
  );
}
