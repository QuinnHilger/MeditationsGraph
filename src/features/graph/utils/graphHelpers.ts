import type { GraphNode, GraphLink, Takeaway, GraphData } from '../../../types/graph';
import { BOOK_NAMES } from '../../../constants/stoic';

/**
 * Kruskal's algorithm to compute the Maximum Spanning Tree (MST) for the given candidates.
 */
export const computeKruskalMST = (candidateLinks: GraphLink[]): GraphLink[] => {
  const sortedCandidateLinks = [...candidateLinks].sort((a, b) => b.weight - a.weight);
  
  const parent: Record<string, string> = {};
  const find = (id: string): string => {
    if (parent[id] === undefined) {
      parent[id] = id;
    }
    if (parent[id] === id) return id;
    return parent[id] = find(parent[id]); // Path compression
  };
  
  const union = (id1: string, id2: string): boolean => {
    const r1 = find(id1);
    const r2 = find(id2);
    if (r1 !== r2) {
      parent[r1] = r2;
      return true;
    }
    return false;
  };

  const mst: GraphLink[] = [];
  for (const link of sortedCandidateLinks) {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    if (union(sourceId, targetId)) {
      mst.push(link);
    }
  }
  return mst;
};

/**
 * Apply local K-Nearest Neighbors connection counts to restrict link density.
 */
export const applyKNNFilter = (links: GraphLink[], maxConnections: number): GraphLink[] => {
  if (maxConnections <= 0) return links;

  const sortedActiveLinks = [...links].sort((a, b) => b.weight - a.weight);
  const nodeLinkCount: Record<string, number> = {};
  
  return sortedActiveLinks.filter(link => {
    // Gravity links to anchors are always preserved to keep visual clusters cohesive
    if (link.isAnchorLink) return true;

    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;

    if ((nodeLinkCount[sourceId] || 0) < maxConnections && (nodeLinkCount[targetId] || 0) < maxConnections) {
      nodeLinkCount[sourceId] = (nodeLinkCount[sourceId] || 0) + 1;
      nodeLinkCount[targetId] = (nodeLinkCount[targetId] || 0) + 1;
      return true;
    }
    return false;
  });
};

export interface FilterParams {
  selectedBooks: number[];
  selectedConcept: string | null;
  searchQuery: string;
  showThemeAnchors: boolean;
  activeTakeaway: Takeaway | null;
  mstEnabled: boolean;
  minWeight: number;
  maxConnections: number;
}

/**
 * Filter nodes and links based on user criteria.
 */
export const filterGraphData = (
  data: GraphData | null,
  params: FilterParams
): { nodes: GraphNode[]; links: GraphLink[] } => {
  if (!data) return { nodes: [], links: [] };

  const {
    selectedBooks,
    selectedConcept,
    searchQuery,
    showThemeAnchors,
    activeTakeaway,
    mstEnabled,
    minWeight,
    maxConnections
  } = params;

  // 1. Filter Nodes
  const matchedNodes = data.nodes.filter(node => {
    // Always include thematic anchor nodes (book: 0) if toggle is enabled
    if (node.isAnchor) return showThemeAnchors;

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

  // 2. Filter Candidate Links (must connect two visible nodes)
  const candidateLinks = data.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;

    // Link must connect two visible nodes
    if (!matchedNodeIds.has(sourceId) || !matchedNodeIds.has(targetId)) return false;

    // If a takeaway is active, only show connections inside that takeaway's node set
    if (activeTakeaway) {
      return activeTakeaway.relatedNodeIds.includes(sourceId) && activeTakeaway.relatedNodeIds.includes(targetId);
    }

    return true;
  });

  let activeLinks: GraphLink[];

  // 3. Process topology constraints (MST or Min Weight + KNN)
  if (mstEnabled) {
    activeLinks = computeKruskalMST(candidateLinks);
  } else {
    // Filter base candidate links by minimum weight threshold
    activeLinks = candidateLinks.filter(link => link.weight >= minWeight);

    // Apply K-Nearest Neighbors (KNN) local connections limit if active
    if (maxConnections > 0) {
      activeLinks = applyKNNFilter(activeLinks, maxConnections);
    }
  }

  return {
    nodes: matchedNodes,
    links: activeLinks
  };
};

/**
 * Calculate the connections/neighbor list for a specific selected node.
 */
export const getNodeConnections = (
  node: GraphNode | null,
  data: GraphData | null,
  minWeight: number
) => {
  if (!node || !data) return [];
  
  return data.links
    .filter(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      return (sourceId === node.id || targetId === node.id) && link.weight >= minWeight;
    })
    .map(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      const neighborId = sourceId === node.id ? targetId : sourceId;
      const neighborText = data.nodes.find(n => n.id === neighborId)?.text || '';
      
      return {
        ...link,
        neighborId,
        neighborText,
        isOutgoing: sourceId === node.id
      };
    })
    .sort((a, b) => b.weight - a.weight);
};

/**
 * Calculate full dataset node degrees to size nodes properly.
 */
export const calculateNodeDegrees = (data: GraphData | null): Record<string, number> => {
  if (!data) return {};
  const degrees: Record<string, number> = {};
  data.links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    degrees[sourceId] = (degrees[sourceId] || 0) + 1;
    degrees[targetId] = (degrees[targetId] || 0) + 1;
  });
  return degrees;
};
