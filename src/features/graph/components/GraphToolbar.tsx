import { Plus, Minus, Maximize2, Orbit } from 'lucide-react';

interface GraphToolbarProps {
  graphMode: '2d' | '3d';
  onToggleGraphMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export const GraphToolbar = ({
  graphMode,
  onToggleGraphMode,
  onZoomIn,
  onZoomOut,
  onRecenter
}: GraphToolbarProps) => {
  return (
    <div className="graph-controls glass" style={{ 
      bottom: 24, 
      left: 'unset', 
      right: 24, 
      transform: 'none', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 8, 
      padding: 8, 
      borderRadius: 8 
    }}>
      <button 
        className="collapse-btn" 
        onClick={onZoomIn} 
        title="Zoom In"
      >
        <Plus size={16} />
      </button>
      <button 
        className="collapse-btn" 
        onClick={onZoomOut} 
        title="Zoom Out"
      >
        <Minus size={16} />
      </button>
      <button 
        className="collapse-btn" 
        onClick={onRecenter} 
        title="Recenter & Fit"
      >
        <Maximize2 size={16} />
      </button>
      <button 
        className={`collapse-btn ${graphMode === '3d' ? 'active-mode' : ''}`}
        onClick={onToggleGraphMode}
        title={graphMode === '2d' ? "Switch to 3D Space View" : "Switch to 2D Flat View"}
        style={{
          background: graphMode === '3d' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
          borderColor: graphMode === '3d' ? '#d4af37' : 'rgba(255, 255, 255, 0.15)',
          color: graphMode === '3d' ? '#d4af37' : '#ffffff'
        }}
      >
        <Orbit size={16} />
      </button>
    </div>
  );
};

export default GraphToolbar;
