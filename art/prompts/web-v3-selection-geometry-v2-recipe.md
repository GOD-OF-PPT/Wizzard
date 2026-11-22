# Web v3 选牌源稿v2：提示与可重建配方

日期2026-10-25。来源独立于Chrome实现；这是原ImageGen稿的局部修补/几何派生，不声称整张由新的一次生成完成。

1. 原始视觉来源：`art/mockups/web-v3/05-gameplay-final.png`（1672×941）和`portrait/05-gameplay-safe-v2.png`（941×1672）。只从原稿测量四张卡的纸面凸包、中心和角度，卡内数字/符号也来自原稿。
2. 露出桌面使用内置ImageGen局部生成。完整提示：`web-v3-hand-clean-landscape-v2.md`、`web-v3-hand-clean-portrait-v2.md`；候选：`art/source/web-v3/hand-clean-{landscape,portrait}-v2-candidate.png`。保留原稿外部HUD/人物/场景。
3. 未选动作“选择手牌”使用内置ImageGen生成。完整提示：`web-v3-select-idle-action-landscape-v1.md`、`web-v3-select-idle-action-portrait-v1.md`；候选：`art/source/web-v3/select-idle-action-{landscape,portrait}-v1-candidate.png`。
4. `tools/build-web-selection-source-v2.mjs <sharp-module-path>`按照140×210框、中心支点、选中上移12/零旋转、邻牌9、光圈低8合成。光圈使用既有ImageGen `art/runtime/web-v3/selected-halo.png`；最终171×231置于纸后，不使用运行卡面、运行字体或Chrome截图。RGBA采样/凸包掩膜和桌面边缘羽化均在脚本中显式记录。
5. 输出25未选和26完成帧各两画幅；仅手牌ROI及未选动作ROI允许变化。`selection-geometry-v2-provenance.json`逐项记录SHA-256、poses、ROI和changedOutsideRoi=0。
6. 由26的手牌变化区域派生14无计时v4和19出牌pending v2；保留各自原无时钟/提交文案与周围像素，`selection-geometry-v2-derivatives.json`记录哈希和变化范围。
7. 合同/测量保存于`art/source/web-v3/selection-geometry-v2*`；运行几何副本为`art/runtime/web-v3/selection-layout-v2.json`。候选只属于source，不导入生产。

历史拒用：旧selected-finish v1候选没有被选为来源；portrait-v1的29原生像素来自过时CSS幅度，不能用于现合同。175×247.8前层halo版本出现悬空底线，保留历史片段但不用。当前姿态不可反向按实现截图修改。

对照生成：`tools/review-web-selection-20261025.mjs <sharp-module-path>`；几何审计：`tools/audit-web-selection-geometry-v2.mjs`。两者消费保存的Chrome证据，不能自行制造浏览器捕获。报告见`docs/55-web-v3-selection-geometry-and-motion.md`；整页视觉P2仍未关闭。
