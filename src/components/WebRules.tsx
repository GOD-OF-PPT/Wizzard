import { useEffect, useRef, useState, type RefObject } from "react";
import art from "../../art/runtime/web-v3/rules.png";
import portraitArt from "../../art/mockups/web-v3/portrait/08-rules.png";

export type WebPreferences = { legalHints: boolean; reducedMotion: boolean };
export const defaultWebPreferences: WebPreferences = { legalHints: true, reducedMotion: false };
export function loadWebPreferences(): WebPreferences {
  try {
    const value = JSON.parse(localStorage.getItem("wizzard.web.preferences.v1") || "{}");
    return { legalHints: typeof value.legalHints === "boolean" ? value.legalHints : true, reducedMotion: value.reducedMotion === true };
  } catch { return defaultWebPreferences; }
}
const chapters = [
  { title: "快速上手", body: "三至六位茶客围桌对局。每轮先预测赢墩数，再依次出牌。预测与实际相同时获得奖励分。", steps: ["决定王牌", "预测赢墩", "跟随花色", "结算分数"] },
  { title: "王牌与牌力", body: "翻出的数字牌决定本轮王牌花色。翻出至高牌时，由发牌者选择花色；翻出虚无牌时，本轮没有王牌。", steps: ["首张至高牌", "最大王牌", "最大领出牌", "虚无牌最低"] },
  { title: "出牌规则", body: "持有领出花色的数字牌时必须跟色；没有该花色时可以打出其他数字牌。至高牌和虚无牌随时可出。先选牌，再确认出牌。", steps: ["查看领出花色", "选择合法手牌", "确认出牌", "胜者领下一墩"] },
  { title: "计分与局制", body: "预测准确：20分基础分，加上每赢一墩10分。预测不准：每差一墩扣10分。总分可为负；最后总分最高者获胜，同分并列。", steps: ["预测准确 +20", "每赢一墩 +10", "每差一墩 −10", "总分最高获胜"] },
];

export function WebRules({ onClose, returnFocusRef, preferences, onPreferences }: {
  onClose: () => void; returnFocusRef: RefObject<HTMLButtonElement | null>; preferences: WebPreferences; onPreferences: (value: WebPreferences) => void;
}) {
  const [tab, setTab] = useState<"rules" | "settings">("rules");
  const [chapter, setChapter] = useState(0);
  const root = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => returnFocusRef.current?.focus();
  }, [returnFocusRef]);
  return <div className="v3-rules-scrim"><section ref={root} className="screen-stage v3-rules" role="dialog" aria-modal="true" aria-labelledby="rules-title" onKeyDown={event => {
    if (event.key === "Escape") closeRef.current();
    if (event.key === "Tab") {
      const controls = [...(root.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <picture className="v3-rules-art"><source media="(orientation: portrait)" srcSet={portraitArt} /><img src={art} alt="" className="screen-art" /></picture>
    <h2 id="rules-title" className="sr-only">规则与设置</h2>
    <button aria-label="关闭规则与设置" className="v3-rules-close v3-baked-hit" onClick={onClose} />
    <div className="v3-rules-tabs" role="tablist" aria-label="规则设置标签">{(["rules", "settings"] as const).map((value, index) => <button role="tab" id={`tab-${value}`} aria-controls="rules-content" aria-selected={tab === value} key={value} onClick={() => setTab(value)}>{index === 0 ? "游戏规则" : "体验设置"}</button>)}</div>
    <nav className="v3-rules-chapters" aria-label="规则章节">{chapters.map((item, index) => <button key={item.title} aria-current={tab === "rules" && index === chapter ? "page" : undefined} onClick={() => { setChapter(index); setTab("rules"); }}>{item.title}</button>)}</nav>
    <article className="v3-rules-body" role="tabpanel" id="rules-content" aria-labelledby={`tab-${tab}`}>
      <h3>{tab === "rules" ? chapters[chapter].title : "体验设置"}</h3>
      {tab === "rules" ? <><p>{chapters[chapter].body}</p><ol>{chapters[chapter].steps.map((step, index) => <li key={step}><span className="v3-step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}</ol></> : <>
        <p>偏好保存在当前浏览器，仅影响本机显示。</p>
        <button className="v3-setting" aria-pressed={preferences.legalHints} onClick={() => onPreferences({ ...preferences, legalHints: !preferences.legalHints })}>合法牌提示 <strong>{preferences.legalHints ? "开启" : "关闭"}</strong></button>
        <button className="v3-setting" aria-pressed={preferences.reducedMotion} onClick={() => onPreferences({ ...preferences, reducedMotion: !preferences.reducedMotion })}>减少动效 <strong>{preferences.reducedMotion ? "开启" : "关闭"}</strong></button>
        <button className="v3-setting" onClick={() => onPreferences(defaultWebPreferences)}>恢复默认</button>
      </>}
    </article>
    <p className="v3-rules-footer">快速局共8轮 · 每轮1至8张牌</p>
  </section></div>;
}
