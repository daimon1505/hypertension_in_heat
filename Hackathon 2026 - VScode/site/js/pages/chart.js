// Patient chart (#/care/patient/:id) — care team only. All content is synthetic.

(function () {
  const esc = UI.esc;
  let activeTab = "overview";

  const TABS = [
    ["overview", "Overview"], ["meds", "Medications"], ["notes", "Visit notes"], ["avs", "After-visit summaries"],
    ["appts", "Appointments"], ["conditions", "Other conditions"], ["labs", "Labs"], ["imaging", "Imaging"], ["heat", "Heat risk"],
  ];

  const table = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const dl = (pairs) => `<dl class="dl">${pairs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const empty = (what) => `<p class="muted">No ${what} on file.</p>`;

  // Tiny line chart for a lab trend.
  function sparkline(values) {
    if (values.length < 2) return "";
    const w = 90, h = 24, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`).join(" ");
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  }

  const tabs = {
    overview(p) {
      const d = p.chart.demographics, px = p.chart.healthcare_proxy, ph = p.chart.pharmacy, hp = p.heat_profile;
      return `<div class="grid-2">
        <div class="card"><h3>Demographics</h3>${dl([
          ["Name", esc(p.display_name)], ["Date of birth", esc(d.dob)], ["Age / sex", `${p.age} / ${esc(p.sex)}`], ["MRN", esc(d.mrn)],
          ["Address", esc(d.address)], ["Phone", `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`], ["Language", esc(d.language)],
          ["Emergency contact", `${esc(d.emergency_contact.name)} (${esc(d.emergency_contact.relationship)}) ${esc(d.emergency_contact.phone)}`]])}</div>
        <div>
          <div class="card"><h3>Healthcare proxy</h3>${dl([["Name", esc(px.name)], ["Relationship", esc(px.relationship)], ["Phone", esc(px.phone)]])}</div>
          <div class="card"><h3>Current pharmacy</h3>${dl([["Name", esc(ph.name)], ["Address", esc(ph.address)], ["Phone", esc(ph.phone)]])}</div>
          <div class="card"><h3>Heat profile</h3>${dl([
            ["AC at home", hp.has_ac ? "Yes" : "<strong>No</strong>"], ["Lives alone", hp.lives_alone ? "Yes" : "No"], ["Mobility", esc(hp.mobility)],
            ["Red-alert sharing consent", p.consent.share_red_alerts_with_care_team ? `Yes (${esc(p.consent.date)})` : `<strong>No</strong> (${esc(p.consent.date)})`]])}</div>
        </div></div>`;
    },
    meds(p) {
      const hm = Scoring.heatMeds(p);
      const ruleFor = (m) => (hm.find((x) => x.med === m) || {}).rule;
      return UI.unreviewedBanner(hm.map((x) => x.rule)) + table(["Medication", "Dose", "Class", "Prescriber", "Start", "Heat"],
        p.medications.map((m) => {
          const r = ruleFor(m);
          return `<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.dose)}</td><td>${r ? esc(r.label) : "—"}</td><td>${esc(m.prescriber)}</td><td>${esc(m.start_date)}</td>
            <td>${r ? `<span class="pill ${r.risk_level === "high" ? "band-dangerous" : "band-moderate"}">⚠ ${esc(r.risk_level)}</span>` : "—"}</td></tr>`;
        })) + (hm.length ? `<h3>Clinician notes</h3><ul>${hm.map((x) => `<li><strong>${esc(x.rule.label)}:</strong> ${esc(x.rule.clinician_note)} <span class="muted small">(${esc(x.rule.reviewed_by)})</span></li>`).join("")}</ul>` : "");
    },
    notes(p) {
      const n = p.chart.visit_notes;
      if (!n.length) return empty("visit notes");
      return n.map((v) => `<article class="card note">
        <header class="row-between"><h3>${esc(v.type)}</h3><span class="muted">${esc(v.date)} · ${esc(v.provider)}</span></header>
        ${[["Subjective", v.subjective], ["Objective", v.objective], ["Assessment", v.assessment], ["Plan", v.plan]].map(([k, t]) => `<h4>${k}</h4><p>${esc(t)}</p>`).join("")}
      </article>`).join("");
    },
    avs(p) {
      const a = p.chart.after_visit_summaries;
      return a.length ? a.map((x) => `<article class="card"><h3>${esc(x.date)}</h3><p>${esc(x.summary)}</p></article>`).join("") : empty("after-visit summaries");
    },
    appts(p) {
      const a = p.chart.appointments;
      return a.length ? table(["Date / time", "With", "Reason"], a.map((x) => `<tr><td>${esc(x.date)}</td><td>${esc(x.provider)}</td><td>${esc(x.reason)}</td></tr>`)) : empty("upcoming appointments");
    },
    conditions(p) {
      return `<div class="grid-2"><div class="card"><h3>Main conditions</h3><ul>${p.conditions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
        <div class="card"><h3>Other health conditions</h3>${p.chart.other_conditions.length ? `<ul>${p.chart.other_conditions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : empty("other conditions")}</div></div>`;
    },
    labs(p) {
      const labs = [...p.chart.labs].sort((a, b) => b.date.localeCompare(a.date));
      if (!labs.length) return empty("lab results");
      const names = [...new Set(labs.flatMap((l) => l.results.map((r) => r.name)))];
      const cell = (lab, name) => {
        const r = lab.results.find((x) => x.name === name);
        return r ? `<td class="${r.flag ? "flag" : ""}">${esc(r.value)}${r.flag ? ` <strong>${esc(r.flag)}</strong>` : ""}</td>` : `<td class="muted">—</td>`;
      };
      const rows = names.map((name) => {
        const any = labs.map((l) => l.results.find((x) => x.name === name)).find(Boolean);
        const trend = [...labs].reverse().map((l) => (l.results.find((x) => x.name === name) || {}).value).filter((v) => typeof v === "number");
        return `<tr><th scope="row">${esc(name)}<br><span class="muted small">${esc(any.unit)} · ref ${esc(any.ref_range)}</span></th>${labs.map((l) => cell(l, name)).join("")}<td>${sparkline(trend)}</td></tr>`;
      });
      return table(["Test", ...labs.map((l) => `${esc(l.date)}<br><span class="muted small">${esc(l.panel)}</span>`), "Trend"], rows) + `<p class="small muted">L/H = below/above reference range. Trend runs oldest → newest.</p>`;
    },
    imaging(p) {
      const im = p.chart.imaging;
      if (!im.length) return empty("imaging");
      return `<div class="grid-2">${im.map((x) => `<article class="card">
        <img class="scan" src="../${esc(x.image_file)}" alt="Placeholder image — not a real scan">
        <h3>${esc(x.modality)} — ${esc(x.body_part)}</h3><p class="muted">${esc(x.date)}</p><p>${esc(x.report)}</p></article>`).join("")}</div>`;
    },
    heat(p) {
      const sit = Alerts.situation(p);
      const ep = sit.ep;
      const mine = State.get().alerts.filter((a) => a.patientId === p.id);
      return `<div class="grid-2">
        <div>
          <div class="card"><h3>Right now: ${UI.bandPill(sit.risk.band)}</h3><p>${esc(sit.loc.label)} · ${esc(State.place(sit.loc.nta_id).name)} · ${esc(ep.label)}</p>
            <ul class="why">${sit.risk.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
          <div class="card"><h3>Saved places</h3>${table(["Place", "Neighborhood", "For everyone", "For this patient"], p.locations.map((l) => {
            const r = Scoring.personal(p, l.nta_id, ep);
            return `<tr><td>${esc(l.label)}</td><td>${esc(State.place(l.nta_id).name)}</td><td>${UI.bandPill(r.base && r.base.band)}</td><td>${UI.bandPill(r.band)}</td></tr>`;
          }))}</div>
          <div class="card"><h3>Alert timeline</h3>${mine.length ? `<ul class="timeline">${mine.flatMap((a) => a.history.map((h) => `<li><span class="muted small">${esc(h.at)}</span> <strong>${a.level === "red" ? "⚠ Red" : "! Yellow"}</strong> at ${esc(a.locationLabel)}: ${esc(h.text)}</li>`)).join("")}</ul>` : empty("alerts in this demo session")}</div>
        </div>
        <div class="card map-card"><h3>Personal risk map</h3><div id="chart-map" class="map" role="img" aria-label="Map of NYC colored by this patient's personal heat risk."></div>${UI.legend()}</div>
      </div>`;
    },
  };

  Router.add("/care/patient/:id", (app, { id }) => {
    const p = State.patient(id);
    if (!p) { app.innerHTML = `<section class="page"><p>Patient not found. <a href="#/care">Back</a></p></section>`; return; }
    const sit = Alerts.situation(p);

    app.innerHTML = `
      <section class="page">
        <p><a href="#/care">← Back to inbox</a></p>
        <div class="chart-head card">
          <span class="avatar avatar-lg">${esc(UI.initials(p.display_name))}</span>
          <div class="grow">
            <h1 class="h2">${esc(p.display_name)}</h1>
            <p class="muted">${p.age} · ${esc(p.sex)} · MRN ${esc(p.chart.demographics.mrn)} · ${esc(p.conditions.join(", "))}</p>
          </div>
          <div>${UI.bandPill(sit.risk.band)}<br>${UI.synthBadge()}</div>
        </div>
        ${p.review_status ? UI.banner("warn", esc(p.review_status)) : ""}
        <div class="tabs" role="tablist" aria-label="Chart sections">
          ${TABS.map(([k, label]) => `<button role="tab" id="tab-${k}" aria-selected="${k === activeTab}" aria-controls="tabpanel" tabindex="${k === activeTab ? 0 : -1}" data-action="tab" data-arg="${k}">${label}</button>`).join("")}
        </div>
        <div id="tabpanel" role="tabpanel" aria-labelledby="tab-${activeTab}" class="tabpanel">${tabs[activeTab](p)}</div>
      </section>`;

    if (activeTab === "heat") {
      const ep = State.episode();
      NycMap.draw(document.getElementById("chart-map"), {
        key: "chart-" + p.id,
        bandFor: (n) => { const r = Scoring.personal(p, n.id, ep); return r.hasData ? r.band : null; },
        popupFor: (n) => { const r = Scoring.personal(p, n.id, ep); return `<strong>${esc(n.name)}</strong><br>${r.hasData ? UI.bandPill(r.band) : "No data"}`; },
        markers: p.locations.map((l, i) => { const [lat, lon] = NycMap.placeLatLon(l); return { lat, lon, band: Scoring.personal(p, l.nta_id, ep).band, label: l.label }; }),
      });
    }

    UI.onActions(app, { tab: (k) => { activeTab = k; Router.render(); document.getElementById("tab-" + k).focus(); } });
    // Arrow keys move between tabs.
    app.querySelector(".tabs").addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const i = TABS.findIndex(([k]) => k === activeTab);
      activeTab = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0];
      Router.render();
      document.getElementById("tab-" + activeTab).focus();
    });
  }, "care");
})();
