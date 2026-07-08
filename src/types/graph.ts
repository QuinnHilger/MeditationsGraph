export interface GraphNode {
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

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  weight: number;
  description: string;
  index?: number;
  isAnchorLink?: boolean;
}

export interface Takeaway {
  id: string;
  title: string;
  story: string;
  relatedNodeIds: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  takeaways: Takeaway[];
}
