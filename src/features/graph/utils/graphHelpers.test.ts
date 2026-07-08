import { describe, it, expect } from 'vitest';
import { 
  computeKruskalMST, 
  applyKNNFilter, 
  calculateNodeDegrees,
  filterGraphData
} from './graphHelpers';
import type { GraphNode, GraphLink, GraphData } from '../../../types/graph';

describe('Graph Calculations & Helpers', () => {
  // Test Data
  const mockNodes: GraphNode[] = [
    { id: 'A', book: 1, chapter: 1, text: 'Passage A', concepts: ['inner_citadel'] },
    { id: 'B', book: 1, chapter: 2, text: 'Passage B', concepts: ['inner_citadel', 'cosmic_order'] },
    { id: 'C', book: 2, chapter: 1, text: 'Passage C', concepts: ['cosmic_order'] },
    { id: 'D', book: 3, chapter: 1, text: 'Passage D', concepts: [] }
  ];

  const mockLinks: GraphLink[] = [
    { source: 'A', target: 'B', weight: 90, label: 'A-B bond', description: 'desc' },
    { source: 'B', target: 'C', weight: 80, label: 'B-C bond', description: 'desc' },
    { source: 'A', target: 'C', weight: 40, label: 'A-C bond', description: 'desc' },
    { source: 'C', target: 'D', weight: 70, label: 'C-D bond', description: 'desc' }
  ];

  const mockGraphData: GraphData = {
    nodes: mockNodes,
    links: mockLinks,
    takeaways: []
  };

  describe('computeKruskalMST', () => {
    it('should generate a Maximum Spanning Tree containing the highest weight links without cycles', () => {
      // For nodes A, B, C connected in a triangle:
      // A-B (90) - highest
      // B-C (80) - second
      // A-C (40) - lowest (would create a cycle)
      // Plus C-D (70) which connects D to the tree
      const candidateLinks = [...mockLinks];
      const mst = computeKruskalMST(candidateLinks);

      // Total links in MST for N nodes must be N-1 (4 nodes -> 3 links)
      expect(mst.length).toBe(3);

      // Should include A-B, B-C, C-D (highest weights)
      const mstKeys = mst.map(link => `${link.source}-${link.target}`);
      expect(mstKeys).toContain('A-B');
      expect(mstKeys).toContain('B-C');
      expect(mstKeys).toContain('C-D');
      
      // Should NOT include A-C since it creates a cycle and has lower weight than A-B and B-C
      expect(mstKeys).not.toContain('A-C');
    });
  });

  describe('applyKNNFilter', () => {
    it('should cap the maximum number of connections per node based on link weights', () => {
      // Connections limit: 1
      // Node A is connected to B (90) and C (40)
      // Node B is connected to A (90) and C (80)
      // Node C is connected to B (80), A (40), and D (70)
      // Node D is connected to C (70)
      const filtered = applyKNNFilter(mockLinks, 1);

      // The highest weights are:
      // 1. A-B (90) -> A gets 1 link, B gets 1 link.
      // 2. B-C (80) -> B already has 1 link, so B-C is rejected because B is capped!
      // 3. C-D (70) -> C gets 1 link, D gets 1 link.
      // 4. A-C (40) -> A already has 1 link, C already has 1 link, so rejected.
      // Expected links remaining: A-B and C-D.
      
      expect(filtered.length).toBe(2);
      const keys = filtered.map(l => `${l.source}-${l.target}`);
      expect(keys).toContain('A-B');
      expect(keys).toContain('C-D');
      expect(keys).not.toContain('B-C');
    });

    it('should do nothing if maxConnections is 0 (unlimited)', () => {
      const filtered = applyKNNFilter(mockLinks, 0);
      expect(filtered.length).toBe(mockLinks.length);
    });
  });

  describe('calculateNodeDegrees', () => {
    it('should return correct degrees for all nodes', () => {
      const degrees = calculateNodeDegrees(mockGraphData);
      expect(degrees['A']).toBe(2); // connected to B, C
      expect(degrees['B']).toBe(2); // connected to A, C
      expect(degrees['C']).toBe(3); // connected to B, A, D
      expect(degrees['D']).toBe(1); // connected to C
    });
  });

  describe('filterGraphData', () => {
    it('should filter nodes by book selection', () => {
      const result = filterGraphData(mockGraphData, {
        selectedBooks: [1, 2], // exclude book 3 (Node D)
        selectedConcept: null,
        searchQuery: '',
        showThemeAnchors: false,
        activeTakeaway: null,
        mstEnabled: false,
        minWeight: 10,
        maxConnections: 0
      });

      const nodeIds = result.nodes.map(n => n.id);
      expect(nodeIds).toContain('A');
      expect(nodeIds).toContain('B');
      expect(nodeIds).toContain('C');
      expect(nodeIds).not.toContain('D'); // D is book 3

      // Links connecting to D should be discarded
      const linkKeys = result.links.map(l => `${l.source}-${l.target}`);
      expect(linkKeys).toContain('A-B');
      expect(linkKeys).toContain('B-C');
      expect(linkKeys).toContain('A-C');
      expect(linkKeys).not.toContain('C-D');
    });

    it('should filter nodes by search query matching passage text or book chapter', () => {
      const resultText = filterGraphData(mockGraphData, {
        selectedBooks: [1, 2, 3],
        selectedConcept: null,
        searchQuery: 'Passage B',
        showThemeAnchors: false,
        activeTakeaway: null,
        mstEnabled: false,
        minWeight: 10,
        maxConnections: 0
      });

      expect(resultText.nodes.length).toBe(1);
      expect(resultText.nodes[0].id).toBe('B');

      const resultChapter = filterGraphData(mockGraphData, {
        selectedBooks: [1, 2, 3],
        selectedConcept: null,
        searchQuery: '2.1', // Book 2 Chapter 1
        showThemeAnchors: false,
        activeTakeaway: null,
        mstEnabled: false,
        minWeight: 10,
        maxConnections: 0
      });

      expect(resultChapter.nodes.length).toBe(1);
      expect(resultChapter.nodes[0].id).toBe('C');
    });

    it('should filter by concept matching tags', () => {
      const result = filterGraphData(mockGraphData, {
        selectedBooks: [1, 2, 3],
        selectedConcept: 'cosmic_order',
        searchQuery: '',
        showThemeAnchors: false,
        activeTakeaway: null,
        mstEnabled: false,
        minWeight: 10,
        maxConnections: 0
      });

      const nodeIds = result.nodes.map(n => n.id);
      // Only B and C have 'cosmic_order'
      expect(nodeIds).toContain('B');
      expect(nodeIds).toContain('C');
      expect(nodeIds).not.toContain('A');
      expect(nodeIds).not.toContain('D');
    });
  });
});
