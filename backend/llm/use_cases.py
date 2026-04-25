"""Three LLM use cases: explain node, codebase overview, impact narrative."""
from .cache import cached_complete


# --- explain_node ---

EXPLAIN_NODE_SYSTEM = """You are a senior Swift engineer explaining a function to a developer.
Be concise (3-5 sentences). Focus on:
- What the function does
- How it fits in the call graph (mention notable callers/callees)
- Any non-obvious behavior

Plain prose, no markdown headers, no bullets."""


def explain_node(node: dict, callers: list, callees: list, code_snippet: str) -> dict:
    caller_names = ", ".join(c["qualified_name"] for c in callers[:5]) or "none"
    callee_names = ", ".join(c["qualified_name"] for c in callees[:5]) or "none"

    user = f"""Function: {node['qualified_name']}
File: {node['file']}:{node['line']}
Signature: {node['signature']}
Called by: {caller_names}
Calls: {callee_names}

Source:
```swift
{code_snippet}
```

Explain this function."""

    resp = cached_complete(
        use_case="explain_node",
        params={"node_id": node["id"]},
        content_signature=f"{node['signature']}|{code_snippet[:500]}",
        system=EXPLAIN_NODE_SYSTEM,
        user=user,
        max_tokens=400,
    )
    return {
        "explanation": resp.text,
        "tokens_used": resp.input_tokens + resp.output_tokens,
        "cached": resp.cached,
    }


# --- codebase_overview ---

OVERVIEW_SYSTEM = """You are a senior Swift engineer summarizing a codebase for a new contributor.
4-6 sentences total. Cover:
- What the library does
- Core architectural pattern (e.g. Redux-like, MVC, etc.)
- The most important entry points

Plain prose."""


def codebase_overview(top_hotspots: list, total_nodes: int, total_edges: int) -> dict:
    hotspot_lines = "\n".join(
        f"- {h['qualified_name']} ({h['file']}, in_degree={h['in_degree']})"
        for h in top_hotspots[:10]
    )

    user = f"""Codebase: BendingSpoons/katana-swift
Total functions: {total_nodes}
Total call edges: {total_edges}

Top called functions (hotspots):
{hotspot_lines}

Summarize this codebase."""

    resp = cached_complete(
        use_case="codebase_overview",
        params={"node_count": total_nodes},
        content_signature=hotspot_lines,
        system=OVERVIEW_SYSTEM,
        user=user,
        max_tokens=400,
    )
    return {
        "overview": resp.text,
        "tokens_used": resp.input_tokens + resp.output_tokens,
        "cached": resp.cached,
    }


# --- impact_narrative ---

IMPACT_SYSTEM = """You are a senior Swift engineer assessing change risk.
Given a target function and the functions a change to it would affect, write a 3-4 sentence narrative.
Cover:
- The blast radius (how much breaks)
- Most critical affected paths
- Risk level (low/medium/high) with one-line justification

Plain prose."""


def impact_narrative(node: dict, affected: list) -> dict:
    affected_lines = "\n".join(
        f"- {a['id'].split(':')[2]} (distance={a['distance']}, risk={a['risk_score']})"
        for a in affected[:10]
    )

    user = f"""Target function: {node['qualified_name']} ({node['file']}:{node['line']})

If this function changes, these are the {len(affected)} most affected functions:
{affected_lines}

Write the impact narrative."""

    resp = cached_complete(
        use_case="impact_narrative",
        params={"node_id": node["id"], "affected_count": len(affected)},
        content_signature=affected_lines,
        system=IMPACT_SYSTEM,
        user=user,
        max_tokens=400,
    )
    return {
        "narrative": resp.text,
        "tokens_used": resp.input_tokens + resp.output_tokens,
        "cached": resp.cached,
    }