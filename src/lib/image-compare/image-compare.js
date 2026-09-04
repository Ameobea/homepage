/** @param {HTMLElement} el @param {number} pct */
const setPos = (el, pct) => {
  pct = Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
  el.style.setProperty('--pos', `${pct}%`);
  el.querySelector('.image-compare-handle')?.setAttribute('aria-valuenow', String(Math.round(pct)));
};

/** @param {HTMLElement} el @param {PointerEvent} e */
const pointerPos = (el, e) => {
  const { left, width } = el.getBoundingClientRect();
  return ((e.clientX - left) / width) * 100;
};

/** @param {EventTarget | null} target @param {string} selector */
const closest = (target, selector) =>
  /** @type {HTMLElement | null} */ (target instanceof Element ? target.closest(selector) : null);

/** @type {{ el: HTMLElement, x: number, y: number, dragging: boolean } | null} */
let active = null;

document.addEventListener('pointerdown', (e) => {
  const el = closest(e.target, '.image-compare');
  if (!el) {
    return;
  }
  el.setPointerCapture(e.pointerId);
  // A touch might be the start of a vertical scroll, so it only takes over once it moves sideways
  const dragging = e.pointerType === 'mouse';
  active = { el, x: e.clientX, y: e.clientY, dragging };
  if (dragging) {
    e.preventDefault();
    setPos(el, pointerPos(el, e));
  }
});

document.addEventListener('pointermove', (e) => {
  if (!active) {
    return;
  }
  if (!active.dragging) {
    const dx = Math.abs(e.clientX - active.x);
    const dy = Math.abs(e.clientY - active.y);
    if (dx < 6 && dy < 6) {
      return;
    }
    if (dy > dx) {
      active = null;
      return;
    }
    active.dragging = true;
  }
  setPos(active.el, pointerPos(active.el, e));
});

document.addEventListener('pointerup', (e) => {
  if (active && !active.dragging) {
    setPos(active.el, pointerPos(active.el, e));
  }
  active = null;
});
document.addEventListener('pointercancel', () => {
  active = null;
});

/** @type {Record<string, number | undefined>} */
const KEY_STEPS = { ArrowLeft: -2, ArrowRight: 2, Home: -100, End: 100 };

document.addEventListener('keydown', (e) => {
  const handle = closest(e.target, '.image-compare-handle');
  const step = KEY_STEPS[e.key];
  if (!handle || step === undefined) {
    return;
  }
  e.preventDefault();
  const el = /** @type {HTMLElement} */ (handle.closest('.image-compare'));
  setPos(el, parseFloat(el.style.getPropertyValue('--pos')) + step);
});
