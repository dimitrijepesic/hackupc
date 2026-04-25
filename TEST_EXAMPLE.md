# Test Example: Python Web App (Order Processing)

A small, hand-crafted call graph designed to showcase Synapsis graph visualization. The example models a minimal order processing HTTP server in Python.

## Files

| File | Description |
|------|-------------|
| `frontend/test/testcase_python_webapp/src/app.py` | Python source code |
| `frontend/test/testcase_python_webapp/testcase_python_webapp_output.json` | Pre-built graph JSON (same schema as backend `/analyze` response) |

## Graph Overview

- **15 nodes**, **16 edges**
- **Depth**: 6 levels (main → run_server → handle_request → process_order → calculate_price → apply_discount)
- **Graph ID**: `python-webapp`

## Call Graph Structure

```
main
├── load_config
├── connect_db
└── run_server
    └── handle_request
        ├── authenticate
        │   └── validate_token
        ├── process_order
        │   ├── lookup_item
        │   ├── calculate_price
        │   │   └── apply_discount
        │   ├── save_order ──────┐
        │   ├── notify_user ─────┤
        │   └── send_response ◄──┼── shared sinks
        └── send_response ◄──────┘
```

## Node Categories

| Category | Nodes | Meaning |
|----------|-------|---------|
| `entry` | `main` | Root of the graph (in_degree = 0) |
| `hub` | `handle_request`, `process_order` | High fan-out, routing/orchestration logic |
| `bridge` | `run_server`, `authenticate`, `calculate_price`, `save_order`, `notify_user` | Single-in, single-out connectors |
| `source` | `load_config`, `connect_db`, `validate_token`, `lookup_item`, `apply_discount` | Leaf nodes (out_degree = 0) |
| `sink` | `log_event`, `send_response` | Shared endpoints (in_degree > 1, out_degree = 0) |

## Why This Example Is Useful

1. **Branching** -- two hub nodes (`handle_request` fans out to 3, `process_order` fans out to 5) create a visually interesting tree shape.
2. **Convergence** -- `log_event` and `send_response` are called from multiple parents, so edges merge back together instead of being a pure tree.
3. **Depth** -- 6 levels deep gives the layout algorithm enough vertical space to work with.
4. **Small enough to reason about** -- 15 nodes fit comfortably on screen without needing zoom or filtering.
5. **Realistic domain** -- the function names (authenticate, process_order, save_order, notify_user) are immediately understandable.
