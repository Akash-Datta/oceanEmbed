import React, { useState, useEffect } from 'react';
import { fetchSpatialMaps } from '../data/dummyOceanData';

export default function SpatialDistribution({ depth, initialFocus, onBack }) {
  const [maps, setMaps] = useState({ argo: '', convformer: '', error: '' });
  const [loading, setLoading] = useState(true);
  
  const [focusedMap, setFocusedMap] = useState(initialFocus);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchSpatialMaps(depth).then((data) => {
      if (isMounted) {
        setMaps(data);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [depth]);

  // ==========================================
  // NEW LOGIC: Global click listener
  // Catch clicks literally anywhere on the webpage to reset the focus
  // ==========================================
  useEffect(() => {
    const handleOutsideClick = () => setFocusedMap(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="spatial-dashboard-container">
      
      {/* e.stopPropagation() prevents clicking the header from triggering the window click */}
      <div className="spatial-header" onClick={(e) => e.stopPropagation()}>
        <h3 className="spatial-title">
          Spatial Temperature Distribution at {depth ? parseFloat(depth).toFixed(1) : "0.0"}m Depth
        </h3>
        <button className="back-to-map-btn" onClick={onBack}>
          ← Back to Interactive Map
        </button>
      </div>

      <div className={`spatial-grid ${focusedMap ? 'has-focus' : ''}`}>
        
        {/* MAP 1: ARGO ACTUAL */}
        <div 
          className={`spatial-card ${focusedMap === 'argo' ? 'focused' : ''}`}
          onClick={(e) => { 
            e.stopPropagation(); 
            // If already focused, clicking it again unfocuses it!
            setFocusedMap(focusedMap === 'argo' ? null : 'argo'); 
          }}
        >
          <div className="spatial-card-header">
            <h4>Independent ARGO (Ground Truth)</h4>
          </div>
          <div className="spatial-image-wrapper">
            {loading ? <div className="loading-text">Fetching Map Data...</div> : <img src={maps.argo} alt="ARGO" className="heatmap-img" />}
          </div>
        </div>

        {/* MAP 2: CONVFORMER PREDICTION */}
        <div 
          className={`spatial-card ${focusedMap === 'convformer' ? 'focused' : ''}`}
          onClick={(e) => { 
            e.stopPropagation(); 
            setFocusedMap(focusedMap === 'convformer' ? null : 'convformer'); 
          }}
        >
          <div className="spatial-card-header">
            <h4>Convformer Prediction</h4>
            <div className="mock-toolbar">📷 🔍 ⛶</div>
          </div>
          <div className="spatial-image-wrapper">
            {loading ? <div className="loading-text">Fetching Map Data...</div> : <img src={maps.convformer} alt="Convformer" className="heatmap-img" />}
          </div>
        </div>

        {/* MAP 3: ABSOLUTE ERROR */}
        <div 
          className={`spatial-card error-card ${focusedMap === 'error' ? 'focused' : ''}`}
          onClick={(e) => { 
            e.stopPropagation(); 
            setFocusedMap(focusedMap === 'error' ? null : 'error'); 
          }}
        >
          <div className="spatial-card-header">
            <h4>Absolute Error (|Pred - Actual|)</h4>
          </div>
          <div className="spatial-image-wrapper error-wrapper">
            {loading ? <div className="loading-text">Fetching Map Data...</div> : <img src={maps.error} alt="Error" className="heatmap-img" />}
            <div className="mock-colorbar">
              <span>14</span><span>12</span><span>10</span><span>8</span>
              <span>6</span><span>4</span><span>2</span><span>0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}