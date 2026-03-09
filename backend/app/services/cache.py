import redis
from app.config import settings
from typing import Optional

_redis_client: Optional[redis.Redis] = None
CACHE_TTL = 300  # 5 minutes


def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


def get_leaderboard_cache(key: str) -> Optional[str]:
    r = get_redis()
    if not r:
        return None
    try:
        return r.get(key)
    except Exception:
        return None


def set_leaderboard_cache(key: str, value: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.setex(key, CACHE_TTL, value)
    except Exception:
        pass


def invalidate_leaderboard_cache() -> None:
    r = get_redis()
    if not r:
        return
    try:
        keys = r.keys("leaderboard:*")
        if keys:
            r.delete(*keys)
    except Exception:
        pass
