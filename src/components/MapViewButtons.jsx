import React from 'react';

export default function MapViewButtons({ activeLayer, setActiveLayer, onBack }) {
  return (
    <div className="map-layer-controls">
      <div className="layer-buttons">
        <button 
          className={`layer-btn ${activeLayer === 'argo' ? 'active' : ''}`}
          onClick={() => setActiveLayer('argo')}
        >
          ARGO Actual
        </button>
        <button 
          className={`layer-btn ${activeLayer === 'convformer' ? 'active' : ''}`}
          onClick={() => setActiveLayer('convformer')}
        >
          ConvFormer
        </button>
        <button 
          className={`layer-btn ${activeLayer === 'error' ? 'active' : ''}`}
          onClick={() => setActiveLayer('error')}
        >
          Absolute Error
        </button>
      </div>
      
      <button className="back-to-map-btn" onClick={onBack}>
        ← Back to Ocean Map
      </button>
    </div>
  );
}