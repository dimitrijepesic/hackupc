# API Contract

This is the source of truth for frontend-backend communication. Both sides must match these shapes. If you need to change something here, coordinate with the team.

---

## Data Models

### GraphNode

```json
{
  "id": "src/Utils.swift:parseData:42",
  "name": "parseData",
  "file": "src/Utils.swift",
  "line_start": 42,
  "line_end": 68,
  "language": "swift",
  "code": "func parseData(raw: String) -> Data {\n    ..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique — format: `file:function_name:line_start` |
| `name` | string | Function/method name |
| `file` | string | Relative path from project root |
| `line_start` | int | First line of function |
| `line_end` | int | Last line of function |
| `language` | string | `"python"`, `"javascript"`, `"typescript"`, `"java"`, `"go"`, `"swift"` |
| `code` | string | Full source code of the function |

### GraphEdge

```json
{
  "id": "edge_001",
  "source": "src/Main.swift:process:10",
  "target": "src/Utils.swift:parseData:42",
  "condition": "if data.isValid()",
  "condition_type": "if"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique edge identifier |
| `source` | string | Source node ID (caller) |
| `target` | string | Target node ID (callee) |
| `condition` | string \| null | Human-readable condition text, null if unconditional |
| `condition_type` | string | One of: `"if"`, `"elif"`, `"else"`, `"for"`, `"while"`, `"try"`, `"except"`, `"unconditional"` |

### CallGraph

```json
{
  "project_id": "abc123",
  "nodes": [ ... ],
  "edges": [ ... ],
  "files": ["src/Main.swift", "src/Utils.swift"],
  "languages": ["swift"]
}
```

---

## Endpoints

### Import

**`POST /api/import`**

Import a repo from GitHub or upload local files.

Request (GitHub):
```json
{ "github_url": "https://github.com/user/repo" }
```

Request (Local upload): `multipart/form-data` with files attached.

Response:
```json
{ "project_id": "abc123" }
```

---

### Graph

**`GET /api/graph/<project_id>`**

Get the full call graph for a parsed project.

Response:
```json
{
  "project_id": "abc123",
  "nodes": [ GraphNode, ... ],
  "edges": [ GraphEdge, ... ],
  "files": ["src/Main.swift", "src/Utils.swift"],
  "languages": ["swift"]
}
```

---

### Nodes

**`GET /api/node/<node_id>`**

Get a single node's full details.

Response: `GraphNode`

---

**`GET /api/node/<node_id>/adjacent`**

Get all nodes directly connected to this node (1 hop) and their connecting edges. Used for prefetching/caching.

Response:
```json
{
  "nodes": [ GraphNode, ... ],
  "edges": [ GraphEdge, ... ]
}
```

---

### AI

**`POST /api/ai/summarize`**

Generate an AI summary for a function, given its context.

Request:
```json
{
  "node_id": "src/Main.swift:process:10",
  "code": "func process(data: Data) { ... }",
  "adjacent_context": [
    { "name": "parseData", "code": "func parseData(raw: String) -> Data { ... }", "relation": "callee" },
    { "name": "main", "code": "func main() { ... }", "relation": "caller" }
  ]
}
```

Response:
```json
{
  "summary": "Processes incoming data by validating it and dispatching to parseData. Called from main as the primary entry point for data handling."
}
```

---

**`POST /api/ai/insert`**

Ask AI to generate a new function and its connections based on a natural language description.

Request:
```json
{
  "project_id": "abc123",
  "description": "Add a caching layer between process() and parseData() that stores results by input hash",
  "target_location": {
    "after_node": "src/Main.swift:process:10",
    "before_node": "src/Utils.swift:parseData:42"
  }
}
```

Response:
```json
{
  "new_node": GraphNode,
  "new_edges": [ GraphEdge, ... ],
  "removed_edges": ["edge_001"],
  "generated_code": "func cacheLookup(data: Data) -> Data {\n    ...",
  "updated_graph": CallGraph
}
```

---

### Manual Node Addition

**`POST /api/node/add`**

Manually add a node with specified connections.

Request:
```json
{
  "project_id": "abc123",
  "node": {
    "name": "validateInput",
    "file": "src/Validators.swift",
    "code": "func validateInput(data: Data) -> Bool {\n    return data != nil\n}",
    "language": "swift"
  },
  "edges": [
    { "source": "src/Main.swift:process:10", "target": "NEW", "condition": "if rawInput", "condition_type": "if" },
    { "source": "NEW", "target": "src/Utils.swift:parseData:42", "condition": null, "condition_type": "unconditional" }
  ]
}
```

Response: Updated `CallGraph`

---

### Test Runner

**`POST /api/test/<project_id>`**

Run the imported project's existing test suite.

Response:
```json
{
  "passed": 12,
  "failed": 1,
  "errors": 0,
  "output": "===== 12 passed, 1 failed in 2.34s ====="
}
```

---

## Error Format

All errors return:
```json
{
  "error": "Short description of what went wrong",
  "detail": "Optional longer explanation"
}
```

With appropriate HTTP status codes (400, 404, 500).
