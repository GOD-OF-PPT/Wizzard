# Web v3 typography sources and adopted rules subset

The rules content adopts LXGW WenKai Medium after same-state Chrome comparison. Lobby/results/ranking Chinese labels also use the separate common-character UI subset below. Forms, gameplay and the Cocos carrier retain their existing fonts. The full source fonts below are DEV comparison material, not production imports.

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
