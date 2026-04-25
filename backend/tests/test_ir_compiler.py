#!/usr/bin/env python3
"""Tests for ir_compiler.build_call_graph and graph utility functions."""

import json
import os
import sys

# Add backend to path so imports work when run standalone
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ir_compiler.ir_compiler import (
    build_call_graph,
    predict_impact,
    hotspots,
    dead_code,
    get_node_with_neighbors,
)

TESTS_DIR = os.path.dirname(__file__)
IR_TESTS_DIR = os.path.join(TESTS_DIR, "ir_compiler_tests")
PARSER_TESTS_DIR = os.path.join(TESTS_DIR, "parser_tests")
ACTUAL_DIR = os.path.join(IR_TESTS_DIR, "actual")
CACHED_DIR = os.path.join(TESTS_DIR, "..", "cached")


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ─── Test case definitions ───────────────────────────────────────────────────

TESTCASES = [
    {
        "name": "test1",
        "input": os.path.join(PARSER_TESTS_DIR, "test1_output.json"),
        "expected": os.path.join(IR_TESTS_DIR, "external_test1_output.json"),
    },
    {
        "name": "test2",
        "input": os.path.join(PARSER_TESTS_DIR, "test2_output.json"),
        "expected": os.path.join(IR_TESTS_DIR, "external_test2_output.json"),
    },
    {
        "name": "test3",
        "input": os.path.join(PARSER_TESTS_DIR, "test3_output.json"),
        "expected": os.path.join(IR_TESTS_DIR, "external_test3_output.json"),
    },
    {
        "name": "external_testcase",
        "input": os.path.join(IR_TESTS_DIR, "external_testcase.json"),
        "expected": os.path.join(IR_TESTS_DIR, "external_testcase_output.json"),
    },
    {
        "name": "testcase5_advanced",
        "input": os.path.join(IR_TESTS_DIR, "testcase5_advanced.json"),
        "expected": os.path.join(IR_TESTS_DIR, "testcase5_output.json"),
    },
    {
        "name": "testcase6_animals",
        "input": os.path.join(IR_TESTS_DIR, "testcase6_animals.json"),
        "expected": os.path.join(IR_TESTS_DIR, "testcase6_output.json"),
    },
]


# ─── Graph comparison ────────────────────────────────────────────────────────

def compare_graphs(actual, expected, name):
    """Compare actual vs expected graph. Returns (passed: bool, diffs: list[str])."""
    diffs = []

    # graph_id
    if actual["graph_id"] != expected["graph_id"]:
        diffs.append(f"graph_id: actual={actual['graph_id']!r} expected={expected['graph_id']!r}")

    # Node count
    actual_nodes = actual["nodes"]
    expected_nodes = expected["nodes"]
    if len(actual_nodes) != len(expected_nodes):
        diffs.append(f"node count: actual={len(actual_nodes)} expected={len(expected_nodes)}")

    # Edge count
    actual_edges = actual["edges"]
    expected_edges = expected["edges"]
    if len(actual_edges) != len(expected_edges):
        diffs.append(f"edge count: actual={len(actual_edges)} expected={len(expected_edges)}")

    # Node-level comparison
    expected_node_map = {n["id"]: n for n in expected_nodes}
    actual_node_map = {n["id"]: n for n in actual_nodes}

    missing_nodes = set(expected_node_map) - set(actual_node_map)
    extra_nodes = set(actual_node_map) - set(expected_node_map)

    if missing_nodes:
        diffs.append(f"missing nodes ({len(missing_nodes)}): {sorted(missing_nodes)}")
    if extra_nodes:
        diffs.append(f"extra nodes ({len(extra_nodes)}): {sorted(extra_nodes)}")

    for node_id in sorted(set(actual_node_map) & set(expected_node_map)):
        a = actual_node_map[node_id]
        e = expected_node_map[node_id]
        if a["in_degree"] != e["in_degree"]:
            diffs.append(f"node {node_id}: in_degree actual={a['in_degree']} expected={e['in_degree']}")
        if a["out_degree"] != e["out_degree"]:
            diffs.append(f"node {node_id}: out_degree actual={a['out_degree']} expected={e['out_degree']}")

    # Edge-level comparison
    expected_edge_map = {(e["source"], e["target"]): e for e in expected_edges}
    actual_edge_map = {(e["source"], e["target"]): e for e in actual_edges}

    missing_edges = set(expected_edge_map) - set(actual_edge_map)
    extra_edges = set(actual_edge_map) - set(expected_edge_map)

    if missing_edges:
        diffs.append(f"missing edges ({len(missing_edges)}):")
        for src, tgt in sorted(missing_edges):
            diffs.append(f"  {src} -> {tgt}")
    if extra_edges:
        diffs.append(f"extra edges ({len(extra_edges)}):")
        for src, tgt in sorted(extra_edges):
            diffs.append(f"  {src} -> {tgt}")

    for key in sorted(set(actual_edge_map) & set(expected_edge_map)):
        a_w = actual_edge_map[key]["weight"]
        e_w = expected_edge_map[key]["weight"]
        if a_w != e_w:
            diffs.append(f"edge {key[0]} -> {key[1]}: weight actual={a_w} expected={e_w}")

    return len(diffs) == 0, diffs


# ─── Run build_call_graph tests ──────────────────────────────────────────────

def run_compiler_tests():
    results = []
    os.makedirs(ACTUAL_DIR, exist_ok=True)

    for tc in TESTCASES:
        name = tc["name"]
        print(f"\n{'='*60}")
        print(f"TEST: {name}")
        print(f"{'='*60}")

        ir = load_json(tc["input"])
        expected = load_json(tc["expected"])
        actual = build_call_graph(ir)

        # Save actual output for inspection
        save_json(os.path.join(ACTUAL_DIR, f"{name}_actual.json"), actual)

        passed, diffs = compare_graphs(actual, expected, name)
        results.append((name, passed, diffs))

        if passed:
            print(f"  PASSED ({len(actual['nodes'])} nodes, {len(actual['edges'])} edges)")
        else:
            print(f"  FAILED — {len(diffs)} difference(s):")
            for d in diffs:
                print(f"    - {d}")

    return results


# ─── Graph utility tests (katana graph) ─────────────────────────────────────

def run_utility_tests():
    katana_path = os.path.join(CACHED_DIR, "katana.graph.json")
    graph = load_json(katana_path)
    results = []

    # --- predict_impact ---
    print(f"\n{'='*60}")
    print("TEST: predict_impact")
    print(f"{'='*60}")
    test_node = graph["nodes"][0]["id"]
    impact = predict_impact(graph, test_node)
    if len(impact) > 0:
        print(f"  PASSED (returned {len(impact)} impacted nodes for {test_node!r})")
        results.append(("predict_impact", True, []))
    else:
        # Try other nodes until we find one with connections
        found = False
        for n in graph["nodes"]:
            if n["in_degree"] > 0 or n["out_degree"] > 0:
                impact = predict_impact(graph, n["id"])
                if len(impact) > 0:
                    print(f"  PASSED (returned {len(impact)} impacted nodes for {n['id']!r})")
                    results.append(("predict_impact", True, []))
                    found = True
                    break
        if not found:
            results.append(("predict_impact", False, ["predict_impact returned empty for all nodes"]))
            print("  FAILED — returned empty for all tried nodes")

    # --- hotspots ---
    print(f"\n{'='*60}")
    print("TEST: hotspots (top_n=5)")
    print(f"{'='*60}")
    hot = hotspots(graph, top_n=5)
    hot_diffs = []
    if len(hot) != 5:
        hot_diffs.append(f"expected 5 elements, got {len(hot)}")
    # Check sorted by in_degree desc
    for i in range(len(hot) - 1):
        if hot[i]["in_degree"] < hot[i + 1]["in_degree"]:
            hot_diffs.append(f"not sorted desc at index {i}: {hot[i]['in_degree']} < {hot[i+1]['in_degree']}")
            break
    if hot_diffs:
        print(f"  FAILED: {hot_diffs}")
    else:
        print(f"  PASSED (top in_degrees: {[n['in_degree'] for n in hot]})")
    results.append(("hotspots", len(hot_diffs) == 0, hot_diffs))

    # --- dead_code ---
    print(f"\n{'='*60}")
    print("TEST: dead_code")
    print(f"{'='*60}")
    dead = dead_code(graph)
    dead_diffs = []
    for n in dead:
        if n["in_degree"] != 0:
            dead_diffs.append(f"node {n['id']} has in_degree={n['in_degree']}, expected 0")
        if n["category"] == "test":
            dead_diffs.append(f"node {n['id']} has category='test', should be excluded")
    if dead_diffs:
        print(f"  FAILED: {dead_diffs[:5]}")
    else:
        print(f"  PASSED ({len(dead)} dead code nodes found)")
    results.append(("dead_code", len(dead_diffs) == 0, dead_diffs))

    # --- get_node_with_neighbors (existing node) ---
    print(f"\n{'='*60}")
    print("TEST: get_node_with_neighbors (existing)")
    print(f"{'='*60}")
    existing_id = graph["nodes"][0]["id"]
    result = get_node_with_neighbors(graph, existing_id)
    gn_diffs = []
    if result is None:
        gn_diffs.append("returned None for existing node")
    else:
        for key in ("node", "callers", "callees"):
            if key not in result:
                gn_diffs.append(f"missing key {key!r} in result")
    if gn_diffs:
        print(f"  FAILED: {gn_diffs}")
    else:
        print(f"  PASSED (callers={len(result['callers'])}, callees={len(result['callees'])})")
    results.append(("get_node_with_neighbors_existing", len(gn_diffs) == 0, gn_diffs))

    # --- get_node_with_neighbors (non-existing node) ---
    print(f"\n{'='*60}")
    print("TEST: get_node_with_neighbors (non-existing)")
    print(f"{'='*60}")
    result_none = get_node_with_neighbors(graph, "func:nonexistent:fake:0")
    gn_none_diffs = []
    if result_none is not None:
        gn_none_diffs.append(f"expected None, got {type(result_none)}")
    if gn_none_diffs:
        print(f"  FAILED: {gn_none_diffs}")
    else:
        print("  PASSED (returned None)")
    results.append(("get_node_with_neighbors_nonexistent", len(gn_none_diffs) == 0, gn_none_diffs))

    return results


# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("IR COMPILER TEST SUITE")
    print("=" * 60)

    compiler_results = run_compiler_tests()
    utility_results = run_utility_tests()

    all_results = compiler_results + utility_results
    passed = sum(1 for _, p, _ in all_results if p)
    failed = sum(1 for _, p, _ in all_results if not p)

    print(f"\n{'='*60}")
    print(f"SUMMARY: {passed}/{len(all_results)} passed, {failed} failed")
    print(f"{'='*60}")

    if failed > 0:
        print("\nFailed tests:")
        for name, p, diffs in all_results:
            if not p:
                print(f"\n  {name}:")
                for d in diffs[:10]:
                    print(f"    - {d}")

    sys.exit(1 if failed > 0 else 0)
