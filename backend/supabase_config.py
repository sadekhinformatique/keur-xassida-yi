import os
from supabase import create_client, Client

_supabase: Client | None = None

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE = os.environ.get("SUPABASE_SERVICE_ROLE")


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)


def upload_photo(bucket: str, path: str, file_data: bytes, content_type: str = "image/jpeg") -> str | None:
    try:
        sb = get_supabase_admin()
        sb.storage.from_(bucket).upload(path, file_data, {"content-type": content_type})
        public_url = sb.storage.from_(bucket).get_public_url(path)
        return public_url
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Supabase upload failed: {e}")
        return None


def verify_jwt(token: str) -> dict | None:
    try:
        sb = get_supabase()
        user = sb.auth.get_user(token)
        return user.model_dump() if user else None
    except Exception:
        return None
