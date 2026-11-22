# Web v3：选牌源坐标、完成帧与真实动效

日期：2026-10-25。全范围目标继续 active；本轮关闭精确选牌完成帧的定义缺口和旋转导致的横向跳动，**整页视觉仍未通过**。

## 来源与当前八组

当前来源是独立设计合成，不取自实现截图。内置 ImageGen 先修补原稿中手牌移开后露出的漆桌及未选牌动作文字；随后仅将原稿四张卡纸像素依照既定合同作几何变换。原稿头像、HUD、桌景和其余文字没有随着实现改写。

| 状态 | 横屏与 portrait/ 下同名源稿 | 当前 Chrome 图 |
| --- | --- | --- |
| 未选择 | `25-gameplay-selection-idle-v2.png` | `idle-{profile}-chrome.png` |
| 选择完成 | `26-gameplay-selection-complete-v2.png` | `complete-{profile}-chrome.png` |
| 无倒计时选择 | `14-gameplay-notimer-selection-v4.png` | `notimer-{profile}-chrome.png` |
| 出牌提交中 | `19-play-pending-selection-v2.png` | `pending-{profile}-chrome.png` |

来源根目录 `art/mockups/web-v3/`；当前原图/全景联合图/无损手牌联合图/哈希和诊断均在 [selection-calibration-20261025](../art/review/web-v3/selection-calibration-20261025/index.html)。八张全景和八张聚焦联合图均已打开审视；左设计、右Chrome。

原05仍保留为初始美术/历史来源；当前选中完成帧以26为准。原无计时和pending也保留，通过局部派生进入新版本，不将旧稿覆盖。新未选态加入清单，成为 **30状态×两画幅**；26是已有选中状态的精确定义，不再额外计一个状态。八组当前图不能扩展成60组本轮重拍或通过。

完整提示及可重建路径见 [选牌生成与合成配方](../art/prompts/web-v3-selection-geometry-v2-recipe.md)。合同/来源/派生哈希分别为：

- `art/source/web-v3/selection-geometry-v2-contract.json`
- `art/source/web-v3/selection-geometry-v2-provenance.json`
- `art/source/web-v3/selection-geometry-v2-derivatives.json`
- `art/source/web-v3/selection-geometry-v2/{landscape,portrait}-measurement.json`

## 几何与实现

逻辑卡框140×210，旋转中心为卡框中心。选中卡保持横向中心，向上12设计像素、归零旋转并升到z=30；其余卡向选择两侧各让9设计像素。光环中心比抬起后的卡心低8设计像素，最终画布171×231，位于卡纸后方。位移随各画幅卡框比例缩放，不能重新固定成12/9/8 CSS像素。

`MatchScreen.tsx`从`art/runtime/web-v3/selection-layout-v2.json`读取原稿独立测量的四牌中心、基线和角度；其他手牌数继续按布局展开。`CardView`将卡面/动态数字放在同一face层，牌纸均匀缩至逻辑框的.955，效果层独立；按钮命中框和规则未改变。选牌140ms cubic-out，第一次确认出现560ms单次脉冲。

修复前105%纵向旋转支点在归零时产生约11 CSS px横屏、4.7 CSS px竖屏横移。现在支点50%/50%，两画幅选中卡横移接近零；源坐标与Chrome卡心最大轴向误差0.039199 CSS px。横屏实际抬升11.998657px；竖屏按比例约4.97786px。详见`geometry-audit.json`，这是逻辑几何证据，不是卡面逐像素AE=0。

早期175×247.8前层光圈产生悬空下边框，已拒用；旧片段保留。现在拟合光圈在卡纸后方，未使用额外固定CSS阴影。历史portrait-v1提示中的29原生像素源于旧12 CSS px实现，**明确作废**；不能将它用作当前设计合同。

## Chrome对照与五项保真面

当前批次63，PNG整数裁幅横屏1672×941、竖屏390×694，DPR约1。Windows横屏实际innerHeight=942的1行取整及舞台浮点边界逐图保存；竖屏正确innerWidth=390。字体loaded、图片解码和当前动作/选中状态均记录。两张60批次竖屏请求实际仍是横屏的截图已标记rejected，不能加入验收。

| 保真面 | 当前观察 | 后续修复 |
| --- | --- | --- |
| 字体 | 数字5/8/2/6笔形、部分昵称及状态字的字重/基线仍P2；pending字距也有差别 | 对照源数字近景校准真实字体；逐项复拍，不能将固定字图匹配扩展为动态字体通过 |
| 间距/布局 | 四牌逻辑中心、12/9/8端点已对齐；没有原支点横跳。头像名牌与本地“你”标牌的光学间距仍P2 | 按各profile测量席位/名牌，不改规则或头像身份迁就布局 |
| 颜色 | 朱漆/旧金/纸面方向保持；运行卡纸及符号局部更饱和/更平滑仍P2 | 在原卡近景基础上修复纸温/符号材质，保留原画外像素 |
| 图像 | 贴合光环改善；叶脉、山/结/日笔触与角纹，头像裁切/金框以及HUD材料仍P2。竖屏重采样更明显 | 逐张生产并检查对应栅格资源，禁止CSS/SVG或字符代画 |
| 内容 | 四牌5/8/2/6及中央7/3/1/9与来源同值；未选“选择手牌”、选中“确认出牌”、pending“出牌中”，无计时状态没有时钟家具 | 动态内容保留真实值，继续补其他独立交互状态和真实网络边界 |

八组都没有据此标记整页通过。相关P2已承接docs/43；差分均值等指标仅作定位，不设自动视觉通过阈值。

## 输入与动效分层

`61-native-selection-inputs-20261025.json`保存横/竖×鼠标/触摸×1–8牌逐张露出点，共144项，失败0。每步使用当前DOM观察到的露出面坐标发CDP原生输入，核对合法牌保持、非法牌解释、归零、抬升及z=30。八牌中间选择另存两侧让位与动作区无交叠记录。每个finally关闭触摸仿真。

这144项来自reduced-motion的DEV样例，只证明相应点和端点；不覆盖每个边缘、真手机或网络规则回放。

`62-live-selection-motion-20261025.json`来自真实本地练习第二轮的两张牌，reducedMotion=false：

- 首次选择青叶4时观察到140ms卡牌transition和560ms确认pulse均running。
- 稳定后Y=-11.9986，逻辑高209.975；倒计时29→28时两种动效都未重播。
- 取消后重新选中没有再次pulse。随后实际返回首页。
- 第一轮观察超时，未计为手动通过，失败尝试保留。

真实两牌练习截图只证明该流程，不能替代四牌设计同态比较。没有将DEV pending称为真实迟到/丢失ACK验收。

## 工程、证据与下一项

最终TypeScript、正式web构建和生产排除检查见当前目录`build.json`；源稿/捕获哈希核验另存。构建只证明工程结果。

手牌共用布局改变后，预测、chooser及其pending、恢复连接和终止连接底层手牌的旧50证据降为历史。接续[docs/56](56-web-v3-shared-hand-surface-recapture.md)已用64批次补齐十二组并逐张复核：当前为captured-and-reviewed-P2-remain，不能继承整页视觉通过。首页/表单/大厅/结果等未受此手牌变更的旧证据保留其原范围与P2。

下一项按当前源稿继续修复卡面/动态数字、头像/HUD，并补齐受影响状态的Chrome双画幅对照。其他hover/focus/校验组合、真实慢握手、延迟/丢失ACK、pending重连所有权、联网终局和重开仍缺；没有缩小全范围目标。

final result: blocked
