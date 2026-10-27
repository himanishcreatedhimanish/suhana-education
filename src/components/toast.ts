"use client";
// Minimal toast: writes into the #toast element rendered in the root layout.
let timer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove("show"), 2600);
}
