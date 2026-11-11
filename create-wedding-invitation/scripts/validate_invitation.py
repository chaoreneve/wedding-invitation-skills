#!/usr/bin/env python3
"""Validate a generated wedding invitation directory."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from theme_palette import resolve_palette


PLACEHOLDERS = ("新郎姓名", "新娘姓名", "示例花园酒店", "TODO", "__INVITATION_CONFIG__")
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
THEME_PRESETS = {"classic", "chinese-red-paper", "custom"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    root = args.directory.resolve()
    errors: list[str] = []
    warnings: list[str] = []
    required_files = ("index.html", "styles.css", "print.css", "invite.js", "config.js", "invitation.json",
                      "materials.html", "assets/paper-warm.jpg", "assets/NOTICES.txt",
                      "assets/licenses/CC-BY-4.0.txt", "assets/licenses/CC0-1.0.txt")
    for name in required_files:
        if not (root / name).is_file():
            errors.append(f"missing required file: {name}")
    if errors:
        return report(errors, warnings)
    try:
        data = json.loads((root / "invitation.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid invitation.json: {exc}")
        return report(errors, warnings)
    for path, value in (
        ("couple.groom", data.get("couple", {}).get("groom")),
        ("couple.bride", data.get("couple", {}).get("bride")),
        ("event.dateDisplay", data.get("event", {}).get("dateDisplay")),
        ("event.venue", data.get("event", {}).get("venue")),
        ("event.address", data.get("event", {}).get("address")),
    ):
        if not isinstance(value, str) or not value.strip():
            errors.append(f"missing required text: {path}")
    if type(data.get("couple", {}).get("brideFirst")) is not bool:
        errors.append("couple.brideFirst must be explicitly set from the user's chosen name order")
    map_url = data.get("event", {}).get("mapUrl", "")
    if map_url:
        if not isinstance(map_url, str):
            errors.append("event.mapUrl must be a string")
        else:
            parsed_url = urlparse(map_url)
            if parsed_url.scheme != "https" or parsed_url.hostname != "www.amap.com":
                errors.append("event.mapUrl must be a verified HTTPS www.amap.com place link")
    datetime_value = data.get("event", {}).get("datetime", "")
    try:
        parsed = datetime.fromisoformat(datetime_value)
        if parsed.utcoffset() is None:
            errors.append("event.datetime must contain an explicit UTC offset")
    except (TypeError, ValueError):
        errors.append("event.datetime must be valid ISO 8601")
    timeline = data.get("timeline", [])
    if not isinstance(timeline, list):
        errors.append("timeline must be a list when provided")
    else:
        for index, item in enumerate(timeline):
            if not isinstance(item, dict) or any(not isinstance(item.get(key), str) or not item[key].strip() for key in ("time", "label")):
                errors.append(f"timeline[{index}] must contain time and label")
    for key in ("accent", "paper"):
        if not HEX.fullmatch(str(data.get("theme", {}).get(key, ""))):
            errors.append(f"theme.{key} must be a six-digit CSS hex color")
    try:
        resolve_palette(data.get('theme', {}))
    except ValueError as exc:
        errors.append(str(exc))
    noindex = data.get("privacy", {}).get("noindex")
    if not isinstance(noindex, bool):
        errors.append("privacy.noindex must be a boolean")
    serialized = json.dumps(data, ensure_ascii=False)
    for placeholder in PLACEHOLDERS:
        if placeholder in serialized:
            errors.append(f"placeholder remains in configuration: {placeholder}")
    media = data.get("media", {})
    paths = [media.get(key, "") for key in ("cover", "ending", "share", "music")]
    paths += [item.get("src", "") for item in media.get("gallery", []) if isinstance(item, dict)]
    for value in filter(None, paths):
        target = (root / value).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            errors.append(f"media path escapes the site directory: {value}")
            continue
        if not target.is_file():
            errors.append(f"missing media file: {value}")
    if not media.get("cover"):
        warnings.append("cover photo is missing; neutral placeholder will be shown")
    if not media.get("gallery"):
        warnings.append("gallery has no photos; labelled neutral placeholders will be shown")
    if not media.get("share") and not (media.get("ending") or media.get("cover")):
        warnings.append("share image is missing; select an existing cover or ending photo")
    html = (root / "index.html").read_text(encoding="utf-8")
    if 'href="./materials.html"' not in html:
        errors.append("missing accessible music/material attribution link")
    notices = (root / "assets/NOTICES.txt").read_text(encoding="utf-8")
    if "Kevin MacLeod" not in notices or "https://creativecommons.org/licenses/by/4.0/" not in notices:
        errors.append("bundled recording attribution is incomplete")
    if 'name="robots"' not in html:
        errors.append("index.html must contain a robots meta tag")
    for field in ("og:title", "og:description", "og:image"):
        if not re.search(rf'<meta\s+property=["\']{re.escape(field)}["\']\s+content=["\'][^"\']+["\']\s*/?>', html):
            errors.append(f"index.html must contain a static {field} meta tag")
    if re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'][^"\']*placeholder\.svg', html):
        warnings.append("share image is still a placeholder; add an approved photo before final sharing")
    image_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
    if image_match and urlparse(image_match.group(1)).scheme != "https":
        warnings.append("index.html og:image must be changed to the public absolute HTTPS image URL before WeChat sharing")
    return report(errors, warnings)


def report(errors: list[str], warnings: list[str]) -> int:
    for message in errors:
        print(f"ERROR: {message}")
    for message in warnings:
        print(f"WARNING: {message}")
    if errors:
        print(f"Validation failed with {len(errors)} error(s).")
        return 1
    print(f"Validation passed with {len(warnings)} warning(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
