import entryOn from "../../art/runtime/web-v3/switches/entry-landscape-on-v1.png";
import entryOff from "../../art/runtime/web-v3/switches/entry-landscape-off-v1.png";
import entryPortraitOn from "../../art/runtime/web-v3/switches/entry-portrait-on-v1.png";
import entryPortraitOff from "../../art/runtime/web-v3/switches/entry-portrait-off-v1.png";
import settingsOn from "../../art/runtime/web-v3/switches/settings-landscape-on-v1.png";
import settingsOff from "../../art/runtime/web-v3/switches/settings-landscape-off-v1.png";
import settingsPortraitOn from "../../art/runtime/web-v3/switches/settings-portrait-on-v1.png";
import settingsPortraitOff from "../../art/runtime/web-v3/switches/settings-portrait-off-v1.png";

const artwork = {
  entry: { on: [entryOn, entryPortraitOn], off: [entryOff, entryPortraitOff] },
  settings: { on: [settingsOn, settingsPortraitOn], off: [settingsOff, settingsPortraitOff] },
} as const;

/** Decorative pixels only; the owning checkbox/button retains all semantics. */
export function WebSwitchArt({ checked, family }: { checked: boolean; family: keyof typeof artwork }) {
  const [landscape, portrait] = artwork[family][checked ? "on" : "off"];
  return <span className={`v3-switch-art v3-switch-art--${family}`} aria-hidden="true">
    <picture><source media="(orientation: portrait)" srcSet={portrait} /><img src={landscape} alt="" draggable={false} /></picture>
  </span>;
}
