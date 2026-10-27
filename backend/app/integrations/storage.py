"""Uploaded files (slips, photos, voice notes). Local disk for development; S3-compatible in production."""

import uuid
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.core.config import get_settings


class Storage(Protocol):
    def save(self, data: bytes, content_type: str, ext: str) -> str:
        """Store the file and return its public URL."""
        ...


def _key(ext: str) -> str:
    return f"{uuid.uuid4().hex}.{ext or 'bin'}"


class LocalStorage:
    def __init__(self, directory: str, base_url: str) -> None:
        self.directory = Path(directory)
        self.base_url = base_url.rstrip("/")

    def save(self, data: bytes, content_type: str, ext: str) -> str:
        self.directory.mkdir(parents=True, exist_ok=True)
        key = _key(ext)
        (self.directory / key).write_bytes(data)
        return f"{self.base_url}/uploads/{key}"


class S3Storage:
    def __init__(self, bucket: str, endpoint_url: str, region: str, public_base_url: str) -> None:
        import boto3

        self.client = boto3.client("s3", endpoint_url=endpoint_url or None, region_name=region)
        self.bucket = bucket
        self.public_base_url = public_base_url.rstrip("/")

    def save(self, data: bytes, content_type: str, ext: str) -> str:
        key = f"uploads/{_key(ext)}"
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return f"{self.public_base_url}/{key}"


@lru_cache
def get_storage() -> Storage:
    s = get_settings()
    if s.storage_backend == "s3":
        return S3Storage(s.s3_bucket, s.s3_endpoint_url, s.s3_region, s.s3_public_base_url)
    return LocalStorage(s.upload_dir, s.public_base_url)
