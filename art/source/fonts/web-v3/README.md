# Web v3 typography sources and adopted rules subset

## Seat-only Regular subsets (2026-10-26)

Dynamic MatchScreen player names and prediction/won rows now use `WebV3Seat-WenKai-Regular-v1.woff2` (1,624,632 bytes,7544 codepoints) for CJK and `WebV3Seat-Tinos-Regular-v1.woff2` (5844 bytes,95 ASCII codepoints) for numbers/AI prefixes. Other labels/ranks retain their previous fonts. Both sources are unchanged Regular400; WenKai uses the same pinned commit below, Tinos follows the actual Google Fonts CSS2 URL saved in `seat-subsets-v1.json`. Existing unchanged OFL/public licenses are hash-checked. The earlier rejected Tinos **Bold rank** proof remains rejected and separate.

`tools/build-web-seat-fonts-v1.py` preserves all shaping/name/license features, uses the saved common-character charset, and refuses to overwrite the output. Full TTFs and DEV proof strings are excluded from production. Rare names still fall back to existing Noto; no user nicknames enter font artifacts. Chrome123 compares source TTFs;124/126 use production subsets. Native platform-font receipts and the remaining glyph/edge differences are documented in docs/64; matching ink boxes is not whole-page acceptance.

The rules content adopts LXGW WenKai Medium after same-state Chrome comparison. The common-character Medium UI subset continues wherever already referenced, including forms, shared gameplay HUD and lobby/results/ranking labels. Dynamic gameplay seats now use the separate Regular subsets above. Other gameplay text and Cocos retain their previous fonts. The full source fonts below are DEV comparison material, not production imports.

- Adopted source: LXGW WenKai Medium, unchanged upstream TTF.
- Upstream: https://github.com/lxgw/LxgwWenKai
- Pinned commit: `4becfb4d5cf0c92cfdb60a6e9b504bda43315325`.
- Font source: https://raw.githubusercontent.com/lxgw/LxgwWenKai/4becfb4d5cf0c92cfdb60a6e9b504bda43315325/fonts/TTF/LXGWWenKai-Medium.ttf
- SHA-256: `F4B8A34D1F838FE411540CB7C97B1C384AC9738A876C4104500BC42508B2312A`.
- License: downloaded unchanged upstream OFL 1.1 plus its stated additional permission, saved as `OFL-LXGW-WenKai.txt`; follow the full text, not a paraphrase.
- The alternative `KaiTi` proof uses the already-installed local Windows font solely for comparison. It is not copied, redistributed or added to the browser package.

## Second comparison candidate

- LXGW ZhenKai Slab GB Regular, unchanged upstream TTF; not selected.
- Official release: https://github.com/lxgw/LxgwZhenKai/releases/tag/v0.827
- SHA-256: `BF4EA8C39B51784469020120125715D3075137233FE337B5D0A7327F9DFC03BD`.
- License: unchanged `OFL-LXGW-ZhenKai.txt` from that release tag.
- The heading/body weight balance was less faithful than WenKai. This is a visual judgment, not a claim that the generated mock used either font.

## Production subset

`art/runtime/fonts/WebV3Rules-WenKai-Medium-v2.woff2`, 61,440 bytes, SHA-256 `CD8F69520C309F8F193D48BA5709A0AA33CEEF6AB8DA3FBEEFCD0E687B51A196`.

Reproduction with FontTools 4.51 and Brotli:

```powershell
python -m fontTools.subset art/source/fonts/web-v3/LXGWWenKai-Medium.ttf --text-file=src/components/WebRules.tsx --unicodes=U+0020-007E,U+00B7,U+2013-2014,U+2212,U+3000-303F --flavor=woff2 --layout-features='*' --no-hinting --recommended-glyphs --notdef-outline --name-IDs='*' --name-languages='*' --no-recalc-timestamp --output-file=art/runtime/fonts/WebV3Rules-WenKai-Medium-v2.woff2
```

All layout features and name/license metadata are retained. The font has `halt` and `chws`, not `palt`; portrait body text explicitly selects `halt` for proportional punctuation. Do not diagnose the initial four-line overflow merely as a missing `palt` table. Its final correction combines preserved features, `halt`, measured letter spacing and optical positioning.

Scope: rules headings, body, step labels, and settings labels only. Body uses weight 500 on PC; headings, settings labels and compact portrait copy use browser-synthesized 700. Numeric badges keep their original font. License is also shipped unchanged at `/licenses/LXGW-WenKai-OFL.txt`. Changed rules copy must be checked against the subset and regenerated if it introduces glyphs.

DEV-only examples: `?design-review=rules&typeface=wenkai`, `typeface=kai`, or `typeface=zhenkai`. The full-font URLs are DEV proof fixtures, not imports. Production JS must exclude the proof selector and fixture routes; neither full TTF should be emitted into `dist/assets`. The unused first WOFF2 candidate is not consumed.

Current Chrome evidence and limitations: `docs/22-web-v3-lobby-and-typography-calibration.md`; neither glyph similarity nor aligned ink bounds means the entire product has passed pixel fidelity.

## Common-character UI subset

`WebV3UI-WenKai-Medium-v1.woff2` is 1,672,512 bytes with 7,544 selected codepoints. SHA-256: `DFCBCA7D92004B07EB2EDBBB3B4EFF6E53E44AA84CB35140D17B0151A729827D`. It uses the same pinned TTF and unchanged shipped OFL license as the rules subset. `ui-charset-v1.txt` is the canonical saved glyph selection; `ui-subset-v1.json` records hashes and build limitations.

Scope: Chinese lobby labels and results/ranking title/name/action text, not numeric columns or Latin prefixes. The `Teahouse UI` CSS face has Unicode range `U+2E80-9FFF,U+F900-FAFF`, so ASCII digits, room codes and the `AI` prefix continue to use Noto Serif. Rare names not covered by this subset also fall back. Arbitrary user nickname data is never harvested into build artifacts.

`python tools/build-web-ui-font.py --version v2` builds a new version from GB2312 plus current source text; it refuses to overwrite existing evidence. Since current source may change, exact v1 reconstruction must use the saved `ui-charset-v1.txt` with the same FontTools subset options above, not rescan newer source text. New versions require an intentional CSS path update and fresh Chrome checks.

The v1 canonical charset retains its original Windows line ending with `-text` so its recorded SHA stays valid on checkout; future generator versions write explicit LF. Line endings do not change the selected glyph set, but do change the input-file hash.

Current comparison and live-flow evidence: `docs/23-web-v3-lobby-results-ink-calibration.md`. This change intentionally keeps Chinese optical ink separate from serif numeric columns; it is not a claim that ImageGen originally used this font.

## Room-code digit subset (2026-10-24)

The join form alone uses EB Garamond ExtraBold lining figures, `WebV3RoomCode-EBGaramond-ExtraBold-v1.woff2` (7,132 bytes, digits 0-9). This follows a Chrome side-by-side study of Noto Serif, Georgia, Times, Constantia, KaiTi, WenKai, ZhenKai, Cormorant Garamond and EB Garamond. It improves the sloping terminals and ink weight; it does not identify the generated source font or close all glyph differences. No other numeric columns were changed.

Pinned upstream inputs are `EBGaramond-Variable.ttf` and the unchanged `OFL-EBGaramond.txt`, downloaded from Google Fonts `ofl/ebgaramond` on 2026-10-24. The complete variable font remains source material only; production emits the digit subset. The unchanged license is also shipped at `public/licenses/EBGaramond-OFL.txt`. Input/output hashes and upstream URLs are in `room-code-subset-v1.json`.

Generation used FontTools 4.51.0:

```powershell
python -m fontTools.varLib.instancer art/source/fonts/web-v3/EBGaramond-Variable.ttf wght=800 --output=tmp/entry-calibration/EBGaramond-ExtraBold.ttf
python -m fontTools.subset tmp/entry-calibration/EBGaramond-ExtraBold.ttf --text=0123456789 --flavor=woff2 --layout-features='*' --no-hinting --recommended-glyphs --notdef-outline --name-IDs='*' --name-languages='*' --no-recalc-timestamp --output-file=art/runtime/fonts/WebV3RoomCode-EBGaramond-ExtraBold-v1.woff2
```

The original output is retained and hashed; no bit-identical regeneration claim is made for an unpinned instancer timestamp. CSS `line-height:1` and `min-height:0` are required: this font's normal line box otherwise expands the grid track and pushes its ink below the authored paper cells. Optical offsets are profile-specific and do not change the six-digit validation.

## Rejected number-card font proofs (2026-10-25)

The card study compared the existing Noto Serif SC700 with EB Garamond800 and Tinos700. The latter faces were rejected for rank shape/weight, especially8/6. Final card ranks still use the existing Noto import, with source-specific position, near-black ink and restrained width calibration. This does not change room-code typography.

`Tinos-Bold.ttf` came from the observed Google Fonts CSS2 URL; `OFL-Tinos.txt` and the matching public license are unchanged. `rank-subset-v1.json` retains exact URLs/hashes and marks the approximately3.6KB `WebV3Rank-Tinos-Bold-v1.woff2` as a rejected candidate, not a production import. The full experimental TTF and candidate WOFF2 must stay out of production. See docs/59 and the saved77–81 Chrome proofs; no generated-source font identity is claimed.

## Results-only genuine Bold face (2026-10-26)

`WebV3Results-Tinos-Bold-v1.woff2` is a separate current runtime subset: 5,876 bytes, 95 ASCII codepoints, genuine weight700/PostScript `Tinos-Bold`. It replaces synthetic Regular700 only for WebResults numerical columns and round numerals; the rejected card-rank subset above remains excluded. Source, runtime and unchanged OFL hashes are in `results-bold-subset-v1.json`, the official Google CSS receipt in `tinos-results-400-700-google-v1.css`, and the reproducible subset command in `tools/build-web-results-bold-font-v1.py`.

Chrome native-font receipt156 confirms the actual face. Current154 source-versus-Chrome comparisons still show numeral/name shape and sampling differences; this is not a claim that ImageGen used Tinos. Nicknames retain the seat WenKai Regular face with synthetic700 after comparing existing Regular/Medium/ZhenKai alternatives. Full TTFs and those probe styles do not enter production. See docs/68.
