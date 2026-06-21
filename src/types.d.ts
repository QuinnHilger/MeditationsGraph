declare module 'react-force-graph-2d' {
  import { Component, ComponentType } from 'react';

  export interface ForceGraphProps {
    graphData: {
      nodes: any[];
      links: any[];
    };
    width?: number;
    height?: number;
    backgroundColor?: string;
    showNavInfo?: boolean;
    nodeRelSize?: number;
    nodeId?: string;
    nodeVal?: number | string | ((node: any) => number);
    nodeLabel?: string | ((node: any) => string);
    nodeColor?: string | ((node: any) => string);
    nodeAutoColorBy?: string | ((node: any) => any);
    nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    nodeCanvasObjectMode?: string | ((node: any) => string);
    
    linkSource?: string;
    linkTarget?: string;
    linkLabel?: string | ((link: any) => string);
    linkHoverPrecision?: number;
    linkColor?: string | ((link: any) => string);
    linkAutoColorBy?: string | ((link: any) => any);
    linkWidth?: number | string | ((link: any) => number);
    linkCurvature?: number | string | ((link: any) => number);
    
    linkDirectionalParticles?: number | string | ((link: any) => number);
    linkDirectionalParticleSpeed?: number | string | ((link: any) => number);
    linkDirectionalParticleWidth?: number | string | ((link: any) => number);
    linkDirectionalParticleColor?: string | ((link: any) => string);
    
    linkDirectionalArrowLength?: number | string | ((link: any) => number);
    linkDirectionalArrowColor?: string | ((link: any) => string);
    linkDirectionalArrowRelPos?: number;
    
    onNodeClick?: (node: any, event: MouseEvent) => void;
    onNodeHover?: (node: any | null, prevNode: any | null) => void;
    onNodeDrag?: (node: any, translate: { x: number; y: number }) => void;
    onNodeDragEnd?: (node: any, translate: { x: number; y: number }) => void;
    onLinkClick?: (link: any, event: MouseEvent) => void;
    onLinkHover?: (link: any | null, prevLink: any | null) => void;
    onBackgroundClick?: (event: MouseEvent) => void;
    onZoom?: (transform: { k: number; x: number; y: number }) => void;
    onZoomEnd?: (transform: { k: number; x: number; y: number }) => void;
    
    cooldownTicks?: number;
    cooldownTime?: number;
    onEngineTick?: () => void;
    onEngineStop?: () => void;
    
    enableNodeDrag?: boolean;
    enableNavigationControls?: boolean;
    enableZoomPanInteraction?: boolean;
    
    d3AlphaMin?: number;
    d3AlphaDecay?: number;
    d3VelocityDecay?: number;
    
    warmupTicks?: number;
  }

  const ForceGraph2D: ComponentType<ForceGraphProps & { ref?: any }>;
  export default ForceGraph2D;
}
