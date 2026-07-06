"""
Supabase Storage Backend for Django
Remplace le FileSystemStorage pour uploader les fichiers vers Supabase Storage
"""
import os
import io
import uuid
import logging
from urllib.parse import urljoin

from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings

from supabase_config import get_supabase_admin

logger = logging.getLogger(__name__)

USE_SUPABASE = os.environ.get('USE_SUPABASE', 'false').lower() == 'true'
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://jfutcdemqkleebjicxpb.supabase.co')


class SupabaseStorage(Storage):
    """Storage backend that uploads files to Supabase Storage buckets"""

    def __init__(self, bucket='employees'):
        self.bucket = bucket
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = get_supabase_admin()
        return self._client

    def _open(self, name, mode='rb'):
        try:
            response = self.client.storage.from_(self.bucket).download(name)
            return ContentFile(response, name)
        except Exception as e:
            logger.error(f"SupabaseStorage _open error: {e}")
            raise FileNotFoundError(f"File {name} not found")

    def _save(self, name, content):
        try:
            file_bytes = content.read()
            content_type = getattr(content, 'content_type', 'application/octet-stream')
            self.client.storage.from_(self.bucket).upload(
                name, file_bytes, {'content-type': content_type}
            )
            return name
        except Exception as e:
            logger.error(f"SupabaseStorage _save error: {e}")
            raise

    def delete(self, name):
        try:
            self.client.storage.from_(self.bucket).remove([name])
        except Exception as e:
            logger.error(f"SupabaseStorage delete error: {e}")

    def exists(self, name):
        try:
            self.client.storage.from_(self.bucket).list(name)
            return True
        except Exception:
            return False

    def url(self, name):
        if not name:
            return ''
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{self.bucket}/{name}"
        return public_url

    def size(self, name):
        try:
            files = self.client.storage.from_(self.bucket).list(os.path.dirname(name) or '')
            for f in files:
                if f.get('name') == os.path.basename(name):
                    return f.get('metadata', {}).get('size', 0)
        except Exception:
            pass
        return 0


def get_upload_path(instance, filename):
    """Generate upload path for employee photos"""
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    folder = {
        'Employee': 'employees/photos',
        'CompanySettings': 'company',
        'User': 'avatars',
    }
    base = folder.get(instance.__class__.__name__, 'uploads')
    unique = uuid.uuid4().hex[:12]
    return f"{base}/{unique}.{ext}"
