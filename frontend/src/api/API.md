# API Layer

**Owner:** Person D (UI + AI)

Typed fetch wrappers for all backend endpoints. All components call these instead of raw fetch.

## Files to create

- `client.ts` — base fetch wrapper (base URL, error handling, JSON parsing)
- `graphApi.ts` — `getGraph(projectId)` → `CallGraph`
- `nodeApi.ts` — `getNode(id)`, `getAdjacentNodes(id)` → node data
- `importApi.ts` — `importFromGitHub(url)`, `importLocal(files)` → `{ project_id }`
- `aiApi.ts` — `summarizeNode(...)`, `aiInsertNode(...)` → AI responses

## Rules

- Base URL: `http://localhost:5000/api`
- All functions return typed promises matching `frontend/src/types/api.ts`
- Use these with TanStack Query in hooks/components for caching
