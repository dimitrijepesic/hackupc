import os
import json
from pathlib import Path
from .base import ParseResult
from .registry import get_parser
from .merger import merge

# trigger registration
from . import langs  # noqa: F401


def parse_repo(repo_path: str, repo_name: str = "", language: str = "swift") -> dict:
    results = []

    for dirpath, _, filenames in os.walk(repo_path):
        for fname in filenames:
            ext = Path(fname).suffix
            parser = get_parser(ext)
            if parser is None:
                continue

            full_path = os.path.join(dirpath, fname)
            relative_path = os.path.relpath(full_path, repo_path)

            try:
                file_result = parser.parse_file(full_path)
                file_result.path = relative_path

                partial = ParseResult(
                    language=parser.language,
                    repo=repo_name,
                    files=[file_result]
                )
                results.append(partial)

            except Exception as e:
                print(f"[warn] skipping {full_path}: {e}")

    merged = merge(results)
    return _to_dict(merged)


def parse_file(file_path: str, repo_name: str = "") -> dict:
    ext = Path(file_path).suffix
    parser = get_parser(ext)
    if parser is None:
        raise ValueError(f"No parser registered for extension '{ext}'")

    file_result = parser.parse_file(file_path)
    result = ParseResult(
        language=parser.language,
        repo=repo_name,
        files=[file_result]
    )
    return _to_dict(result)


def _to_dict(result: ParseResult) -> dict:
    return {
        "version": result.version,
        "language": result.language,
        "repo": result.repo,
        "files": [
            {
                "path": f.path,
                "imports": f.imports,
                "functions": [
                    {
                        "qualified_name": fn.qualified_name,
                        "name": fn.name,
                        "line_start": fn.line_start,
                        "line_end": fn.line_end,
                        "signature": fn.signature,
                        "calls": [
                            {"target": c.target, "line": c.line}
                            for c in fn.calls
                        ]
                    }
                    for fn in f.functions
                ]
            }
            for f in result.files
        ]
    }