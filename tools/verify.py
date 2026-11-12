#!/usr/bin/env python3
"""Offline repository and generator checks using synthetic data only."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CLASSIC = ROOT / "create-wedding-invitation"
WITNESS = ROOT / "create-witness-wedding-invitation"


def run(script, *args, succeeds=True):
    result = subprocess.run([sys.executable, str(script), *map(str, args)],
                            capture_output=True, text=True)
    if (result.returncode == 0) != succeeds:
        raise AssertionError(result.stdout + result.stderr)
    return result


class ReleaseChecks(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="wedding-skills-check-")
        self.addCleanup(self.temporary.cleanup)
        self.work = Path(self.temporary.name)

    def generate(self, skill, config, name="site"):
        source = self.work / f"{name}.json"
        source.write_text(json.dumps(config, ensure_ascii=False), encoding="utf-8")
        output = self.work / name
        filename = "create_invitation.py" if skill == CLASSIC else "create_witness_invitation.py"
        run(skill / "scripts" / filename, "--config", source, "--output", output)
        return output

    def test_skill_contract_and_repository_text(self):
        patterns = [r"/Users/[^/\s]+/", r"[A-Z]:\\Users\\[^\\\s]+\\",
                    r"gh[pousr]_[A-Za-z0-9]{30,}", r"AKIA[A-Z0-9]{16}",
                    r"-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----"]
        for skill in (CLASSIC, WITNESS):
            text = (skill / "SKILL.md").read_text(encoding="utf-8")
            front = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
            self.assertIsNotNone(front, skill.name)
            self.assertIn(f"name: {skill.name}\n", front.group(1) + "\n")
            self.assertRegex(front.group(1), r"(?m)^description: .+")
            for link in re.findall(r"\]\(([^)]+)\)", text):
                if "://" not in link:
                    self.assertTrue((skill / link.split("#")[0]).exists(), link)
            for path in skill.rglob("*"):
                self.assertFalse(path.is_symlink(), str(path.relative_to(ROOT)))
                if path.is_file() and path.suffix in {".md", ".py", ".mjs", ".js", ".css", ".html", ".yaml", ".json", ".svg"}:
                    content = path.read_text(encoding="utf-8")
                    for pattern in patterns:
                        self.assertIsNone(re.search(pattern, content), str(path.relative_to(ROOT)))

    def test_classic_themes_and_name_order(self):
        fixture = json.loads((ROOT / "examples/classic.json").read_text(encoding="utf-8"))
        for preset in ("classic", "chinese-red-paper", "custom"):
            config = copy.deepcopy(fixture)
            config["theme"] = {"preset": preset}
            if preset == "custom":
                config["theme"]["accent"] = "#28533F"
            site = self.generate(CLASSIC, config, preset)
            run(CLASSIC / "scripts/validate_invitation.py", site)
            resolved = json.loads((site / "invitation.json").read_text(encoding="utf-8"))
            self.assertIn("<title>周宁 &amp; 林一 · 婚礼邀请</title>", (site / "index.html").read_text(encoding="utf-8"))
            self.assertEqual(resolved["theme"]["preset"], preset)
            self.assertEqual(resolved["timeline"], [])
            self.assertEqual(resolved["media"]["music"], "")

    def test_witness_envelope_and_packaging(self):
        config = json.loads((ROOT / "examples/witness.json").read_text(encoding="utf-8"))
        site = self.generate(WITNESS, config, "no-photos")
        run(WITNESS / "scripts/validate_witness_invitation.py", site)
        self.assertIn('content="./assets/og-witness-letter.png"', (site / "index.html").read_text(encoding="utf-8"))
        run(WITNESS / "scripts/package_witness_invitation.py", site, "--output", self.work / "blocked.zip", succeeds=False)
        # A bundled decorative raster is a test fixture, not a sample portrait.
        fixture = WITNESS / "assets/witness-template/assets/og-witness-letter.png"
        config["media"]["gallery"] = [{"src": str(fixture), "alt": "检查用图形"}]
        config["sharing"] = {"url": "https://example.invalid/preview/"}
        site = self.generate(WITNESS, config, "photos")
        html = (site / "index.html").read_text(encoding="utf-8")
        self.assertIn('content="https://example.invalid/preview/assets/og-witness-letter.png"', html)
        self.assertNotIn('content="https://example.invalid/preview/assets/user/', html)
        archive = self.work / "witness.zip"
        run(WITNESS / "scripts/package_witness_invitation.py", site, "--output", archive)
        with zipfile.ZipFile(archive) as bundle:
            names = set(bundle.namelist())
            self.assertIn("assets/og-witness-letter.png", names)
            self.assertIn("index.html", names)
            for required in ("materials.html", "assets/NOTICES.txt", "assets/NOTICES.txt"):
                self.assertIn(required, names)
            self.assertNotIn("invitation.json", names)
            self.assertFalse(any(".." in Path(name).parts or Path(name).is_absolute() for name in names))

    def test_classic_package_and_unknown_fields(self):
        fixture = WITNESS / "assets/witness-template/assets/og-witness-letter.png"
        for skill, example in ((CLASSIC, "classic"), (WITNESS, "witness")):
            config = json.loads((ROOT / f"examples/{example}.json").read_text(encoding="utf-8"))
            config["unexpected_private_note"] = "must be rejected"
            source = self.work / f"invalid-{example}.json"
            source.write_text(json.dumps(config), encoding="utf-8")
            filename = "create_invitation.py" if skill == CLASSIC else "create_witness_invitation.py"
            run(skill / "scripts" / filename, "--config", source, "--output", self.work / f"invalid-{example}", succeeds=False)
            self.assertFalse((self.work / f"invalid-{example}").exists())
        config = json.loads((ROOT / "examples/classic.json").read_text(encoding="utf-8"))
        config["media"].update(cover=str(fixture), ending=str(fixture), gallery=[{"src": str(fixture), "alt": "检查用图形"}])
        site = self.generate(CLASSIC, config)
        archive = self.work / "classic.zip"
        run(CLASSIC / "scripts/package_invitation.py", site, "--output", archive)
        with zipfile.ZipFile(archive) as bundle:
            self.assertIn("index.html", bundle.namelist())
            self.assertNotIn("invitation.json", bundle.namelist())
            self.assertIn("materials.html", bundle.namelist())
            self.assertIn("assets/NOTICES.txt", bundle.namelist())

    def test_default_music_and_license_enforcement(self):
        for skill, example, validator, packager in (
            (CLASSIC, "classic", "validate_invitation.py", "package_invitation.py"),
            (WITNESS, "witness", "validate_witness_invitation.py", "package_witness_invitation.py"),
        ):
            config = json.loads((ROOT / f"examples/{example}.json").read_text(encoding="utf-8"))
            config["media"].pop("music")
            fixture = WITNESS / "assets/witness-template/assets/og-witness-letter.png"
            config["media"]["gallery"] = [{"src": str(fixture), "alt": "检查用图形"}]
            site = self.generate(skill, config, example)
            data = json.loads((site / "invitation.json").read_text(encoding="utf-8"))
            self.assertEqual(data["media"]["music"], "./assets/classic-bgm.mp3")
            run(skill / "scripts" / validator, site)
            archive = self.work / f"{example}-licensed.zip"
            run(skill / "scripts" / packager, site, "--output", archive)
            with zipfile.ZipFile(archive) as bundle:
                self.assertIn("assets/classic-bgm.mp3", bundle.namelist())
                self.assertIn("assets/NOTICES.txt", bundle.namelist())
                notices = bundle.read("assets/NOTICES.txt").decode("utf-8")
                self.assertIn("严禁商用", notices)
                self.assertIn("授权状态未确认", notices)
            (site / "assets/NOTICES.txt").unlink()
            run(skill / "scripts" / validator, site, succeeds=False)
            run(skill / "scripts" / packager, site, "--output", self.work / f"{example}-missing-credit.zip", succeeds=False)

    def test_original_asset_hashes(self):
        hashes = json.loads((ROOT / "asset-sources/ORIGINAL_SHA256.json").read_text())
        self.assertEqual(len(hashes), 6)
        for name, expected in hashes.items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), expected, name)
        original_music = "2a90743f9fb2cad7a74a2a01f309abb04a67d5c7eb7565bc315313bbbc7011b0"
        for skill, template in ((CLASSIC, "classic-template"), (WITNESS, "witness-template")):
            assets = skill / "assets" / template / "assets"
            self.assertEqual(hashlib.sha256((assets / "classic-bgm.mp3").read_bytes()).hexdigest(), original_music)
            self.assertFalse((assets / "canon-in-d-major.mp3").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
