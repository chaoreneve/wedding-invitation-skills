#!/usr/bin/env python3
"""Preflight or publish a static invitation to Cloudflare Pages."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path


PROJECT = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,56}[a-z0-9])?$")


def find_wrangler() -> list[str] | None:
    executable = shutil.which("wrangler")
    if executable:
        return [executable]
    npx = shutil.which("npx")
    if npx:
        probe = subprocess.run(
            [npx, "--no-install", "wrangler", "--version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if probe.returncode == 0:
            return [npx, "--no-install", "wrangler"]
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    parser.add_argument("--project", required=True)
    parser.add_argument("--branch")
    parser.add_argument("--publish", action="store_true", help="perform the public upload")
    args = parser.parse_args()
    site = args.site.resolve()
    if not site.is_dir() or not (site / "index.html").is_file():
        parser.error(f"validated site directory not found: {site}")
    if not PROJECT.fullmatch(args.project):
        parser.error("project must use lowercase letters, digits, and hyphens")
    packager = Path(__file__).resolve().with_name("package_invitation.py")
    wrangler = find_wrangler()
    if not wrangler:
        print("error: Wrangler is not installed. Install it explicitly, then run `wrangler login`.", file=sys.stderr)
        return 2
    with tempfile.TemporaryDirectory(prefix="classic-invite-release-") as temporary:
        archive = Path(temporary) / "release.zip"
        packaged = subprocess.run(
            [sys.executable, str(packager), str(site), "--output", str(archive)], check=False
        )
        if packaged.returncode:
            return packaged.returncode
        print(f"Site: {site}")
        print(f"Project: {args.project}.pages.dev")
        print("Access: public to anyone with the URL")
        if not args.publish:
            print("Preflight passed. Re-run with --publish only after explicit public-upload confirmation.")
            return 0
        release = Path(temporary) / "site"
        release.mkdir()
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(release)
        command = [*wrangler, "pages", "deploy", str(release), "--project-name", args.project]
        if args.branch:
            command.extend(["--branch", args.branch])
        print("Publishing reviewed release files to Cloudflare Pages...")
        return subprocess.run(command, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
