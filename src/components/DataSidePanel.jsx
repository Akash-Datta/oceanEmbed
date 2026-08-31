import React, { useState, useMemo } from 'react';
import TemperatureProfile from './TemperatureProfile';
import { getLocationMetrics } from '../data/dummyOceanData';

export default function DataSidePanel({ position, depth, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = useMemo(() => {
    if (!position) return null;
    return getLocationMetrics(position.lat, position.lng);
  }, [position]);

  if (!position || !metrics) return null;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className={`side-data-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="panel-header">
        <h4>Location Data</h4>
        <div className="panel-actions">
          <button onClick={toggleExpand} className="action-btn expand-btn" title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? "🗗" : "⛶"}
          </button>
          <button onClick={onClose} className="action-btn close-btn" title="Close">
            ×
          </button>
        </div>
      </div>
      
      <div className="panel-content">
        {/* UPDATED TO 6 DECIMAL PLACES HERE */}
        <p><strong>Lat:</strong> {position.lat.toFixed(6)}°</p>
        <p><strong>Lng:</strong> {position.lng.toFixed(6)}°</p>
        {depth && <p><strong>Depth:</strong> {depth} m</p>}
        
        <hr />
        
        <h5>Surface Parameters</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 'bold' }}>SST (Temp)</span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{metrics.surfaceData.sst} °C</strong>
          </div>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 'bold' }}>SSS (Salinity)</span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{metrics.surfaceData.sss} PSU</strong>
          </div>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 'bold' }}>SSH (Height)</span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{metrics.surfaceData.ssh} m</strong>
          </div>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 'bold' }}>SLA (Anomaly)</span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{metrics.surfaceData.sla} m</strong>
          </div>
        </div>
        
        <hr />
        <h5>Vertical Temperature Profile</h5>
        <div style={{ height: isExpanded ? '400px' : '220px', transition: 'height 0.3s' }}>
          <TemperatureProfile selectedDepth={depth} profileData={metrics.profileData} />
        </div>
      </div>
    </div>
  );
}