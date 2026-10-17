import type { KeyboardEvent } from "react";

/** Keep keyboard navigation inside the currently displayed modal surface. */
export function trapDialogTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (!first) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
