from .base import ParseResult, FileResult


def merge(results: list[ParseResult]) -> ParseResult:
    if not results:
        return ParseResult()

    merged = ParseResult(
        version=results[0].version,
        language=results[0].language,
        repo=results[0].repo,
    )

    for result in results:
        merged.files.extend(result.files)

    return merged