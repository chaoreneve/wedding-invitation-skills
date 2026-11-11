#!/usr/bin/env python3
"""Validate and ZIP only the files needed for a witness-mode invitation."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import zipfile
from pathlib import Path

RUNTIME_FILES = {
    "index.html", "config.js", "styles.css", "witness.css", "witness.js",
    "assets/placeholder.svg", "assets/背景1.jpg", "assets/water-ripple-bg.png", "assets/og-witness-letter.png",
}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
PRIVATE_METADATA_MARKERS = (
    b"Exif\x00\x00", b"<x:xmpmeta", b"http://ns.adobe.com/xap/1.0/", b"eXIf", b"EXIF",
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--allow-placeholders", action="store_true",
                        help="only after explicit approval of a photo-free final invitation")
    args = parser.parse_args()
    root, output = args.directory.resolve(), args.output.resolve()
    if not root.is_dir():
        parser.error(f"site directory not found: {root}")
    if output.exists():
        parser.error(f"output exists: {output}")
    if output.is_relative_to(root):
        parser.error("place the ZIP outside the site directory")

    validator = Path(__file__).resolve().with_name("validate_witness_invitation.py")
    if subprocess.run([sys.executable, str(validator), str(root)], check=False).returncode:
        return 1
    data = json.loads((root / "invitation.json").read_text(encoding="utf-8"))
    media = data.get("media", {})
    if not media.get("gallery") and not args.allow_placeholders:
        print("error: photo placeholders remain; add photos or explicitly approve a photo-free final version", file=sys.stderr)
        return 1

    selected = set(RUNTIME_FILES)
    for key in ("share", "music", "missionProof", "accepted"):
        if media.get(key):
            selected.add(media[key].removeprefix("./"))
    for item in media.get("gallery", []):
        for key in ("src", "largeSrc"):
            if item.get(key):
                selected.add(item[key].removeprefix("./"))

    files = []
    for name in sorted(selected):
        relative = Path(name)
        path = root / relative
        if (relative.is_absolute() or ".." in relative.parts or
            (name not in RUNTIME_FILES and name != "assets/classic-bgm.mp3" and not name.startswith("assets/user/")) or
            not path.resolve().is_relative_to(root) or path.is_symlink() or not path.is_file()):
            print(f"error: invalid release file: {name}", file=sys.stderr)
            return 1
        if name.startswith("assets/user/") and path.suffix.lower() in IMAGE_SUFFIXES:
            content = path.read_bytes()
            if any(marker in content for marker in PRIVATE_METADATA_MARKERS):
                print(f"error: photo metadata may expose private information: {name}; remove EXIF/XMP before packaging", file=sys.stderr)
                return 1
        files.append((relative, path))

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative, path in files:
            archive.write(path, relative.as_posix())
    print(f"Created hosting ZIP: {output}")
    print(f"Files: {len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
