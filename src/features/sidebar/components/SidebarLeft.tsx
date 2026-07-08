import { Search, Sliders, Sparkles } from 'lucide-react';
import { BOOK_COLORS, STOIC_CONCEPTS } from '../../../constants/stoic';
import type { GraphData, Takeaway } from '../../../types/graph';

interface SidebarLeftProps {
  collapsed: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBooks: number[];
  toggleBook: (bookNum: number) => void;
  selectAllBooks: () => void;
  clearAllBooks: () => void;
  selectedConcept: string | null;
  selectConceptFilter: (concept: string | null) => void;
  mstEnabled: boolean;
  setMstEnabled: (enabled: boolean) => void;
  showThemeAnchors: boolean;
  setShowThemeAnchors: (show: boolean) => void;
  minWeight: number;
  setMinWeight: (weight: number) => void;
  maxConnections: number;
  setMaxConnections: (connections: number) => void;
  activeTakeaway: Takeaway | null;
  onSelectTakeaway: (takeaway: Takeaway | null) => void;
  data: GraphData | null;
}

export const SidebarLeft = ({
  collapsed,
  searchQuery,
  setSearchQuery,
  selectedBooks,
  toggleBook,
  selectAllBooks,
  clearAllBooks,
  selectedConcept,
  selectConceptFilter,
  mstEnabled,
  setMstEnabled,
  showThemeAnchors,
  setShowThemeAnchors,
  minWeight,
  setMinWeight,
  maxConnections,
  setMaxConnections,
  activeTakeaway,
  onSelectTakeaway,
  data
}: SidebarLeftProps) => {
  return (
    <aside className={`sidebar glass ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header left-header">
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
            onChange={e => setSearchQuery(e.target.value)}
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
              <button onClick={() => selectConceptFilter(null)}>Clear Theme</button>
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
                  onClick={() => selectConceptFilter(selectedConcept === key ? null : key)}
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

        {/* Topology Controls */}
        <div className="slider-container" style={{ marginTop: 15 }}>
          <div className="filter-section-title" style={{ marginBottom: 8, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            <span>Graph Topology</span>
          </div>
          
          {/* MST Backbone Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-main)', width: '100%' }}>
              <input 
                type="checkbox"
                checked={mstEnabled}
                onChange={e => setMstEnabled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold' }}>MST Spanning Backbone</span>
            </label>
          </div>

          {/* Show Theme Anchors Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-main)', width: '100%' }}>
              <input 
                type="checkbox"
                checked={showThemeAnchors}
                onChange={e => setShowThemeAnchors(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Show Theme Anchors</span>
            </label>
          </div>

          {/* Cosine Similarity Slider */}
          <div 
            style={{ opacity: mstEnabled ? 0.45 : 1.0, transition: 'opacity 0.2s', marginBottom: 16 }}
            title={mstEnabled ? "This setting is locked while MST Spanning Backbone is active. Click the MST toggle above to unlock." : undefined}
          >
            <div className="slider-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Min Connection Weight</span>
              <span className="serif-title" style={{ fontSize: '0.8rem' }}>
                {minWeight} {mstEnabled && <span style={{ color: 'var(--accent-gold)', fontSize: '0.65rem', fontWeight: 'normal', marginLeft: 4 }}>🔒 Locked</span>}
              </span>
            </div>
            <input 
              type="range" 
              className="weight-slider"
              min="10" 
              max="90" 
              value={minWeight}
              disabled={mstEnabled}
              onChange={e => setMinWeight(parseInt(e.target.value))}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: -4, display: 'block' }}>
              {mstEnabled 
                ? "Locked in MST mode to maintain full connectivity." 
                : "Filter out weaker semantic bonds to untangle graph complexity."
              }
            </span>
          </div>

          {/* KNN Connections Slider */}
          <div 
            style={{ opacity: mstEnabled ? 0.45 : 1.0, transition: 'opacity 0.2s' }}
            title={mstEnabled ? "This setting is locked while MST Spanning Backbone is active. Click the MST toggle above to unlock." : undefined}
          >
            <div className="slider-header" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Max Connections per Node</span>
              <span className="serif-title" style={{ fontSize: '0.8rem' }}>
                {maxConnections === 0 ? 'Unlimited' : maxConnections} {mstEnabled && <span style={{ color: 'var(--accent-gold)', fontSize: '0.65rem', fontWeight: 'normal', marginLeft: 4 }}>🔒 Locked</span>}
              </span>
            </div>
            <input 
              type="range" 
              className="weight-slider"
              min="0" 
              max="6" 
              value={maxConnections}
              disabled={mstEnabled}
              onChange={e => setMaxConnections(parseInt(e.target.value))}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: -4, display: 'block' }}>
              {mstEnabled 
                ? "Locked in MST mode to maintain spanning tree connectivity." 
                : "Limit links per passage to prevent dense hairballs."
              }
            </span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

        {/* Thematic Takeaways */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="filter-section-title">
            <span>Stoic Storylines</span>
            {activeTakeaway && (
              <button onClick={() => onSelectTakeaway(null)}>Clear Story</button>
            )}
          </div>
          
          <div className="takeaway-list">
            {data?.takeaways.map(t => (
              <div 
                key={t.id} 
                className={`takeaway-card ${activeTakeaway?.id === t.id ? 'active' : ''}`}
                onClick={() => onSelectTakeaway(activeTakeaway?.id === t.id ? null : t)}
              >
                <h3><Sparkles size={13} /> {t.title}</h3>
                <p>{t.story.slice(0, 140)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft;
