#!/usr/bin/env python3
"""Remove MP3 metadata/artwork; optionally encode a smaller mobile BGM."""
import argparse
import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--compress", action="store_true", help="encode 96 kbps stereo MP3 using ffmpeg or imageio-ffmpeg")
args = parser.parse_args()
data = args.source.read_bytes()
original_hash = hashlib.sha256(data).hexdigest()
if data[:3] == b"ID3":
    if len(data) < 10 or any(value & 0x80 for value in data[6:10]):
        raise SystemExit("invalid ID3 header")
    size = sum(value << (7 * (3-index)) for index, value in enumerate(data[6:10]))
    footer = 10 if data[3] == 4 and data[5] & 0x10 else 0
    data = data[10+size+footer:]
if data[-128:-125] == b"TAG":
    data = data[:-128]
if not data or data[0] != 0xff or data[1] & 0xe0 != 0xe0:
    raise SystemExit("expected MPEG audio frame after metadata removal")
if args.compress:
    executable = shutil.which("ffmpeg")
    if not executable:
        try:
            import imageio_ffmpeg
            executable = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            raise SystemExit("Compression requires ffmpeg or the optional imageio-ffmpeg build dependency")
    with tempfile.TemporaryDirectory(prefix="licensed-bgm-") as temporary:
        source, target = Path(temporary)/"source.mp3", Path(temporary)/"mobile.mp3"
        source.write_bytes(data)
        subprocess.run([executable, "-hide_banner", "-loglevel", "error", "-i", str(source),
                        "-map_metadata", "-1", "-vn", "-codec:a", "libmp3lame", "-b:a", "96k",
                        "-id3v2_version", "0", "-write_id3v1", "0", str(target)], check=True)
        data = target.read_bytes()
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_bytes(data)
print("Downloaded recording SHA256:", original_hash)
print("Prepared BGM SHA256:", hashlib.sha256(data).hexdigest())
