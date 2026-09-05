import React, { useMemo } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title as ChartTitle, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { dummyTemperatureData } from "../data/dummyOceanData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

// ============================================================
// CUSTOM PLUGIN: DEPTH RULER, LABEL & INTERPOLATION ENGINE
// ============================================================
const depthRulerPlugin = {
  id: 'depthRuler',
  afterDraw(chart) {
    const options = chart.options.plugins?.depthRuler;
    if (!options) return;

    const { selectedDepth, profileData } = options;
    if (!selectedDepth || !profileData || profileData.length === 0) return;

    const targetDepth = parseFloat(selectedDepth);
    let argoTemp, convTemp, yPos, xPosArgo, xPosConv;

    const metaArgo = chart.getDatasetMeta(0);
    const metaConv = chart.getDatasetMeta(1);
    if (!metaArgo || !metaArgo.data || metaArgo.data.length === 0) return;

    const exactIndex = profileData.findIndex(d => Number(d.depth) === targetDepth);

    if (exactIndex !== -1) {
      argoTemp = profileData[exactIndex].argo.toFixed(1);
      convTemp = profileData[exactIndex].convformer.toFixed(1);
      yPos = metaArgo.data[exactIndex].y;
    } else {
      // INTERPOLATION MAGIC
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
      convTemp = (lower.convformer + ratio * (upper.convformer - lower.convformer)).toFixed(1);
      
      yPos = metaArgo.data[lowerIndex].y + ratio * (metaArgo.data[upperIndex].y - metaArgo.data[lowerIndex].y);
      xPosArgo = metaArgo.data[lowerIndex].x + ratio * (metaArgo.data[upperIndex].x - metaArgo.data[lowerIndex].x);
      xPosConv = metaConv.data[lowerIndex].x + ratio * (metaConv.data[upperIndex].x - metaConv.data[lowerIndex].x);
    }

    const { ctx, chartArea: { top, left, right } } = chart;
    ctx.save();
    
    // --- Draw the horizontal dashed ruler line ---
    ctx.beginPath();
    ctx.setLineDash([6, 6]); 
    ctx.moveTo(left, yPos);
    ctx.lineTo(right, yPos);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155'; 
    ctx.stroke();
    ctx.setLineDash([]); 

    // --- Draw Temporary Features for Interpolated Depths ---
    if (exactIndex === -1) {
      // 1. Temporary ARGO Dot
      ctx.beginPath();
      ctx.arc(xPosArgo, yPos, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#0000FF';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 2. Temporary Convformer Dot
      ctx.beginPath();
      ctx.arc(xPosConv, yPos, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 3. Draw the temporary depth number exactly on the Y-Axis
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

    // --- Draw the floating data label box on the right ---
    const dataBoxWidth = 145;
    const dataBoxHeight = 56;
    const dataBoxX = right - dataBoxWidth - 10;
    const dataBoxY = yPos - dataBoxHeight - 12 > top ? yPos - dataBoxHeight - 12 : yPos + 12;

    ctx.beginPath();
    ctx.rect(dataBoxX, dataBoxY, dataBoxWidth, dataBoxHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // MUST RESET TEXT ALIGNMENT HERE SO IT DOESN'T BLEED FROM THE Y-AXIS BADGE
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

    ctx.restore();
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TemperatureProfile({ selectedDepth, profileData }) {
  
  const dataToUse = profileData && profileData.length > 0 ? profileData : dummyTemperatureData;

  const chartData = useMemo(() => {
    return {
      labels: dataToUse.map((item) => item.depth),
      datasets: [
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
          label: "Convformer Prediction",
          data: dataToUse.map((item) => item.convformer),
          borderColor: "#FF0000", 
          backgroundColor: "#FF0000",
          borderWidth: 2,
          borderDash: [5, 5], 
          pointRadius: dataToUse.map((item) => String(item.depth) === String(selectedDepth) ? 6 : 3),
          tension: 0.1,
          fill: false,
        },
      ],
    };
  }, [selectedDepth, dataToUse]);

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
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.x} °C`,
          title: (context) => `Depth: ${context[0].label} m`,
        },
      },
      depthRuler: { selectedDepth, profileData: dataToUse }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
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
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>Convformer Prediction</span>
        </div>
        
      </div>
      
    </div>
  );
}
