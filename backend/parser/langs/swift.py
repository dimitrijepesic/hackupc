from tree_sitter import Language, Parser
import tree_sitter_swift
from ..base import BaseParser, FileResult, FunctionInfo, FunctionCall
from ..registry import register

CONTAINER_TYPES = {
    "class_declaration",
    "struct_declaration",
    "enum_declaration",
    "protocol_declaration",
    "extension_declaration",
}

@register
class SwiftParser(BaseParser):

    def __init__(self):
        lang = Language(tree_sitter_swift.language())
        self._parser = Parser(lang)

    @property
    def language(self) -> str:
        return "swift"

    @property
    def extensions(self) -> list[str]:
        return [".swift"]

    def parse_file(self, path: str) -> FileResult:
        with open(path, "rb") as f:
            source = f.read()

        tree = self._parser.parse(source)
        result = FileResult(path=path)

        self._walk(tree.root_node, source, result, current_class=None, current_fn=None)
        return result

    def _walk(self, node, source: bytes, result: FileResult, current_class: str | None, current_fn: FunctionInfo | None):

        if node.type == "import_declaration":
            for child in node.children:
                if child.type == "identifier":
                    for subchild in child.children:
                        if subchild.type == "simple_identifier":
                            result.imports.append(source[subchild.start_byte:subchild.end_byte].decode("utf-8"))
            return

        if node.type in CONTAINER_TYPES:
            container_name = self._extract_container_name(node, source)
            for child in node.children:
                self._walk(child, source, result, current_class=container_name, current_fn=None)
            return

        if node.type == "function_declaration":
            fn = self._extract_function(node, source, current_class)
            if fn:
                result.functions.append(fn)
                for child in node.children:
                    self._walk(child, source, result, current_class=current_class, current_fn=fn)
            return

        if node.type == "init_declaration":
            fn = self._extract_init(node, source, current_class)
            if fn:
                result.functions.append(fn)
                for child in node.children:
                    self._walk(child, source, result, current_class=current_class, current_fn=fn)
            return

        if node.type == "deinit_declaration":
            fn = self._extract_deinit(node, source, current_class)
            if fn:
                result.functions.append(fn)
                for child in node.children:
                    self._walk(child, source, result, current_class=current_class, current_fn=fn)
            return

        if node.type == "call_expression" and current_fn:
            target = self._extract_call_target(node, source)
            if target:
                line = node.start_point[0] + 1
                current_fn.calls.append(FunctionCall(target=target, line=line))

        for child in node.children:
            self._walk(child, source, result, current_class=current_class, current_fn=current_fn)

    def _extract_container_name(self, node, source: bytes) -> str | None:
        for child in node.children:
            if child.type in ("type_identifier", "simple_identifier"):
                return source[child.start_byte:child.end_byte].decode("utf-8")
        return None

    def _extract_function(self, node, source: bytes, current_class: str | None) -> FunctionInfo | None:
        name = None
        for child in node.children:
            if child.type == "simple_identifier":
                name = source[child.start_byte:child.end_byte].decode("utf-8")
                break
        if not name:
            return None

        qualified_name = f"{current_class}.{name}" if current_class else name
        return FunctionInfo(
            qualified_name=qualified_name,
            name=name,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            signature=self._extract_signature(node, source),
        )

    def _extract_init(self, node, source: bytes, current_class: str | None) -> FunctionInfo | None:
        qualified_name = f"{current_class}.init" if current_class else "init"
        return FunctionInfo(
            qualified_name=qualified_name,
            name="init",
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            signature=self._extract_signature(node, source),
        )

    def _extract_deinit(self, node, source: bytes, current_class: str | None) -> FunctionInfo | None:
        qualified_name = f"{current_class}.deinit" if current_class else "deinit"
        return FunctionInfo(
            qualified_name=qualified_name,
            name="deinit",
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            signature="deinit",
        )

    def _extract_signature(self, node, source: bytes) -> str:
        for child in node.children:
            if child.type == "function_body":
                return source[node.start_byte:child.start_byte].decode("utf-8").strip()
        return source[node.start_byte:node.end_byte].decode("utf-8").split("{")[0].strip()

    def _extract_call_target(self, node, source: bytes) -> str | None:
        for child in node.children:
            if child.type == "simple_identifier":
                return source[child.start_byte:child.end_byte].decode("utf-8")
            if child.type == "navigation_expression":
                return source[child.start_byte:child.end_byte].decode("utf-8")
        return None