// Care-team home (#/care) — red alert notifications, patient notes, patient list, area map.
// Notifications are RED alerts only. Yellow notes from patients are listed separately.

(function () {
  const esc = UI.esc;
  const showPhone = new Set(); // alerts where "Call patient" was clicked
  const STATUS_LABEL = { new: "New", acknowledged: "Acknowledged", contacted: "Contacted", resolved: "Resolved" };

  // Current medication list for the alert card. Heat-risk medicines are flagged; RED stands out.
  function medicationBlock(p) {
    const rows = p.medications.map((m) => {
      const r = Scoring.ruleFor(m);
      const tier = r ? r.tier : null;
      const cls = tier === "RED" ? "med-red" : tier === "YELLOW" ? "med-yellow" : "";
      return `<li class="${cls}">
        <div class="row-between">
          <strong>${esc(m.name)}</strong>
          ${tier && tier !== "GREEN" ? `<span class="pill ${tier === "RED" ? "band-dangerous" : "band-moderate"}">${Icons.svg("warning", { size: 14 })} ${tier === "RED" ? "High heat risk" : "Moderate heat risk"}</span>` : `<span class="tag">No heat interaction</span>`}
        </div>
        <span class="small muted">${esc(m.dose)}${r ? ` · ${esc(r.label)}` : ""}</span>
        ${tier && tier !== "GREEN" ? `<div class="small med-detail">
            <strong>Mechanism:</strong> ${esc(r.mechanism)}<br>
            <strong>Heat-wave guidance:</strong> ${esc(r.clinician_note)}<br>
            <span class="src-tag">Source: ${esc(r.source)} · ${esc(r.reviewed_by)}</span>
          </div>` : ""}
      </li>`;
    });
    return `<div class="med-flags">
      <h4>Current medications</h4>
      <ul class="med-flag-list">${rows.join("")}</ul>
      <p class="advisory">${Icons.svg("info", { size: 16 })} <strong>Decision support only.</strong> These flags are a recommendation, not a directive. They indicate possible heat-related risk; they do not tell you to change or stop any prescription. Clinical judgement and a medication review apply.</p>
    </div>`;
  }

  function alertCard(a) {
    const p = State.patient(a.patientId);
    const phone = p.chart.demographics.phone;
    const proxy = p.chart.healthcare_proxy;
    const typeLabel = a.type === "auto_red" ? "Auto-sent (red)" : "Patient-reported";
    const older = p.age >= 65;
    return `
      <li class="inbox-item level-${a.level} ${a.status === "resolved" ? "is-resolved" : ""}">
        <div class="row-between">
          <div>
            <span class="pill level-pill-${a.level}">${Icons.svg(a.level === "red" ? "warning" : "alert", { size: 14 })} ${a.level === "red" ? "Red" : "Yellow"}</span>
            <span class="tag">${typeLabel}</span>
            <span class="tag status-${a.status}">${STATUS_LABEL[a.status]}</span>
          </div>
          <span class="muted small">${esc(a.createdAt)}</span>
        </div>
        <h3><a href="#/care/patient/${p.id}">${esc(p.display_name)}</a> <span class="muted small">${p.age} · ${esc(p.conditions.join(", "))} · at ${esc(a.locationLabel)}, ${esc(a.neighborhood)}</span></h3>
        <p class="small muted">${esc(a.episodeLabel)}</p>
        <details open><summary>Why (rules that fired)</summary><ul class="why">${a.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>
        ${medicationBlock(p)}
        ${older ? `<p class="call-prompt">${Icons.svg("phone", { size: 16 })} <strong>Patient is ${p.age} (65 or older).</strong> Consider phoning them directly to check on symptoms and their cooling plan. Proxy: ${esc(proxy.name)} (${esc(proxy.relationship)}) ${esc(proxy.phone)}.</p>` : ""}
        ${a.symptoms.length ? `<p class="small"><strong>Patient reports:</strong> ${a.symptoms.map(esc).join(", ")}</p>` : ""}
        ${a.note ? `<p class="small"><strong>Patient note:</strong> “${esc(a.note)}”</p>` : ""}
        ${a.notes.length ? `<ul class="notes">${a.notes.map((n) => `<li><span class="muted small">${esc(n.at)}</span> ${esc(n.text)}</li>`).join("")}</ul>` : ""}
        ${showPhone.has(a.id) ? `<p class="phone-box">${Icons.svg("phone", { size: 15 })} Call <strong>${esc(p.display_name)}</strong>: <a href="tel:${esc(phone)}">${esc(phone)}</a> · Proxy: ${esc(proxy.name)} ${esc(proxy.phone)}</p>` : ""}
        <div class="action-row">
          <button class="button button-small" data-action="ack" data-arg="${a.id}" ${a.status !== "new" ? "disabled" : ""}>Acknowledge</button>
          <button class="button button-small ${older ? "" : "button-ghost"}" data-action="call" data-arg="${a.id}">Call patient</button>
          <button class="button button-small button-ghost" data-action="contacted" data-arg="${a.id}" ${a.status === "contacted" || a.status === "resolved" ? "disabled" : ""}>Mark contacted</button>
          <button class="button button-small button-ghost" data-action="resolve" data-arg="${a.id}" ${a.status === "resolved" ? "disabled" : ""}>Resolve</button>
        </div>
        <form class="note-form" data-alert="${a.id}"><label class="visually-hidden" for="note-${a.id}">Add note</label>
          <input id="note-${a.id}" name="note" placeholder="Add a note…"><button class="button button-small button-ghost">Add note</button></form>
      </li>`;
  }

  Router.add("/care", (app) => {
    const data = State.getData();
    const alerts = State.get().alerts;
    // Notifications = red alerts only. Yellow notes are shown separately, without alerting.
    const red = alerts.filter((a) => a.level === "red");
    const openRed = red.filter((a) => a.status !== "resolved");
    const doneRed = red.filter((a) => a.status === "resolved");
    const yellowNotes = alerts.filter((a) => a.level !== "red");
    const ep = State.episode();

    const rows = data.patients
      .map((p) => ({ p, sit: Alerts.situation(p) }))
      .sort((a, b) => (b.sit.risk.bandIndex ?? -1) - (a.sit.risk.bandIndex ?? -1));

    // Map markers: one per neighborhood with a count. No names, no individual pins.
    const byArea = {};
    rows.forEach(({ sit }) => {
      const id = sit.loc.nta_id;
      (byArea[id] = byArea[id] || { id, count: 0, worst: -1 }).count++;
      byArea[id].worst = Math.max(byArea[id].worst, sit.risk.bandIndex ?? -1);
    });

    app.innerHTML = `
      <section class="page">
        ${UI.placeholderBanner()}
        <div class="page-head">
          <div>
            <p class="eyebrow">${esc(data.careTeam.display_name)} · ${UI.synthBadge()}</p>
            <h1>Red alert notifications</h1>
            <p class="lead">${esc(ep.label)}, ${ep.tmax}°F · <strong>${openRed.length}</strong> open red alert${openRed.length === 1 ? "" : "s"}. Only red (high-risk) situations notify you.</p>
          </div>
          <button class="button button-ghost" data-action="controls">${Icons.svg("gear", { size: 16 })} Simulate patient locations</button>
        </div>

        <div class="grid-2 grid-care">
          <div>
            ${red.length ? `<ul class="inbox">${[...openRed, ...doneRed].map(alertCard).join("")}</ul>`
              : `<div class="card empty">No red alerts. You are notified only when a patient's personal risk is high.</div>`}
            ${yellowNotes.length ? `<details class="card" open><summary><strong>Notes from patients (${yellowNotes.length})</strong> — medium risk, no alert raised</summary>
              <ul class="inbox">${yellowNotes.map(alertCard).join("")}</ul></details>` : ""}
          </div>
          <div>
            <div class="card">
              <h2 class="h3">Patients by current risk</h2>
              <ul class="patient-list">
                ${rows.map(({ p, sit }) => `
                  <li><a href="#/care/patient/${p.id}" class="patient-row">
                    <span class="avatar">${esc(UI.initials(p.display_name))}</span>
                    <span class="grow"><strong>${esc(p.display_name)}</strong><br><span class="small muted">${p.age} · ${esc(sit.loc.label)} · ${esc(State.place(sit.loc.nta_id).name)}</span></span>
                    ${UI.bandPill(sit.risk.band)}
                  </a></li>`).join("")}
              </ul>
            </div>
            <div class="card map-card">
              <h2 class="h3">Where your patients are</h2>
              <p class="small muted">General areas only — counts per neighborhood, no names or addresses. Area color = risk for everyone there.</p>
              <div id="care-map" class="map map-short" role="img" aria-label="Map showing how many patients are in each neighborhood. The patient list above gives each patient's risk."></div>
              ${UI.legend()}
            </div>
          </div>
        </div>
      </section>`;

    NycMap.draw(document.getElementById("care-map"), {
      key: "care",
      fillOpacity: 0.6,
      bandFor: (n) => { const r = Scoring.neighborhood(n.id, ep); return r.hasData ? r.band : null; },
      popupFor: (n) => `<strong>${esc(n.name)}</strong>${byArea[n.id] ? `<br>${byArea[n.id].count} patient${byArea[n.id].count === 1 ? "" : "s"} in this area` : ""}`,
      markers: Object.values(byArea).map((a) => {
        const c = State.place(a.id).centroid || [40.73, -73.95];
        const r = Scoring.neighborhood(a.id, ep);
        return { lat: c[0], lon: c[1], band: r.hasData ? r.band : null,
                 label: `${a.count} patient${a.count === 1 ? "" : "s"}`,
                 popup: `${a.count} patient${a.count === 1 ? "" : "s"} in ${esc(State.place(a.id).name)}<br><span class="muted">General area only</span>` };
      }),
    });

    UI.onActions(app, {
      controls: () => UI.toggleDrawer(true),
      ack: (id) => Alerts.setStatus(id, "acknowledged"),
      contacted: (id) => Alerts.setStatus(id, "contacted"),
      resolve: (id) => Alerts.setStatus(id, "resolved"),
      call: (id) => { showPhone.has(id) ? showPhone.delete(id) : showPhone.add(id); Router.render(); },
    });
    app.querySelectorAll(".note-form").forEach((f) => {
      f.onsubmit = (e) => { e.preventDefault(); Alerts.addNote(f.dataset.alert, f.note.value); };
    });
  }, "care");
})();
