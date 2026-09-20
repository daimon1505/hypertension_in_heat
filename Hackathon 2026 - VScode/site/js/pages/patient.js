// Patient page: #/patient/:id
// Layout follows "Reformat sketch.png":
//   status + what heat does to your body  →  note from the doctor  →  what to do today
//   →  my medicines and heat  →  next 7 days (vertical) + heat map
//   →  floating "submit a ticket" button

(function () {
  const esc = UI.esc;
  const icon = (n, size = 20, cls = "") => Icons.svg(n, { size, cls });
  let ticketOpen = false;  // is the ticket form showing?
  let profileOpen = false; // is the profile window open?

  // "2026-07-19" → "July 19"
  const longDate = (iso) => {
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  // The 7-day list always starts today, whatever date the demo is run on.
  const dayFromToday = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const SYMPTOMS = ["Dizzy or light-headed", "Headache", "Nausea", "Very tired or weak", "Muscle cramps", "Confused", "Heavy sweating", "Short of breath"];
  const PLACE_ICON = { home: "home", work: "work", family: "users" };
  // Clinic and pharmacy are not shown on the patient's map (they are not places to shelter in).
  const onMap = (l) => PLACE_ICON[l.type];

  // ---------- helpers ----------

  function milesBetween(a, b) {
    const R = 3959, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function nearestCoolSites(loc, count) {
    const here = NycMap.placeLatLon(loc);
    return State.getData().coolingSites.sites
      .map((s) => ({ s, miles: milesBetween(here, [s.lat, s.lon]) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, count);
  }

  // Everything the doctor's side has sent back to this patient.
  function doctorMessages(p) {
    const out = [];
    State.get().alerts.filter((a) => a.patientId === p.id).forEach((a) => {
      a.notes.forEach((n) => out.push({ at: n.at, text: n.text, kind: "note" }));
      if (a.status === "acknowledged") out.push({ at: a.history[a.history.length - 1].at, text: "Your doctor has seen your alert.", kind: "status" });
      if (a.status === "contacted") out.push({ at: a.history[a.history.length - 1].at, text: "Your doctor has tried to contact you.", kind: "status" });
      if (a.status === "resolved") out.push({ at: a.history[a.history.length - 1].at, text: "Your doctor marked this as resolved.", kind: "status" });
    });
    return out;
  }

  // ---------- my profile ----------

  // A simpler view of the record the doctor holds. Some fields the patient can edit,
  // the clinical ones they cannot.
  function profileWindow(p) {
    if (!profileOpen) return "";
    const d = p.chart.demographics;
    const hp = p.heat_profile;
    const row = (label, value) => `<div class="pf-row"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    const field = (label, name, value, type = "text") =>
      `<label class="field">${esc(label)}<input type="${type}" name="${name}" value="${esc(value)}"></label>`;
    const check = (label, name, on) =>
      `<label class="pf-check"><input type="checkbox" name="${name}" ${on ? "checked" : ""}> ${esc(label)}</label>`;

    return `<div class="modal-backdrop" data-action="close-profile">
      <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="pf-title" data-stop="1">
        <div class="row-between modal-head">
          <div class="pf-id">
            <span class="avatar avatar-lg">${esc(UI.initials(p.display_name))}</span>
            <div>
              <h2 id="pf-title" class="h3">${esc(p.display_name)}</h2>
              <p class="small muted">${p.age} · ${esc(p.sex)} · ${esc(p.conditions.join(", "))}</p>
            </div>
          </div>
          <button class="icon-button" data-action="close-profile" aria-label="Close">&times;</button>
        </div>

        <form id="profile-form">
          <h3 class="pf-h">My contact details</h3>
          <p class="small muted">You can change these.</p>
          ${field("Home address", "address", d.address)}
          ${field("Phone", "phone", d.phone, "tel")}
          ${field("Emergency contact — name", "ec_name", d.emergency_contact.name)}
          ${field("Emergency contact — phone", "ec_phone", d.emergency_contact.phone, "tel")}

          <h3 class="pf-h">My home and support</h3>
          <p class="small muted">This changes the advice you get on hot days.</p>
          ${check("I have air conditioning at home that works", "has_ac", hp.has_ac)}
          ${check("I live alone", "lives_alone", hp.lives_alone)}
          ${check("Share high-risk heat alerts with my doctor automatically", "consent", p.consent.share_red_alerts_with_care_team)}

          <h3 class="pf-h">My health record</h3>
          <p class="small muted">Only your care team can change these. Ask them if something looks wrong.</p>
          <dl class="pf-list">
            ${row("Conditions", esc(p.conditions.join(", ")))}
            ${row("Medicines", p.medications.map((m) => `${esc(m.name)} <span class="muted">${esc(m.dose)}</span>`).join("<br>"))}
            ${row("Pharmacy", `${esc(p.chart.pharmacy.name)}<br><span class="muted small">${esc(p.chart.pharmacy.phone)}</span>`)}
            ${row("Healthcare proxy", `${esc(p.chart.healthcare_proxy.name)} (${esc(p.chart.healthcare_proxy.relationship)})<br><span class="muted small">${esc(p.chart.healthcare_proxy.phone)}</span>`)}
            ${row("Next appointment", p.chart.appointments.length ? esc(p.chart.appointments[0].date) + " · " + esc(p.chart.appointments[0].provider) : "None booked")}
          </dl>

          <div class="row modal-actions">
            <button class="button" type="submit">Save my changes</button>
            <button class="button button-ghost" type="button" data-action="close-profile">Cancel</button>
          </div>
          <p class="small muted">${UI.synthBadge()} Demo only — changes stay in this browser tab.</p>
        </form>
      </div>
    </div>`;
  }

  // ---------- page pieces ----------

  function statusHero(p, sit, ep, place, team) {
    const band = sit.risk.band;
    const level = sit.risk.alertLevel;
    const headline = { safe: "Low Risk", moderate: "Medium Risk", dangerous: "High Risk" }[band ? band.id : "safe"];
    const note = level === "red"
      ? (sit.consent ? "Your doctor has been notified." : "Not sent to your doctor — you can submit a ticket.")
      : "";
    return `<div class="status-hero risk-${band ? band.id : "none"}">
      <div class="status-tile">${icon(NycMap.BAND_ICON[band ? band.id : "safe"], 30)}</div>
      <div class="grow">
        <p class="status-big">${headline}</p>
        <p class="status-where">${icon("pin", 13)} ${esc(sit.loc.label)} · ${esc(place.name)} · ${esc(ep.label)}, <strong>${ep.tmax}°F</strong></p>
      </div>
      ${note ? `<p class="status-note">${note}</p>` : ""}
    </div>`;
  }


  function doctorNote(p) {
    const msgs = doctorMessages(p).reverse();
    const seeded = p.doctor_note;
    return `<section class="card doctor-note">
      <h2 class="h3">${icon("stethoscope", 20)} Note from my doctor</h2>
      ${msgs.length || seeded
        ? `<ul class="doctor-msgs">
            ${msgs.map((m) => `<li class="${m.kind}">${icon(m.kind === "note" ? "message" : "check", 16)}
              <span><span class="muted small">${esc(m.at)}</span><br>${esc(m.text)}</span></li>`).join("")}
            ${seeded ? `<li class="note">${icon("message", 16)}
              <span><span class="muted small">${esc(longDate(seeded.date))} · ${esc(seeded.from)}</span><br>${esc(seeded.text)}</span></li>` : ""}
          </ul>`
        : `<p class="na">N/A — nothing new from your doctor right now.</p>`}
    </section>`;
  }

  // CDC steps chosen for THIS patient's situation. Medicines are covered by their own
  // section above, so nothing here names a medicine.
  function todaySteps(p, risk, tips) {
    const items = [];
    if (risk.band && risk.band.id === "dangerous") {
      items.push([tips.emergency, "CDC"]);
      items.push([{ icon: "snowflake", phrase: "Go somewhere cool now", detail: "Air conditioning is best — see the cool places on the map." }, "CDC"]);
    }
    if (!p.heat_profile.has_ac) items.push([{ icon: "ac", phrase: "No AC at home — plan a cool place", detail: "Spend the hottest hours somewhere with air conditioning. Above 90°F a fan alone can make you hotter." }, "CDC"]);
    else items.push([tips.actions.stay_cool[0], "CDC"]);
    items.push([tips.actions.stay_cool[2], "CDC"]); // avoid the midday heat
    items.push([tips.actions.stay_cool[1], "CDC"]); // stay in the shade
    items.push([tips.actions.stay_hydrated[0], "CDC"]);
    items.push([tips.actions.stay_hydrated[2], "CDC"]);
    if (p.age >= 65 || p.heat_profile.lives_alone) items.push([tips.actions.check_ins[0], "CDC"]);
    return `<section class="card">
      <h2 class="h3">What to do today</h2>
      <ul class="action-grid">
        ${items.slice(0, 8).map(([a, tag]) => `<li class="action">
          <span class="action-icon">${icon(a.icon, 22)}</span>
          <span><strong>${esc(a.phrase)}</strong><br><span class="small">${esc(a.detail)}</span>
          <span class="src-tag">${esc(tag)}</span></span></li>`).join("")}
      </ul>
      <p class="small muted">Advice from <a href="${esc(tips.source.url)}" target="_blank" rel="noopener">${esc(tips.source.label)}</a>, matched to your situation. Not medical advice.</p>
    </section>`;
  }

  function myMedicines(p, risk) {
    const rules = p.medications.map((m) => Scoring.ruleFor(m)).filter(Boolean);
    const risky = risk.heatMeds.length;
    return `<section class="card">
      <h2 class="h3">${icon("pill", 20)} How heat affects my medicines</h2>
      <p class="small muted">${risky
        ? `${risky} of your ${p.medications.length} medicines ${risky === 1 ? "needs" : "need"} extra care in hot weather.`
        : "None of your medicines are affected by hot weather."}</p>
      ${UI.unreviewedBanner(rules)}
      <ul class="med-list-inline">
        ${p.medications.map((m) => {
          const r = Scoring.ruleFor(m);
          const risky = r && r.risk_level !== "none";
          return `<li class="${risky ? "med-risky" : ""}">
            <div class="row-between"><strong>${esc(m.name)}</strong>
              ${risky ? `<span class="pill ${r.tier === "RED" ? "band-dangerous" : "band-moderate"}">${icon("warning", 14)} Heat risk</span>`
                      : `<span class="pill band-safe">${icon("check", 14)} No heat effect</span>`}</div>
            <p class="small muted">${esc(m.dose)}</p>
            ${r ? `<p class="small">${esc(r.patient_advice)}</p>` : ""}
          </li>`;
        }).join("")}
      </ul>
      <p class="small muted">Never stop or change a medicine on your own — talk to your doctor first.</p>
    </section>`;
  }

  function nextSevenDays(p, ep, loc) {
    const days = ep.forecast || [{ label: "Today", tmax: ep.tmax }];
    return `<section class="card days-card">
      <h2 class="h3">Next 7 days</h2>
      <ul class="days-list">
        ${days.map((d, i) => {
          const r = Scoring.personal(p, loc.nta_id, { tmax: d.tmax });
          const b = r.band || {};
          return `<li class="day-row band-${b.id || "none"}">
            <span class="day-label">${esc(dayFromToday(i))}${i === 0 ? ` <span class="day-today">Today</span>` : ""}</span>
            <span class="day-icon">${b.id ? icon(NycMap.BAND_ICON[b.id], 18) : ""}</span>
            <span class="day-temp">${d.tmax}°</span>
          </li>`;
        }).join("")}
      </ul>
      <p class="small muted">Colour = your own risk at ${esc(loc.label)}, not just the temperature.
        ${ep.live ? `Real forecast from the ${esc(State.getData().forecast.source)}.` : "Replay of a past heat episode."}</p>
    </section>`;
  }

  function coolPlaces(loc) {
    const cs = State.getData().coolingSites;
    return `<section class="card cool-card">
      <h2 class="h3">${icon("snowflake", 20)} Cool places near you</h2>
      <ul class="place-list">
        ${nearestCoolSites(loc, 3).map(({ s, miles }) => `<li>
          <span class="cool-dot" aria-hidden="true"></span>
          <span class="grow"><strong>${esc(s.name)}</strong><br><span class="small muted">${esc(s.type)}</span></span>
          <span class="miles">${miles < 0.3 ? "In your area" : miles.toFixed(1) + " mi"}</span></li>`).join("")}
      </ul>
      <p class="small"><a href="${esc(cs.finder.url)}" target="_blank" rel="noopener">${esc(cs.finder.label)}</a><br>
      <a href="tel:311">${esc(cs.hotline.label)}</a></p>
    </section>`;
  }

  function ticket(p, sit, team) {
    const sent = sit.alert && (sit.alert.symptoms.length || sit.alert.note || sit.alert.type === "patient_reported");
    if (sent) {
      return `<div class="fab-wrap"><div class="fab-panel card">
        <p class="sent">${icon("check", 16)} Ticket sent at ${esc(sit.alert.createdAt)}</p>
        ${sit.alert.symptoms.length ? `<p class="small">You reported: ${sit.alert.symptoms.map(esc).join(", ")}</p>` : ""}
        ${sit.alert.note ? `<p class="small">“${esc(sit.alert.note)}”</p>` : ""}
        <p class="small muted">${esc(sit.alert.status === "new" ? "Waiting for your doctor to see it" : Alerts.STATUS_TEXT[sit.alert.status])}</p>
      </div></div>`;
    }
    if (!ticketOpen) {
      return `<div class="fab-wrap"><button class="fab" data-action="open-ticket">${icon("ticket", 22)} Submit a ticket to the Care Team</button></div>`;
    }
    return `<div class="fab-wrap"><div class="fab-panel card">
      <div class="row-between"><h2 class="h3">${icon("ticket", 18)} Ticket to the Care Team</h2>
        <button class="icon-button" data-action="cancel-ticket" aria-label="Close">&times;</button></div>
      <form class="report-form" id="ticket-form">
        <fieldset><legend>How do you feel? (optional)</legend>
          <div class="checks">${SYMPTOMS.map((s) => `<label><input type="checkbox" name="sym" value="${esc(s)}"> ${esc(s)}</label>`).join("")}</div>
        </fieldset>
        <label class="field">Anything your doctor should know? (optional)<textarea name="note" rows="2" placeholder="For example: my apartment is very hot and I feel dizzy"></textarea></label>
        <button class="button" type="submit">Send to ${esc(team.display_name)}</button>
      </form>
      <p class="small muted">Not for emergencies — call 911 if you feel very unwell.</p>
    </div></div>`;
  }

  // ---------- the page ----------

  function home(app, { id }) {
    const data = State.getData();
    const p = State.patient(id);
    const ep = State.episode();
    const sit = Alerts.situation(p);
    const place = State.place(sit.loc.nta_id);
    const tips = data.tips;
    const team = data.careTeam;

    app.innerHTML = `
      <section class="page patient-page">
        ${UI.placeholderBanner()}
        <p class="eyebrow">Your heat safety · ${UI.synthBadge()}</p>
        <div class="page-title-row">
          <h1>Hi, ${esc(p.display_name.split(" ")[0])}</h1>
          <button class="avatar-button" data-action="profile" aria-haspopup="dialog" title="My profile">
            <span class="avatar avatar-lg">${esc(UI.initials(p.display_name))}</span>
            <span class="avatar-button-text">My profile</span>
          </button>
        </div>

        ${statusHero(p, sit, ep, place, team)}

        ${doctorNote(p)}
        ${myMedicines(p, sit.risk)}

        <div class="bottom-row">
          <div>
            ${nextSevenDays(p, ep, sit.loc)}
            ${coolPlaces(sit.loc)}
          </div>
          <div>
          <section class="card map-card">
            <div class="row-between">
              <h2 class="h3">${icon("map", 20)} Heat map</h2>
              <span class="chip-row small">
                ${p.locations.filter(onMap).map((l) => `<button class="chip ${l.id === sit.loc.id ? "chip-on" : ""}" data-action="move" data-arg="${l.id}" aria-pressed="${l.id === sit.loc.id}">${esc(l.label)}</button>`).join("")}
              </span>
            </div>
            <div id="patient-map" class="map" role="img" aria-label="Map of NYC coloured by your personal heat risk, with your places and nearby cool spaces."></div>
            ${UI.legend(true)}
            <p class="small muted">${icon("you", 13)} where you are now · <span class="cool-dot" aria-hidden="true"></span> public cool space · icons are your saved places.</p>
          </section>
          ${todaySteps(p, sit.risk, tips)}
          </div>
        </div>

        <div class="grid-2">
        </div>
        <p class="disclaimer">${esc(tips.disclaimer)}</p>
        ${ticket(p, sit, team)}
        ${profileWindow(p)}
      </section>`;

    const cool = nearestCoolSites(sit.loc, 8);
    NycMap.draw(document.getElementById("patient-map"), {
      // A new key per location means the map recentres when the patient "moves".
      key: `patient-${p.id}-${sit.loc.id}`,
      focusOn: [NycMap.placeLatLon(sit.loc), ...p.locations.filter(onMap).map((l) => NycMap.placeLatLon(l))],
      patientWords: true,
      bandFor: (n) => { const r = Scoring.personal(p, n.id, ep); return r.hasData ? r.band : null; },
      popupFor: (n) => {
        const r = Scoring.personal(p, n.id, ep);
        return `<strong>${esc(n.name)}</strong><br>${r.hasData ? `For you: ${UI.bandPill(r.band, "", true)}<ul class="why">${r.reasons.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : esc(r.reasons[0])}`;
      },
      markers: [
        ...cool.map(({ s }) => {
          return { lat: s.lat, lon: s.lon, kind: "cool", label: s.name, popup: `<strong>${esc(s.name)}</strong><br>${esc(s.type)}` };
        }),
        ...p.locations.filter((l) => l.id !== sit.loc.id && onMap(l)).map((l) => {
          const [lat, lon] = NycMap.placeLatLon(l);
          const r = Scoring.personal(p, l.nta_id, ep);
          return { lat, lon, kind: "place", icon: PLACE_ICON[l.type] || "pin", band: r.band, label: l.label,
                   popup: `<strong>${esc(l.label)}</strong><br>${UI.bandPill(r.band, "", true)}` };
        }),
        (() => {
          const [lat, lon] = NycMap.placeLatLon(sit.loc);
          return { lat, lon, kind: "you", label: "You are here", popup: `<strong>You are here</strong><br>${esc(sit.loc.label)} · ${UI.bandPill(sit.risk.band, "", true)}` };
        })(),
      ],
    });

    UI.onActions(app, {
      move: (locId) => { ticketOpen = false; UI.setLocation(p.id, locId); },
      profile: () => { profileOpen = true; home(app, { id }); },
      "close-profile": (_a, el, ev) => {
        if (el.classList.contains("modal-backdrop") && ev.target !== el) return; // clicks inside the window
        profileOpen = false;
        home(app, { id });
      },
      "open-ticket": () => { ticketOpen = true; home(app, { id }); },
      "cancel-ticket": () => { ticketOpen = false; home(app, { id }); },
    });
    const pf = document.getElementById("profile-form");
    if (pf) {
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { profileOpen = false; document.removeEventListener("keydown", esc); home(app, { id }); }
      });
      pf.querySelector("input").focus();
      pf.onsubmit = (e) => {
        e.preventDefault();
        profileOpen = false;
        State.updatePatient(p.id, {
          "chart.demographics.address": pf.address.value.trim(),
          "chart.demographics.phone": pf.phone.value.trim(),
          "chart.demographics.emergency_contact.name": pf.ec_name.value.trim(),
          "chart.demographics.emergency_contact.phone": pf.ec_phone.value.trim(),
          "heat_profile.has_ac": pf.has_ac.checked,
          "heat_profile.lives_alone": pf.lives_alone.checked,
          "consent.share_red_alerts_with_care_team": pf.consent.checked,
        });
      };
    }

    const form = document.getElementById("ticket-form");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const symptoms = [...form.querySelectorAll("input[name=sym]:checked")].map((c) => c.value);
        ticketOpen = false;
        Alerts.submitReport(p, symptoms, form.note.value);
      };
    }
  }


  Router.add("/patient/:id", home, "patient");
})();
