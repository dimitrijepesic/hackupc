# Call Graph JSON Schema — v4

Reference documentation for the JSON output of `ir_compiler_v4.py`. Intended for frontend developers building visualizations, for LLMs interpreting the graph programmatically, and for anyone integrating with this data.

## Top-Level Structure

```json
{
  "graph_id":  "katana",
  "metadata":  { ... },
  "nodes":     [ ... ],
  "edges":     [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `graph_id` | `string` | Short identifier derived from the repo name (e.g. `"katana"` from `katana-swift`). Stable across rebuilds of the same repo. |
| `metadata` | `object` | Graph-level statistics for overview panels, landing pages, and aggregate filters. See [Metadata](#metadata). |
| `nodes` | `array<Node>` | Every function in the codebase, including compiler-synthesized memberwise inits. See [Node](#node). |
| `edges` | `array<Edge>` | Directed call relationships between nodes. See [Edge](#edge). |

---

## Node

Each node represents one function (method, initializer, test, etc.) found in the Swift source.

### Identity & Location

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Globally unique node ID. Format: `func:{file_path}:{qualified_name}:{line_start}`. Use this as the primary key for lookups, edge references, and URL fragments. |
| `type` | `string` | Always `"function"` in the current version. Reserved for future node kinds (types, modules). |
| `qualified_name` | `string` | Dot-separated name including the enclosing type, e.g. `"Store.dispatch"`, `"AddTodo.updateState"`. Top-level functions have no dot. Synthetic inits use `"TypeName.__synthetic_init"`. |
| `name` | `string` | The bare function name without the container prefix, e.g. `"dispatch"`, `"init"`, `"testFoo"`. Use for display labels and search. |
| `file` | `string` | Relative path to the source file, e.g. `"Sources/Store.swift"`. Use for file-tree grouping, category derivation, and linking to source. |
| `line` | `int` | 1-based line number where the function declaration starts. Use for source linking. |
| `line_end` | `int \| null` | 1-based line number where the function body ends. `null` if the parser couldn't determine it. Together with `line`, gives the function's line span. |
| `container` | `string \| null` | Name of the enclosing type (class/struct/enum/protocol), e.g. `"Store"`. `null` for top-level (free) functions. Use for type-based grouping. |

### Signature & Type Info

| Field | Type | Description |
|-------|------|-------------|
| `signature` | `string` | Full Swift function signature as written in source, e.g. `"public func dispatch(_ dispatchable: Dispatchable)"`. May contain newlines for multi-line signatures. The access level, `override`, `static`/`class`, parameter labels, and return type are all embedded here. |
| `params` | `array<Param>` | Parsed parameter list. Each element has `label` (external name or `null`), `name` (internal name), and `type` (Swift type string). Empty array for zero-argument functions. |
| `return_type` | `string \| null` | The declared return type, e.g. `"Promise<Void>"`, `"State"`. `null` for `Void`/omitted returns and for initializers. |

### Classification

| Field | Type | Possible Values | Description |
|-------|------|-----------------|-------------|
| `category` | `string` | `"source"`, `"test"`, `"util"` | Derived from the file path. `"test"` if the path contains `/Tests/`. `"util"` if it contains `/Helpers/` or `/Util/`. Everything else is `"source"`. Use for filtering the graph into production code vs test infrastructure. |
| `function_kind` | `string` | `"constructor"`, `"destructor"`, `"protocol_default"`, `"static_method"`, `"test_case"`, `"test_lifecycle"`, `"test_helper"`, `"method"` | Semantic classification of the function's role. See [Function Kind Reference](#function-kind-reference) below. |
| `synthetic` | `bool` | *(only present when `true`)* | `true` for compiler-synthesized memberwise initializers that have no explicit `init` in source. These nodes are created by the compiler to represent implicit Swift struct inits. If this field is absent, the node is not synthetic. |

### Graph Metrics

| Field | Type | Description |
|-------|------|-------------|
| `in_degree` | `int` | Number of distinct edges pointing TO this node (how many other functions call it). High in_degree = widely depended upon. |
| `out_degree` | `int` | Number of distinct edges pointing FROM this node (how many other functions it calls). High out_degree = orchestrator/coordinator. |

### Enrichment Fields (v4)

These fields are derived from the IR and the computed graph. They help developers orient themselves without reading source code.

| Field | Type | Description |
|-------|------|-------------|
| `access_level` | `string` | Swift visibility: `"public"`, `"open"`, `"internal"`, `"private"`, or `"fileprivate"`. Parsed from the first keyword of the `signature` text. Defaults to `"internal"` when no explicit modifier is present (Swift's default). **Use case:** Filter to see only public API surface, identify private implementation details, find functions that could be narrowed in scope. |
| `is_override` | `bool` | `true` if the `signature` text contains the `override` keyword, meaning this function replaces a superclass implementation. **Use case:** Understand inheritance relationships, identify customization points in a class hierarchy. |
| `protocol_witnesses` | `array<string>` | List of protocol names whose requirement this function satisfies. For example, a `sideEffect` method on a type conforming to `ReturningTestSideEffect` would have `["ReturningTestSideEffect"]`. Empty array if the function doesn't witness any protocol requirement. **Use case:** Understand which functions exist because of protocol conformance obligations, trace the protocol → implementation mapping. |
| `complexity` | `object` | Lightweight complexity estimate from IR data. Contains three sub-fields (see below). **Use case:** Triage which functions deserve closer review, sort by complexity in a list view. |
| `complexity.param_count` | `int` | Number of parameters. Higher arity often correlates with more complex logic. |
| `complexity.call_count` | `int` | Number of outbound call sites in the function body (from the parser). This counts raw call expressions, not unique targets — a loop calling the same function 3 times counts as 3. |
| `complexity.line_span` | `int \| null` | `line_end - line_start + 1`. `null` if `line_end` is unknown. A rough proxy for function length. |
| `reachable_from_public_api` | `bool` | `true` if this node is on a forward call path from any `public`/`open` source node. Computed via BFS. **Use case:** Distinguish "truly internal" code (unreachable from public API, safe to refactor freely) from code that is part of the public API's transitive implementation. Nodes where this is `false` AND `category == "source"` are strong candidates for dead code or internal-only utilities. |

---

## Edge

Each edge represents one or more call sites from a source function to a target function.

| Field | Type | Description |
|-------|------|-------------|
| `source` | `string` | Node `id` of the caller. |
| `target` | `string` | Node `id` of the callee. |
| `type` | `string` | Always `"calls"` in the current version. Reserved for future relationship types (e.g. `"conforms_to"`, `"overrides"`). |
| `weight` | `int` | Number of distinct call sites from source to target within the source function's body. A weight of 3 means the caller invokes the target at 3 separate locations in its code. **Use case:** Thicker lines in visualizations, risk assessment (more call sites = tighter coupling). |

**Invariants:**
- No self-loops: `source` never equals `target`.
- Edges are deduplicated: at most one edge per `(source, target)` pair; multiple call sites are folded into `weight`.
- Both `source` and `target` always reference valid node IDs present in the `nodes` array.

---

## Metadata

Graph-level statistics computed after the full graph is built. Intended for overview panels, dashboards, and high-level health indicators.

### Counts

| Field | Type | Description |
|-------|------|-------------|
| `node_count` | `int` | Total number of nodes in the graph. |
| `edge_count` | `int` | Total number of edges in the graph. |
| `category_counts` | `object` | Breakdown by category. Keys are `"source"`, `"test"`, `"util"` (only present if count > 0). Values are integers. Example: `{"source": 68, "test": 85}`. |
| `function_kinds` | `object` | Breakdown by function kind. Keys are the `function_kind` values (only present if count > 0). Each value is `{"label": "Human Label", "count": N}`. The `label` field provides a display-friendly name for filter panels. Keys appear in a canonical display order. |

### Entry Points

| Field | Type | Description |
|-------|------|-------------|
| `entry_points` | `array<string>` | Node IDs of `public`/`open` source nodes with `in_degree == 0`. These are the intended external API surface — functions that external consumers call but that no internal code calls. **Use case:** Starting points for "explore from the API surface" workflows, public API documentation. |

### Structural Analysis

| Field | Type | Description |
|-------|------|-------------|
| `connected_components` | `object` | Undirected connectivity summary. |
| `connected_components.count` | `int` | Number of connected components. A high count relative to node count suggests a fragmented or modular codebase. |
| `connected_components.largest_size` | `int` | Size of the largest connected component. If this is close to `node_count`, the codebase is tightly interconnected. |
| `connected_components.isolated_nodes` | `int` | Number of nodes in singleton components (no edges at all). These are completely disconnected functions — likely external API wrappers, unused code, or functions whose calls couldn't be resolved. |
| `cycles` | `object` | Strongly connected component (SCC) analysis via Tarjan's algorithm. Only SCCs of size ≥ 2 (actual cycles) are reported. |
| `cycles.count` | `int` | Number of call cycles in the graph. |
| `cycles.largest_size` | `int` | Number of nodes in the largest cycle. |
| `cycles.members` | `array<array<string>>` | The top 5 largest cycles, each as a list of node IDs. **Use case:** Highlight circular dependencies, identify tightly coupled function groups that may be hard to test or refactor in isolation. |

### Test Coverage Proxy

| Field | Type | Description |
|-------|------|-------------|
| `test_coverage` | `object` | Estimates how much of the production code is exercised by tests, based on call-graph reachability (not runtime coverage). |
| `test_coverage.source_nodes` | `int` | Total number of source (production) nodes. |
| `test_coverage.covered_by_tests` | `int` | Number of source nodes reachable via BFS from any test node. |
| `test_coverage.coverage_ratio` | `float` | `covered_by_tests / source_nodes`, rounded to 4 decimal places. 0.0 = no test reaches any production code, 1.0 = every production function is on a call path from at least one test. **Caveat:** This is a static call-graph proxy, not runtime coverage. It may overcount (a test that calls `Store.dispatch` makes all transitive callees "covered" even if the test doesn't exercise those paths) and undercount (calls through closures or dynamic dispatch that the resolver can't trace). |

### Protocol Summary

| Field | Type | Description |
|-------|------|-------------|
| `protocol_summary` | `object` | Map of protocol names to summary stats. Only includes protocols that have at least one conformer or at least one method with a default implementation. |
| `protocol_summary[name].conformer_count` | `int` | Number of concrete types (transitively) conforming to this protocol. |
| `protocol_summary[name].method_count` | `int` | Number of methods with default implementations defined in extensions of this protocol. |

**Use case:** Understand the protocol hierarchy at a glance, identify protocols with many conformers (extension points) vs protocols with few (specialized contracts).

---

## Function Kind Reference

The `function_kind` field classifies each node by its semantic role. Classification follows a priority order — e.g. a test file's `init()` is still `"constructor"`, not `"test_helper"`.

| Kind | Label | Rule | What it means |
|------|-------|------|---------------|
| `constructor` | Constructors | `name == "init"` | Initializers, including synthetic memberwise inits. Always takes priority over any other classification. |
| `destructor` | Destructors | `name == "deinit"` | Deinitializers. Rare; indicates resource cleanup logic. |
| `test_case` | Test cases | `category == "test"` AND `name.startswith("test")` | XCTest test methods. The primary unit test entry points. |
| `test_lifecycle` | Test lifecycle | `category == "test"` AND name is `setUp`/`tearDown`/etc. | XCTest lifecycle hooks. Run before/after each test case. |
| `test_helper` | Test helpers | `category == "test"` AND not init/deinit/test*/lifecycle | Any other function living in a test file — mock builders, assertion utilities, helper methods. |
| `protocol_default` | Protocol defaults | Container is a protocol | Default implementations declared in protocol extensions. These are dispatched at runtime to conforming types that don't provide their own override. |
| `static_method` | Static / class methods | Signature contains `"static func"` or `"class func"` | Type-level methods called on the type itself, not on instances. |
| `method` | Methods | Everything else | Regular instance methods, computed properties, free functions. The catch-all bucket. |

---

## Node ID Format

```
func:{file_path}:{qualified_name}:{line_start}
```

Example:
```
func:Sources/Store.swift:Store.dispatch:401
```

The four segments are colon-separated. To extract components:

```javascript
const [kind, file, qualifiedName, line] = nodeId.split(":");
// kind          = "func"
// file          = "Sources/Store.swift"
// qualifiedName = "Store.dispatch"
// line          = "401"
```

**Note:** If the file path or qualified name contains colons (unusual but possible), use `split(":", 4)` to avoid over-splitting.

Synthetic init nodes always have `line_start = 0` and `qualified_name` ending in `.__synthetic_init`.

---

## Usage Patterns

### "Show me the public API"

Filter nodes where `access_level` is `"public"` or `"open"` and `category` is `"source"`. The `entry_points` metadata field gives the subset of these that have no internal callers.

### "What's dead code?"

Use the `dead_code()` function in the compiler, or approximate it: nodes where `in_degree == 0`, `category != "test"`, `function_kind != "constructor"`, `access_level` is not `"public"`/`"open"`, and `synthetic` is not `true`. For transitive dead code, also check nodes whose only callers are themselves dead.

### "What's risky to change?"

Nodes with high `in_degree` (many dependents) and `reachable_from_public_api == true` are the riskiest. The `hotspots()` function weights callers by category to discount test-only usage.

### "What calls what?"

Follow edges from a node's `id` as `source` to find callees, or as `target` to find callers. The `weight` field indicates coupling intensity.

### "Show me the test coverage gaps"

Nodes where `category == "source"` and `reachable_from_public_api == true` but NOT in the set reachable from test nodes (approximated by checking the `test_coverage` metadata) are production code that tests don't exercise.

### "Where are the cycles?"

The `cycles.members` metadata field lists the node IDs involved in circular call chains. These represent tightly coupled function groups.