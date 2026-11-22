# Recovery source portrait reconnecting: keyboard focus v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/15-reconnecting.png` (941 × 1672).

Raw candidate: `art/source/web-v3/recovery-source-v1/portrait-reconnecting-focus-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: keyboard-focus interaction-state candidate derived from the exact selected portrait reconnecting page.
Input images: Image1 is the complete original941 ×1672 source page, the sole edit target and source of truth for every pixel and component. Do not use any other recovery design or scene.
Primary request: add ONLY one restrained keyboard-focus outline around the existing parchment action button “立即重试”. The existing button's authored outer bounds are approximately x242,y983,width457,height104. Draw one continuous3px thin pale ivory-gold unfilled outline outside its existing authored shape, separated from the original button edge by a4px quiet dark-blue gap. Focus outline outer bounds approximately x235..706,y976..1094, with approximately17px rounded corners. The focus outline must not overlap, cover, alter or replace the original button border. It is a plain crisp focus ring, with no glow, sparkle, bloom, shadow, extra inner ring or filled backing.
Critical preservation: keep original “立即重试” label, its black handwritten typography, optical placement, paper material, authored button geometry and gold ornamental border completely unchanged. Keep the whole reconnecting modal, title “正在恢复连接”, all body copy, fine separators, corner decorations, dark-blue texture and every original page element unchanged. All original upper and lower scene pixels, players, names, stats, cards, table, lanterns and foreground props retain their original positions, sizes, colors and lighting. In particular the original selected gold glow around the underlying bottom-left hand card must remain untouched; this is focus-only editing, not hand cleanup.
Composition/framing: exact941 ×1672 full-page portrait canvas. Do not crop, zoom, recenter, reframe, resize, move or redraw components. Only new pixels are the single focus outline immediately around the action.
Text (verbatim): all original text unchanged, especially “立即重试”. No new wording or symbol.
Avoid: moving/rewording/resizing any component; new overlay or warning panel; changed body copy; changed button label/paper/border; focus ring on any other element; halo removal from underlying hand; glow/sparkles; duplicated outline; opaque/filled rectangle; altered full-page brightness; watermark.

## Integration contract

Keep raw output unchanged. Main retains bounded ring pixels only, normalizes coordinates and protects exact original body RGB. No whole-page replacement, post-processing, code, browser, runtime or canonical-design edits.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-b6c1413d-05f2-4274-a74b-355e2e5318d0.png`.
- Copied unchanged to candidate destination. Actual **941 ×1672 RGB**.
- Single-result visual inspection: one continuous pale ivory-gold unfilled outline surrounds original 立即重试 paper button; no visible glow/sparkles or duplicate focus ring. Original label, normal border and material remain structurally intact. Underlying leaf5 selection glow remains. Scene, modal text and overall components retain structural positions, not proven pixel-identical.
- Measured bright ring outer box **x230,y971,width480,height130** (bright threshold R>220,G>190,B>110 in the outer ring lane, excluding original button interior and lower-right modal cloud). Target outer box was approximately x235..706,y976..1094, so generated ring is roughly5px too far left/top,4px too far right and7px too far down, with larger corner radius/gap. Main should normalize ring geometry and protect all original body/button pixels.
- Straight-edge bright-core probe at y1034 gives x231,232,233 (3px); at x470 top lane gives y971,973,974 with uneven antialias/brightness. These are threshold samples, not a guarantee of exact continuous3px stroke or17px corner radius.
