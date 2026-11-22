"""Preserve the rejected Tinos rank-font candidate and its OFL provenance."""
import hashlib
import json
from pathlib import Path
import shutil
from fontTools import subset, version as fonttools_version
from fontTools.ttLib import TTFont

source = Path("art/source/fonts/web-v3/Tinos-Bold.ttf")
license_path = Path("art/source/fonts/web-v3/OFL-Tinos.txt")
runtime = Path("art/runtime/fonts/WebV3Rank-Tinos-Bold-v1.woff2")
options = subset.Options()
options.layout_features = ["*"]
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
font = TTFont(source)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text="0123456789")
subsetter.subset(font)
font.flavor = "woff2"
font.save(runtime)
shipped_license = Path("public/licenses/Tinos-OFL.txt")
shutil.copyfile(license_path, shipped_license)
files = [source, license_path, runtime, shipped_license]
record = {
    "upstreamCss": "https://fonts.googleapis.com/css2?family=Tinos:wght@700&display=swap",
    "upstreamFont": "https://fonts.gstatic.com/s/tinos/v26/buE1poGnedXvwj1AW0Fp.ttf",
    "licenseUrl": "https://raw.githubusercontent.com/googlefonts/tinos/main/OFL.txt",
    "metadata": "https://raw.githubusercontent.com/google/fonts/main/ofl/tinos/METADATA.pb",
    "downloadDate": "2026-10-25",
    "fontTools": fonttools_version,
    "weight": 700,
    "codepoints": "U+0030-0039",
    "scope": "Rejected Web rank-font candidate; not imported by production. Final ranks retain Noto Serif SC with source geometry/ink calibration.",
    "proofs": {
        "noto": {"batch": 77, "sizeCqw": 34, "topPercent": 8.5, "leftPercent": 17},
        "garamond": {"batch": 78, "sizeCqw": 40, "topPercent": 9.1, "leftPercent": 17, "status": "rejected for rank shape"},
        "tinos": {"batch": 79, "sizeCqw": 40, "topPercent": 10, "leftPercent": 17, "status": "rejected after the source ink comparison; 8/6 were too heavy"},
    },
    "files": [{"path": str(p).replace("\\", "/"), "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],
}
Path("art/source/fonts/web-v3/rank-subset-v1.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"runtime": str(runtime), "bytes": runtime.stat().st_size, "glyphs": len(font.getBestCmap()), "license": "SIL OFL 1.1"}))
