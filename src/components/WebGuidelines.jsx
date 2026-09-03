import React from "react";

export default function WebGuidelines({ onClose }) {
  return (
    <div className="about-authors-backdrop" onClick={onClose}>
      <div className="about-authors-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-panel-header">
          <div className="header-title-wrapper">
            <span className="header-icon">🧭</span>
            <h3>Web Guidelines & Usage</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        <div className="about-panel-body">
          <div className="team-section-glow">
            <span className="team-label">Platform Overview</span>
            <h4 className="team-name-badge">Navigation Guide</h4>
            <p className="team-subtitle">Master the spatiotemporal ocean temperature intelligence platform</p>
          </div>

          <div className="contributors-divider">
            <span>Step-by-Step Instructions</span>
          </div>

          <div className="guidelines-list">
            <div className="guideline-card">
              <div className="guideline-step-icon">📅</div>
              <div className="guideline-content">
                <h5>1. Select Date Range</h5>
                <p>Begin by picking your starting date in the control bar. The system automatically calculates and locks a 4-day analysis window for consistent forecasting.</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">📍</div>
              <div className="guideline-content">
                <h5>2. Point-Based Profiling</h5>
                <p>Click anywhere on the map or manually input your Latitude & Longitude. Land coordinates are automatically redirected to the nearest ocean grid point ($±0.25^\circ$ spacing).</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">📊</div>
              <div className="guideline-content">
                <h5>3. Analyze Surface & Depth</h5>
                <p>The side panel displays real-time Surface Parameters (SST, SSS, SSH, SLA) alongside an interactive Vertical Temperature Profile graph.</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">🗺️</div>
              <div className="guideline-content">
                <h5>4. Regional Layer Modes</h5>
                <p>Select a specific depth value while leaving coordinates empty to unlock regional visualization modes: ARGO observation maps, Convformer Predictions, and Error mapping.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}