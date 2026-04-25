# Types

TypeScript interfaces mirroring the backend models. This is the frontend half of the shared contract.

## Files to create

- `api.ts` — `GraphNode`, `GraphEdge`, `CallGraph`, API request/response types

## Rules

- Must stay in sync with `backend/app/models/graph.py` and `shared/api_contract.md`
- Coordinate changes with the team — these types are imported everywhere on the frontend
