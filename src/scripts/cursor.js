// A small ink dot for a cursor: it opens into a green ring over anything clickable and steps aside
// over text fields, where the native I-beam shows where typing will land.
export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches) return;

  document.documentElement.classList.add("dot-on");

  const dot = document.createElement("div");
  dot.className = "pointer-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.append(dot);

  let shown = false;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    if (!shown) { dot.classList.add("on"); shown = true; }
    const t = e.target.closest ? e.target : null;
    dot.classList.toggle("link", !!(t && t.closest("a, button, [role=button], summary, label, select")));
    dot.classList.toggle("text", !!(t && t.closest("input, textarea, [contenteditable=true]")));
  }, { passive: true });

  addEventListener("pointerdown", () => dot.classList.add("down"));
  addEventListener("pointerup", () => dot.classList.remove("down"));
  document.addEventListener("pointerleave", () => { dot.classList.remove("on"); shown = false; });
}
