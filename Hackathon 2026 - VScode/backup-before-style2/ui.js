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

  function placeholderBanner() {
    const d = State.getData();
    if (!d.metrics.placeholder && !d.episodes.placeholder) return "";
    return banner("placeholder", "<strong>Placeholder data.</strong> Neighborhood scores and heat episodes are not real yet. The team will replace them with NYC HVI, CDC PLACES and NOAA data.");
  }

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

  // ----- Top bar -----
  function renderTopbar() {
    const acct = State.get().account;
    const name = accountName(acct);
    const nav = acct
      ? acct.type === "care"
        ? `<a href="#/care">Inbox</a>`
        : `<a href="#/patient/${acct.id}">My status</a>`
      : "";
    document.getElementById("topbar").innerHTML = `
      <div class="topbar-inner">
        <a class="logo" href="#/">${Icons.svg("thermometer", { size: 22, cls: "logo-icon" })} HeatSafe NYC</a>
        <nav class="topnav" aria-label="Main">
          <a href="#/">Heat map</a>${nav}
          <a href="#/methods">Methods</a><a href="#/evidence">Evidence</a><a href="#/ethics">Ethics</a>
        </nav>
        <div class="topbar-right">
          ${name
            ? `<a class="account-chip" href="#/login" title="Switch account"><span class="avatar">${esc(initials(name))}</span><span class="account-text"><span class="account-name">${esc(name)}</span><span class="account-switch">Switch account</span></span></a>`
            : `<a class="button button-small" href="#/login">Sign in</a>`}
          <button class="button button-ghost button-small" id="drawer-toggle" aria-expanded="false" aria-controls="drawer" aria-label="Demo controls">${Icons.svg("gear", { size: 16 })}<span class="drawer-label"> Demo controls</span></button>
        </div>
      </div>`;
    document.getElementById("drawer-toggle").onclick = toggleDrawer;
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

  return { esc, bandPill, synthBadge, banner, placeholderBanner, unreviewedBanner, legend, renderTopbar, renderDrawer, toggleDrawer, setLocation, onActions, homeHash, initials };
})();
