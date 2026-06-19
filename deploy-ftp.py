#!/usr/bin/env python3
"""Sube el sitio Honda Baterías al hosting Piensa Solutions por FTP."""

import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UPLOAD_DIRS = ("config", "css", "data", "images", "js")
UPLOAD_FILES = ("index.html",)
REMOTE_ROOT = "public_html"


def env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"Falta variable de entorno: {name}")
        sys.exit(1)
    return value


def ensure_remote_dir(ftp: FTP, path: str) -> None:
    parts = [p for p in path.split("/") if p]
    for i in range(len(parts)):
        sub = "/".join(parts[: i + 1])
        try:
            ftp.cwd(sub)
        except error_perm:
            ftp.mkd(sub)
            ftp.cwd(sub)
    ftp.cwd("/")


def upload_file(ftp: FTP, local: Path, remote: str) -> None:
    with local.open("rb") as handle:
        ftp.storbinary(f"STOR {remote}", handle)
    print(f"  OK {remote}")


def upload_tree(ftp: FTP, local_dir: Path, remote_dir: str) -> None:
    ensure_remote_dir(ftp, remote_dir)
    for item in sorted(local_dir.rglob("*")):
        if item.is_dir():
            continue
        rel = item.relative_to(local_dir).as_posix()
        remote_path = f"{remote_dir}/{rel}"
        remote_parent = "/".join(remote_path.split("/")[:-1])
        ensure_remote_dir(ftp, remote_parent)
        upload_file(ftp, item, remote_path)


def main() -> None:
    host = env("FTP_HOST")
    user = env("FTP_USER")
    password = env("FTP_PASS")
    remote_root = os.environ.get("FTP_REMOTE_DIR", REMOTE_ROOT).strip() or REMOTE_ROOT

    print(f"Conectando a {host}...")
    ftp = FTP(host, timeout=60)
    ftp.login(user, password)
    print(f"Conectado. Subiendo a /{remote_root}/")

    for filename in UPLOAD_FILES:
        local = ROOT / filename
        if not local.exists():
            print(f"  Falta archivo local: {filename}")
            sys.exit(1)
        upload_file(ftp, local, f"{remote_root}/{filename}")

    for dirname in UPLOAD_DIRS:
        local_dir = ROOT / dirname
        if not local_dir.is_dir():
            print(f"  Falta carpeta local: {dirname}")
            sys.exit(1)
        print(f"Carpeta {dirname}/")
        upload_tree(ftp, local_dir, f"{remote_root}/{dirname}")

    ftp.quit()
    print("\nDespliegue completado: https://hondabateriacali.com")


if __name__ == "__main__":
    main()
