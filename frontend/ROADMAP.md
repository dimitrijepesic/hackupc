# Frontend Roadmap

Ideas for surfacing more of the data already produced by the AST parser. The graph contract (`backend/app/models/graph.py`) gives us `in_degree`, `out_degree`, `category`, `container`, `signature`, `params`, `return_type`, `line`/`line_end` — most of which the UI doesn't fully exploit yet.

## Ideas

1. **Dead-code / entry / leaf classification** — `in_degree:0` on non-test nodes (e.g. `Cat.speak`) flags unreachable code; `out_degree:0` is a leaf. Color or filter the canvas by these states.
2. **Test coverage overlay** — transitive closure from `category:'test'` nodes → mark each source node "covered by N tests" with a badge.
3. **Class / struct hierarchy panel** — group sidebar entries by `container` (Animal → Dog → GuideDog, Shelter, AdoptionError) to show OOP shape at a glance.
4. **Inheritance edges** — `override` in `signature` implies a parent with the same `name`; draw dashed inheritance edges (e.g. Dog.speak → Animal.speak).
5. **Cycle / SCC detection** — beyond the self-loops and mutual-recursion pairs we already mark, run Tarjan's to surface longer cycles (A → B → C → A).
6. **Throws propagation** — flag `throws`/`rethrows` in signatures; color outgoing edges red where the caller doesn't `try`. Useful smell detector.
7. **Functions outline view** — current file tree maps one file → one node. Replace with a grouped `file → [functions]` outline so every function is clickable, like a VS Code outline.
8. **Hubs ranking sidebar** — "Top callers / Top callees" lists sorted by `in_degree` / `out_degree`.
9. **Call depth from entry** — BFS distance from each test root (or `main`-like entry) shown as a small badge per node.
10. **Edge weight visualization** — when the parser emits real call counts via `weight`, render edge thickness proportional to it.
11. **Stats header strip** — across the top of the canvas: `N nodes · M edges · K tests · S self-loops · R mutual-rec pairs`.
12. **Search / filter bar** — filter the canvas by container, category, or tag (`throws`, `private`, `override`, `static`, etc.).
13. **Full-file view toggle** — render the entire source file with the active function highlighted, not just the sliced body.
