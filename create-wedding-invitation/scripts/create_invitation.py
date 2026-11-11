#!/usr/bin/env python3
"""Create a static wedding invitation from a JSON configuration."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from copy import deepcopy
from html import escape
from pathlib import Path
from urllib.parse import urljoin
from theme_palette import resolve_palette


DEFAULTS = {
    "timeline": [],
    "copy": {
        "eyebrow": "The Exhibition of",
        "title": "Our Journey",
        "invitation": "诚邀您参加我们的婚礼",
        "galleryTitle": "爱的放映厅",
        "galleryIntro": "那些明亮而珍贵的瞬间，连成一段关于我们的故事。",
        "closing": "每一次相遇，都会激起一圈涟漪。",
        "signature": "With love and gratitude",
    },
    "theme": {"preset": "classic", "accent": "#8b3a3a", "paper": "#f4efe5"},
    "privacy": {"noindex": True},
    "media": {"cover": "", "ending": "", "share": "", "music": "", "gallery": []},
}

PRESET_DEFAULTS = {
    "chinese-red-paper": {"accent": "#a61b1b", "paper": "#f7ead2"},
}
DEFAULT_MUSIC = "./assets/canon-in-d-major.mp3"
ALLOWED_FIELDS = {
    "": {"couple", "event", "timeline", "copy", "theme", "privacy", "media", "sharing"},
    "couple": {"groom", "bride", "brideFirst"},
    "event": {"datetime", "dateDisplay", "venue", "address", "mapUrl", "dresscode"},
    "copy": {"eyebrow", "title", "invitation", "galleryTitle", "galleryIntro", "closing", "signature"},
    "theme": {"preset", "accent", "paper", "surface", "surfaceDark", "metallic", "text", "surfaceText", "darkText", "card", "cardText", "texture"},
    "privacy": {"noindex"},
    "media": {"cover", "ending", "share", "music", "gallery"},
    "sharing": {"url"},
    "media.gallery[]": {"src", "title", "caption", "alt"},
    "timeline[]": {"time", "label"},
}


def reject_unknown_fields(data: dict) -> None:
    """Do not publish stray notes or credentials through config.js."""
    def check(value: object, location: str) -> None:
        if not isinstance(value, dict):
            raise ValueError(f"{location or 'configuration'} must be an object")
        unexpected = set(value) - ALLOWED_FIELDS[location]
        if unexpected:
            raise ValueError(f"unsupported field at {location or 'configuration'}: {', '.join(sorted(unexpected))}")
    check(data, "")
    for section in ("couple", "event", "copy", "theme", "privacy", "media", "sharing"):
        if section in data:
            check(data[section], section)
    for section in ("timeline", "media.gallery"):
        values = data.get("media", {}).get("gallery", []) if section == "media.gallery" else data.get(section, [])
        if not isinstance(values, list):
            raise ValueError(f"{section} must be a list")
        for value in values:
            check(value, section + "[]")


def merge(base: dict, incoming: dict) -> dict:
    result = deepcopy(base)
    for key, value in incoming.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge(result[key], value)
        else:
            result[key] = value
    return result


def copy_media(config: dict, source_dir: Path, output: Path) -> None:
    assets = output / "assets" / "user"
    assets.mkdir(parents=True, exist_ok=True)
    used_names: set[str] = set()

    def copy_one(value: str, label: str) -> str:
        if not value:
            return ""
        source = (source_dir / value).resolve() if not Path(value).is_absolute() else Path(value).resolve()
        if not source.is_file():
            raise ValueError(f"Missing {label} file: {source}")
        allowed = {".mp3", ".m4a", ".ogg", ".wav"} if label == "media.music" else {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
        if source.suffix.lower() not in allowed:
            raise ValueError(f"Unsupported {label} file type: {source.suffix}")
        name = source.name
        if name in used_names:
            stem, suffix, index = source.stem, source.suffix, 2
            while f"{stem}-{index}{suffix}" in used_names:
                index += 1
            name = f"{stem}-{index}{suffix}"
        used_names.add(name)
        shutil.copy2(source, assets / name)
        return f"./assets/user/{name}"

    media = config["media"]
    for key in ("cover", "ending", "share", "music"):
        media[key] = copy_one(media.get(key, ""), f"media.{key}")
    for index, item in enumerate(media.get("gallery", [])):
        item["src"] = copy_one(item.get("src", ""), f"media.gallery[{index}].src")

    if not media.get("share"):
        first_gallery = next((item.get("src", "") for item in media.get("gallery", []) if item.get("src")), "")
        media["share"] = media.get("cover") or first_gallery or media.get("ending") or ""


def write_static_share_metadata(path: Path, config: dict) -> None:
    """Write crawler-readable sharing values into the initial HTML."""
    couple = config.get("couple", {})
    first = couple.get("bride") if couple.get("brideFirst") else couple.get("groom")
    second = couple.get("groom") if couple.get("brideFirst") else couple.get("bride")
    names = " & ".join(value for value in (first, second) if value)
    event = config.get("event", {})
    invitation = config.get("copy", {}).get("invitation", "诚邀您参加我们的婚礼")
    displayed_date = event.get("dateDisplay", "")
    clock = re.search(r"T(\d{2}):(\d{2})", event.get("datetime", ""))
    if clock and not re.search(r"\d{1,2}:\d{2}|\d{1,2}点", displayed_date):
        displayed_date = f"{displayed_date} {clock.group(1)}:{clock.group(2)}"
    details = "，".join(value for value in (displayed_date, event.get("venue")) if value)
    title = f"{names} · 婚礼邀请" if names else "婚礼邀请"
    description = f"{details}。{invitation}" if details else invitation
    image = config.get("media", {}).get("share") or "./assets/placeholder.svg"
    public_url = config.get("sharing", {}).get("url", "")
    if public_url:
        image = urljoin(public_url, image)

    html = path.read_text(encoding="utf-8")
    replacements = {
        '<title>婚礼邀请</title>': f'<title>{escape(title)}</title>',
        '<meta name="description" content="诚邀您参加我们的婚礼" />': f'<meta name="description" content="{escape(description, quote=True)}" />',
        '<meta property="og:title" content="婚礼邀请" />': f'<meta property="og:title" content="{escape(title, quote=True)}" />',
        '<meta property="og:description" content="诚邀您参加我们的婚礼" />': f'<meta property="og:description" content="{escape(description, quote=True)}" />',
        '<meta property="og:image" content="./assets/placeholder.svg" />': f'<meta property="og:image" content="{escape(image, quote=True)}" />',
    }
    for old, new in replacements.items():
        html = html.replace(old, new)
    path.write_text(html, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    config_path, output = args.config.resolve(), args.output.resolve()
    if not config_path.is_file():
        parser.error(f"configuration not found: {config_path}")
    if output.exists():
        parser.error(f"output already exists; choose a new folder: {output}")
    try:
        supplied = json.loads(config_path.read_text(encoding="utf-8"))
        if not isinstance(supplied, dict):
            raise ValueError('configuration must be an object')
        reject_unknown_fields(supplied)
        couple = supplied.get("couple", {})
        if not isinstance(couple, dict) or type(couple.get("brideFirst")) is not bool:
            raise ValueError("couple.brideFirst must be explicitly set from the user's chosen name order")
        supplied_media = supplied.get("media", {})
        use_default_music = not isinstance(supplied_media, dict) or "music" not in supplied_media
        supplied['theme'] = resolve_palette(supplied.get('theme', {}))
        config = merge(DEFAULTS, supplied)
        supplied_theme = supplied.get("theme", {}) if isinstance(supplied, dict) else {}
        preset_defaults = PRESET_DEFAULTS.get(config["theme"].get("preset"), {})
        for key, value in preset_defaults.items():
            if key not in supplied_theme:
                config["theme"][key] = value
        template = Path(__file__).resolve().parent.parent / "assets" / "classic-template"
        shutil.copytree(template, output)
        copy_media(config, config_path.parent, output)
        if use_default_music:
            config["media"]["music"] = DEFAULT_MUSIC
        write_static_share_metadata(output / "index.html", config)
        config_text = json.dumps(config, ensure_ascii=False, indent=2).replace("</", "<\\/")
        config_js = output / "config.js"
        config_js.write_text(config_js.read_text(encoding="utf-8").replace("__INVITATION_CONFIG__", config_text), encoding="utf-8")
        (output / "invitation.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        if output.exists():
            shutil.rmtree(output)
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"Created invitation: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
