"""A genuine Bold face for live results, instead of browser synthetic weight."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import version as fonttools_version
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[1]
source=root/'art/source/fonts/web-v3/Tinos-Bold.ttf'
output=root/'art/runtime/fonts/WebV3Results-Tinos-Bold-v1.woff2'
if output.exists():raise SystemExit('Refusing to overwrite versioned font')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
with TTFont(source)as f:
    if f['OS/2'].usWeightClass!=700 or f['name'].getDebugName(6)!='Tinos-Bold':raise SystemExit('Wrong face')
subprocess.run([sys.executable,'-m','fontTools.subset',str(source),'--text='+''.join(map(chr,range(32,127))),'--flavor=woff2','--layout-features=*','--no-hinting','--recommended-glyphs','--notdef-outline','--name-IDs=*','--name-languages=*','--no-recalc-timestamp','--output-file='+str(output)],check=True)
license=root/'art/source/fonts/web-v3/OFL-Tinos.txt'
if sha(license)!=sha(root/'public/licenses/Tinos-OFL.txt'):raise SystemExit('License mismatch')
record=dict(source=str(source.relative_to(root)).replace('\\','/'),sourceSha256=sha(source),upstream='https://fonts.gstatic.com/s/tinos/v26/buE1poGnedXvwj1AW0Fp.ttf',runtime=str(output.relative_to(root)).replace('\\','/'),runtimeSha256=sha(output),bytes=output.stat().st_size,fontTools=fonttools_version,family='Tinos',postscript='Tinos-Bold',weight=700,codepoints=95,license=str(license.relative_to(root)).replace('\\','/'),licenseSha256=sha(license),publicLicense='public/licenses/Tinos-OFL.txt',scope='Web results score/rank and round numerals; other UI typography unchanged')
(root/'art/source/fonts/web-v3/results-bold-subset-v1.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(record))
