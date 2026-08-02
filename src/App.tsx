const decisions = [
  "横版 16:9 牌桌",
  "3–6 人好友房",
  "AI 可补足空位",
  "原创美术与角色",
  "暂不商业化",
];

export function App() {
  return (
    <main className="project-shell">
      <section className="intro">
        <p className="eyebrow">好友预测卡牌 · 项目基线</p>
        <h1>奇术茶馆</h1>
        <p className="summary">
          一个面向微信好友的原创预测型墩牌游戏。当前仓库已经固化完整规则、横版布局、
          第二套美术方向与平台技术决策资料。
        </p>

        <ul className="decision-list" aria-label="已确认的项目决策">
          {decisions.map((decision) => (
            <li key={decision}>{decision}</li>
          ))}
        </ul>

        <p className="phase">当前阶段：视觉资源拆分与可交互牌桌原型</p>
      </section>

      <figure className="reference-frame">
        <img
          src="/assets/selected-art-direction.png"
          alt="奇术茶馆横版多人牌桌视觉方向"
        />
        <figcaption>选定视觉方向 · Option 2</figcaption>
      </figure>
    </main>
  );
}
