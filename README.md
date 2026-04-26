# Synapsis

Interactive call-graph explorer for unfamiliar codebases. Drop in a repo (Swift, Python, JavaScript/TypeScript), map every function and every call, then click any node to read the source, ask the AI what it does, or predict what breaks if you change it. Built to shorten the "first day on a new repo" ramp.

## How It Works

1. **Import** a codebase from GitHub or upload an archive
2. **tree-sitter** parses the source via a pluggable language registry — Swift, Python, JavaScript/TypeScript today; new languages drop in as adapters
3. **Call graph** is built from the parsed IR — nodes are functions, edges are calls
4. **Interactive visualization** — explore the graph, click nodes to see source code and neighbors
5. **AI summaries** — Groq (Llama 3.3 70B) explains individual functions, summarizes the codebase, narrates impact predictions; prompts adapt to the repo's language
6. **Deterministic queries** — predict impact, find hotspots and dead code with zero LLM calls

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 8 + JavaScript |
| Graph viz | Custom SVG canvas + dagre layout |
| Frontend state | Zustand |
| Backend | FastAPI (Python 3.12) |
| AST parsing | tree-sitter (Swift, Python, JavaScript/TypeScript; multi-language pluggable) |
| LLM | Groq (Llama 3.3 70B) via OpenAI-compatible SDK |
| LLM cache | SQLite |
| Storage | Filesystem (cloned repos in temp dirs, graphs as JSON) |

## Project Structure

```
backend/
  api/                    FastAPI app + endpoints
  ir_compiler/            IR → graph, predict_impact, hotspots, dead_code, clustering
  llm/                    Groq LLM provider, SQLite cache, use cases
  parser/                 tree-sitter parsing (Swift / Python / JS-TS, multi-language registry)
  cached/                 Pre-built katana.ir.json + katana.graph.json
  scripts/                build_katana_graph, prefill_cache
  data/katana/            Cloned katana-swift repo (for code snippets)
  tests/                  Parser + IR compiler test suites
frontend/
  src/
    pages/                Landing, Workspace (main canvas + side panels), Home, Login
    components/Layout/    Header, Footer
    store/                Zustand stores (graphStore, projectStore)
    data/                 Mock data for frontend-only dev
    types/                API type reference (JSDoc) + endpoint constants
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cp ../.env.example ../.env
# edit ../.env and set LLM_API_KEY to your Groq key
uvicorn api.main:app --reload --port 8000
```

Server: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

Get a Groq API key at https://console.groq.com/keys (free tier).

### Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

## Team

| Person | Role | Owns |
|--------|------|------|
| **P1** | Parsers | `backend/parser/` — tree-sitter, language adapters (Swift / Python / JS-TS), IR JSON output |
| **P2** | IR → Graph | `backend/ir_compiler/ir_compiler.py` — graph builder, predict_impact, hotspots, dead_code |
| **P3** | Backend API + LLM | `backend/api/` — FastAPI routes, Groq integration, SQLite cache |
| **P4** | Frontend | `frontend/` — React app, graph viz, code panel, node editor |

## Pipeline

```
Source code ──▶ IR JSON ──▶ Graph JSON ──▶ HTTP API + LLM ──▶ React UI
   (P1)           (P2)         (P3)              (P3)          (P4)
```

Each stage has one owner and one output format. Mock-first development means each downstream stage hand-writes a fake input from the upstream stage and stays unblocked until the real one ships.

## API Contract

Source of truth is the Swagger UI at `/docs` on the running backend.

## Deployment

Deployed on Render free tier (Python native runtime). See `render.yaml` for the blueprint config.

- Persistent disk at `/var/data` holds `katana.graph.json` and `cache.sqlite`
- On first deploy, the app auto-seeds the graph JSON from the bundled copy in `backend/cached/`
- Set `LLM_API_KEY` manually in the Render dashboard

## Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Description |
|---|---|
| `LLM_PROVIDER` | LLM provider (`groq`) |
| `LLM_MODEL` | Model name (e.g. `llama-3.3-70b-versatile`) |
| `LLM_API_KEY` | API key for the chosen provider |
| `LLM_BASE_URL` | Base URL for OpenAI-compatible providers |
| `CACHE_PATH` | SQLite cache file path (default: `cache.sqlite`) |
| `GRAPH_PATH` | Path to graph JSON (default: `backend/cached/katana.graph.json`) |
| `FRONTEND_ORIGIN` | Frontend origin allowed by CORS |
