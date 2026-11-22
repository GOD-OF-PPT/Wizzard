import { useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { gameAudio } from "./player";
import { gameMusic } from "./music";
import type { MusicScene } from "./music-assets";

export function useGameAudio(enabled: boolean, musicScene: MusicScene) {
  useEffect(() => { gameAudio.setEnabled(enabled); gameMusic.setEnabled(enabled); }, [enabled]);
  useEffect(() => { gameMusic.setScene(musicScene); }, [musicScene]);
  useEffect(() => {
    gameAudio.preload();
    const unlock = (event: Event) => { if (event.isTrusted) { gameAudio.unlock(); gameMusic.unlock(); } };
    const hide = () => { if (document.hidden) { gameAudio.stop(); gameMusic.suspend(); } };
    const leave = () => { gameAudio.stop(); gameMusic.suspend(); };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
      gameAudio.stop();
      gameMusic.dispose();
    };
  }, []);

  return (event: ReactMouseEvent<HTMLElement>) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>('button,input[type="checkbox"],summary');
    if (!control || control.closest('[inert],[data-audio="silent"],[aria-label="你的手牌"]') || control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return;
    const label = (control.getAttribute("aria-label") ?? control.textContent ?? "").replace(/\s+/g, "").trim();
    // These have their own authoritative settlement cue, never a success on send.
    if (/^(准备|取消准备|开始游戏|确认出牌|确认预测|选择.+为王牌|添加机器人|移除机器人|确认离开|恢复默认)/.test(label)) return;
    gameAudio.play({ id: /^(返回|关闭|继续等待)/.test(label) ? "ui.back" : "ui.tap" });
  };
}
