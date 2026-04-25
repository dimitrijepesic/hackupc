# ImportDialog

**Owner:** Person D (UI + AI)

Modal for importing a codebase — either from GitHub URL or local file upload.

## Files to create

- `ImportDialog.tsx` — modal wrapper with tab toggle between GitHub / Local
- `GitHubImport.tsx` — URL input + clone button
- `LocalImport.tsx` — drag-and-drop / file picker for local folders
- `index.ts` — barrel export

## Behavior

- GitHub: user pastes repo URL → `POST /api/import { github_url }` → receives `project_id` → navigate to project page
- Local: user uploads files → `POST /api/import` as multipart form data → same flow
- Show loading state during clone/parse, error state on failure
