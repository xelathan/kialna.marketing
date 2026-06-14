# Graph Report - kialna.shop  (2026-05-24)

## Corpus Check
- 22 files · ~7,794 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 110 nodes · 136 edges · 15 communities (8 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `getCurrentUser()` - 14 edges
3. `scripts` - 5 edges
4. `getFees()` - 5 edges
5. `Theme: Modern Premium Marketplace (Clean, Accessible, Mobile-First)` - 5 edges
6. `Home()` - 4 edges
7. `getSellerProducts()` - 4 edges
8. `getSellerOrders()` - 4 edges
9. `Component Styles` - 4 edges
10. `NewProductPage()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/app/page.tsx → src/lib/session.ts
- `Home()` --calls--> `getSellerProducts()`  [EXTRACTED]
  src/app/page.tsx → src/app/actions/products.ts
- `Home()` --calls--> `getSellerOrders()`  [EXTRACTED]
  src/app/page.tsx → src/app/actions/products.ts
- `NewProductPage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/app/seller/products/new/page.tsx → src/lib/session.ts
- `NewProductPage()` --calls--> `getFees()`  [EXTRACTED]
  src/app/seller/products/new/page.tsx → src/app/actions/products.ts

## Communities (15 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (14): createProduct(), deleteProduct(), getFees(), getSellerOrders(), getSellerProducts(), toggleProductStatus(), updateProduct(), Home() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (14): dependencies, lucide-react, next, @prisma/client, react, react-dom, name, private (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.20
Nodes (8): Buttons, Cards & Surfaces, Color Palette and Roles, Component Styles, Form Inputs (Critical for Sellers), Theme: Modern Premium Marketplace (Clean, Accessible, Mobile-First), Typography Rules, Visual Theme and Atmosphere

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **61 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._