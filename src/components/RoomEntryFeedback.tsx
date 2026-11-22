import createName from "../../art/runtime/web-v3/create-name-error-landscape-v1.png";
import createNamePortrait from "../../art/runtime/web-v3/create-name-error-portrait-v1.png";
import joinName from "../../art/runtime/web-v3/join-name-error-landscape-v1.png";
import joinNamePortrait from "../../art/runtime/web-v3/join-name-error-portrait-v1.png";
import joinCode from "../../art/runtime/web-v3/join-code-error-landscape-v1.png";
import joinCodePortrait from "../../art/runtime/web-v3/join-code-error-portrait-v1.png";

export type EntryValidationField = "name" | "code";
const messages = { name: "请填写茶客昵称", code: "请输入六位数字房间码" } as const;

/** Fixed authored lettering, with live field association and announcement. */
export function RoomEntryFeedback({ mode, field }: { mode: "create" | "join"; field: EntryValidationField }) {
  const [landscape, portrait] = mode === "create" ? [createName, createNamePortrait]
    : field === "name" ? [joinName, joinNamePortrait] : [joinCode, joinCodePortrait];
  return <p id="entry-validation" className={`v3-entry-feedback v3-entry-feedback--${mode}-${field}`} role="alert">
    <picture aria-hidden="true"><source media="(orientation: portrait)" srcSet={portrait} /><img src={landscape} alt="" /></picture>
    <span className="sr-only">{messages[field]}</span>
  </p>;
}
