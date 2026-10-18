"""Build a versioned browser UI font subset, never the Cocos font bundle.

GB2312 common glyphs cover ordinary guest names; all current web source text is
included too. Less-common Unicode names retain the existing Noto fallback.
The upstream TTF and license are not modified. FontTools/Brotli are required.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import argparse
import re
from pathlib import Path

from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--version", default="v1")
args = parser.parse_args()
if not re.fullmatch(r"v[1-9][0-9]*", args.version):
    raise SystemExit("Version must be v1, v2, ...")
source = root / "art/source/fonts/web-v3/LXGWWenKai-Medium.ttf"
output = root / f"art/runtime/fonts/WebV3UI-WenKai-Medium-{args.version}.woff2"
charset = root / f"art/source/fonts/web-v3/ui-charset-{args.version}.txt"
report = root / f"art/source/fonts/web-v3/ui-subset-{args.version}.json"
if any(path.exists() for path in (output, charset, report)):
    raise SystemExit("Versioned output exists. Choose a new version, do not overwrite evidence.")

requested = set(range(0x20, 0x7F))
for lead in range(0xA1, 0xF8):
    for trail in range(0xA1, 0xFF):
        try:
            requested.update(map(ord, bytes((lead, trail)).decode("gb2312")))
        except UnicodeDecodeError:
            pass
for path in (root / "src").rglob("*"):
    if path.suffix in (".ts", ".tsx"):
        requested.update(ord(char) for char in path.read_text(encoding="utf-8") if not char.isspace())
requested.update((0xB7, 0x2013, 0x2014, 0x2212))
with TTFont(source) as font:
    available = set(font.getBestCmap())
selected = requested & available
with charset.open("w", encoding="utf-8", newline="\n") as target:
    target.write("".join(map(chr, sorted(selected))) + "\n")
subprocess.run([
    sys.executable, "-m", "fontTools.subset", str(source),
    f"--text-file={charset}", "--flavor=woff2", "--layout-features=*",
    "--no-hinting", "--recommended-glyphs", "--notdef-outline",
    "--name-IDs=*", "--name-languages=*", "--no-recalc-timestamp",
    f"--output-file={output}",
], check=True)
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest().upper()
data = {
    "source": source.relative_to(root).as_posix(), "sourceSha256": digest(source),
    "runtime": output.relative_to(root).as_posix(), "runtimeSha256": digest(output),
    "bytes": output.stat().st_size, "glyphs": len(selected),
    "charset": charset.relative_to(root).as_posix(), "charsetSha256": digest(charset),
    "recipe": "GB2312 + all current src .ts/.tsx characters + ASCII/punctuation; all layout/name/license features retained",
    "fallbackCodepoints": [f"U+{value:04X}" for value in sorted(requested - available)],
    "limitation": "Not a universal nickname font. Unsupported glyphs use existing Noto fallback; no user text enters build artifacts.",
}
with report.open("w", encoding="utf-8", newline="\n") as target:
    target.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(data, ensure_ascii=False))
