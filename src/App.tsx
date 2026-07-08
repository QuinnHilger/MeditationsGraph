import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Info, 
  Activity, 
  Maximize2 
} from 'lucide-react';
import { STOIC_CONCEPTS } from './constants/stoic';
import type { GraphNode, GraphLink, Takeaway, GraphData } from './types/graph';
import { 
  filterGraphData, 
  getNodeConnections, 
  calculateNodeDegrees 
} from './features/graph/utils/graphHelpers';
import SidebarLeft from './features/sidebar/components/SidebarLeft';
import SidebarRight from './features/sidebar/components/SidebarRight';
import ForceGraphWrapper from './features/graph/components/ForceGraphWrapper';
import GraphToolbar from './features/graph/components/GraphToolbar';
import './App.css';

function App() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection & UI States
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [activeTakeaway, setActiveTakeaway] = useState<Takeaway | null>(null);
  
  // Filtering States
  const [selectedBooks, setSelectedBooks] = useState<number[]>(Array.from({ length: 12 }, (_, i) => i + 1));
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [minWeight, setMinWeight] = useState<number>(75); 
  const [maxConnections, setMaxConnections] = useState<number>(0); 
  const [mstEnabled, setMstEnabled] = useState<boolean>(true);
  const [showThemeAnchors, setShowThemeAnchors] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sidebar toggles
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState<boolean>(false);
  
  // Zen Mode & Tour Mode States
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [tourModeActive, setTourModeActive] = useState<boolean>(false);
  const [tourCurrentStep, setTourCurrentStep] = useState<number>(0);
  
  // Graph viewport size
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('2d');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFitDone = useRef<boolean>(false);
  const prevDimensions = useRef({ width: 0, height: 0 });

  // Load Graph Data
  useEffect(() => {
    fetch('/data/graph_data.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load graph data. Make sure public/data/graph_data.json exists.");
        return res.json();
      })
      .then((jsonData: GraphData) => {
        // Tag nodes with concepts dynamically
        const nodesWithConcepts = jsonData.nodes.map(node => {
          const matchedConcepts: string[] = [];
          const textLower = node.text.toLowerCase();
          
          Object.entries(STOIC_CONCEPTS).forEach(([key, concept]) => {
            const hasKeyword = concept.keywords.some(kw => {
              const regex = new RegExp(`\\b${kw}\\b`, 'i');
              return regex.test(textLower);
            });
            if (hasKeyword) {
              matchedConcepts.push(key);
            }
          });
          return {
            ...node,
            concepts: matchedConcepts
          };
        });

        setData({
          ...jsonData,
          nodes: nodesWithConcepts
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Update Graph Dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [loading, leftPanelCollapsed, rightPanelCollapsed]);

  // Focus camera on node (handles both 2D centering/zoom and 3D camera transitions)
  const focusNode = useCallback((node: GraphNode, duration = 1000) => {
    if (!fgRef.current || node.x === undefined || node.y === undefined) return;
    if (graphMode === '2d') {
      fgRef.current.centerAt(node.x, node.y, duration);
      fgRef.current.zoom(2.5, duration);
    } else {
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 0);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio }, 
        node, 
        duration 
      );
    }
  }, [graphMode]);

  // Handle zooming to node
  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
    setRightPanelCollapsed(false); 
    
    // Zoom/Center camera on node
    focusNode(node, 1000);
  };

  // Helper: toggle book selection
  const toggleBook = (bookNum: number) => {
    setSelectedBooks(prev => 
      prev.includes(bookNum) 
        ? prev.filter(b => b !== bookNum) 
        : [...prev, bookNum]
    );
  };

  const selectAllBooks = () => {
    setSelectedBooks(Array.from({ length: 12 }, (_, i) => i + 1));
  };

  const clearAllBooks = () => {
    setSelectedBooks([]);
  };

  // Helper: select or toggle theme concept filter, and align selected books dynamically
  const selectConceptFilter = (conceptKey: string | null) => {
    setSelectedConcept(conceptKey);
    setActiveTakeaway(null);
    setTourModeActive(false);
    
    if (conceptKey) {
      const connectedBooks = data?.nodes
        .filter(n => !n.isAnchor && n.concepts?.includes(conceptKey))
        .map(n => n.book) || [];
      const uniqueBooks = Array.from(new Set(connectedBooks)).sort((a, b) => a - b);
      setSelectedBooks(uniqueBooks);
    } else {
      setSelectedBooks(Array.from({ length: 12 }, (_, i) => i + 1));
    }
  };

  // Calculate Node Degrees in full loaded dataset (to size nodes consistently)
  const nodeDegrees = useMemo(() => {
    return calculateNodeDegrees(data);
  }, [data]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return filterGraphData(data, {
      selectedBooks,
      selectedConcept,
      searchQuery,
      showThemeAnchors,
      activeTakeaway,
      mstEnabled,
      minWeight,
      maxConnections
    });
  }, [data, selectedBooks, selectedConcept, minWeight, maxConnections, mstEnabled, showThemeAnchors, searchQuery, activeTakeaway]);

  // Reset initial fit flag when filtered data changes to trigger refit
  useEffect(() => {
    initialFitDone.current = false;
  }, [filteredData]);

  // Adjust camera to fit or center when dimensions change
  useEffect(() => {
    if (fgRef.current && data) {
      const dimChanged = prevDimensions.current.width !== dimensions.width || prevDimensions.current.height !== dimensions.height;
      if (dimChanged) {
        prevDimensions.current = { width: dimensions.width, height: dimensions.height };
        const timer = setTimeout(() => {
          if (selectedNode && selectedNode.x !== undefined && selectedNode.y !== undefined) {
            focusNode(selectedNode, 400);
          } else if (activeTakeaway) {
            fgRef.current.zoomToFit(400, 85, (n: GraphNode) => activeTakeaway.relatedNodeIds.includes(n.id));
          } else {
            fgRef.current.zoomToFit(400, 85);
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [dimensions, data, selectedNode, activeTakeaway, graphMode, focusNode]);

  // Trigger a camera fit when switching to 3D mode
  useEffect(() => {
    if (graphMode === '3d' && fgRef.current) {
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(800, 85);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [graphMode]);

  // Keyboard listener to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEngineStop = () => {
    if (!initialFitDone.current && fgRef.current) {
      fgRef.current.zoomToFit(800, 85);
      initialFitDone.current = true;
    }
  };

  // Tour steps nodes
  const tourNodes = useMemo(() => {
    if (!activeTakeaway || !data) return [];
    return activeTakeaway.relatedNodeIds.map(id => data.nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];
  }, [activeTakeaway, data]);

  const handleTourStepChange = (step: number) => {
    if (!tourNodes[step]) return;
    setTourCurrentStep(step);
    const targetNode = tourNodes[step];
    handleNodeSelect(targetNode);
  };

  // Active highlighted nodes/links (neighbors of selection or story participants)
  const highlightedDetails = useMemo(() => {
    const highlightedNodes = new Set<string>();
    const highlightedLinks = new Set<string>();

    if (selectedNode) {
      highlightedNodes.add(selectedNode.id);
      
      filteredData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
        
        if (sourceId === selectedNode.id) {
          highlightedNodes.add(targetId);
          highlightedLinks.add(`${sourceId}-${targetId}`);
        } else if (targetId === selectedNode.id) {
          highlightedNodes.add(sourceId);
          highlightedLinks.add(`${sourceId}-${targetId}`);
        }
      });
    } else if (activeTakeaway) {
      activeTakeaway.relatedNodeIds.forEach(id => highlightedNodes.add(id));
      
      filteredData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
        
        if (highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
          highlightedLinks.add(`${sourceId}-${targetId}`);
        }
      });
    }

    return {
      nodes: highlightedNodes,
      links: highlightedLinks,
      hasActiveHighlight: selectedNode !== null || activeTakeaway !== null
    };
  }, [selectedNode, activeTakeaway, filteredData]);

  // Selected Node's Outgoing and Incoming links
  const nodeConnections = useMemo(() => {
    return getNodeConnections(selectedNode, data, minWeight);
  }, [selectedNode, data, minWeight]);

  const resetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 100);
      setSelectedNode(null);
      setSelectedLink(null);
      setActiveTakeaway(null);
    }
  };

  const handleSelectTakeaway = (t: Takeaway | null) => {
    setSelectedNode(null);
    setSelectedLink(null);
    setActiveTakeaway(t);
    setTourModeActive(false);
    
    if (t) {
      setRightPanelCollapsed(false);
      if (fgRef.current && t.relatedNodeIds.length > 0) {
        setTimeout(() => {
          fgRef.current.zoomToFit(800, 100, (n: GraphNode) => t.relatedNodeIds.includes(n.id));
        }, 50);
      }
    }
  };

  const handleZoomIn = () => {
    if (!fgRef.current) return;
    if (graphMode === '2d') {
      fgRef.current.zoom(fgRef.current.zoom() * 1.4, 300);
    } else {
      const cam = fgRef.current.cameraPosition();
      fgRef.current.cameraPosition(
        { x: cam.x * 0.75, y: cam.y * 0.75, z: cam.z * 0.75 },
        undefined,
        300
      );
    }
  };

  const handleZoomOut = () => {
    if (!fgRef.current) return;
    if (graphMode === '2d') {
      fgRef.current.zoom(fgRef.current.zoom() / 1.4, 300);
    } else {
      const cam = fgRef.current.cameraPosition();
      fgRef.current.cameraPosition(
        { x: cam.x * 1.35, y: cam.y * 1.35, z: cam.z * 1.35 },
        undefined,
        300
      );
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="serif-title" style={{ fontSize: '1.2rem' }}>Constructing the Meditations Graph...</p>
          <p style={{ fontSize: '0.85rem' }}>Reading passages and mapping semantic links...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <p className="serif-title" style={{ color: '#ef4444' }}>Error Launching Application</p>
        <p style={{ marginTop: 10 }}>{error}</p>
        <p style={{ marginTop: 20, fontSize: '0.8rem', color: '#9ca3af' }}>Please verify that public/data/graph_data.json was compiled correctly.</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${zenMode ? 'zen-mode' : ''}`}>
      {/* Background glowing lights */}
      <div className="orb-1"></div>
      <div className="orb-2"></div>
      <div className="orb-3"></div>

      {zenMode && (
        <button className="zen-exit-badge" onClick={() => setZenMode(false)}>
          <Maximize2 size={12} /> Exit Zen Mode (ESC)
        </button>
      )}
      
      {/* Top Header */}
      <header className="app-header">
        <h1 className="serif-title">
          <BookOpen size={20} />
          MARCUS AURELIUS: THE MEDITATIONS GRAPH
        </h1>
        
        <div className="header-controls">
          <div className="stats-badge">
            <Activity size={12} />
            <span>Passages: {filteredData.nodes.length}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>Connections: {filteredData.links.length}</span>
          </div>
          
          <button className="graph-btn" onClick={() => setZenMode(true)} style={{ borderColor: 'var(--border-glass)' }} title="Zen Mode">
            <Maximize2 size={14} /> Zen Mode
          </button>

          <button className="graph-btn" onClick={() => setShowInfoModal(true)}>
            <Info size={14} /> Guide
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-main">
        {/* Toggle Left Sidebar */}
        <button 
          className={`floating-toggle toggle-left`}
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          title={leftPanelCollapsed ? "Open Sidebar" : "Close Sidebar"}
        >
          {leftPanelCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* LEFT SIDEBAR: FILTERS & TAKEAWAYS */}
        <SidebarLeft 
          collapsed={leftPanelCollapsed}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            setActiveTakeaway(null); 
          }}
          selectedBooks={selectedBooks}
          toggleBook={toggleBook}
          selectAllBooks={selectAllBooks}
          clearAllBooks={clearAllBooks}
          selectedConcept={selectedConcept}
          selectConceptFilter={selectConceptFilter}
          mstEnabled={mstEnabled}
          setMstEnabled={setMstEnabled}
          showThemeAnchors={showThemeAnchors}
          setShowThemeAnchors={setShowThemeAnchors}
          minWeight={minWeight}
          setMinWeight={setMinWeight}
          maxConnections={maxConnections}
          setMaxConnections={setMaxConnections}
          activeTakeaway={activeTakeaway}
          onSelectTakeaway={handleSelectTakeaway}
          data={data}
        />

        {/* CENTER INTERACTIVE GRAPH CONTAINER */}
        <div className="graph-container" ref={containerRef}>
          {data && (
            <ForceGraphWrapper 
              fgRef={fgRef}
              graphMode={graphMode}
              filteredData={filteredData}
              dimensions={dimensions}
              selectedNode={selectedNode}
              selectedLink={selectedLink}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              highlightedDetails={highlightedDetails}
              nodeDegrees={nodeDegrees}
              onNodeSelect={handleNodeSelect}
              onLinkSelect={(link) => {
                setSelectedLink(link);
                setSelectedNode(null);
                setRightPanelCollapsed(false);
              }}
              onBackgroundClick={() => {
                setSelectedNode(null);
                setSelectedLink(null);
                setActiveTakeaway(null);
              }}
              onEngineStop={handleEngineStop}
              rawGraphDataLoaded={data !== null}
            />
          )}

          {/* Floating Zoom Controls Toolbar */}
          <GraphToolbar 
            graphMode={graphMode}
            onToggleGraphMode={() => {
              setGraphMode(prev => prev === '2d' ? '3d' : '2d');
              initialFitDone.current = false;
            }}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRecenter={resetZoom}
          />

          {activeTakeaway && (
            <div className="glass" style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: '0.8rem',
              color: 'var(--accent-gold)',
              borderColor: 'var(--accent-gold)',
              zIndex: 4,
              pointerEvents: 'none'
            }}>
              Active Story: <strong>{activeTakeaway.title}</strong>
            </div>
          )}
        </div>

        {/* Toggle Right Sidebar */}
        <button 
          className={`floating-toggle toggle-right`}
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          title={rightPanelCollapsed ? "Open Details" : "Close Details"}
        >
          {rightPanelCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* RIGHT SIDEBAR: PASSAGE / EDGE DETAILS */}
        <SidebarRight 
          collapsed={rightPanelCollapsed}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          activeTakeaway={activeTakeaway}
          setActiveTakeaway={setActiveTakeaway}
          tourModeActive={tourModeActive}
          setTourModeActive={setTourModeActive}
          tourCurrentStep={tourCurrentStep}
          tourNodes={tourNodes}
          onTourStepChange={handleTourStepChange}
          nodeConnections={nodeConnections}
          data={data}
          onNodeSelect={handleNodeSelect}
        />
      </div>

      {/* Info Guide Modal */}
      {showInfoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99,
          padding: 20
        }} onClick={() => setShowInfoModal(false)}>
          <div className="glass" style={{
            maxWidth: 600,
            padding: 30,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-glow)'
          }} onClick={e => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              Meditations Graph Explorer Guide
            </h2>
            
            <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
              This interactive map organizes all <strong>437 passages</strong> of Marcus Aurelius's <em>Meditations</em> (George Long translation). 
            </p>
            
            <h4 className="serif-title" style={{ fontSize: '0.9rem', color: '#ffffff', marginTop: 10 }}>How it was built:</h4>
            <ul style={{ paddingLeft: 20, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <li><strong>Passage Parsing</strong>: The raw Gutenberg Ebook was parsed and segmented into 437 unique passage nodes (mapped by Book and Chapter).</li>
              <li><strong>Local Neural Embeddings</strong>: Computed 384-dimensional dense semantic vectors using a local <code>all-MiniLM-L6-v2</code> transformer model. This captures thematic equivalence (e.g. matching "inner citadel" and "ruling power") even when there is no word overlap.</li>
              <li><strong>Dynamic Similarity Thresholding</strong>: Calculated pairwise similarity using vector dot products, automatically calibrating the link density threshold based on the similarity distribution to prevent clutter.</li>
              <li><strong>AI-Refined Relationships</strong>: An Antigravity reasoning agent evaluated the strongest semantic candidate pairs to prune false matches, write custom Stoic labels, and generate 1-2 sentence contextual connection descriptions.</li>
            </ul>

            <h4 className="serif-title" style={{ fontSize: '0.9rem', color: '#ffffff', marginTop: 10 }}>Graph Operations:</h4>
            <ul style={{ paddingLeft: 20, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <li><strong>Hover</strong>: Reveal Book.Chapter identifier.</li>
              <li><strong>Left-Click Node</strong>: Select a passage to read, isolate its local connection web, and zoom in.</li>
              <li><strong>Left-Click Line</strong>: Inspect why two thoughts are connected and how they link.</li>
              <li><strong>Scroll Wheel</strong>: Zoom in and out of the graph universe.</li>
              <li><strong>Left-Drag background / nodes</strong>: Pan viewport or pull nodes to explore physics.</li>
            </ul>

            <button 
              className="graph-btn" 
              style={{ alignSelf: 'center', marginTop: 15, padding: '8px 24px', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
              onClick={() => setShowInfoModal(false)}
            >
              Enter the Mind of the Emperor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
