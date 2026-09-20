// alerts.js — the yellow/red warning workflow (PLAN.md §4).
// It never decides colors itself; it asks scoring.js.
//
//   Yellow → the patient sees a warning and MAY report to the care team.
//   Red    → the care team is told automatically (only if the patient gave consent).
//            Without consent, the patient gets a strong prompt to report instead.

window.Alerts = (function () {
  const keyOf = (pid, epId, locId) => `${pid}|${epId}|${locId}`;
  const now = () => new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // The current personal risk for one patient where they are right now.
  function situation(p) {
    const ep = State.episode();
    const loc = State.currentLocation(p);
    const risk = Scoring.personal(p, loc.nta_id, ep);
    const key = keyOf(p.id, ep.id, loc.id);
    const alert = State.get().alerts.find((a) => a.key === key);
    return { ep, loc, risk, key, alert, consent: p.consent.share_red_alerts_with_care_team };
  }

  // What gets shared with the care team — limited on purpose (PLAN.md §4).
  function payload(p, sit) {
    const place = State.place(sit.loc.nta_id);
    return {
      key: sit.key, patientId: p.id, episodeId: sit.ep.id, locationId: sit.loc.id,
      locationLabel: sit.loc.label, neighborhood: `${place.name}, ${place.borough}`,
      episodeLabel: sit.ep.label, band: sit.risk.band.id, reasons: sit.risk.reasons,
      heatMedClasses: [...new Set(sit.risk.heatMeds.map((m) => m.rule.label))],
    };
  }

  // Check every patient. Run whenever the episode or a location changes,
  // so red alerts appear even if nobody opened that patient's account.
  function evaluateAll() {
    const alerts = State.get().alerts;
    let changed = false;
    State.getData().patients.forEach((p) => {
      const sit = situation(p);
      if (!sit.risk.hasData || sit.risk.alertLevel !== "red" || !sit.consent) return;
      if (!sit.alert) {
        alerts.unshift({
          id: "a" + Date.now() + Math.random().toString(16).slice(2, 6),
          ...payload(p, sit), level: "red", type: "auto_red", status: "new",
          createdAt: now(), symptoms: [], note: "", notes: [],
          history: [{ at: now(), text: "Sent automatically (red, patient consented)" }],
        });
        changed = true;
      } else if (sit.alert.level !== "red") {
        Object.assign(sit.alert, payload(p, sit), { level: "red", type: "auto_red", status: "new" });
        sit.alert.history.push({ at: now(), text: "Upgraded from yellow to red automatically" });
        changed = true;
      }
    });
    return changed;
  }

  // Patient taps "Report to my care team".
  function submitReport(p, symptoms, note) {
    const sit = situation(p);
    const alerts = State.get().alerts;
    if (sit.alert) {
      Object.assign(sit.alert, { symptoms, note });
      sit.alert.history.push({ at: now(), text: "Patient added a report" });
    } else {
      alerts.unshift({
        id: "a" + Date.now(), ...payload(p, sit), level: sit.risk.alertLevel,
        type: "patient_reported", status: "new", createdAt: now(),
        symptoms, note, notes: [], history: [{ at: now(), text: "Reported by patient" }],
      });
    }
    State.set({});
  }

  // Care-team actions: acknowledge, contacted, resolved, add note.
  const STATUS_TEXT = { acknowledged: "Acknowledged by care team", contacted: "Care team contacted patient", resolved: "Resolved" };
  function setStatus(alertId, status) {
    const a = State.get().alerts.find((x) => x.id === alertId);
    if (!a) return;
    a.status = status;
    a.history.push({ at: now(), text: STATUS_TEXT[status] });
    State.set({});
  }
  function addNote(alertId, text) {
    const a = State.get().alerts.find((x) => x.id === alertId);
    if (!a || !text.trim()) return;
    a.notes.push({ at: now(), text: text.trim() });
    a.history.push({ at: now(), text: "Note added" });
    State.set({});
  }

  return { situation, evaluateAll, submitReport, setStatus, addNote, STATUS_TEXT };
})();
