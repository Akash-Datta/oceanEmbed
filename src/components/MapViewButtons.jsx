import React from 'react';

export default function MapViewButtons({ activeLayer, setActiveLayer, onBack }) {
  return (
    <div className="map-layer-controls">
      <div className="layer-buttons">
        <button 
          className={`layer-btn ${activeLayer === 'argo' ? 'active' : ''}`}
          onClick={() => setActiveLayer('argo')}
        >
          <span className="layer-icon">🌊</span>
          <span>ARGO Actual</span>
        </button>
        
        <button 
          className={`layer-btn ${activeLayer === 'transformer' ? 'active' : ''}`}
          onClick={() => setActiveLayer('transformer')}
        >
          <span className="layer-icon">🤖</span>
          <span>Transformer</span>
        </button>
        
        <button 
          className={`layer-btn ${activeLayer === 'error' ? 'active' : ''}`}
          onClick={() => setActiveLayer('error')}
        >
          <span className="layer-icon">⚡</span>
          <span>Absolute Error</span>
        </button>
      </div>
      
      <button className="back-to-map-btn" onClick={onBack}>
        <span className="back-arrow">←</span>
        <span>Back to Ocean Map</span>
      </button>
    </div>
  );
}