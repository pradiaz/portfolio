/**
 * app.js — router, layar, navigasi keyboard, dan transisi wipe.
 * Konten diambil dari js/data.js (window.PORTFOLIO).
 * Rute memakai hash (#about, #skills, ...) sehingga aman di GitHub Pages.
 */
(function () {
  "use strict";
  const D = window.PORTFOLIO;
  const P = D.profile;

  /* ---------- helpers ---------- */
  const asset = (f) => (window.ASSET_MAP && window.ASSET_MAP[f]) || f;
  const icon = (n) => asset(`svg/icons/icon-${n}.svg`);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  const pad2 = (n) => String(n).padStart(2, "0");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_RANK = 5;

  const stars = (rank) => {
    let s = `<span class="rank-stars" role="img" aria-label="Rank ${rank} of ${MAX_RANK}">`;
    for (let i = 1; i <= MAX_RANK; i++) s += `<i class="${i <= rank ? "" : "off"}" aria-hidden="true">★</i>`;
    return s + "</span>";
  };
  const tags = (arr) => has(arr) ? `<div class="tagrow">${arr.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : "";

  const MENU = [
    { id: "about",      label: "About",      hint: "View profile and stats" },
    { id: "skills",     label: "Skills",     hint: "Check skill ranks" },
    { id: "equip",      label: "Equip",      hint: "Inspect tools in the loadout" },
    { id: "projects",   label: "Projects",   hint: "Review systems built" },
    { id: "experience", label: "Experience", hint: "Open the work calendar" },
    { id: "contact",    label: "Contact",    hint: "Send a calling card" }
  ];
  const TITLES = { home: "Main", about: "Stats", skills: "Skill", equip: "Equip", projects: "Request", experience: "Calendar", contact: "Contact" };
  const ROUTES = ["home"].concat(MENU.map((m) => m.id));

  const state = { home: 0, skills: 0, equip: 0, projects: 0, experience: 0, contact: 0 };
  const $screen = document.getElementById("screen");
  const $hud = document.getElementById("hud-name");
  const $keys = document.getElementById("keys");
  const $wipe = document.getElementById("wipe");
  let current = null;

  /* ==========================================================
     HOME — menu miring di garis pemisah merah | bintang
     ========================================================== */
  const MENU_FONTS = ["var(--ransom-1)", "var(--ransom-2)", "var(--ransom-3)", "var(--ransom-5)", "var(--ransom-1)", "var(--ransom-4)"];
  function menuLetters(text, seed) {
    let h = (seed + 1) * 2654435761 >>> 0;
    return [...text].map((c) => {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      const f = MENU_FONTS[(h >>> 7) % MENU_FONTS.length];
      const sz = (0.86 + ((h >>> 11) % 26) / 100).toFixed(2);
      const r = ((((h >>> 15) % 9) - 4) * 1.6).toFixed(1);
      return `<span class="mm__ch" style="font-family:${f};--sz:${sz};--r:${r}deg">${esc(c)}</span>`;
    }).join("");
  }
  function homeView() {
    return `
    <section class="home">
      <nav class="mm" id="mm" aria-label="Main menu">
        <ul class="mm__list">
          ${MENU.map((m, i) => `<li><a class="mm__item p5-hl" href="#${m.id}" data-idx="${i}" aria-label="${m.label}"><span aria-hidden="true">${menuLetters(m.label.toUpperCase(), i)}</span></a></li>`).join("")}
        </ul>
        <p class="mm__hint" id="home-hint"></p>
      </nav>
      <div class="home__tags">
        <span class="tag-w">${esc(P.title)}</span>
        <div class="tag-b">
          <h1 class="home__name" data-ransom data-seed="3">${esc(P.handle)}</h1>
          <small>${esc(P.focus)}</small>
        </div>
        <div class="home__count"><b>${pad2(D.projects.length)}</b><span>Projects<br>built</span></div>
      </div>
    </section>`;
  }
  function homeMount() {
    const nav = document.getElementById("mm");
    const items = [...nav.querySelectorAll(".mm__item")];
    const hint = document.getElementById("home-hint");
    let lastBox = -1;
    function angle() {
      // garis pemisah: x 46% di atas → 34% di bawah
      const deg = Math.atan((0.12 * window.innerWidth) / window.innerHeight) * 180 / Math.PI;
      nav.style.setProperty("--div-angle", deg.toFixed(2) + "deg");
    }
    function boxLetter(el) {
      nav.querySelectorAll(".mm__ch.is-box").forEach((c) => c.classList.remove("is-box"));
      const chs = [...el.querySelectorAll(".mm__ch")];
      let k = Math.floor(Math.random() * chs.length);
      if (chs.length > 1 && k === lastBox) k = (k + 1) % chs.length;
      lastBox = k; chs[k].classList.add("is-box");
    }
    function select(i, focus) {
      const changed = state.home !== (i + items.length) % items.length || !nav.querySelector(".is-box");
      state.home = (i + items.length) % items.length;
      items.forEach((el, k) => el.classList.toggle("is-active", k === state.home));
      const el = items[state.home];
      if (changed) boxLetter(el);
      hint.textContent = MENU[state.home].hint;
      if (focus) el.focus({ preventScroll: true });
    }
    items.forEach((el, i) => {
      el.addEventListener("mouseenter", () => select(i));
      el.addEventListener("focus", () => select(i));
    });
    angle();
    const onResize = () => { if (current === "home") { angle(); select(state.home); } };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => select(state.home));
    return {
      move: (d) => select(state.home + d, true),
      confirm: () => go(MENU[state.home].id)
    };
  }

  /* ==========================================================
     ABOUT
     ========================================================== */
  function groupRank(group) {
    const r = D.skills.filter((s) => s.group === group).map((s) => s.rank);
    return r.length ? Math.max.apply(null, r) : 0;
  }
  function aboutView() {
    const top = D.skills.slice().sort((a, b) => b.rank - a.rank)[0];
    const groups = [["Backend", "backend"], ["Mobile", "mobile"], ["Frontend", "frontend"]]
      .filter(([, g]) => groupRank(g) > 0);
    // pengalaman dihitung dari tanggal mulai kerja paling awal
    const starts = D.experience.map((j) => ym(j.start)).filter(Boolean);
    const first = starts.sort((a, b) => (a.y - b.y) || (a.m - b.m))[0];
    const now = new Date();
    const months = first ? (now.getFullYear() - first.y) * 12 + (now.getMonth() - first.m) : 0;
    const lv = Math.floor(months / 12), next = 12 - (months % 12);
    const days = first ? Math.floor((now - new Date(first.y, first.m, 1)) / 864e5) : 0;
    const nSkills = D.skills.length, nDomains = (P.domains || []).length;
    const rot = ["-3deg", "2deg", "-2deg", "3deg", "-4deg", "1deg"];
    return `
    <section class="ab">
      <div class="ab__stack">
        <div class="ab-name">
          <button type="button" class="ab-nav" data-step="-1" aria-label="Previous screen">LB</button>
          <span>${esc(P.name)}</span>
          <button type="button" class="ab-nav" data-step="1" aria-label="Next screen">RB</button>
        </div>
        <div class="ab-lv" title="Years in the field, and months until the next one">
          <span class="ab-lv__k">LV</span><b class="ab-lv__v">${lv}</b>
          <span class="ab-lv__next">Next level</span><b class="ab-lv__n">${next}</b><small>mo</small>
        </div>
        <div class="ab-gauges">
          <span class="g g--hp"><i>Stack</i><b>${pad2(nSkills)}</b><em>/${pad2(nSkills)}</em></span>
          ${nDomains ? `<span class="g g--sp"><i>Domain</i><b>${pad2(nDomains)}</b><em>/${pad2(nDomains)}</em></span>` : ""}
        </div>
        ${top ? `<div class="ab-persona">
          <img src="${icon(top.icon)}" alt="">
          <span class="ab-persona__class">Developer</span>
          <span class="ab-persona__lv">LV<b>${top.rank}</b>·</span>
          <span class="ab-persona__name">${esc(top.name)}</span>
        </div>` : ""}
        <div class="ab-stats">
          <dl>${groups.map(([label, g]) => { const r = groupRank(g); return `<dt>${label}</dt><dd><span>•</span>${r}${r >= MAX_RANK ? "<small>MAX</small>" : `<small>/${MAX_RANK}</small>`}</dd>`; }).join("")}</dl>
        </div>
        <div class="ab-shots"><span>Workplaces</span><b>${D.experience.length}</b></div>
        <div class="ab-burst">
          <img src="${asset("svg/starburst.svg")}" alt="">
          <span class="ab-burst__lbl">Projects</span>
          <span class="ab-burst__sub">Built</span>
          <b>${pad2(D.projects.length)}</b>
        </div>
      </div>

      <div class="ab-poster">
        <div class="ab-poster__wanted" aria-hidden="true">Wanted</div>
        <div class="ab-poster__photo${has(P.photo) ? "" : " is-empty"}">
          ${has(P.photo) ? `<img src="${esc(P.photo)}" alt="${esc(P.name)}">` : `<img src="${asset("svg/logo-monogram.svg")}" alt="">`}
        </div>
        <div class="ab-poster__bio">
          <h1 class="ab-poster__title" data-ransom data-seed="2">Profile</h1>
          <p>${esc(P.bio)}</p>
          ${has(P.domains) ? `<ul class="chips" aria-label="Domains">${P.domains.map((d, i) => `<li style="--r:${rot[i % rot.length]}">${esc(d)}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="ab-stamp" aria-hidden="true"><span>${esc(P.title)}</span></div>
        <img class="ab-badge" src="${asset("svg/logo-monogram.svg")}" alt="">
        <div class="ab-exp" title="Days since the first job">
          <span class="ab-exp__k">Total EXP</span>
          <b class="ab-exp__v">${days.toLocaleString("de-DE")}</b><small>days</small>
        </div>
      </div>

      <div class="ab-bubble" aria-hidden="true"><span>✚</span> Profile <b>Status</b> <span>✚</span></div>
    </section>`;
  }
  function aboutMount() {
    const ids = MENU.map((m) => m.id);
    const step = (d) => go(ids[(ids.indexOf("about") + d + ids.length) % ids.length]);
    $screen.querySelectorAll(".ab-nav").forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.step))));
    return { sideMove: step };
  }


  /* ==========================================================
     SKILLS — layar "stats" dengan bintang emas besar
     ========================================================== */
  const RANK_TITLE = ["", "Rookie", "Familiar", "Proficient", "Advanced", "Master"];
  const GROUP_LABEL = { backend: "Backend", mobile: "Mobile", frontend: "Frontend" };

  function yellowWord(text) {
    // huruf potongan kuning/hitam untuk label bintang
    let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return [...text].map((c, i) => {
      const k = ((h >> (i % 16)) & 3) === 0 && i > 0;
      const r = (((h >> ((i * 3) % 13)) & 7) - 3.5) * 1.4;
      return `<i class="${k ? "k" : ""}" style="--r:${r.toFixed(1)}deg">${esc(c)}</i>`;
    }).join("");
  }

  function radar(skills, sel) {
    const N = skills.length, cx = 250, cy = 262, R = 168, INNER = 0.42;
    const ang = (i) => (-90 + (360 / N) * i) * Math.PI / 180;
    const pt = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const f = (p) => p.map((v) => v.toFixed(1)).join(",");
    const half = Math.PI / N;
    const starPts = (scaleTip, scaleIn) => {
      const out = [];
      for (let i = 0; i < N; i++) { out.push(pt(ang(i), scaleTip(i))); out.push(pt(ang(i) + half, scaleIn(i))); }
      return out;
    };
    const v = skills.map((s) => Math.max(0.2, s.rank / MAX_RANK));
    const inV = (i) => R * INNER * Math.max(0.5, (v[i] + v[(i + 1) % N]) / 2);
    const big = starPts(() => R * 1.95, () => R * 1.95 * INNER);
    const guide = starPts(() => R, () => R * INNER);
    const tips = skills.map((s, i) => pt(ang(i), R * v[i]));
    const ins = skills.map((s, i) => pt(ang(i) + half, inV(i)));

    let facets = "";
    for (let i = 0; i < N; i++) {
      const prev = ins[(i - 1 + N) % N];
      const hot = i === sel;
      facets += `<polygon points="${cx},${cy} ${f(prev)} ${f(tips[i])}" fill="${hot ? "#ffc21a" : "#f6b400"}"/>`;
      facets += `<polygon points="${cx},${cy} ${f(tips[i])} ${f(ins[i])}" fill="${hot ? "#f2a900" : "#e39a00"}"/>`;
    }
    // bintang kecil terang di tengah (seperti kilau)
    const core = [];
    for (let i = 0; i < N; i++) {
      core.push(pt(ang(i), R * v[i] * 0.42));
      core.push(pt(ang(i) + half, inV(i) * 0.42));
    }
    let dots = "";
    for (let i = 0; i < N; i++) for (let k = 1; k <= 8; k++) {
      const [x, y] = pt(ang(i), (R * k) / 8);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#6a6a69"/>`;
    }
    const labels = skills.map((s, i) => {
      const a = ang(i), [x, y] = pt(a, R + 46);
      const side = Math.cos(a) > 0.3 ? "r" : Math.cos(a) < -0.3 ? "l" : "c";
      return `<button type="button" class="sk-label sk-label--${side} p5-hl${i === sel ? " is-active" : ""}" data-idx="${i}"
          style="left:${(x / 5).toFixed(2)}%;top:${(y / 5).toFixed(2)}%" aria-label="${esc(s.name)}, rank ${s.rank} of ${MAX_RANK}">
        <span class="sk-label__top"><span class="sk-label__name">${yellowWord(s.name)}</span><span class="sk-label__max">${s.rank >= MAX_RANK ? "MAX" : "R" + s.rank}</span></span>
        <span class="sk-label__title">${RANK_TITLE[s.rank] || ""}</span>
      </button>`;
    }).join("");
    return `<div class="radar">
      <svg viewBox="0 0 500 500" aria-hidden="true">
        <polygon points="${big.map(f).join(" ")}" fill="#2a2a2b"/>
        <polygon points="${guide.map(f).join(" ")}" fill="#3a3a3b"/>
        ${dots}
        <g>${facets}</g>
        <polygon points="${core.map(f).join(" ")}" fill="#ffd34d" opacity="0.55"/>
      </svg>${labels}</div>`;
  }

  function skillsView() {
    return `
    <section class="sk">
      <div class="sk-left">
        <div class="sk-strip sk-strip--name">
          <button type="button" class="sk-nav" data-dir="-1" aria-label="Previous skill"><span>LB</span></button>
          <span class="sk-name" id="sk-name"></span>
          <button type="button" class="sk-nav" data-dir="1" aria-label="Next skill"><span>RB</span></button>
        </div>
        <div class="sk-strip sk-strip--rank">
          <span class="sk-rank__lbl">Rank</span><b id="sk-rank"></b><span class="sk-rank__of" id="sk-of"></span>
        </div>
        <div class="sk-persona"><img id="sk-icon" src="" alt=""><span class="sk-persona__lang" id="sk-lang"></span><span class="sk-persona__title" id="sk-title"></span></div>
        <div class="sk-box">
          <dl class="sk-box__meta" id="sk-meta"></dl>
          <p class="sk-box__note" id="sk-note"></p>
        </div>
        <div class="sk-burst">
          <img src="${asset("svg/starburst.svg")}" alt="">
          <span class="sk-burst__lbl">Stack</span><b>${pad2(D.skills.length)}</b>
        </div>
      </div>
      <div class="sk-right">
        <div class="sk-bubble" aria-hidden="true">Skills <span>✚</span></div>
        <div id="skill-radar" role="group" aria-label="Skill ranks"></div>
        <p class="sk-hint">Ranks on a 1–5 scale. Frameworks first, language underneath.</p>
      </div>
    </section>`;
  }

  function skillsMount() {
    const N = D.skills.length;
    function select(i) {
      state.skills = (i + N) % N;
      const s = D.skills[state.skills];
      const used = D.projects.filter((p) => (p.stack || []).indexOf(s.name) !== -1).map((p) => p.short || p.name);
      document.getElementById("sk-name").textContent = s.name;
      document.getElementById("sk-rank").textContent = s.rank;
      document.getElementById("sk-of").innerHTML = s.rank >= MAX_RANK ? '<span class="max-badge">MAX</span>' : "/ " + MAX_RANK;
      const ic = document.getElementById("sk-icon"); ic.src = icon(s.icon);
      document.getElementById("sk-lang").textContent = s.lang;
      document.getElementById("sk-title").textContent = RANK_TITLE[s.rank] || "";
      const rows = [["Rank", stars(s.rank)], ["Field", esc(GROUP_LABEL[s.group] || s.group || "")]];
      if (used.length) rows.push(["Used in", used.map(esc).join(", ")]);
      document.getElementById("sk-meta").innerHTML = rows.filter((r) => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
      document.getElementById("sk-note").textContent = s.note || "";
      const box = document.getElementById("skill-radar");
      box.innerHTML = radar(D.skills, state.skills);
      box.querySelectorAll(".sk-label").forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.idx))));
    }
    $screen.querySelectorAll(".sk-nav").forEach((b) => b.addEventListener("click", () => select(state.skills + Number(b.dataset.dir))));
    select(state.skills || 0);
    return { move: (d) => select(state.skills + d), side: true };
  }

  /* ==========================================================
     EQUIP — tools & software sebagai slot perlengkapan
     ========================================================== */
  function equipGroups() {
    const groups = [];
    (D.tools || []).forEach((t, i) => {
      let g = groups.find((x) => x.slot === t.slot);
      if (!g) groups.push((g = { slot: t.slot || "Gear", items: [] }));
      g.items.push(i);
    });
    return groups;
  }
  function equipDetail(t) {
    const same = D.tools.filter((x) => x.slot === t.slot && x !== t).map((x) => x.name);
    return `
      <img class="eq-detail__icon" src="${icon(t.icon)}" alt="">
      <span class="eq-detail__slot">${esc(t.slot)}</span>
      <h2 class="eq-detail__name" data-ransom="red" data-seed="3">${esc(t.name)}</h2>
      ${has(t.note) ? `<p class="eq-detail__note">${esc(t.note)}</p>` : ""}
      ${same.length ? `<dl class="eq-detail__meta"><dt>Same slot</dt><dd>${same.map(esc).join(", ")}</dd></dl>` : ""}`;
  }
  function equipView() {
    const groups = equipGroups();
    return `
    <section class="eq">
      <div class="eq-left">
        <h1 class="screen-title eq-title" data-ransom data-seed="4">Equip</h1>
        <div class="eq-groups">
          ${groups.map((g) => `<div class="eq-group">
            <span class="eq-slot">${esc(g.slot)}</span>
            <ul class="eq-list" role="listbox" aria-label="${esc(g.slot)}">
              ${g.items.map((i) => { const t = D.tools[i]; return `<li><button class="row eq-item" role="option" data-idx="${i}">
                <img src="${icon(t.icon)}" alt="">
                <span class="eq-item__name">${esc(t.name)}</span>
                <span class="eq-item__e" aria-hidden="true">E</span>
              </button></li>`; }).join("")}
            </ul>
          </div>`).join("")}
        </div>
      </div>
      <div class="eq-right">
        <article class="eq-detail" id="eq-detail" aria-live="polite"></article>
        <div class="eq-loadout">
          <span class="eq-loadout__k">Loadout</span>
          <dl>${groups.map((g) => `<dt>${esc(g.slot)}</dt><dd>${pad2(g.items.length)}</dd>`).join("")}</dl>
          <p class="eq-loadout__total"><b>${pad2((D.tools || []).length)}</b><span>Tools<br>equipped</span></p>
        </div>
      </div>
    </section>`;
  }
  function equipMount() {
    return listMount("equip", D.tools || [], (t) => {
      const d = document.getElementById("eq-detail");
      d.innerHTML = equipDetail(t); Ransom.apply(d);
    });
  }

  /* ==========================================================
     PROJECTS
     ========================================================== */
  function projectDetail(p) {
    const links = [];
    if (has(p.repo)) links.push(`<a href="${esc(p.repo)}" target="_blank" rel="noopener">Source</a>`);
    if (has(p.demo)) links.push(`<a href="${esc(p.demo)}" target="_blank" rel="noopener">Live demo</a>`);
    return `
      <img class="detail__icon" src="${icon(p.icon)}" alt="">
      <h2 class="detail__title" data-ransom="red" data-seed="1">${esc(p.short || p.name)}</h2>
      <div class="detail__target"><b>Target</b><span>${esc(p.domain)}</span></div>
      <p><strong>${esc(p.name)}.</strong> ${esc(p.summary)}</p>
      ${tags(p.stack)}
      ${links.length ? `<div class="tagrow">${links.join("")}</div>` : ""}`;
  }
  function projectsView() {
    return `
    <section class="projects">
      <div class="projects__side">
        <h1 class="screen-title" data-ransom data-seed="5">Projects</h1>
        <p class="projects__count"><b>${pad2(D.projects.length)}</b><span>Projects<br>built</span></p>
        <article class="detail detail--red" id="project-detail" aria-live="polite"></article>
      </div>
      <div class="projects__list" style="--rows:${D.projects.length}">
        <div class="listhead" aria-hidden="true"><span>Status</span><span>Title</span><span>Type</span></div>
        <ul class="list" role="listbox" aria-label="Projects">
          ${D.projects.map((p, i) => `<li><button class="row" role="option" data-idx="${i}" style="--i:${i}">
            <span class="row__stamp">BUILT!</span>
            <span class="row__title">${esc(p.name)}<small>${esc(p.domain)}</small></span>
            <img src="${icon(p.icon)}" alt="">
          </button></li>`).join("")}
        </ul>
      </div>
    </section>`;
  }
  function projectsMount() {
    return listMount("projects", D.projects, (p) => {
      const d = document.getElementById("project-detail");
      d.innerHTML = projectDetail(p); Ransom.apply(d);
    });
  }

  /* ==========================================================
     EXPERIENCE — kalender besar + daftar pekerjaan
     ========================================================== */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const ym = (s) => { if (!has(s)) return null; const [y, m] = s.split("-").map(Number); return { y, m: m - 1 }; };
  const ymText = (o) => o ? `${MONTHS[o.m]} ${o.y}` : "Today";
  function duration(j) {
    const a = ym(j.start); if (!a) return "";
    const now = new Date(), b = ym(j.end) || { y: now.getFullYear(), m: now.getMonth() };
    const total = (b.y - a.y) * 12 + (b.m - a.m) + (has(j.end) ? 0 : 1);
    const y = Math.floor(total / 12), m = total % 12;
    return [y ? y + (y > 1 ? " yrs" : " yr") : "", m ? m + (m > 1 ? " mos" : " mo") : ""].filter(Boolean).join(" ");
  }
  const periodText = (j) => has(j.start) ? `${ymText(ym(j.start))} — ${ymText(ym(j.end))}` : (j.period || "");

  function calendar() {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    let weeks = "";
    for (let w = 0; w < cells.length / 7; w++) {
      const row = cells.slice(w * 7, w * 7 + 7);
      const last = Math.max.apply(null, row.filter(Boolean));
      const done = last < today;
      weeks += `<div class="cal__week${done ? " is-done" : ""}">` + row.map((d, i) => {
        if (!d) return "<span></span>";
        const c = [i === 0 ? "sun" : i === 6 ? "sat" : "wd", d < today ? "past" : "", d === today ? "today" : ""].filter(Boolean).join(" ");
        return d === today
          ? `<span class="${c}" aria-current="date"><em>TODAY</em><s>${d}</s></span>`
          : `<span class="${c}">${d}</span>`;
      }).join("") + "</div>";
    }
    return `<div class="cal">
      <div class="cal__wk">${WEEK.map((d, i) => `<span class="${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${d}</span>`).join("")}</div>
      <div class="cal__weeks" aria-hidden="true">${weeks}</div>
      <div class="cal__month"><span>${MONTHS[m].toUpperCase()}</span><small>${y}</small></div>
      <div class="cal__date">${m + 1}/${today} (${WEEK[now.getDay()]})</div>
    </div>`;
  }

  function jobDetail(j) {
    const built = D.projects.filter((p) => has(p.at) && p.at === j.company).map((p) => p.name).join(", ");
    const rows = [["Period", periodText(j) + (duration(j) ? ` · ${duration(j)}` : "")], ["Company", j.company], ["Type", j.type], ["Place", j.place], ["Built", built]]
      .filter(([, v]) => has(v));
    return `
      <p class="jd__lead">${esc(has(j.summary) ? j.summary : j.role + (has(j.company) ? " at " + j.company : ""))}</p>
      <dl class="jd__meta">${rows.map(([k, v]) => `<dt>${k}:</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      ${tags(j.stack)}`;
  }

  function experienceView() {
    const groups = [];
    D.experience.forEach((j, i) => {
      let g = groups.find((x) => x.type === (j.type || "Work"));
      if (!g) groups.push((g = { type: j.type || "Work", items: [] }));
      g.items.push(i);
    });
    return `
    <section class="exp">
      <div class="exp__cal">${calendar()}</div>
      <div class="exp__side">
        <div class="exp__jobs">
          ${groups.map((g) => `<div class="jobs__group"><h2 class="jobs__h">${esc(g.type)}</h2>
            <ul class="jobs__list" role="listbox" aria-label="${esc(g.type)}">
              ${g.items.map((i) => { const j = D.experience[i]; return `<li><button class="job" role="option" data-idx="${i}">
                <span class="job__role">${esc(j.role)}</span>
                <span class="job__co">${esc(j.company)}</span>
              </button></li>`; }).join("")}
            </ul></div>`).join("")}
        </div>
        <article class="jd" id="job-detail" aria-live="polite"></article>
      </div>
    </section>`;
  }

  function experienceMount() {
    const rows = [...$screen.querySelectorAll(".job")];
    const N = D.experience.length;
    function select(i, focus) {
      state.experience = (i + N) % N;
      rows.forEach((r) => {
        const on = Number(r.dataset.idx) === state.experience;
        r.classList.toggle("is-sel", on); r.setAttribute("aria-selected", on);
        if (on && focus) r.focus({ preventScroll: true });
      });
      document.getElementById("job-detail").innerHTML = jobDetail(D.experience[state.experience]);
    }
    rows.forEach((r) => {
      r.addEventListener("click", () => select(Number(r.dataset.idx)));
      r.addEventListener("mouseenter", () => window.matchMedia("(hover: hover)").matches && select(Number(r.dataset.idx)));
    });
    select(state.experience || 0);
    return { move: (d) => select(state.experience + d, true) };
  }

  /* ==========================================================
     CONTACT
     ========================================================== */
  function contactView() {
    const rows = [];
    if (has(P.github)) rows.push({ k: "GitHub", v: "github.com/" + P.github, href: "https://github.com/" + P.github, a1: "Link", a2: "Open" });
    if (has(P.email)) rows.push({ k: "Email", v: P.email, href: "mailto:" + P.email, a1: "Mail", a2: "Copy", copy: P.email });
    if (has(P.linkedin)) rows.push({ k: "LinkedIn", v: P.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: P.linkedin, a1: "Link", a2: "Open" });
    if (has(P.cv)) rows.push({ k: "Resume", v: "Download CV (PDF)", href: P.cv, a1: "File", a2: "Get" });
    const ext = (h) => h.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
    const word = "CONTACT";
    return `
    <section class="ct">
      <ul class="ct-list" aria-label="Contact channels">
        ${rows.map((r, i) => `<li class="ct-row" data-idx="${i}" style="--i:${i}">
          <a class="ct-row__main" href="${esc(r.href)}"${ext(r.href)}>
            <span class="ct-row__k"><small>Channel</small>${r.k}</span>
            <span class="ct-row__v">${esc(r.v)}</span>
          </a>
          ${r.copy
            ? `<button type="button" class="ct-row__act" data-copy="${esc(r.copy)}" aria-label="Copy email address"><small>${r.a1}</small><b>${r.a2}</b></button>`
            : `<a class="ct-row__act" href="${esc(r.href)}"${ext(r.href)} tabindex="-1" aria-hidden="true"><small>${r.a1}</small><b>${r.a2}</b></a>`}
        </li>`).join("")}
      </ul>
      <p class="ct-prompt">How do you want to reach me?</p>

      <div class="card ct-card">
        <p class="card__to">To whoever runs the operation,</p>
        <h1 class="card__title" data-ransom data-seed="9">Let's build it</h1>
        <p class="card__msg">If your gates, fleet, people or resources still run on spreadsheets and phone calls, send me a message. I'll help turn the process into a system.</p>
        <p class="card__sign">${esc(P.handle)}</p>
        <img class="card__logo" src="${asset("svg/logo-monogram.svg")}" alt="">
      </div>

      <div class="ct-word" aria-hidden="true">${[...word].map((c, i) => `<span class="${i % 3 === 1 ? "w" : "b"}" style="--r:${[-4, 6, -2, 8, -6, 3, -3][i]}deg;--s:${[1, 0.82, 1.08, 0.9, 1.04, 0.86, 1][i]}">${c}</span>`).join("")}</div>
      <div class="ct-tag" aria-hidden="true">${esc(P.name)}</div>
    </section>`;
  }
  function contactMount() {
    const rows = [...$screen.querySelectorAll(".ct-row")];
    function select(i, focus) {
      if (!rows.length) return;
      state.contact = (i + rows.length) % rows.length;
      rows.forEach((r, k) => r.classList.toggle("is-sel", k === state.contact));
      if (focus) rows[state.contact].querySelector(".ct-row__main").focus({ preventScroll: true });
    }
    rows.forEach((r, i) => {
      r.addEventListener("mouseenter", () => select(i));
      r.addEventListener("focusin", () => select(i));
    });
    $screen.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      const txt = b.dataset.copy, label = b.querySelector("b");
      const done = () => { label.textContent = "Done"; setTimeout(() => (label.textContent = "Copy"), 1600); };
      const fallback = () => {
        const v = b.closest(".ct-row").querySelector(".ct-row__v");
        const r = document.createRange(); r.selectNodeContents(v);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      };
      try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (err) { fallback(); }
    }));
    select(state.contact || 0);
    return { move: (d) => select((state.contact || 0) + d, true) };
  }

  /* ==========================================================
     Generic list selection (skills, projects, experience)
     ========================================================== */
  function listMount(key, data, onSelect) {
    const rows = [...$screen.querySelectorAll(".row[data-idx]")];
    function select(i, focus) {
      state[key] = (i + data.length) % data.length;
      rows.forEach((r) => {
        const on = Number(r.dataset.idx) === state[key];
        r.classList.toggle("is-sel", on); r.setAttribute("aria-selected", on);
        if (on && focus) r.focus({ preventScroll: false });
      });
      onSelect(data[state[key]], state[key]);
    }
    rows.forEach((r) => {
      r.addEventListener("click", () => select(Number(r.dataset.idx)));
      r.addEventListener("mouseenter", () => window.matchMedia("(hover: hover)").matches && select(Number(r.dataset.idx)));
    });
    select(state[key] || 0);
    return { move: (d) => select(state[key] + d, true) };
  }

  /* ==========================================================
     Router + transitions
     ========================================================== */
  const VIEWS = {
    home: [homeView, homeMount], about: [aboutView, aboutMount], skills: [skillsView, skillsMount],
    equip: [equipView, equipMount], projects: [projectsView, projectsMount], experience: [experienceView, experienceMount], contact: [contactView, contactMount]
  };
  let ctrl = {};

  function keysBar(route) {
    const btn = (k, label, color, action, extra = "") =>
      `<button class="p5-btn" type="button" ${action ? `data-act="${action}"` : "data-static"} ${extra}><span class="p5-btn__key" style="--k:${color}">${k}</span>${label}</button>`;
    $keys.innerHTML = route === "home"
      ? btn("↑↓", "Select", "#1d4ed8", "", "data-hide-sm tabindex=\"-1\"") + btn("↵", "Confirm", "#16a34a", "confirm")
      : btn("↑↓", "Select", "#1d4ed8", "", "data-hide-sm tabindex=\"-1\"") + btn("Esc", "Back", "#d4002a", "back");
  }

  function render(route) {
    current = route;
    document.body.dataset.route = route;
    $hud.textContent = TITLES[route];
    document.title = route === "home" ? `${P.handle} · Portfolio` : `${MENU.find((m) => m.id === route).label} · ${P.handle}`;
    $screen.innerHTML = VIEWS[route][0]();
    Ransom.apply($screen);
    ctrl = VIEWS[route][1]() || {};
    keysBar(route);
    $screen.classList.remove("is-enter"); void $screen.offsetWidth; $screen.classList.add("is-enter");
    window.scrollTo(0, 0);
    if (route !== "home") $screen.focus({ preventScroll: true });
  }

  let busy = false;
  function go(route) {
    if (location.hash.slice(1) !== route) { location.hash = route; return; } // hashchange calls show()
    show(route);
  }
  function show(route) {
    if (!VIEWS[route]) route = "home";
    if (route === current || busy) return;
    if (current === null || reduceMotion) return render(route);
    busy = true;
    $wipe.classList.remove("is-on"); void $wipe.offsetWidth; $wipe.classList.add("is-on");
    setTimeout(() => render(route), 300);
    setTimeout(() => { $wipe.classList.remove("is-on"); busy = false; }, 760);
  }

  window.addEventListener("hashchange", () => show(location.hash.slice(1) || "home"));
  $keys.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "back") go("home");
    if (b.dataset.act === "confirm" && ctrl.confirm) ctrl.confirm();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowDown" && ctrl.move) { e.preventDefault(); ctrl.move(1); }
    else if (e.key === "ArrowUp" && ctrl.move) { e.preventDefault(); ctrl.move(-1); }
    else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && (ctrl.side || ctrl.sideMove)) { e.preventDefault(); (ctrl.sideMove || ctrl.move)(e.key === "ArrowRight" ? 1 : -1); }
    else if (e.key === "Enter" && ctrl.confirm && !e.target.matches("a, button")) { e.preventDefault(); ctrl.confirm(); }
    else if ((e.key === "Escape" || e.key === "Backspace") && current !== "home") { e.preventDefault(); go("home"); }
  });

  /* ---------- Latar: bidang gugus bintang bergaris yang mengalir ke tengah ---------- */
  function starField(canvas) {
    const ctx = canvas.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const INNER = 0.48, RATIO = 0.8, BLACK = "#0b0b0c", WHITE = "#f1f1ef";
    // x, y: posisi relatif viewport; r: ukuran relatif sisi terpanjang; per: detik per siklus
    const CLUSTERS = [
      { x: 0.80, y: 0.52, r: 0.46, rot: 4,   spin: 1.2,  per: 3.6, twist: 3 },
      { x: 0.99, y: 0.06, r: 0.26, rot: -14, spin: -2.0, per: 2.9, twist: -4 },
      { x: 0.60, y: 0.94, r: 0.24, rot: 22,  spin: 1.6,  per: 3.1, twist: 4 },
      { x: 0.63, y: 0.16, r: 0.19, rot: -8,  spin: -1.4, per: 2.6, twist: -3 },
      { x: 1.02, y: 0.84, r: 0.26, rot: 12,  spin: 1.0,  per: 3.3, twist: 3 },
      { x: 0.51, y: 0.48, r: 0.15, rot: -20, spin: 2.2,  per: 2.4, twist: 5 },
      { x: 0.90, y: 0.29, r: 0.12, rot: 30,  spin: -2.6, per: 2.2, twist: -5 },
      { x: 0.73, y: 0.79, r: 0.11, rot: -30, spin: 2.4,  per: 2.0, twist: 4 },
      { x: 0.83, y: 0.98, r: 0.10, rot: 8,   spin: -1.8, per: 2.3, twist: 3 }
    ];
    let W = 0, H = 0, base = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight; base = Math.max(W, H);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function starPath(R, rotDeg) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (-90 + rotDeg + i * 36) * Math.PI / 180, r = i % 2 ? R * INNER : R;
        i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
    }
    function cluster(c, time) {
      const R = c.r * base, t = (time / c.per) % 1, rot = c.rot + c.spin * time;
      ctx.save();
      ctx.translate(c.x * W, c.y * H);
      ctx.rotate(rot * Math.PI / 180);
      // garis luar hitam tebal
      starPath(R * 1.07, 0); ctx.fillStyle = BLACK; ctx.fill();
      starPath(R, 0); ctx.save(); ctx.clip();
      // lapisan bintang: skala turun 2 langkah per siklus → garis mengalir ke tengah
      for (let k = -2; k < 40; k++) {
        const s = Math.pow(RATIO, k + 2 * t);
        if (s * R < 1.5) break;
        starPath(R * s, (k + 2 * t) * c.twist);
        ctx.fillStyle = (k & 1) ? WHITE : BLACK;
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }
    function draw(ms) {
      const time = ms / 1000;
      ctx.fillStyle = "#e4e4e2"; ctx.fillRect(0, 0, W, H);
      CLUSTERS.forEach((c) => cluster(c, time));
    }
    let raf = 0;
    function loop(ms) { draw(ms); raf = requestAnimationFrame(loop); }
    resize();
    window.addEventListener("resize", () => { resize(); if (still) draw(0); });
    if (still) draw(0); else raf = requestAnimationFrame(loop);
  }
  const $stars = document.getElementById("stars");
  if ($stars && $stars.getContext) starField($stars);


  show(ROUTES.indexOf(location.hash.slice(1)) > -1 ? location.hash.slice(1) : "home");
})();
