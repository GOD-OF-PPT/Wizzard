import type { RefObject } from "react";
import home from "../../art/runtime/web-v3/home.png";
import portrait from "../../art/runtime/web-v3/portrait/home.png";
import protectedHome from "../../art/runtime/web-v3/tab-protection-v1.png";
import protectedPortrait from "../../art/runtime/web-v3/portrait/tab-protection-v1.png";

type Props = {
  roomEntryDisabled?: boolean;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onPractice: () => void;
  onRules: () => void;
  rulesButtonRef: RefObject<HTMLButtonElement | null>;
};

export function WebHome({ onCreateRoom, onJoinRoom, onPractice, onRules, rulesButtonRef, roomEntryDisabled = false }: Props) {
  return <section className="screen-stage v3-home" aria-labelledby="home-title">
    <h1 className="sr-only" id="home-title">奇术茶馆</h1>
    <picture className="screen-art-picture">
      <source media="(orientation: portrait)" srcSet={roomEntryDisabled ? protectedPortrait : portrait} />
      <img className="screen-art" alt="灯下的奇术茶馆，好友围桌品茶" src={roomEntryDisabled ? protectedHome : home} draggable={false} />
    </picture>
    <nav aria-label="茶馆入口" className="v3-home-nav">
      <button disabled={roomEntryDisabled} className="v3-home-hit v3-home-create" aria-label="创建房间" onClick={onCreateRoom} />
      <button disabled={roomEntryDisabled} className="v3-home-hit v3-home-join" aria-label="加入房间" onClick={onJoinRoom} />
      <button className="v3-home-hit v3-home-practice" aria-label="单人练习" onClick={onPractice} />
      <button className="v3-home-hit v3-home-rules" aria-label="规则与设置" onClick={onRules} ref={rulesButtonRef} />
    </nav>
    {roomEntryDisabled ? <>
      <p className="sr-only" role="status">房间已在另一标签页打开。请先关闭原标签页，再刷新此页继续。单人练习与规则仍可使用。</p>
      <button className="v3-home-refresh v3-baked-hit" aria-label="刷新此页" onClick={() => window.location.reload()} />
    </> : null}
  </section>;
}
