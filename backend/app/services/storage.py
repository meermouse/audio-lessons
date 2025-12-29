from __future__ import annotations
import os
import uuid
from dataclasses import dataclass
from typing import BinaryIO, Optional

import aiofiles
import boto3

from app.core.config import settings

@dataclass
class StoredObject:
    key: str
    size_bytes: int | None = None
    content_type: str | None = None

class Storage:
    async def put_bytes(self, key: str, data: bytes, content_type: str | None = None) -> StoredObject:
        raise NotImplementedError

    async def put_stream(self, key: str, fileobj: BinaryIO, content_type: str | None = None) -> StoredObject:
        raise NotImplementedError

    async def get_path_or_presigned(self, key: str) -> str:
        """Local returns filesystem path; S3 returns presigned URL (or could download temp)."""
        raise NotImplementedError

    async def exists(self, key: str) -> bool:
        raise NotImplementedError

    async def list_keys(self, prefix: str) -> list[str]:
        """List all keys with a given prefix."""
        raise NotImplementedError

class LocalStorage(Storage):
    def __init__(self, base_dir: str):
        self.base_dir = os.path.abspath(base_dir)

    def _abs(self, key: str) -> str:
        return os.path.join(self.base_dir, key)

    async def put_bytes(self, key: str, data: bytes, content_type: str | None = None) -> StoredObject:
        path = self._abs(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return StoredObject(key=key, size_bytes=len(data), content_type=content_type)

    async def put_stream(self, key: str, fileobj: BinaryIO, content_type: str | None = None) -> StoredObject:
        path = self._abs(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        async with aiofiles.open(path, "wb") as out:
            while True:
                chunk = fileobj.read(1024 * 1024)
                if not chunk:
                    break
                await out.write(chunk)
        return StoredObject(key=key, content_type=content_type)

    async def get_path_or_presigned(self, key: str) -> str:
        return self._abs(key)

    async def exists(self, key: str) -> bool:
        return os.path.exists(self._abs(key))

    async def list_keys(self, prefix: str) -> list[str]:
        base_path = self._abs(prefix)
        keys = []
        if os.path.exists(base_path):
            for root, dirs, files in os.walk(base_path):
                for file in files:
                    full_path = os.path.join(root, file)
                    # Convert back to key format (relative to base_dir)
                    rel_path = os.path.relpath(full_path, self.base_dir)
                    key = rel_path.replace(os.sep, "/")
                    keys.append(key)
        return keys

class S3Storage(Storage):
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        if not settings.S3_BUCKET:
            raise RuntimeError("S3_BUCKET missing")
        self.bucket = settings.S3_BUCKET

    async def put_bytes(self, key: str, data: bytes, content_type: str | None = None) -> StoredObject:
        extra = {}
        if content_type:
            extra["ContentType"] = content_type
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, **extra)
        return StoredObject(key=key, size_bytes=len(data), content_type=content_type)

    async def put_stream(self, key: str, fileobj: BinaryIO, content_type: str | None = None) -> StoredObject:
        extra = {}
        if content_type:
            extra["ContentType"] = content_type
        self.s3.upload_fileobj(fileobj, self.bucket, key, ExtraArgs=extra or None)
        return StoredObject(key=key, content_type=content_type)

    async def get_path_or_presigned(self, key: str) -> str:
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=3600,
        )

    async def exists(self, key: str) -> bool:
        try:
            self.s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def list_keys(self, prefix: str) -> list[str]:
        keys = []
        paginator = self.s3.get_paginator('list_objects_v2')
        try:
            for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                if 'Contents' in page:
                    keys.extend([obj['Key'] for obj in page['Contents']])
        except Exception:
            pass
        return keys

def get_storage() -> Storage:
    if settings.STORAGE_BACKEND.lower() == "s3":
        return S3Storage()
    return LocalStorage(settings.LOCAL_STORAGE_DIR)

def new_id() -> str:
    return uuid.uuid4().hex
