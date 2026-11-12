// A terminal caret for a cursor: a block that blinks while idle, goes solid over anything clickable.
export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches) return;

  document.documentElement.classList.add("caret-on");

  const caret = document.createElement("div");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");
  document.body.append(caret);

  let shown = false;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    caret.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    if (!shown) { caret.classList.add("on"); shown = true; }
    const hot = e.target.closest && e.target.closest("a, button, [role=button], summary, label, input, select");
    caret.classList.toggle("link", !!hot);
  }, { passive: true });

  addEventListener("pointerdown", () => caret.classList.add("down"));
  addEventListener("pointerup", () => caret.classList.remove("down"));
  document.addEventListener("pointerleave", () => { caret.classList.remove("on"); shown = false; });
}
