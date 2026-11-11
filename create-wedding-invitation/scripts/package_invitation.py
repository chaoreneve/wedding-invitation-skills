#!/usr/bin/env python3
"""Validate and package a generated wedding invitation for static hosting."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path


RUNTIME_FILES = {
    "index.html", "config.js", "invite.js", "gallery-player.js",
    "styles.css", "print.css", "composition.css", "gallery-player.css",
    "location-card.css", "mobile-pages.css", "music-control.css",
    "theme-palette.css", "theme-presets.css",
    "assets/placeholder.svg", "assets/paper-warm.jpg", "materials.html",
    "assets/NOTICES.txt", "assets/licenses/CC-BY-4.0.txt", "assets/licenses/CC0-1.0.txt",
}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
PRIVATE_METADATA_MARKERS = (b"Exif\x00\x00", b"<x:xmpmeta", b"http://ns.adobe.com/xap/1.0/", b"eXIf", b"EXIF")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    site = args.site.resolve()
    output = (args.output or site.parent / f"{site.name}-site.zip").resolve()
    if not site.is_dir():
        parser.error(f"site directory not found: {site}")
    if output.exists():
        parser.error(f"output already exists: {output}")
    try:
        output.relative_to(site)
        parser.error("place the ZIP outside the site directory")
    except ValueError:
        pass

    validator = Path(__file__).resolve().with_name("validate_invitation.py")
    result = subprocess.run([sys.executable, str(validator), str(site)], check=False)
    if result.returncode:
        return result.returncode

    data = json.loads((site / "invitation.json").read_text(encoding="utf-8"))
    media = data.get("media", {})
    selected = set(RUNTIME_FILES)
    for value in [*(media.get(key, "") for key in ("cover", "ending", "share", "music")),
                  *(item.get("src", "") for item in media.get("gallery", []) if isinstance(item, dict))]:
        if value:
            selected.add(value.removeprefix("./"))
    files = []
    for name in sorted(selected):
        relative = Path(name)
        path = site / relative
        if (relative.is_absolute() or ".." in relative.parts or
            (name not in RUNTIME_FILES and name != "assets/canon-in-d-major.mp3" and not name.startswith("assets/user/")) or
            not path.resolve().is_relative_to(site) or path.is_symlink() or not path.is_file()):
            print(f"error: invalid release file: {name}", file=sys.stderr)
            return 1
        if name.startswith("assets/user/") and path.suffix.lower() in IMAGE_SUFFIXES:
            content = path.read_bytes()
            if any(marker in content for marker in PRIVATE_METADATA_MARKERS):
                print(f"error: photo metadata may expose private information: {name}; remove EXIF/XMP before packaging", file=sys.stderr)
                return 1
        files.append((relative, path))
    if not any(relative.as_posix() == "index.html" for relative, _ in files):
        print("error: index.html is missing from package", file=sys.stderr)
        return 1

    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for relative, path in sorted(files):
                info = zipfile.ZipInfo(relative.as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes())
    except OSError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"Created hosting ZIP: {output}")
    print(f"Files: {len(files)}")
    print(f"SHA256: {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
