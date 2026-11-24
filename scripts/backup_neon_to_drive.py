#!/usr/bin/env python3
"""Encrypt a Neon pg_dump and upload it to a Google Drive Shared Drive folder.

The plaintext dump is removed whether upload succeeds or fails. The passphrase
is never stored in the backup file or printed to the workflow log.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

MAGIC = b"CJXDB01\x00"
SALT_BYTES = 16
NONCE_BYTES = 12
DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"]


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")
    return value


def derive_key(passphrase: str, salt: bytes) -> bytes:
    return hashlib.scrypt(
        passphrase.encode("utf-8"),
        salt=salt,
        n=2**15,
        r=8,
        p=1,
        dklen=32,
    )


def encrypt_backup(source: Path, encrypted_path: Path, passphrase: str) -> tuple[str, int]:
    plaintext = source.read_bytes()
    plaintext_sha256 = hashlib.sha256(plaintext).hexdigest()

    salt = os.urandom(SALT_BYTES)
    nonce = os.urandom(NONCE_BYTES)
    header = MAGIC + salt + nonce
    key = derive_key(passphrase, salt)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, header)

    encrypted_path.write_bytes(header + ciphertext)

    # Verify the encrypted payload locally before uploading it.
    stored = encrypted_path.read_bytes()
    stored_header = stored[: len(header)]
    recovered = AESGCM(key).decrypt(
        nonce,
        stored[len(header) :],
        stored_header,
    )
    if hashlib.sha256(recovered).hexdigest() != plaintext_sha256:
        raise RuntimeError("Local backup encryption verification failed.")

    return plaintext_sha256, encrypted_path.stat().st_size


def upload_to_drive(encrypted_path: Path, folder_id: str, service_account_json: str) -> dict:
    try:
        account_info = json.loads(service_account_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.") from exc

    credentials = service_account.Credentials.from_service_account_info(
        account_info,
        scopes=DRIVE_SCOPE,
    )
    drive = build("drive", "v3", credentials=credentials, cache_discovery=False)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    file_name = f"cyberjocx-neon-weekly-{timestamp}.dump.enc"
    media = MediaFileUpload(
        str(encrypted_path),
        mimetype="application/octet-stream",
        resumable=True,
        chunksize=8 * 1024 * 1024,
    )
    created = drive.files().create(
        body={
            "name": file_name,
            "mimeType": "application/octet-stream",
            "parents": [folder_id],
            "description": (
                "Encrypted CyberJocx Neon PostgreSQL backup. "
                "Restore instructions: docs/BACKUP_TO_GOOGLE_DRIVE.md"
            ),
        },
        media_body=media,
        fields="id,name,size,createdTime,webViewLink",
        supportsAllDrives=True,
    ).execute()

    file_id = created.get("id")
    if not file_id:
        raise RuntimeError("Google Drive did not return an uploaded file ID.")

    verified = drive.files().get(
        fileId=file_id,
        fields="id,name,size,createdTime,webViewLink",
        supportsAllDrives=True,
    ).execute()

    expected_size = encrypted_path.stat().st_size
    actual_size = int(verified.get("size", -1))
    if actual_size != expected_size:
        raise RuntimeError(
            f"Uploaded backup size verification failed: expected {expected_size}, got {actual_size}."
        )

    return verified


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to the temporary pg_dump file.")
    args = parser.parse_args()

    source = Path(args.input).resolve()
    encrypted_path = source.with_name(source.name + ".enc")

    try:
        if not source.is_file() or source.stat().st_size == 0:
            raise RuntimeError("The PostgreSQL dump is missing or empty.")

        folder_id = required_env("GOOGLE_DRIVE_FOLDER_ID")
        service_account_json = required_env("GOOGLE_SERVICE_ACCOUNT_JSON")
        passphrase = required_env("BACKUP_ENCRYPTION_PASSPHRASE")
        if len(passphrase) < 32:
            raise RuntimeError("BACKUP_ENCRYPTION_PASSPHRASE must contain at least 32 characters.")

        sha256, encrypted_size = encrypt_backup(source, encrypted_path, passphrase)
        uploaded = upload_to_drive(encrypted_path, folder_id, service_account_json)

        print("Backup encrypted, uploaded and size-verified.")
        print(f"Drive filename: {uploaded.get('name', 'unknown')}")
        print(f"Encrypted bytes: {encrypted_size}")
        print(f"Plaintext SHA-256: {sha256}")
        print(f"Drive file ID: {uploaded['id']}")
        if uploaded.get("webViewLink"):
            print(f"Drive link: {uploaded['webViewLink']}")
        return 0
    except Exception as exc:
        # Avoid printing credential material or connection strings.
        print(f"Backup failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    finally:
        for path in (source, encrypted_path):
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
