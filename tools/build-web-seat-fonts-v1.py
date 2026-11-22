"""Versioned source-backed seat text subsets; no user text is collected."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from fontTools.ttLib import TTFont
from fontTools import version as fonttools_version

root = Path(__file__).resolve().parents[1]
charset = root / "art/source/fonts/web-v3/ui-charset-v1.txt"
jobs = [
    ("LXGWWenKai-Regular.ttf", "WebV3Seat-WenKai-Regular-v1.woff2", None,
     "https://raw.githubusercontent.com/lxgw/LxgwWenKai/4becfb4d5cf0c92cfdb60a6e9b504bda43315325/fonts/TTF/LXGWWenKai-Regular.ttf", "OFL-LXGW-WenKai.txt", "LXGW-WenKai-OFL.txt"),
    ("Tinos-Regular.ttf", "WebV3Seat-Tinos-Regular-v1.woff2", "".join(map(chr, range(32, 127))),
     "https://fonts.gstatic.com/s/tinos/v26/buE4poGnedXvwgX8.ttf", "OFL-Tinos.txt", "Tinos-OFL.txt"),
]
reports = []
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for name, output, text, url, license_name, public_name in jobs:
    source = root / "art/source/fonts/web-v3" / name
    runtime = root / "art/runtime/fonts" / output
    if runtime.exists():
        raise SystemExit(f"Refusing to overwrite {runtime}")
    with TTFont(source) as font:
        family = font['name'].getDebugName(1)
        weight = font['OS/2'].usWeightClass
    subprocess.run([sys.executable, "-m", "fontTools.subset", str(source),
                    f"--text={text}" if text is not None else f"--text-file={charset}",
                    "--flavor=woff2", "--layout-features=*", "--no-hinting",
                    "--recommended-glyphs", "--notdef-outline", "--name-IDs=*",
                    "--name-languages=*", "--no-recalc-timestamp", f"--output-file={runtime}"], check=True)
    with TTFont(runtime) as font:
        glyphs = len(font.getBestCmap())
    license_path = root / "art/source/fonts/web-v3" / license_name
    shipped_license = root / "public/licenses" / public_name
    if sha(license_path) != sha(shipped_license):
        raise SystemExit("Existing public license differs")
    reports.append({"source":source.relative_to(root).as_posix(), "sourceSha256":sha(source),
                    "upstream":url,"family":family,"weight":weight,
                    "runtime":runtime.relative_to(root).as_posix(),"runtimeSha256":sha(runtime),
                    "bytes":runtime.stat().st_size,"glyphs":glyphs,
                    "license":license_path.relative_to(root).as_posix(),"licenseSha256":sha(license_path),
                    "publicLicense":shipped_license.relative_to(root).as_posix()})
record = {"fontTools":fonttools_version,"charset":charset.relative_to(root).as_posix(),
          "charsetSha256":sha(charset),"scope":"PlayerSeat dynamic name and prediction/won text only. CJK Regular plus Times-style ASCII. Other UI, card ranks and Cocos unchanged; unsupported rare CJK fall back to existing Noto.","reports":reports}
(root / "art/source/fonts/web-v3/seat-subsets-v1.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(record,ensure_ascii=False))
