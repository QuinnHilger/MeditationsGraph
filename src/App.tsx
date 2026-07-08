import { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { forceX, forceY } from 'd3-force';
import { 
  Search, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Info, 
  Activity, 
  Maximize2,
  Plus,
  Minus,
  Orbit
} from 'lucide-react';
import './App.css';

// Type definitions
interface GraphNode {
  id: string;
  book: number;
  chapter: number;
  text: string;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  index?: number;
  concepts?: string[];
  isAnchor?: boolean;
  theme?: string;
  title?: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  weight: number;
  description: string;
  index?: number;
  isAnchorLink?: boolean;
}

interface Takeaway {
  id: string;
  title: string;
  story: string;
  relatedNodeIds: string[];
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  takeaways: Takeaway[];
}

// Color scheme for Books 1 to 12
const BOOK_COLORS: Record<number, string> = {
  1: '#d4af37', // Imperial Gold
  2: '#10b981', // Stoic Emerald
  3: '#3b82f6', // Cobalt Blue
  4: '#f59e0b', // Autumn Amber
  5: '#ef4444', // Gladiator Ruby
  6: '#8b5cf6', // Tyrian Purple
  7: '#06b6d4', // Aegean Teal
  8: '#f97316', // Campfire Orange
  9: '#ec4899', // Blossom Pink
  10: '#14b8a6', // Mediterranean Cyan
  11: '#f43f5e', // Rose
  12: '#a855f7'  // Violet
};

// Colors for the 6 central Stoic themes (for Anchor Nodes)
const THEME_COLORS: Record<string, string> = {
  INNER_CITADEL: '#ef4444', // Gladiator Ruby
  TRANSIENCE: '#3b82f6',    // Cobalt Blue
  COSMOS: '#d4af37',        // Imperial Gold
  SOCIAL_DUTY: '#10b981',   // Stoic Emerald
  VIRTUE: '#8b5cf6',        // Tyrian Purple
  FAME: '#f97316'           // Campfire Orange
};

const BOOK_NAMES: Record<number, string> = {
  1: "Book I (Ancestors)",
  2: "Book II (On the Quadi)",
  3: "Book III (Carnuntum)",
  4: "Book IV (Self-Retreat)",
  5: "Book V (Duty)",
  6: "Book VI (The Whole)",
  7: "Book VII (Providence)",
  8: "Book VIII (Virtue)",
  9: "Book IX ( Logos)",
  10: "Book X (Nature)",
  11: "Book XI (Fellowship)",
  12: "Book XII (Eternity)"
};

const STOIC_CONCEPTS: Record<string, { label: string; keywords: string[]; color: string }> = {
  inner_citadel: {
    label: "The Inner Citadel",
    color: "#3b82f6", // Blue
    keywords: [
      "citadel", "fortress", "ruling center", "governing part", "mind", "soul", 
      "daemon", "inner self", "ruling power", "rational soul", "judgment", "opinion",
      "assent", "retreat within", "sanctuary", "freedom", "free"
    ]
  },
  transience_of_life: {
    label: "Transience & Mortality",
    color: "#f59e0b", // Amber
    keywords: [
      "transience", "fleeting", "smoke", "bubble", "river", "transitoriness", "eternity", "time", "death", 
      "die", "mortal", "decay", "ashes", "oblivion", "brief", "moment", "temporary",
      "span", "vapor", "swift", "flow", "transitory", "vanished"
    ]
  },
  cosmic_order: {
    label: "Cosmic Order & Logos",
    color: "#8b5cf6", // Purple
    keywords: [
      "logos", "nature", "cosmos", "providence", "universe", "whole", "destiny", 
      "fate", "ordained", "all-governing", "rational design", "world-soul", "coherence",
      "harmony", "general law"
    ]
  },
  social_duty: {
    label: "Fellowship & Duty",
    color: "#10b981", // Emerald Green
    keywords: [
      "fellowship", "brotherhood", "social", "citizen", "cooperation", "help", "common good",
      "kindness", "benevolence", "community", "jointly", "neighbor", "forbear", "patiently",
      "instruction", "fellow-workers", "society", "mankind"
    ]
  },
  virtue_and_vice: {
    label: "Virtue & Wisdom",
    color: "#ef4444", // Crimson Red
    keywords: [
      "virtue", "vice", "good", "evil", "justice", "temperance", "fortitude", "wisdom",
      "integrity", "moral", "shamefastness", "truth", "righteousness", "duty", "honest"
    ]
  }
};

// Helper function to draw rounded rectangles on older browsers compatibly
const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};

// Helper function to draw a beautiful open book icon
const drawBookIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isHighlighted: boolean) => {
  const w = size * 2.2;
  const h = size * 1.5;
  const pad = Math.max(1.8, size * 0.12);
  
  if (isHighlighted) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }
  
  // 1. Draw Cover (outer outline)
  ctx.fillStyle = color;
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2 - pad, y - h/2 - pad, w/2, h + pad*2, 2.5);
  drawRoundRect(ctx, x + pad, y - h/2 - pad, w/2, h + pad*2, 2.5);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  
  // 2. Draw Paper Pages (base white/cream)
  ctx.fillStyle = '#fefefe';
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2, y - h/2, w/2 - 0.5, h, 1.2);
  drawRoundRect(ctx, x + 0.5, y - h/2, w/2 - 0.5, h, 1.2);
  ctx.fill();

  // Apply subtle color-coded tint to pages (18% opacity of the book theme color)
  ctx.fillStyle = `${color}2e`; // 2e hex = 46 dec = ~18% opacity
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2, y - h/2, w/2 - 0.5, h, 1.2);
  drawRoundRect(ctx, x + 0.5, y - h/2, w/2 - 0.5, h, 1.2);
  ctx.fill();
  
  // 3. Draw Page Lines (indicating text)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  
  // Left page text lines
  ctx.moveTo(x - w/2 + 3, y - h/4); ctx.lineTo(x - 3, y - h/4);
  ctx.moveTo(x - w/2 + 3, y);       ctx.lineTo(x - 3, y);
  ctx.moveTo(x - w/2 + 3, y + h/4); ctx.lineTo(x - 3, y + h/4);
  
  // Right page text lines
  ctx.moveTo(x + 3, y - h/4);       ctx.lineTo(x + w/2 - 3, y - h/4);
  ctx.moveTo(x + 3, y);             ctx.lineTo(x + w/2 - 3, y);
  ctx.moveTo(x + 3, y + h/4);       ctx.lineTo(x + w/2 - 3, y + h/4);
  ctx.stroke();
  
  // 4. Draw Center Spine
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - h/2);
  ctx.lineTo(x, y + h/2);
  ctx.stroke();
 
  // 5. Draw Gold Ribbon Bookmark
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - h/2 + 1);
  ctx.lineTo(x, y + h/2 + size * 0.45);
  ctx.stroke();
};

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
  const [minWeight, setMinWeight] = useState<number>(30); // Default to filter out weak links
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
      for (let entry of entries) {
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
  const focusNode = (node: any, duration = 1000) => {
    if (!fgRef.current || node.x === undefined || node.y === undefined) return;
    if (graphMode === '2d') {
      fgRef.current.centerAt(node.x, node.y, duration);
      fgRef.current.zoom(2.5, duration);
    } else {
      // 3D camera zoom/focus: calculate offset camera coordinates pointing at node
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 0);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio }, // position
        node, // lookAt
        duration // transition time
      );
    }
  };

  // Handle zooming to node
  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
    setRightPanelCollapsed(false); // Uncollapse sidebar when node is selected
    
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

  // Calculate Node Degrees in full loaded dataset (to size nodes consistently)
  const nodeDegrees = useMemo(() => {
    if (!data) return {};
    const degrees: Record<string, number> = {};
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      degrees[sourceId] = (degrees[sourceId] || 0) + 1;
      degrees[targetId] = (degrees[targetId] || 0) + 1;
    });
    return degrees;
  }, [data]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    // 1. Filter Nodes based on Book Selection, Search Query, and Concept Filter
    const matchedNodes = data.nodes.filter(node => {
      const isBookSelected = selectedBooks.includes(node.book);
      if (!isBookSelected) return false;

      // Filter by selected concept
      if (selectedConcept && (!node.concepts || !node.concepts.includes(selectedConcept))) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = node.text.toLowerCase().includes(query);
        const matchesBookChapter = `${node.book}.${node.chapter}`.includes(query);
        const matchesBookName = BOOK_NAMES[node.book]?.toLowerCase().includes(query);
        return matchesText || matchesBookChapter || matchesBookName;
      }
      return true;
    });

    const matchedNodeIds = new Set(matchedNodes.map(n => n.id));

    // 2. Filter Links
    const matchedLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      // Link must connect two visible nodes
      if (!matchedNodeIds.has(sourceId) || !matchedNodeIds.has(targetId)) return false;
      
      // Link must meet minimum weight
      if (link.weight < minWeight) return false;

      // If a takeaway is active, only show connections inside that takeaway's node set
      if (activeTakeaway) {
        return activeTakeaway.relatedNodeIds.includes(sourceId) && activeTakeaway.relatedNodeIds.includes(targetId);
      }

      return true;
    });

    // Make sure we keep nodes that are in the link set, or nodes that match search.
    // If a node is completely orphaned by the weight slider, it's still shown, but
    // we can filter out nodes with no links if desired. Here we keep matched nodes.
    return {
      nodes: matchedNodes,
      links: matchedLinks
    };
  }, [data, selectedBooks, minWeight, searchQuery, activeTakeaway]);

  // Configure D3 simulation forces to prevent overlap and increase node spacing
  useEffect(() => {
    if (fgRef.current && data) {
      if (graphMode === '2d') {
        // Charge repulsion (makes nodes push away from each other)
        fgRef.current.d3Force('charge').strength(-260);
        // Link distance (makes connected nodes sit further apart)
        fgRef.current.d3Force('link').distance(110);
        // Add x and y forces to pull sparse outlying nodes closer to the center
        fgRef.current.d3Force('x', forceX(dimensions.width / 2).strength(0.08));
        fgRef.current.d3Force('y', forceY(dimensions.height / 2).strength(0.08));
        // Reheat the simulation to let nodes settle into new layout
        fgRef.current.d3ReheatSimulation();
      } else {
        // 3D physics repulsion settings
        fgRef.current.d3Force('charge').strength(-180);
        fgRef.current.d3Force('link').distance(90);
        fgRef.current.d3ReheatSimulation();
      }
    }
  }, [data, filteredData, dimensions, graphMode]);



  // Reset initial fit flag when filtered data changes to trigger refit on next layout stabilization
  useEffect(() => {
    initialFitDone.current = false;
  }, [filteredData]);

  // Adjust camera to fit or center when dimensions change (sidebar toggle, resize, etc.)
  useEffect(() => {
    if (fgRef.current && data) {
      const dimChanged = prevDimensions.current.width !== dimensions.width || prevDimensions.current.height !== dimensions.height;
      if (dimChanged) {
        prevDimensions.current = { width: dimensions.width, height: dimensions.height };
        const timer = setTimeout(() => {
          if (selectedNode && selectedNode.x !== undefined && selectedNode.y !== undefined) {
            focusNode(selectedNode, 400);
          } else if (activeTakeaway) {
            fgRef.current.zoomToFit(400, 85, (n: any) => activeTakeaway.relatedNodeIds.includes(n.id));
          } else {
            fgRef.current.zoomToFit(400, 85);
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [dimensions, data, selectedNode, activeTakeaway, graphMode]);

  // Trigger a camera fit when switching to 3D mode to ensure elements are properly scaled and visible
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

  const handleEngineStop = () => {
    if (!initialFitDone.current && fgRef.current) {
      fgRef.current.zoomToFit(800, 85);
      initialFitDone.current = true;
    }
  };

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

  // Tour steps nodes
  const tourNodes = useMemo(() => {
    if (!activeTakeaway || !data) return [];
    return activeTakeaway.relatedNodeIds.map(id => data.nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];
  }, [activeTakeaway, data]);

  const handleTourStepChange = (step: number) => {
    if (!tourNodes[step]) return;
    setTourCurrentStep(step);
    const targetNode = tourNodes[step];
    
    // Zoom/Center camera on node
    handleNodeSelect(targetNode);
  };

  // Active highlighted nodes/links (neighbors of selection or story participants)
  const highlightedDetails = useMemo(() => {
    const highlightedNodes = new Set<string>();
    const highlightedLinks = new Set<string>();

    if (selectedNode) {
      highlightedNodes.add(selectedNode.id);
      
      // Find neighbors
      filteredData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
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
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
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

  // Refresh graph visuals in 3D mode when node selections or hover states change
  useEffect(() => {
    if (fgRef.current && graphMode === '3d') {
      fgRef.current.refresh();
    }
  }, [selectedNode, hoveredNode, highlightedDetails.hasActiveHighlight, graphMode]);

  // Selected Node's Outgoing and Incoming links (to display in sidebar)
  const nodeConnections = useMemo(() => {
    if (!selectedNode || !data) return [];
    
    return data.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return (sourceId === selectedNode.id || targetId === selectedNode.id) && link.weight >= minWeight;
    }).map(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const neighborId = sourceId === selectedNode.id ? targetId : sourceId;
      const neighborText = data.nodes.find(n => n.id === neighborId)?.text || '';
      
      return {
        ...link,
        neighborId,
        neighborText,
        isOutgoing: sourceId === selectedNode.id
      };
    }).sort((a, b) => b.weight - a.weight);
  }, [selectedNode, data, minWeight]);

  // Fit camera zoom to encompass all active graph elements
  const resetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 100);
      setSelectedNode(null);
      setSelectedLink(null);
      setActiveTakeaway(null);
    }
  };

  // Custom Node Drawing on Canvas (Open Book Icons - Upgraded Sizes)
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightedDetails.nodes.has(node.id);
    const isDimmed = highlightedDetails.hasActiveHighlight && !isHighlighted;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;

    ctx.save();

    // Set alpha
    let alpha = 1.0;
    if (isDimmed) alpha = 0.12;
    ctx.globalAlpha = alpha;

    const nodeColor = node.isAnchor 
      ? (THEME_COLORS[node.theme] || '#d4af37')
      : (BOOK_COLORS[node.book] || '#9ca3af');

    if (node.isAnchor) {
      const size = 30.0; // Theme anchors are drawn very large
      
      // 1. Draw Ring / Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 1.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = isSelected || isHovered ? 'rgba(255, 255, 255, 0.15)' : `${nodeColor}10`;
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? '#ffffff' : nodeColor;
      ctx.lineWidth = isSelected || isHovered ? 3.0 / globalScale : 1.5 / globalScale;
      ctx.stroke();

      // 2. Draw Thematic Emblem (Double-border Circle)
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'var(--bg-card)';
      ctx.fill();
      ctx.stroke();

      // Inner decorative ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.75, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1.0 / globalScale;
      ctx.stroke();

      // 3. Render Large Theme Label inside Emblem
      const label = node.title || node.id;
      const fontSize = 7.0 / globalScale;
      ctx.font = `bold ${fontSize}px var(--font-serif)`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = label.split(' ');
      if (words.length > 2) {
        const line1 = words.slice(0, 2).join(' ');
        const line2 = words.slice(2).join(' ');
        ctx.fillText(line1, node.x, node.y - fontSize * 0.6);
        ctx.fillText(line2, node.x, node.y + fontSize * 0.6);
      } else {
        ctx.fillText(label, node.x, node.y);
      }
      
      ctx.restore();
      return;
    }

    const degree = nodeDegrees[node.id] || 0;
    const baseRadius = 11.0;
    const size = baseRadius + Math.sqrt(degree) * 1.35;

    // 1. Draw Ring / Glow for highlighted or hovered nodes
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 1.8, 0, 2 * Math.PI, false);
      ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.15)' : `${nodeColor}22`;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }
    }

    // 2. Draw Book Icon
    drawBookIcon(ctx, node.x, node.y, size, nodeColor, isHighlighted && !isDimmed);

    // 3. Label rendering
    const showLabel = globalScale > 1.8 || isHovered || isSelected || (isHighlighted && !isDimmed);
    if (showLabel) {
      const label = `${node.book}.${node.chapter}`;
      const fontSize = Math.max(3.2, 9 / globalScale);
      ctx.font = `${isSelected || isHovered ? 'bold' : 'normal'} ${fontSize}px var(--font-sans)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Label box
      ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(
        node.x - textWidth / 2 - 2, 
        node.y + size * 1.2 + 2, 
        textWidth + 4, 
        fontSize + 2
      );
      
      ctx.fillStyle = isSelected || isHovered ? '#ffffff' : '#e5e7eb';
      ctx.fillText(label, node.x, node.y + size * 1.2 + 2 + fontSize / 2);
    }

    ctx.restore();
  };

  // Render nodes as 3D canvas textures mapped to Three.js Sprites
  const createNodeSprite = (node: any) => {
    const canvas = document.createElement('canvas');
    const scale = 2.0; 
    
    const nodeColor = node.isAnchor 
      ? (THEME_COLORS[node.theme] || '#d4af37')
      : (BOOK_COLORS[node.book] || '#9ca3af');
      
    const degree = nodeDegrees[node.id] || 0;
    const baseRadius = 11.0;
    const size = node.isAnchor ? 30.0 : (baseRadius + Math.sqrt(degree) * 1.35);
    
    const canvasSize = node.isAnchor ? 120 * scale : 60 * scale;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Object3D();
    
    ctx.scale(scale, scale);
    const cx = canvasSize / (2 * scale);
    const cy = canvasSize / (2 * scale);
    
    const isHighlighted = highlightedDetails.nodes.has(node.id);
    const isDimmed = highlightedDetails.hasActiveHighlight && !isHighlighted;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    
    ctx.save();
    
    let alpha = 1.0;
    if (isDimmed) alpha = 0.15;
    ctx.globalAlpha = alpha;
    
    if (node.isAnchor) {
      // 1. Draw Ring / Glow
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = isSelected || isHovered ? 'rgba(255, 255, 255, 0.15)' : `${nodeColor}10`;
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? '#ffffff' : nodeColor;
      ctx.lineWidth = isSelected || isHovered ? 3.0 : 1.5;
      ctx.stroke();
      
      // 2. Draw Thematic Emblem
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#0a0c10';
      ctx.fill();
      ctx.stroke();
      
      // Inner decorative ring
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.75, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      
      // 3. Render Large Theme Label
      const label = node.title || node.id;
      const fontSize = 8.0;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = label.split(' ');
      if (words.length > 2) {
        const line1 = words.slice(0, 2).join(' ');
        const line2 = words.slice(2).join(' ');
        ctx.fillText(line1, cx, cy - fontSize * 0.6);
        ctx.fillText(line2, cx, cy + fontSize * 0.6);
      } else {
        ctx.fillText(label, cx, cy);
      }
    } else {
      // Standard Node
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 1.8, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.15)' : `${nodeColor}22`;
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      
      drawBookIcon(ctx, cx, cy, size, nodeColor, isHighlighted && !isDimmed);
      
      // Label
      const label = `${node.book}.${node.chapter}`;
      const fontSize = 9.0;
      ctx.font = `${isSelected || isHovered ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(
        cx - textWidth / 2 - 2, 
        cy + size * 1.2 + 2, 
        textWidth + 4, 
        fontSize + 2
      );
      
      ctx.fillStyle = isSelected || isHovered ? '#ffffff' : '#e5e7eb';
      ctx.fillText(label, cx, cy + size * 1.2 + 2 + fontSize / 2);
    }
    
    ctx.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthWrite: false
    });
    
    const sprite = new THREE.Sprite(material);
    const worldScale = node.isAnchor ? 38 : 22;
    sprite.scale.set(worldScale, worldScale, 1);
    
    return sprite;
  };

  // Custom Link Drawing / Coloration
  const getLinkColor = (link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isSelected = selectedLink && 
      (typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source) === sourceId &&
      (typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target) === targetId;

    if (isSelected) return '#ffffff';

    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);
    const isDimmed = highlightedDetails.hasActiveHighlight && !isHighlighted;
    
    if (isDimmed) return 'rgba(255, 255, 255, 0.02)';
    
    // Custom style for Anchor gravity links
    if (link.isAnchorLink) {
      if (isHighlighted) return 'rgba(212, 175, 55, 0.25)'; // Faint gold when highlighted
      return 'rgba(255, 255, 255, 0.015)'; // Faint grey gravity lines (almost invisible)
    }

    if (isHighlighted) return 'rgba(212, 175, 55, 0.5)'; // Active Gold Link
    
    // Normal state - map opacity to similarity weight
    const opacity = Math.min(0.25, Math.max(0.04, (link.weight / 100) * 0.25));
    return `rgba(255, 255, 255, ${opacity})`;
  };

  const getLinkWidth = (link: any) => {
    if (link.isAnchorLink) return 0.5; // Thin gravity lines

    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);
    return isHighlighted ? 4.0 : Math.max(1.0, (link.weight / 100) * 3.5);
  };

  // Particles flowing through links to give it a neural pathway look
  const getLinkParticles = (link: any) => {
    if (link.isAnchorLink) return 0; // No particles on gravity links

    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);
    
    // Let particles flow on highlighted/selected path
    return isHighlighted ? 2 : 0;
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
        <aside className={`sidebar glass ${leftPanelCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2><Sliders size={16} /> Filters & Thematic Stories</h2>
          </div>
          
          <div className="sidebar-content scrollable">
            {/* Search Bar */}
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search text, books, themes..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setActiveTakeaway(null); // Clear active story on search
                }}
              />
            </div>

            {/* Book Selector */}
            <div>
              <div className="filter-section-title">
                <span>Filter Books</span>
                <div>
                  <button onClick={selectAllBooks} style={{ marginRight: 8 }}>All</button>
                  <button onClick={clearAllBooks}>None</button>
                </div>
              </div>
              <div className="books-grid">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(b => (
                  <label key={b}>
                    <input 
                      type="checkbox" 
                      className="book-checkbox"
                      checked={selectedBooks.includes(b)}
                      onChange={() => toggleBook(b)}
                    />
                    <span 
                      className="book-label"
                      style={{ 
                        borderColor: selectedBooks.includes(b) ? BOOK_COLORS[b] : 'var(--border-glass)',
                        background: selectedBooks.includes(b) ? `${BOOK_COLORS[b]}15` : 'rgba(0,0,0,0.2)',
                        color: selectedBooks.includes(b) ? BOOK_COLORS[b] : 'var(--text-muted)'
                      }}
                    >
                      {b}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <div className="filter-section-title">
                <span>Stoic Themes</span>
                {selectedConcept && (
                  <button onClick={() => setSelectedConcept(null)}>Clear Theme</button>
                )}
              </div>
              <div className="theme-tag-container">
                {Object.entries(STOIC_CONCEPTS).map(([key, concept]) => {
                  const count = data?.nodes.filter(n => n.concepts?.includes(key)).length || 0;
                  return (
                    <div
                      key={key}
                      className={`theme-pill ${selectedConcept === key ? 'active' : ''}`}
                      style={{ 
                        color: concept.color,
                        borderColor: selectedConcept === key ? concept.color : 'var(--border-glass)',
                        background: selectedConcept === key ? `${concept.color}15` : 'rgba(0,0,0,0.2)'
                      }}
                      onClick={() => {
                        setSelectedConcept(prev => prev === key ? null : key);
                        setActiveTakeaway(null); // Clear active story on theme selection
                        setTourModeActive(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="theme-bullet" style={{ backgroundColor: concept.color }}></span>
                        <span>{concept.label}</span>
                      </div>
                      <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cosine Similarity Slider */}
            <div className="slider-container">
              <div className="slider-header">
                <span>Min Connection Weight</span>
                <span className="serif-title" style={{ fontSize: '0.8rem' }}>{minWeight}</span>
              </div>
              <input 
                type="range" 
                className="weight-slider"
                min="10" 
                max="90" 
                value={minWeight}
                onChange={e => setMinWeight(parseInt(e.target.value))}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: -4 }}>
                Filter out weaker semantic bonds to untangle graph complexity.
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            {/* Thematic Takeaways */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="filter-section-title">
                <span>Stoic Storylines</span>
                {activeTakeaway && (
                  <button onClick={() => setActiveTakeaway(null)}>Clear Story</button>
                )}
              </div>
              
              <div className="takeaway-list">
                {data?.takeaways.map(t => (
                  <div 
                    key={t.id} 
                    className={`takeaway-card ${activeTakeaway?.id === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedNode(null);
                      setSelectedLink(null);
                      
                      if (activeTakeaway?.id === t.id) {
                        setActiveTakeaway(null);
                      } else {
                        setActiveTakeaway(t);
                        setRightPanelCollapsed(false); // Uncollapse sidebar when story is selected
                        
                        // Fit camera to story nodes if refs available
                        if (fgRef.current && t.relatedNodeIds.length > 0) {
                          setTimeout(() => {
                            fgRef.current.zoomToFit(800, 100, (n: any) => t.relatedNodeIds.includes(n.id));
                          }, 50);
                        }
                      }
                    }}
                  >
                    <h3><Sparkles size={13} /> {t.title}</h3>
                    <p>{t.story.slice(0, 140)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER INTERACTIVE GRAPH CONTAINER */}
        <div className="graph-container" ref={containerRef}>
          {data && (
            graphMode === '2d' ? (
              <ForceGraph2D
                ref={fgRef}
                graphData={filteredData}
                width={dimensions.width}
                height={dimensions.height}
                
                // Custom rendering callbacks
                nodeCanvasObject={drawNode}
                
                // Link styling callbacks
                linkColor={getLinkColor}
                linkWidth={getLinkWidth}
                
                // Directional Particles (flows along lines)
                linkDirectionalParticles={getLinkParticles}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={1.8}
                linkDirectionalParticleColor={() => '#d4af37'}
                
                // Interaction bindings
                onNodeClick={handleNodeSelect}
                onNodeHover={setHoveredNode}
                
                onLinkClick={(link) => {
                  setSelectedLink(link);
                  setSelectedNode(null);
                  setRightPanelCollapsed(false); // Uncollapse sidebar when link is selected
                }}
                
                onBackgroundClick={() => {
                  setSelectedNode(null);
                  setSelectedLink(null);
                  setActiveTakeaway(null);
                }}
                
                // Physics settings
                cooldownTicks={120}
                d3VelocityDecay={0.3}
                onEngineStop={handleEngineStop}
              />
            ) : (
              <ForceGraph3D
                ref={fgRef}
                graphData={filteredData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#0a0c10"
                
                // Custom rendering (ThreeJS Sprite)
                nodeThreeObject={createNodeSprite}
                
                // Link styling callbacks
                linkColor={getLinkColor}
                
                // Directional Particles (flows along lines)
                linkDirectionalParticles={getLinkParticles}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={1.2}
                linkDirectionalParticleColor={() => '#d4af37'}
                
                // Interaction bindings
                onNodeClick={handleNodeSelect}
                onNodeHover={(node, prevNode) => {
                  setHoveredNode(node);
                  // Scale up node object on hover in 3D space
                  if (node && node.__threeObj) {
                    const worldScale = node.isAnchor ? 38 : 22;
                    node.__threeObj.scale.set(worldScale * 1.3, worldScale * 1.3, 1);
                  }
                  if (prevNode && prevNode.__threeObj) {
                    const worldScale = prevNode.isAnchor ? 38 : 22;
                    prevNode.__threeObj.scale.set(worldScale, worldScale, 1);
                  }
                }}
                
                onLinkClick={(link) => {
                  setSelectedLink(link);
                  setSelectedNode(null);
                  setRightPanelCollapsed(false);
                }}
                
                onBackgroundClick={() => {
                  setSelectedNode(null);
                  setSelectedLink(null);
                  setActiveTakeaway(null);
                }}
                
                // Physics settings
                cooldownTicks={120}
                onEngineStop={handleEngineStop}
              />
            )
          )}

          {/* Floating Zoom Controls Toolbar */}
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
              onClick={() => {
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
              }} 
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <button 
              className="collapse-btn" 
              onClick={() => {
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
              }} 
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
            <button 
              className="collapse-btn" 
              onClick={resetZoom} 
              title="Recenter & Fit"
            >
              <Maximize2 size={16} />
            </button>
            <button 
              className={`collapse-btn ${graphMode === '3d' ? 'active-mode' : ''}`}
              onClick={() => {
                setGraphMode(prev => prev === '2d' ? '3d' : '2d');
                initialFitDone.current = false;
              }}
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
        <aside className={`sidebar glass ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
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
                    onClick={() => {
                      setTourModeActive(false);
                    }}
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
                    onClick={() => handleTourStepChange(tourCurrentStep - 1)}
                    disabled={tourCurrentStep === 0}
                  >
                    &larr;
                  </button>
                  <span className="tour-step-badge">
                    Passage {tourCurrentStep + 1} of {tourNodes.length}
                  </span>
                  <button 
                    className="tour-btn"
                    onClick={() => handleTourStepChange(tourCurrentStep + 1)}
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
                        Meditations in this Theme ({data?.nodes.filter((n: any) => n.theme === selectedNode.theme && !n.isAnchor).length || 0})
                      </h3>
                      
                      <div className="connections-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {data?.nodes
                          .filter((n: any) => n.theme === selectedNode.theme && !n.isAnchor)
                          .map((n: any) => (
                            <div 
                              key={n.id} 
                              className="connection-item"
                              style={{ padding: '8px 12px', borderLeftColor: THEME_COLORS[selectedNode.theme || ''] }}
                              onClick={() => handleNodeSelect(n)}
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
                                if (neighbor) handleNodeSelect(neighbor);
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
                      if (srcNode) handleNodeSelect(srcNode);
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
                      if (tgtNode) handleNodeSelect(tgtNode);
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
                      setTourCurrentStep(0);
                      if (tourNodes.length > 0) {
                        handleTourStepChange(0);
                      }
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
                              if (node) handleNodeSelect(node);
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
