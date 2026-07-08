import { useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { forceX, forceY } from 'd3-force';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { drawBookIcon } from '../utils/drawing';
import { BOOK_COLORS, THEME_COLORS } from '../../../constants/stoic';
import type { GraphNode, GraphLink } from '../../../types/graph';

interface ForceGraphWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fgRef: React.MutableRefObject<any>;
  graphMode: '2d' | '3d';
  filteredData: { nodes: GraphNode[]; links: GraphLink[] };
  dimensions: { width: number; height: number };
  selectedNode: GraphNode | null;
  selectedLink: GraphLink | null;
  hoveredNode: GraphNode | null;
  setHoveredNode: (node: GraphNode | null) => void;
  highlightedDetails: {
    nodes: Set<string>;
    links: Set<string>;
    hasActiveHighlight: boolean;
  };
  nodeDegrees: Record<string, number>;
  onNodeSelect: (node: GraphNode) => void;
  onLinkSelect: (link: GraphLink) => void;
  onBackgroundClick: () => void;
  onEngineStop: () => void;
  rawGraphDataLoaded: boolean; // to indicate data is loaded
}

export const ForceGraphWrapper = ({
  fgRef,
  graphMode,
  filteredData,
  dimensions,
  selectedNode,
  selectedLink,
  hoveredNode,
  setHoveredNode,
  highlightedDetails,
  nodeDegrees,
  onNodeSelect,
  onLinkSelect,
  onBackgroundClick,
  onEngineStop,
  rawGraphDataLoaded
}: ForceGraphWrapperProps) => {

  // Configure D3 simulation forces to prevent overlap and increase node spacing
  useEffect(() => {
    if (!fgRef.current || !rawGraphDataLoaded) return;

    // Use a small timeout to ensure the D3 force layout is fully initialized by the library before we interact with it
    const timer = setTimeout(() => {
      if (!fgRef.current) return;
      
      try {
        const chargeForce = fgRef.current.d3Force('charge');
        const linkForce = fgRef.current.d3Force('link');
        
        if (graphMode === '2d') {
          if (chargeForce) chargeForce.strength(-260);
          if (linkForce) linkForce.distance(110);
          fgRef.current.d3Force('x', forceX(dimensions.width / 2).strength(0.08));
          fgRef.current.d3Force('y', forceY(dimensions.height / 2).strength(0.08));
          fgRef.current.d3ReheatSimulation();
        } else {
          if (chargeForce) chargeForce.strength(-180);
          if (linkForce) linkForce.distance(90);
          fgRef.current.d3ReheatSimulation();
        }
      } catch (err) {
        console.warn("Could not configure D3 forces yet (layout initialization pending):", err);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [rawGraphDataLoaded, filteredData, dimensions, graphMode, fgRef]);

  // Custom Node Drawing on Canvas (Open Book Icons)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      ctx.fillStyle = '#0a0c10'; // Dark card background style
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
      ctx.font = `bold ${fontSize}px serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = label.split(' ');
      if (words.length > 2) {
        const line1 = words.slice(0, 2).join(' ');
        const line2 = words.slice(2).join(' ');
        ctx.fillText(line1, node.x, node.y - fontSize * 0.75);
        ctx.fillText(line2, node.x, node.y + fontSize * 0.75);
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
      ctx.font = `${isSelected || isHovered ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createNodeSprite = (node: any) => {
    try {
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
          ctx.fillText(line1, cx, cy - fontSize * 0.75);
          ctx.fillText(line2, cx, cy + fontSize * 0.75);
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
    } catch (err) {
      console.error("Error creating node sprite for node:", node.id, err);
      // Fallback to basic Mesh so the simulation continues running safely
      const fallbackColor = node.isAnchor 
        ? (THEME_COLORS[node.theme] || '#d4af37')
        : (BOOK_COLORS[node.book] || '#9ca3af');
      const geometry = new THREE.SphereGeometry(node.isAnchor ? 12 : 6, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: fallbackColor });
      return new THREE.Mesh(geometry, material);
    }
  };

  // Custom Link Drawing / Coloration
  const getLinkColor = (link: GraphLink) => {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    
    const isSelected = selectedLink && 
      (typeof selectedLink.source === 'object' ? (selectedLink.source as GraphNode).id : selectedLink.source) === sourceId &&
      (typeof selectedLink.target === 'object' ? (selectedLink.target as GraphNode).id : selectedLink.target) === targetId;

    if (isSelected) return '#ffffff';

    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);
    const isDimmed = highlightedDetails.hasActiveHighlight && !isHighlighted;
    
    if (isDimmed) return 'rgba(255, 255, 255, 0.02)';
    
    // Custom style for Anchor gravity links
    if (link.isAnchorLink) {
      let themeId = null;
      if (targetId && targetId.startsWith('theme_')) {
        themeId = targetId.replace('theme_', '').toUpperCase();
      } else if (sourceId && sourceId.startsWith('theme_')) {
        themeId = sourceId.replace('theme_', '').toUpperCase();
      }
      
      const themeColor = (themeId && THEME_COLORS[themeId]) ? THEME_COLORS[themeId] : '#d4af37';
      
      if (isHighlighted) return `${themeColor}cc`; // Opaque theme color when highlighted
      return `${themeColor}26`; // Faint theme color
    }

    if (isHighlighted) return 'rgba(212, 175, 55, 0.5)'; // Active Gold Link
    
    // Normal state - map opacity to similarity weight
    const opacity = Math.min(0.25, Math.max(0.04, (link.weight / 100) * 0.25));
    return `rgba(255, 255, 255, ${opacity})`;
  };

  const getLinkWidth = (link: GraphLink) => {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    
    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);

    if (link.isAnchorLink) {
      return isHighlighted ? 2.5 : 0.8;
    }

    return isHighlighted ? 4.0 : Math.max(1.0, (link.weight / 100) * 3.5);
  };

  // Particles flowing through links to give it a neural pathway look
  const getLinkParticles = (link: GraphLink) => {
    if (link.isAnchorLink) return 0; // No particles on gravity links

    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    
    const isHighlighted = highlightedDetails.links.has(`${sourceId}-${targetId}`) || highlightedDetails.links.has(`${targetId}-${sourceId}`);
    
    return isHighlighted ? 2 : 0;
  };

  // Trigger camera refresh on selections
  useEffect(() => {
    if (fgRef.current && graphMode === '3d') {
      fgRef.current.refresh();
    }
  }, [selectedNode, hoveredNode, highlightedDetails.hasActiveHighlight, graphMode, fgRef]);

  if (graphMode === '2d') {
    return (
      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        width={dimensions.width}
        height={dimensions.height}
        
        nodeCanvasObject={drawNode}
        
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={1.8}
        linkDirectionalParticleColor={() => '#d4af37'}
        
        onNodeClick={onNodeSelect}
        onNodeHover={setHoveredNode}
        
        onLinkClick={onLinkSelect}
        onBackgroundClick={onBackgroundClick}
        
        cooldownTicks={120}
        d3VelocityDecay={0.3}
        onEngineStop={onEngineStop}
      />
    );
  }

  return (
    <ErrorBoundary>
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#0a0c10"
        
        nodeThreeObject={createNodeSprite}
        
        linkColor={getLinkColor}
        
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalParticleColor={() => '#d4af37'}
        
        onNodeClick={onNodeSelect}
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
        
        onLinkClick={onLinkSelect}
        onBackgroundClick={onBackgroundClick}
        
        cooldownTicks={120}
        onEngineStop={onEngineStop}
      />
    </ErrorBoundary>
  );
};

export default ForceGraphWrapper;
