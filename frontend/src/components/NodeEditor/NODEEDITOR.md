# NodeEditor

**Owner:** Person D (UI + AI)

Panel for adding new nodes to the call graph — manually or via AI description.

## Files to create

- `NodeEditor.tsx` — main panel with toggle between manual / AI mode
- `ConditionForm.tsx` — manual: specify function code, predecessor, successor, conditions
- `AIInsert.tsx` — AI: natural language description of what to insert and where
- `index.ts` — barrel export

## Behavior

- Manual mode: user writes code, picks predecessor/successor from dropdowns, specifies conditions
- AI mode: user describes in plain text → `POST /api/ai/insert` → returns generated code + new graph
- Both modes: show preview of updated graph before confirming
- On confirm: `POST /api/node/add` → graph refreshes → optionally run tests via `POST /api/test/<id>`
