/* Hero editor — off by default. Open index.html?layout=1 to edit.
   Images: position, size, rotation, layer. Text and CTAs: size, weight, letter spacing.
   Edits are kept in localStorage per breakpoint until "Reset"; paste Copy CSS into landing.css to ship. */

(() => {
  const params = new URLSearchParams(location.search);
  if (params.get("layout") !== "1") return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  document.documentElement.classList.add("layout-mode");

  const STORE = "hero-layout-v3";
  const floats = [...hero.querySelectorAll(".float")];
  const TEXTS = [
    { key: "name", label: "Name", selector: ".hero .hero-name", serif: true },
    { key: "tagline", label: "Tagline", selector: ".tagline" },
    { key: "nav", label: "Nav links", selector: ".hero-nav .nav-links" },
    { key: "pill", label: "work", selector: ".hero-cta" },
  ].map((t) => ({ ...t, el: document.querySelector(t.selector) })).filter((t) => t.el);

  const nameOf = (el) => el.dataset.layoutFloat || "object";
  const clsOf = (el) => [...el.classList].find((c) => c.startsWith("float-") && c !== "float");
  const bucket = () => (innerWidth <= 390 ? "phone" : innerWidth <= 1024 ? "tablet" : "desktop");
  const round = (n, d = 2) => Number(n.toFixed(d));

  const readStore = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const writeStore = (data) => localStorage.setItem(STORE, JSON.stringify(data));

  const heroW = () => hero.clientWidth;
  const heroH = () => hero.clientHeight;
  const rotationOf = (el) => parseFloat(getComputedStyle(el).getPropertyValue("--rest-rotate")) || 0;
  const zOf = (el) => parseInt(getComputedStyle(el).zIndex, 10) || 0;

  /* Images */
  const floatState = (el) => ({
    left: round((el.offsetLeft / heroW()) * 100),
    top: round((el.offsetTop / heroH()) * 100),
    width: round((el.offsetWidth / heroW()) * 100),
    rotate: round(rotationOf(el), 1),
    z: zOf(el),
  });

  const applyFloat = (el, s) => {
    if (s.left != null) { el.style.left = `${s.left}%`; el.style.right = "auto"; }
    if (s.top != null) { el.style.top = `${s.top}%`; el.style.bottom = "auto"; }
    if (s.width != null) el.style.width = `${s.width}%`;
    if (s.rotate != null) el.style.setProperty("--rest-rotate", `${s.rotate}deg`);
    if (s.z != null) el.style.zIndex = s.z;
  };

  /* Text */
  const textState = (t) => {
    const cs = getComputedStyle(t.el);
    const size = parseFloat(cs.fontSize);
    const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
    return { size: round(size, 1), weight: parseInt(cs.fontWeight, 10), tracking: round(ls / size, 3) };
  };

  const applyText = (t, s) => {
    if (s.size != null) t.el.style.fontSize = `${s.size}px`;
    if (s.weight != null) t.el.style.fontWeight = s.weight;
    if (s.tracking != null) t.el.style.letterSpacing = `${s.tracking}em`;
  };

  const save = () => {
    const data = readStore();
    const b = bucket();
    data[b] = { floats: {}, text: {} };
    floats.forEach((el) => { if (el.getAttribute("style")) data[b].floats[nameOf(el)] = floatState(el); });
    TEXTS.forEach((t) => { if (t.el.style.fontSize || t.el.style.fontWeight || t.el.style.letterSpacing) data[b].text[t.key] = textState(t); });
    writeStore(data);
  };

  let currentBucket = bucket();
  const loadBucket = () => {
    floats.forEach((el) => el.removeAttribute("style"));
    TEXTS.forEach((t) => { t.el.style.fontSize = t.el.style.fontWeight = t.el.style.letterSpacing = ""; });
    const saved = readStore()[currentBucket] || {};
    const savedFloats = saved.floats || saved;

    floats.forEach((el) => {
      const pos = savedFloats[nameOf(el)];
      if (pos) applyFloat(el, pos);
    });

    TEXTS.forEach((t) => saved.text?.[t.key] && applyText(t, saved.text[t.key]));
  };

  /* Panel */
  const panel = document.createElement("aside");
  panel.className = "layout-panel";
  panel.innerHTML = `
    <div class="layout-head"><strong>Edit hero</strong>
      <button type="button" data-act="copy">Copy CSS</button>
      <button type="button" data-act="reset">Reset</button>
    </div>
    <p class="layout-hint">Click an image or any text. Images: drag to move, corner handle resizes, top handle rotates (Shift snaps 15°).
      Keys: arrows move, + / − size, [ / ] rotate, Esc deselects.</p>
    <div class="layout-texts">Text: ${TEXTS.map((t) => `<button type="button" data-text="${t.key}">${t.label}</button>`).join("")}</div>
    <div class="layout-fields" data-for="float" hidden>
      <span class="layout-name"></span>
      <label>X <input type="number" step="0.1" data-k="left">%</label>
      <label>Y <input type="number" step="0.1" data-k="top">%</label>
      <label>Size <input type="number" step="0.1" min="1" data-k="width">%</label>
      <label>Rotate <input type="number" step="1" data-k="rotate">°</label>
      <span class="layout-layer">Layer <button type="button" data-act="back">Back</button><button type="button" data-act="front">Front</button></span>
    </div>
    <div class="layout-fields" data-for="text" hidden>
      <span class="layout-name"></span>
      <label>Size <input type="number" step="1" min="6" data-t="size">px</label>
      <label>Weight <input type="number" step="50" min="100" max="900" data-t="weight"></label>
      <label>Spacing <input type="number" step="0.005" data-t="tracking">em</label>
      <span class="layout-note" hidden>Instrument Serif has one weight. Other weights are faked by the browser.</span>
    </div>
    <details class="layout-css"><summary>Show CSS</summary><pre class="layout-readout"></pre></details>`;
  document.body.appendChild(panel);

  const floatFields = panel.querySelector('[data-for="float"]');
  const textFields = panel.querySelector('[data-for="text"]');
  const floatInputs = [...floatFields.querySelectorAll("input")];
  const textInputs = [...textFields.querySelectorAll("input")];
  const readout = panel.querySelector(".layout-readout");

  const exportCss = () => {
    const lines = floats
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => {
        const s = floatState(el);
        return `.${clsOf(el)} { left: ${s.left}%; top: ${s.top}%; width: ${s.width}%; --rest-rotate: ${s.rotate}deg; z-index: ${s.z}; }`;
      });
    const textLines = TEXTS
      .filter((t) => getComputedStyle(t.el).display !== "none")
      .map((t) => {
        const s = textState(t);
        return `${t.selector} { font-size: ${s.size}px; font-weight: ${s.weight}; letter-spacing: ${s.tracking}em; }`;
      });
    return [`/* ${currentBucket} — ${innerWidth}×${innerHeight} */`, ...lines, "", ...textLines].join("\n");
  };

  let selected = null; // { kind: "float", el } | { kind: "text", t }

  const refresh = () => {
    readout.textContent = exportCss();
    floatFields.hidden = selected?.kind !== "float";
    textFields.hidden = selected?.kind !== "text";
    panel.querySelectorAll("[data-text]").forEach((b) => b.classList.toggle("is-on", selected?.t?.key === b.dataset.text));
    if (selected?.kind === "float") {
      floatFields.querySelector(".layout-name").textContent = nameOf(selected.el).replace(/-/g, " ");
      const s = floatState(selected.el);
      floatInputs.forEach((i) => { if (document.activeElement !== i) i.value = s[i.dataset.k]; });
    }
    if (selected?.kind === "text") {
      textFields.querySelector(".layout-name").textContent = selected.t.label;
      textFields.querySelector(".layout-note").hidden = !selected.t.serif;
      const s = textState(selected.t);
      textInputs.forEach((i) => { if (document.activeElement !== i) i.value = s[i.dataset.t]; });
    }
  };

  const select = (next) => {
    hero.querySelectorAll(".is-selected").forEach((n) => n.classList.remove("is-selected"));
    selected = next;
    if (next?.kind === "float") { next.el.classList.add("is-selected"); next.el.focus({ preventScroll: true }); }
    if (next?.kind === "text") next.t.el.classList.add("is-selected");
    refresh();
  };

  const changeFloat = (el, s) => { applyFloat(el, s); save(); refresh(); };
  const changeText = (t, s) => { applyText(t, s); save(); refresh(); };

  floatInputs.forEach((input) => input.addEventListener("input", () => {
    if (selected?.kind !== "float" || input.value === "") return;
    changeFloat(selected.el, { [input.dataset.k]: parseFloat(input.value) });
  }));

  textInputs.forEach((input) => input.addEventListener("input", () => {
    if (selected?.kind !== "text" || input.value === "") return;
    changeText(selected.t, { [input.dataset.t]: parseFloat(input.value) });
  }));

  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (btn.dataset.text) select({ kind: "text", t: TEXTS.find((t) => t.key === btn.dataset.text) });
    if (act === "copy") navigator.clipboard.writeText(exportCss());
    if (act === "reset") { localStorage.removeItem(STORE); loadBucket(); refresh(); }
    if (selected?.kind === "float" && act === "front") changeFloat(selected.el, { z: zOf(selected.el) + 1 });
    if (selected?.kind === "float" && act === "back") changeFloat(selected.el, { z: zOf(selected.el) - 1 });
  });

  /* Text: click to select, and keep links from navigating while editing */
  TEXTS.forEach((t) => {
    t.el.classList.add("layout-text");
    t.el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      select({ kind: "text", t });
    }, true);
  });

  /* Image pointer gestures */
  let gesture = null;

  const onMove = (e) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    e.preventDefault();
    const { el, mode } = gesture;
    const rect = hero.getBoundingClientRect();
    if (mode === "move") {
      applyFloat(el, {
        left: round(((e.clientX - rect.left - gesture.dx) / heroW()) * 100),
        top: round(((e.clientY - rect.top - gesture.dy) / heroH()) * 100),
      });
    } else if (mode === "resize") {
      const w = Math.max(20, gesture.w + (e.clientX - gesture.x));
      applyFloat(el, { width: round((w / heroW()) * 100) });
    } else if (mode === "rotate") {
      const a = (Math.atan2(e.clientY - gesture.cy, e.clientX - gesture.cx) * 180) / Math.PI;
      let deg = gesture.rot + (a - gesture.a);
      deg = ((deg + 540) % 360) - 180;
      if (e.shiftKey) deg = Math.round(deg / 15) * 15;
      applyFloat(el, { rotate: round(deg, 1) });
    }
    refresh();
  };

  const onUp = (e) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    gesture.el.classList.remove("is-dragging");
    gesture = null;
    save();
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    refresh();
  };

  floats.forEach((el) => {
    el.removeAttribute("aria-hidden");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `Edit ${nameOf(el).replace(/-/g, " ")}`);
    el.insertAdjacentHTML("beforeend",
      '<span class="layout-handle layout-rotate" data-mode="rotate" aria-hidden="true"></span>' +
      '<span class="layout-handle layout-resize" data-mode="resize" aria-hidden="true"></span>');

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      select({ kind: "float", el });
      const mode = e.target.dataset.mode || "move";
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      gesture = {
        el, mode, id: e.pointerId,
        dx: e.clientX - r.left, dy: e.clientY - r.top,
        x: e.clientX, w: el.offsetWidth,
        cx, cy, rot: rotationOf(el),
        a: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
      };
      el.classList.add("is-dragging");
      addEventListener("pointermove", onMove);
      addEventListener("pointerup", onUp);
      addEventListener("pointercancel", onUp);
    });
  });

  hero.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".float, .layout-text")) select(null);
  });

  addEventListener("keydown", (e) => {
    if (!selected || e.target.closest(".layout-panel")) return;
    if (e.key === "Escape") { select(null); return; }
    const big = e.shiftKey;

    if (selected.kind === "text") {
      const s = textState(selected.t);
      const keys = {
        "=": { size: s.size + (big ? 4 : 1) }, "+": { size: s.size + 4 },
        "-": { size: Math.max(6, s.size - (big ? 4 : 1)) }, "_": { size: Math.max(6, s.size - 4) },
        "[": { tracking: round(s.tracking - 0.005, 3) }, "]": { tracking: round(s.tracking + 0.005, 3) },
      };
      if (!keys[e.key]) return;
      e.preventDefault();
      changeText(selected.t, keys[e.key]);
      return;
    }

    const s = floatState(selected.el);
    const step = big ? 1 : 0.1;
    const keys = {
      ArrowLeft: { left: round(s.left - step) },
      ArrowRight: { left: round(s.left + step) },
      ArrowUp: { top: round(s.top - step) },
      ArrowDown: { top: round(s.top + step) },
      "=": { width: round(s.width + (big ? 1 : 0.25)) },
      "+": { width: round(s.width + 1) },
      "-": { width: round(Math.max(1, s.width - (big ? 1 : 0.25))) },
      "_": { width: round(Math.max(1, s.width - 1)) },
      "[": { rotate: s.rotate - 1 },
      "]": { rotate: s.rotate + 1 },
      "{": { rotate: s.rotate - 5 },
      "}": { rotate: s.rotate + 5 },
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    changeFloat(selected.el, keys[e.key]);
  });

  addEventListener("resize", () => {
    if (bucket() !== currentBucket) { currentBucket = bucket(); select(null); loadBucket(); }
    refresh();
  });

  loadBucket();
  refresh();
})();
