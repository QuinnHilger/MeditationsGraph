# Project Context: Marcus Aurelius Meditations Graph

An interactive 2D/3D neural network-style visualization mapping all 437 passages of Marcus Aurelius's *Meditations* (George Long translation). Passages are linked using dense semantic vector embeddings (computed locally via `all-MiniLM-L6-v2`) and refined using an AI reasoning model.

## Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Graph Engines**: `react-force-graph-2d`, `react-force-graph-3d`, `three`, `d3-force`
- **Styling**: Vanilla CSS with custom properties (CSS variables), glassmorphism, responsive panels, and glowing background decorations
- **Icons**: `lucide-react`
- **Tests**: `vitest`

## Repository Structure

```
MeditationsGraph/
├── public/
│   └── data/
│       └── graph_data.json      # Precompiled passages, semantic links, and takeaways
├── scripts/
│   ├── prepare_data.py          # Parsed Gutenberg book text parser
│   └── analyze_graph_neural.py  # Local MiniLM vector embeddings generator
├── src/
│   ├── assets/                  # Hero and react logos
│   ├── components/              # Shared cross-cutting components (ErrorBoundary)
│   ├── constants/               # BOOK_COLORS, STOIC_CONCEPTS, and book names
│   │   └── stoic.ts
│   ├── features/                # Domain-driven features
│   │   ├── graph/               # Graph rendering, calculations, and toolbars
│   │   │   ├── components/      # ForceGraphWrapper, GraphToolbar
│   │   │   └── utils/           # drawing.ts (Canvas icons), graphHelpers.ts (MST, KNN)
│   │   └── sidebar/             # Sidebar control panels
│   │       └── components/      # SidebarLeft, SidebarRight
│   ├── types/                   # TypeScript interfaces
│   │   └── graph.ts
│   ├── App.tsx                  # Coordinate center layout (manages state and composition)
│   ├── index.css                # Global design system & theme variables
│   ├── App.css                  # Sidebar animations & viewport layout
│   └── main.tsx                 # Web entrypoint
├── package.json
└── vite.config.ts
```

## Key Commands

- **Development Server**: `npm run dev`
- **Build Production Bundle**: `npm run build`
- **Linter**: `npm run lint`
- **Test Suite**: `npm run test`

## Architecture & Code Guidelines

1. **Modular Components**: Avoid giant single-file layouts. Separate view elements from analytical calculations (such as graph topologies, canvas drawing, etc.) which go into utility helpers under `features/`.
2. **State Management**: Keep filter, selection, and timeline state in `App.tsx` as the single source of truth, passing parameters down. This ensures sidebars and WebGL graphics remain fully synchronized.
3. **Styling Standards**:
   - Use CSS variables defined in `src/index.css`.
   - Avoid inline styles where possible.
   - Maintain the premium, dark-mode glassmorphic theme.
4. **Graph Performance**:
   - Limit charge/link simulation heating to prevent browser freezes.
   - Use custom Three.js `CanvasTexture` sprites for 3D node optimizations.
   - Restrict links using Kruskal's MST Backbone or KNN bounds to avoid visual hairballs.

## Database Style Rules

If database backends (e.g. Supabase) are introduced in future iterations:
1. **Up scripts**: One-time DDL changes (e.g., table creation) must be written in SQL and saved to `supabase/scripts/up/` as numbered scripts (e.g., `1.create-exercise-table.sql`).
2. **Sprocs**: Stored procedures/functions must be stored in `supabase/sprocs/` as `Drop {name} If Exists` followed by `Create {name}v{n}` definitions.
