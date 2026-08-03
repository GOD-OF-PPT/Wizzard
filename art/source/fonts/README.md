# 字体来源与子集说明

本项目运行时字体由本机安装的 Noto SC 可变字体生成静态字重并按牌桌、好友房和结算文案做字符子集。原始可变字体不进入仓库，运行时只分发 `art/runtime/fonts/` 下的两个子集 TTF。

## 来源

| 用途 | 本机源文件 | 源文件 SHA-256 | 静态字重 | 上游项目 |
| --- | --- | --- | --- | --- |
| 界面与辅助文案 | `C:\Windows\Fonts\NotoSansSC-VF.ttf`，17,773,244 bytes | `763146584CF0710223441356B4395E279021B0806C196614377A7A0174AE074A` | Medium，`wght=500` | [Noto Sans CJK](https://github.com/notofonts/noto-cjk/tree/main/Sans) |
| 标题与展示文字 | `C:\Windows\Fonts\NotoSerifSC-VF.ttf`，25,129,160 bytes | `A4AED9985A5916FBF6690456F8732A9FCCD517938E353165D4142B4F11A39280` | SemiBold，`wght=600` | [Noto Serif CJK](https://github.com/notofonts/noto-cjk/tree/main/Serif) |

源字体元数据中的版权声明分别为：

- Noto Sans SC：`© 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'.`
- Noto Serif SC：`© 2017-2023 Adobe (http://www.adobe.com/).`

两者均按 [SIL Open Font License 1.1](LICENSE-OFL-1.1.txt) 分发。子集字体保留源字体的版权、作者与许可证 name table 元数据。

当前输出：

| 运行时文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `art/runtime/fonts/NotoSansSC-Medium-Subset.ttf` | 108,488 bytes | `5CECF3920CAAD57271F505EFF3378297E5B664AC8D26B8A9BADF0C71EF439507` |
| `art/runtime/fonts/NotoSerifSC-SemiBold-Subset.ttf` | 144,564 bytes | `7472432173B6CF8B1993A74B053AC1C82A51F459F30BCDA03489E21C2BADA582` |

两个输出均为无 `fvar`/`gvar` 的静态 TrueType 字体；相较 42.9 MB 的两个源文件合计体积约减少 99.4%。

## 字符范围

[`subset-glyphs.txt`](subset-glyphs.txt) 固化当前 React 验证客户端与 Cocos 首个可玩切片已使用的中文字符，并补充好友房、重连、准备、托管、结算和错误反馈所需常用文案。生成时还统一加入：

- Basic Latin `U+0020–U+007E`；
- 不换行空格、度数、正负号、间隔号、乘号、除号与数学减号；
- 中文引号、破折号、省略号、项目符号与千分号；
- 箭头 `U+2190–U+2193`；
- CJK 标点 `U+3000–U+303F`；
- 全角 ASCII、标点与常用全角货币符号 `U+FF01–U+FF5E`、`U+FFE0–U+FFE6`。

新增正式文案前应先确认字符已在子集中；缺字时更新 `subset-glyphs.txt` 后重新生成两个字体，不要在运行时混用系统字体兜底。

## 可复现命令

当前文件使用 Python `fonttools 4.51.0` 生成。先将可变字体实例化为静态字重，再执行子集化：

```powershell
python -m fontTools.varLib.instancer C:\Windows\Fonts\NotoSansSC-VF.ttf wght=500 --update-name-table --no-recalc-timestamp -o $env:TEMP\NotoSansSC-Medium.ttf
python -m fontTools.varLib.instancer C:\Windows\Fonts\NotoSerifSC-VF.ttf wght=600 --update-name-table --no-recalc-timestamp -o $env:TEMP\NotoSerifSC-SemiBold.ttf

pyftsubset $env:TEMP\NotoSansSC-Medium.ttf --text-file=art/source/fonts/subset-glyphs.txt --unicodes="U+0020-007E,U+00A0,U+00B0-00B1,U+00B7,U+00D7,U+00F7,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2030,U+2190-2193,U+2212,U+3000-303F,U+FF01-FF5E,U+FFE0-FFE6" --layout-features=kern --no-hinting --recommended-glyphs --notdef-outline --name-IDs=* --name-languages=* --no-recalc-timestamp --output-file=art/runtime/fonts/NotoSansSC-Medium-Subset.ttf
pyftsubset $env:TEMP\NotoSerifSC-SemiBold.ttf --text-file=art/source/fonts/subset-glyphs.txt --unicodes="U+0020-007E,U+00A0,U+00B0-00B1,U+00B7,U+00D7,U+00F7,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2030,U+2190-2193,U+2212,U+3000-303F,U+FF01-FF5E,U+FFE0-FFE6" --layout-features=kern --no-hinting --recommended-glyphs --notdef-outline --name-IDs=* --name-languages=* --no-recalc-timestamp --output-file=art/runtime/fonts/NotoSerifSC-SemiBold-Subset.ttf
```

`--no-recalc-timestamp` 保持输出稳定；`--no-hinting` 适用于本项目的高 DPI 横屏渲染并显著减小包体。重新生成后应检查静态字重、字符覆盖、许可证元数据和 SHA-256。
