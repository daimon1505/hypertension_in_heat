// ui.js — small shared building blocks: badges, banners, top bar, demo controls drawer.

window.UI = (function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Color + icon + word, so color is never the only signal.
  // patientWords = true → "Low / Medium / High risk" wording used on patient pages.
  function bandPill(band, extraClass = "", patientWords = false) {
    if (!band) return `<span class="pill band-none">– No data</span>`;
    return `<span class="pill band-${band.id} ${extraClass}">${Icons.svg(NycMap.BAND_ICON[band.id], { size: 14 })} ${patientWords ? band.patient_label : band.label}</span>`;
  }

  const synthBadge = () => `<span class="synth-badge" title="All patient information is made up">Demo — synthetic data</span>`;

  function banner(kind, html) {
    return `<div class="banner banner-${kind}" role="note">${html}</div>`;
  }

  // The data files still carry their own placeholder flags (see data/SOURCES.md);
  // the interface no longer shows a banner about them.
  function placeholderBanner() { return ""; }

  function unreviewedBanner(rules) {
    if (!rules.some((r) => (r.reviewed_by || "").startsWith("UNREVIEWED"))) return "";
    return banner("warn", "<strong>Unreviewed medication rules.</strong> These heat-risk flags come from the team's drug-heat knowledge base (demo draft) and still need pharmacist/physician review.");
  }

  function legend(patientWords = false) {
    return `<div class="legend" aria-label="Map legend">
      ${Scoring.CONFIG.bands.map((b) => `<span><i class="swatch" style="background:${NycMap.FILL[b.id]}"></i>${patientWords ? b.patient_label : b.label}</span>`).join("")}
      <span><i class="swatch" style="background:${NycMap.FILL.none}"></i>No residents / no data</span>
    </div>`;
  }

  function accountName(acct) {
    if (!acct) return null;
    if (acct.type === "care") return State.getData().careTeam.display_name;
    const p = State.patient(acct.id);
    return p ? p.display_name : null;
  }

  function homeHash(acct) {
    if (!acct) return "#/login";
    return acct.type === "care" ? "#/care" : `#/patient/${acct.id}`;
  }

  // ----- Left navigation -----
  // "Main menu" is an outline of the page you are on: click a heading to scroll to it.
  // "Go to" holds the links between pages.
  function renderTopbar() {
    const acct = State.get().account;
    const name = accountName(acct);
    const pages = [{ href: "#/", icon: "map", label: "Map of the city" }];
    if (acct && acct.type === "care") pages.push({ href: "#/care", icon: "note", label: "Inbox" });
    pages.push(
      { href: "#/methods", icon: "info", label: "Methods" },
      { href: "#/evidence", icon: "check", label: "Evidence" },
      { href: "#/ethics", icon: "lock", label: "Ethics" },
    );
    const here = location.hash || "#/";
    const pageItem = (l) => `<a href="${l.href}" class="nav-item ${here === l.href ? "is-on" : ""}">${Icons.svg(l.icon, { size: 19 })}<span>${l.label}</span></a>`;

    document.getElementById("sidebar").innerHTML = `
      <a class="logo" href="#/"><span class="logo-mark">${Icons.svg("thermometer", { size: 20 })}</span> HeatSafe<b>NYC</b></a>
      <nav class="nav" aria-label="Main">
        <p class="nav-label">Main menu</p>
        <div id="outline" class="outline"></div>
        <p class="nav-label">Go to</p>
        ${pages.map(pageItem).join("")}
      </nav>
      <div class="nav-foot">
        <button class="button button-ghost button-small nav-demo" id="drawer-toggle" aria-expanded="false" aria-controls="drawer" aria-label="Demo controls">${Icons.svg("gear", { size: 16 })}<span class="drawer-label"> Demo controls</span></button>
        ${name
          ? `<a class="account-chip" href="#/login" title="Switch account"><span class="avatar">${esc(initials(name))}</span><span class="account-text"><span class="account-name">${esc(name)}</span><span class="account-switch">Switch account</span></span></a>`
          : `<a class="button button-small nav-signin" href="#/login">Sign in</a>`}
      </div>`;
    document.getElementById("drawer-toggle").onclick = toggleDrawer;
    refreshOutline();
  }

  // ----- Main menu -----
  // Always the same three entries. On a page that has the section, the entry scrolls to it;
  // on a page that doesn't, it takes you to the page that does.
  const MENU = [
    { id: "overview", label: "Overview", icon: "home", match: (h) => h.tagName === "H1" },
    { id: "health", label: "My health", icon: "heart", match: (h) => /medicines|my health/i.test(h.textContent),
      fallback: () => { const a = State.get().account; return a && a.type === "patient" ? `#/patient/${a.id}` : null; } },
    { id: "map", label: "Heat map", icon: "map",
      match: (h) => /heat map|where your patients are/i.test(h.textContent),
      element: () => document.querySelector("#app .map-card, #app .map"),
      fallback: () => "#/" },
  ];
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  let spyHandler = null;
  let pendingScroll = null; // a menu entry to scroll to once the next page has drawn

  function scrollToHead(head) {
    const gentle = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    head.scrollIntoView({ behavior: gentle ? "smooth" : "auto", block: "start" });
  }

  function refreshOutline() {
    const box = document.getElementById("outline");
    const app = document.getElementById("app");
    if (!box || !app) return;

    const heads = [...app.querySelectorAll("h1, h2")]
      .filter((h) => !h.closest(".modal, .fab-panel, .drawer"))
      .filter((h) => h.textContent.trim().length > 1);
    heads.forEach((h, i) => { if (!h.id) h.id = `sec-${i}-${slug(h.textContent)}`; });

    const entries = MENU
      .map((m) => ({ ...m, head: heads.find(m.match) || (m.element ? m.element() : null), href: m.fallback ? m.fallback() : null }))
      .filter((m) => m.head || m.href); // drop an entry only when there is nowhere for it to go

    entries.forEach((m, i) => { if (m.head && !m.head.id) m.head.id = `menu-target-${i}`; });
    box.innerHTML = entries.map((m) =>
      `<a href="${m.head ? "#" + m.head.id : m.href}" class="nav-item outline-item" data-menu="${m.id}">
         ${Icons.svg(m.icon, { size: 19 })}<span>${esc(m.label)}</span>
       </a>`).join("");

    box.querySelectorAll("[data-menu]").forEach((a) => {
      const entry = entries.find((m) => m.id === a.dataset.menu);
      a.onclick = (e) => {
        e.preventDefault();
        if (entry.head) {
          scrollToHead(entry.head);
          box.querySelectorAll("[data-menu]").forEach((x) => x.classList.toggle("is-on", x === a));
        } else {
          pendingScroll = entry.id; // scroll once the other page is on screen
          Router.go(entry.href);
        }
      };
    });

    // Follow the page in the order the sections actually appear, not the order of the menu.
    const inOrder = entries.filter((m) => m.head)
      .sort((a, b) => a.head.compareDocumentPosition(b.head) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    if (spyHandler) window.removeEventListener("scroll", spyHandler);
    spyHandler = () => {
      if (!inOrder.length) return;
      let current = inOrder[0];
      inOrder.forEach((m) => { if (m.head.getBoundingClientRect().top <= 120) current = m; });
      box.querySelectorAll("[data-menu]").forEach((a) => a.classList.toggle("is-on", a.dataset.menu === current.id));
    };
    window.addEventListener("scroll", spyHandler, { passive: true });
    spyHandler();

    if (pendingScroll) {
      const want = entries.find((m) => m.id === pendingScroll && m.head);
      pendingScroll = null;
      if (want) setTimeout(() => scrollToHead(want.head), 60);
    }
  }

  function initials(name) {
    return name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  // ----- Demo controls drawer -----
  function toggleDrawer(force) {
    const d = document.getElementById("drawer");
    const open = typeof force === "boolean" ? force : d.hidden;
    d.hidden = !open;
    document.getElementById("drawer-toggle").setAttribute("aria-expanded", String(open));
    if (open) renderDrawer();
  }

  function renderDrawer() {
    const drawer = document.getElementById("drawer");
    if (drawer.hidden) return;
    const s = State.get();
    const data = State.getData();
    // A signed-in patient controls only their own location; otherwise show all patients.
    const who = s.account && s.account.type === "patient" ? [State.patient(s.account.id)] : data.patients;
    drawer.innerHTML = `
      <div class="drawer-head"><h2>Demo controls</h2><button class="icon-button" id="drawer-close" aria-label="Close demo controls">&times;</button></div>
      <p class="muted small">Replays a past heat episode. Nothing here is live.</p>
      <label class="field">Heat episode
        <select id="ctl-episode">
          ${data.episodes.episodes.map((e) => `<option value="${e.id}" ${e.id === s.episodeId ? "selected" : ""}>${esc(e.label)} — ${e.tmax}°F</option>`).join("")}
        </select>
      </label>
      <fieldset class="field"><legend>Where each patient is now</legend>
        ${who.map((p) => `
          <label class="field">${esc(p.display_name)}
            <select data-patient="${p.id}">
              ${p.locations.map((l) => `<option value="${l.id}" ${l.id === s.locations[p.id] ? "selected" : ""}>${esc(l.label)} — ${esc(State.place(l.nta_id).name)}</option>`).join("")}
            </select>
          </label>`).join("")}
      </fieldset>
      <button class="button button-ghost" id="ctl-reset">Reset demo (clear alerts)</button>`;
    drawer.querySelector("#drawer-close").onclick = () => toggleDrawer(false);
    drawer.querySelector("#ctl-episode").onchange = (e) => State.set({ episodeId: e.target.value });
    drawer.querySelectorAll("select[data-patient]").forEach((sel) => {
      sel.onchange = (e) => setLocation(sel.dataset.patient, e.target.value);
    });
    drawer.querySelector("#ctl-reset").onclick = () => { if (confirm("Clear all alerts and reset the demo?")) State.reset(); };
  }

  function setLocation(patientId, locId) {
    const locations = { ...State.get().locations, [patientId]: locId };
    State.set({ locations });
  }

  // Wire up click handlers inside a page: <button data-action="name" data-arg="...">
  function onActions(root, handlers) {
    root.querySelectorAll("[data-action]").forEach((el) => {
      const fn = handlers[el.dataset.action];
      if (fn) el.addEventListener("click", (ev) => fn(el.dataset.arg, el, ev));
    });
  }

  return { esc, bandPill, synthBadge, banner, placeholderBanner, unreviewedBanner, legend, renderTopbar, refreshOutline, renderDrawer, toggleDrawer, setLocation, onActions, homeHash, initials };
})();
