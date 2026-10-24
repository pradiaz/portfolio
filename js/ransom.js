/**
 * ransom.js — ubah teks menjadi huruf "ransom note" ala menu P5.
 * Pemakaian:
 *   <h1 data-ransom>Pradias Ramadhan</h1>
 *   <h1 data-ransom="light" data-seed="7">Projects</h1>   // untuk latar terang
 *   <h1 data-ransom="red">Profile</h1>                     // untuk latar merah
 *   Ransom.apply(document);                                // sekali saat load
 * Hasilnya deterministik (seed dari teks) agar tidak berubah tiap reload.
 */
(function (global) {
  const FONTS = ["var(--ransom-1)", "var(--ransom-2)", "var(--ransom-3)",
                 "var(--ransom-4)", "var(--ransom-5)", "var(--ransom-6)"];
  const VARIANTS = ["v-bare", "v-bare", "v-ink", "v-paper", "v-red", "v-cut", "v-bare"];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build(el) {
    if (el.dataset.ransomDone) return;
    const text = el.textContent.trim();
    const rand = rng(hash(text) + Number(el.dataset.seed || 0));
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const wrap = document.createElement("span");
    wrap.className = "ransom" + (el.dataset.ransom === "light" ? " ransom--on-light" : el.dataset.ransom === "red" ? " ransom--on-red" : "");
    wrap.setAttribute("aria-hidden", "true");

    let word = null, i = 0;
    [...text].forEach((ch) => {
      if (ch === " ") {
        word = null;
        const sp = document.createElement("span"); sp.className = "ransom__space"; wrap.appendChild(sp); return;
      }
      if (!word) { word = document.createElement("span"); word.className = "ransom__word"; wrap.appendChild(word); }
      i++;
      const s = document.createElement("span");
      const variant = i === 1 ? "v-red" : VARIANTS[Math.floor(rand() * VARIANTS.length)];
      s.className = "ransom__ch " + variant;
      s.textContent = rand() > 0.45 ? ch.toUpperCase() : ch.toLowerCase();
      s.style.fontFamily = FONTS[Math.floor(rand() * FONTS.length)];
      s.style.setProperty("--r", ((rand() - 0.5) * 14).toFixed(1) + "deg");
      s.style.setProperty("--y", ((rand() - 0.5) * 0.18).toFixed(2) + "em");
      s.style.setProperty("--s", (0.86 + rand() * 0.3).toFixed(2));
      word.appendChild(s);
    });
    el.appendChild(wrap);
    el.dataset.ransomDone = "1";
  }

  global.Ransom = {
    apply(root = document) { root.querySelectorAll("[data-ransom]").forEach(build); },
    build
  };
})(window);
