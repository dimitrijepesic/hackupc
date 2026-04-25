"""Pre-fill LLM cache for demo. Calls all 3 LLM endpoints for a curated list of nodes."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # backend/
sys.path.insert(0, str(ROOT))

from ir_compiler.ir_compiler import (
    predict_impact,
    get_node_with_neighbors,
    hotspots,
)
from llm.use_cases import explain_node, codebase_overview, impact_narrative

GRAPH_PATH = ROOT / "cached" / "katana.graph.json"

# Curated demo nodes — interesting Sources functions with high signal
DEMO_NODE_IDS = [
    "func:Sources/Interceptor/ObserverInterceptor.swift:ObserverInterceptor.observe:90",
    "func:Sources/Store.swift:Store.dispatch:498",
    "func:Sources/Store.swift:Store.dispatch:472",
    "func:Sources/Store.swift:Store.dispatch:444",
    "func:Sources/SideEffect.swift:SideEffectContext.getAnyState:147",
    "func:Sources/Store.swift:Store.manageUpdateState:648",
    "func:Sources/Store.swift:Store.enqueueSideEffect:682",
    "func:Sources/Interceptor/ObserverInterceptor.swift:ObserverLogic.handleDispatchable:229",
    "func:Sources/StateUpdater.swift:StateUpdater.updatedState:62",
]


def main():
    with open(GRAPH_PATH, encoding="utf-8") as f:
        GRAPH = json.load(f)

    node_map = {n["id"]: n for n in GRAPH["nodes"]}
    total_in = total_out = 0
    n_calls = 0

    # 1. Overview (once)
    print("[1] codebase_overview ...")
    r = codebase_overview(
        top_hotspots=hotspots(GRAPH, top_n=10),
        total_nodes=len(GRAPH["nodes"]),
        total_edges=len(GRAPH["edges"]),
    )
    total_in += r["tokens_used"]
    n_calls += 1
    print(f"    cached={r['cached']} tokens={r['tokens_used']}")

    # 2. Per-node explain + impact
    for node_id in DEMO_NODE_IDS:
        if node_id not in node_map:
            print(f"[skip] {node_id} not in graph")
            continue
        result = get_node_with_neighbors(GRAPH, node_id)
        node = result["node"]
        snippet = node.get("code_snippet", "")

        print(f"[explain] {node['qualified_name']} ...")
        r = explain_node(node, result["callers"], result["callees"], snippet)
        total_in += r["tokens_used"]
        n_calls += 1
        print(f"    cached={r['cached']} tokens={r['tokens_used']}")

        print(f"[impact]  {node['qualified_name']} ...")
        affected = predict_impact(GRAPH, node_id)
        r = impact_narrative(node, affected)
        total_in += r["tokens_used"]
        n_calls += 1
        print(f"    cached={r['cached']} tokens={r['tokens_used']}")

    print(f"\nDone. {n_calls} calls, ~{total_in} total tokens.")


if __name__ == "__main__":
    main()