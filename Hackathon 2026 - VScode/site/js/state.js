// state.js — one place that remembers what's going on in the demo:
// who is signed in, which heat episode is selected, where each patient is, and the alerts.
// Saved to sessionStorage so a page reload keeps the demo (closing the tab clears it).
// No localStorage, no cookies (PLAN.md §4).

window.State = (function () {
  // Bumped when the demo data changes shape, so an old browser tab starts fresh
  // instead of holding on to a selection that no longer makes sense.
  const KEY = "heatsafe-demo-v3";
  const listeners = [];
  let data = null; // loaded data files (read-only)
  let s = null; // the changeable demo state

  function fresh() {
    const locations = {};
    data.patients.forEach((p) => (locations[p.id] = p.current_location_id));
    return {
      account: null, // { type: "patient", id } or { type: "care" }
      episodeId: data.episodes.episodes[0].id, // the live forecast when we have one
      locations,
      alerts: [],
      profileEdits: {}, // { patientId: { "path.to.field": value } } — what the patient changed
    };
  }

  function init(loaded) {
    data = loaded;
    s = fresh();
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY));
      if (saved) s = { ...s, ...saved };
    } catch (e) { /* storage blocked — start fresh */ }
    // Re-apply anything the patient edited earlier in this session.
    Object.entries(s.profileEdits || {}).forEach(([id, edits]) =>
      Object.entries(edits).forEach(([path, value]) => setPath(patient(id), path, value)));
  }

  // Set a nested value from a path like "chart.demographics.phone".
  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    if (target) target[last] = value;
  }

  // The patient edits their own details. Changes live in memory + sessionStorage only.
  function updatePatient(id, edits) {
    const p = patient(id);
    Object.entries(edits).forEach(([path, value]) => setPath(p, path, value));
    s.profileEdits[id] = { ...(s.profileEdits[id] || {}), ...edits };
    set({});
  }

  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  function get() { return s; }
  function getData() { return data; }

  // Change state, save it, and tell the page to redraw.
  function set(patch) {
    Object.assign(s, patch);
    save();
    listeners.forEach((fn) => fn());
  }

  function subscribe(fn) { listeners.push(fn); }

  function reset() {
    const account = s.account;
    s = fresh();
    s.account = account;
    set({});
  }

  // Handy lookups
  const patient = (id) => data.patients.find((p) => p.id === id);
  const episode = () => data.episodes.episodes.find((e) => e.id === s.episodeId);
  const currentLocation = (p) => p.locations.find((l) => l.id === s.locations[p.id]) || p.locations[0];
  const place = (ntaId) => data.neighborhoodById[ntaId] || { name: ntaId, borough: "" };

  return { init, get, getData, set, save, subscribe, reset, updatePatient, patient, episode, currentLocation, place };
})();
