import time
from typing import Optional

CACHE_TTL = 300  # 5 minutes

_store: dict[str, tuple[str, float]] = {}  # key -> (value, expiry_timestamp)


def get_leaderboard_cache(key: str) -> Optional[str]:
    entry = _store.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    _store.pop(key, None)
    return None


def set_leaderboard_cache(key: str, value: str) -> None:
    _store[key] = (value, time.time() + CACHE_TTL)


def invalidate_leaderboard_cache() -> None:
    keys = [k for k in _store if k.startswith("leaderboard:")]
    for k in keys:
        _store.pop(k, None)
