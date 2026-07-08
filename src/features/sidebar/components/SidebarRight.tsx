import { BookOpen, Sparkles } from 'lucide-react';
import { BOOK_COLORS, THEME_COLORS, STOIC_CONCEPTS } from '../../../constants/stoic';
import type { GraphData, GraphNode, GraphLink, Takeaway } from '../../../types/graph';

interface SidebarRightProps {
  collapsed: boolean;
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  selectedLink: GraphLink | null;
  setSelectedLink: (link: GraphLink | null) => void;
  activeTakeaway: Takeaway | null;
  setActiveTakeaway: (takeaway: Takeaway | null) => void;
  tourModeActive: boolean;
  setTourModeActive: (active: boolean) => void;
  tourCurrentStep: number;
  tourNodes: GraphNode[];
  onTourStepChange: (step: number) => void;
  nodeConnections: (GraphLink & { neighborId: string; neighborText: string; isOutgoing: boolean })[];
  data: GraphData | null;
  onNodeSelect: (node: GraphNode) => void;
}

export const SidebarRight = ({
  collapsed,
  selectedNode,
  setSelectedNode,
  selectedLink,
  setSelectedLink,
  activeTakeaway,
  setActiveTakeaway,
  tourModeActive,
  setTourModeActive,
  tourCurrentStep,
  tourNodes,
  onTourStepChange,
  nodeConnections,
  data,
  onNodeSelect
}: SidebarRightProps) => {
  return (
    <aside className={`sidebar glass ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header right-header">
        <h2><BookOpen size={16} /> Details Panel</h2>
      </div>
      
      <div className="sidebar-content scrollable">
        {/* Tour Navigation stepper rendered at the top of Details panel if active */}
        {tourModeActive && activeTakeaway && (
          <div className="tour-container">
            <div className="tour-header">
              <span className="tour-title">Story Tour</span>
              <button 
                className="close-detail-btn"
                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                onClick={() => setTourModeActive(false)}
              >
                Exit Tour
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
              {activeTakeaway.title}
            </div>
            <div className="tour-stepper">
              <button 
                className="tour-btn"
                onClick={() => onTourStepChange(tourCurrentStep - 1)}
                disabled={tourCurrentStep === 0}
              >
                &larr;
              </button>
              <span className="tour-step-badge">
                Passage {tourCurrentStep + 1} of {tourNodes.length}
              </span>
              <button 
                className="tour-btn"
                onClick={() => onTourStepChange(tourCurrentStep + 1)}
                disabled={tourCurrentStep === tourNodes.length - 1}
              >
                &rarr;
              </button>
            </div>
          </div>
        )}

        {selectedNode ? (
          selectedNode.isAnchor ? (
            <div className="detail-card">
              <div className="detail-header" style={{ borderBottom: `2px solid ${THEME_COLORS[selectedNode.theme || ''] || 'var(--accent-gold)'}` }}>
                <div className="passage-meta" style={{ color: THEME_COLORS[selectedNode.theme || ''] || 'var(--accent-gold)', fontWeight: 'bold' }}>
                  Stoic Theme Hub
                </div>
                <button 
                  className="close-detail-btn"
                  onClick={() => {
                    setSelectedNode(null);
                    if (tourModeActive) setTourModeActive(false);
                  }}
                  title="Close details"
                >
                  &times;
                </button>
              </div>
              
              <div className="detail-body">
                <h3 className="serif-title" style={{ fontSize: '1.4rem', color: '#ffffff', marginTop: 10, marginBottom: 10 }}>
                  {selectedNode.title}
                </h3>
                <div className="passage-content serif-text" style={{ fontSize: '0.9rem', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 20 }}>
                  "{selectedNode.text}"
                </div>

                <div className="connections-section">
                  <h3 className="connections-title">
                    Meditations in this Theme ({data?.nodes.filter((n: GraphNode) => n.theme === selectedNode.theme && !n.isAnchor).length || 0})
                  </h3>
                  
                  <div className="connections-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {data?.nodes
                      .filter((n: GraphNode) => n.theme === selectedNode.theme && !n.isAnchor)
                      .map((n: GraphNode) => (
                        <div 
                          key={n.id} 
                          className="connection-item"
                          style={{ padding: '8px 12px', borderLeftColor: THEME_COLORS[selectedNode.theme || ''] }}
                          onClick={() => onNodeSelect(n)}
                        >
                          <div className="connection-item-header">
                            <span className="connection-node-id" style={{ fontWeight: 'bold' }}>
                              Passage {n.id.replace('B', '').replace('_P', '.')}
                            </span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                              Book {n.book}
                            </span>
                          </div>
                          <p className="connection-description" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {n.text}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-header">
                <div className="passage-meta">
                  Book {selectedNode.book}, Passage {selectedNode.chapter}
                </div>
                <button 
                  className="close-detail-btn"
                  onClick={() => {
                    setSelectedNode(null);
                    if (tourModeActive) setTourModeActive(false);
                  }}
                  title="Close details"
                >
                  &times;
                </button>
              </div>
              
              <div className="detail-body">
                <div className="passage-content serif-text manuscript-dropcap">
                  "{selectedNode.text}"
                </div>

                {selectedNode.concepts && selectedNode.concepts.length > 0 && (
                  <div className="passage-concept-tags">
                    {selectedNode.concepts.map(key => {
                      const concept = STOIC_CONCEPTS[key];
                      if (!concept) return null;
                      return (
                        <span 
                          key={key} 
                          className="concept-pill"
                          style={{ 
                            color: concept.color, 
                            borderColor: `${concept.color}40`,
                            background: `${concept.color}10` 
                          }}
                        >
                          {concept.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="connections-section">
                  <h3 className="connections-title">
                    Thematic Connections ({nodeConnections.length})
                  </h3>
                  
                  <div className="connections-list">
                    {nodeConnections.length > 0 ? (
                      nodeConnections.map((link, idx) => (
                        <div 
                          key={idx} 
                          className="connection-item"
                          onClick={() => {
                            const neighbor = data?.nodes.find(n => n.id === link.neighborId);
                            if (neighbor) onNodeSelect(neighbor);
                          }}
                        >
                          <div className="connection-item-header">
                            <span className="connection-node-id">
                              Passage {link.neighborId.replace('B', '').replace('_P', '.')}
                            </span>
                            <span className="connection-weight">
                              Strength: {link.weight}/100
                            </span>
                          </div>
                          <span className="connection-label">
                            {link.label}
                          </span>
                          <p className="connection-description">
                            {link.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                        No semantic connections found at this threshold. Try lowering the "Min Connection Weight" slider.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : selectedLink ? (
          <div className="detail-card">
            <div className="detail-header">
              <div className="passage-meta">
                Semantic Bond
              </div>
              <button 
                className="close-detail-btn"
                onClick={() => setSelectedLink(null)}
              >
                &times;
              </button>
            </div>

            <div className="detail-body">
              <div className="edge-detail-panel">
                <span className="edge-detail-title">
                  <Sparkles size={12} />
                  {selectedLink.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', margin: '4px 0 10px' }}>
                  Connection strength: <strong>{selectedLink.weight} / 100</strong>
                </span>
                <p className="edge-detail-text">
                  {selectedLink.description}
                </p>
              </div>

              {/* Source Node Preview */}
              <div 
                className="connection-item"
                style={{ marginTop: 10, cursor: 'pointer' }}
                onClick={() => {
                  const srcNode = typeof selectedLink.source === 'object' ? selectedLink.source : data?.nodes.find(n => n.id === selectedLink.source);
                  if (srcNode) onNodeSelect(srcNode);
                }}
              >
                <div className="connection-node-id" style={{ marginBottom: 4 }}>
                  Source: Passage {(typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source).replace('B', '').replace('_P', '.')}
                </div>
                <div className="serif-text" style={{ 
                  fontSize: '0.8rem', 
                  lineHeight: 1.4, 
                  paddingRight: 4, 
                  color: 'var(--text-muted)',
                  fontStyle: 'italic'
                }}>
                  "{data?.nodes.find(n => n.id === (typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source))?.text}"
                </div>
              </div>

              {/* Target Node Preview */}
              <div 
                className="connection-item"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const tgtNode = typeof selectedLink.target === 'object' ? selectedLink.target : data?.nodes.find(n => n.id === selectedLink.target);
                  if (tgtNode) onNodeSelect(tgtNode);
                }}
              >
                <div className="connection-node-id" style={{ marginBottom: 4 }}>
                  Target: Passage {(typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target).replace('B', '').replace('_P', '.')}
                </div>
                <div className="serif-text" style={{ 
                  fontSize: '0.8rem', 
                  lineHeight: 1.4, 
                  paddingRight: 4, 
                  color: 'var(--text-muted)',
                  fontStyle: 'italic'
                }}>
                  "{data?.nodes.find(n => n.id === (typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target))?.text}"
                </div>
              </div>
            </div>
          </div>
        ) : activeTakeaway ? (
          <div className="detail-card">
            <div className="detail-header">
              <div className="passage-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> Storyline Summary
              </div>
              <button 
                className="close-detail-btn"
                onClick={() => {
                  setActiveTakeaway(null);
                  setTourModeActive(false);
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="detail-body">
              <h3 className="serif-title" style={{ fontSize: '1.2rem', marginBottom: 4 }}>
                {activeTakeaway.title}
              </h3>
              <div className="passage-content serif-text" style={{ maxHeight: 'none', flex: 1 }}>
                {activeTakeaway.story}
              </div>

              <button 
                className="graph-btn" 
                style={{ 
                  alignSelf: 'center', 
                  marginTop: 10, 
                  padding: '8px 24px', 
                  borderColor: 'var(--accent-gold)', 
                  color: 'var(--accent-gold)',
                  fontWeight: 600
                }}
                onClick={() => {
                  setTourModeActive(true);
                  onTourStepChange(0);
                }}
              >
                <Sparkles size={14} /> Start Story Tour
              </button>
              
              <div style={{ marginTop: 10 }}>
                <span className="connections-title">Key Passages in this Thread</span>
                <div className="books-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 8 }}>
                  {activeTakeaway.relatedNodeIds.map(nodeId => {
                    const node = data?.nodes.find(n => n.id === nodeId);
                    return (
                      <div 
                        key={nodeId}
                        className="book-label"
                        style={{ 
                          borderColor: node ? BOOK_COLORS[node.book] : 'var(--border-glass)',
                          background: node ? `${BOOK_COLORS[node.book]}20` : 'rgba(0,0,0,0.2)',
                          color: '#ffffff',
                          fontSize: '0.65rem'
                        }}
                        onClick={() => {
                          if (node) onNodeSelect(node);
                        }}
                      >
                        {nodeId.replace('B', '').replace('_P', '.')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-panel">
            <BookOpen size={48} style={{ color: 'var(--accent-gold)', opacity: 0.5, marginBottom: 8 }} />
            <h3>Explore the Stoic Mind</h3>
            <p>
              Select any passage node in the graph to read Marcus Aurelius's reflections and view its semantic connections.
            </p>
            <p>
              Alternatively, click a <strong>Stoic Storyline</strong> on the left panel to follow conceptual paths like "The Inner Citadel" or "The Flow of Time" mapped across his 12 books.
            </p>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 12 }}>
              Drag nodes to adjust physics, scroll to zoom, and double-click to drag a sub-network.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarRight;
