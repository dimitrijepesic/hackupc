_registry: dict[str, type] = {}

def register(cls):
    """Decorator: register a parser class for its extensions."""
    instance = cls()
    for ext in instance.extensions:
        _registry[ext] = cls
    return cls

def get_parser(extension: str):
    cls = _registry.get(extension)
    return cls() if cls else None

def supported_extensions() -> list[str]:
    return list(_registry.keys())