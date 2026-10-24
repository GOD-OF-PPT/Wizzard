# 2026-10-19 横屏预测提交态校准

当前目标仍active，整体未通过。常规5173/8787/5199本轮均确认监听；Chrome5173页面可正常访问，5174延迟代理入口的拦截未被绕过，真实延迟ACK仍缺证据。

## 设计产物

补生成此前缺失的横屏pending稿。内置ImageGen输入原`10-bid.png`，并以竖屏`17-bid-pending-v2.png`为禁用态参考；原始生成保存在`art/source/web-v3/bid-pending-landscape-v1.png`，1672×941。提示要求只修改右下绿色动作文字为提交中、加减控件禁用，保留数字2和其他场景。

使用已有局部合成工具，只采纳三个生成区域`590,440,128,106;950,440,130,106;1300,714,270,70`，新设计保存`art/mockups/web-v3/17-bid-pending-v1.png`。区域外changedOutside=0，原10稿不变。哈希/矩形在`30-bid-pending-landscape-source.json`。

## 实现与Chrome对照

Chrome1672×942/舞台1672×941；DEV样例通过真实点击增加两次、确认预测2进入pending，没有注入状态。第一次复拍`30-bid-pending-landscape-20261019.jpg`显示面板偏低约6px、禁用覆盖露出控件底边。

仅横屏校准：底图translateY从-4.7%到-5.4%；范围说明top40.45%、数字top46.7%；加减热区top47.4%、height10.4%。竖屏配置不变。修复后`30-bid-pending-landscape-fixed-20261019.jpg`再次生成全景/聚焦/叠图，已实际打开源稿与Chrome联合聚焦检查：下缘亮条消除，数字框和按钮恢复同一水平带。

仍有差异：生成disabled色调与CSS暗化不完全相同、字体笔触与按钮边框纹理略有不同，原牌桌头像/卡面差异仍存在；不能将整页宣称像素一致。此轮补齐的是横屏预测pending设计和指定位置修复后证据。其他动作pending设计、真实网络恢复/终局仍需完成。
