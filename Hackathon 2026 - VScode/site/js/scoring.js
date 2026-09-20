// scoring.js — the ONLY place where risk colors are decided.
// Maps, alerts and the Methods page all read from here.
// All numbers in CONFIG are STARTER PLACEHOLDERS for the team to review (see PLAN.md §8).

(function (root) {
  const CONFIG = {
    status: "Starter placeholders — pending team decisions (DECISIONS.md)",

    // Episode max temperature (°F) → env_points. Use the highest tier the temp reaches.
    // [VERIFY] against NWS New York heat-advisory criteria.
    env_tiers: [
      { min_f: 85, points: 1 },
      { min_f: 90, points: 2 },
      { min_f: 95, points: 3 },
      { min_f: 100, points: 4 },
    ],

    // HVI is 1–5, so hvi_points = HVI − 1 (0–4).
    hvi_offset: 1,

    // Chronic-disease burden: lowest / middle / highest third of neighborhoods → 0 / 1 / 2 points.
    burden_points_by_tercile: [0, 1, 2],

    // Neighborhood score (0–10) → band. [DECISION] cutoffs.
    // Round 2: Moderate widened to 4–7 so the map shows fewer High areas and more Medium ones.
    bands: [
      { id: "safe", label: "Safe", patient_label: "Low risk", icon: "✓", max_score: 3 },
      { id: "moderate", label: "Moderate", patient_label: "Medium risk", icon: "!", max_score: 7 },
      { id: "dangerous", label: "Dangerous", patient_label: "High risk", icon: "⚠", max_score: 10 },
    ],

    // Personal escalation. Round 2: each rule adds POINTS to the neighborhood score
    // (it used to jump a whole band, which turned almost every area red for anyone on a
    // heat-risk medicine). Points keep the personalization but spread the map out.
    escalation: {
      points_per_rule: 1.5,
      max_points: 3.5,
      medication_rule: { min_env_points: 2 },
      stacking_rule: { min_distinct_classes: 2, min_env_points: 2 },
      vulnerability_rule: {
        min_age: 65,
        // [DECISION] list; matched against patient conditions (case-insensitive, partial match).
        qualifying_conditions: ["heart failure", "coronary", "copd", "chronic kidney", "diabetes", "stroke", "dementia", "schizophrenia"],
        min_env_points: 0, // PLAN.md sets no temperature minimum for this rule.
      },
    },

    // Personal band → alert level.
    alert_for_band: { safe: "none", moderate: "yellow", dangerous: "red" },
  };

  let metrics = {};
  let medRules = {};
  let burdenCuts = [0, 0];

  // Call once after data loads.
  function init(data) {
    metrics = data.metrics.metrics;
    medRules = {};
    data.medRules.rules.forEach((r) => (medRules[r.id] = r));
    const values = Object.values(metrics).map((m) => m.burden_index).sort((a, b) => a - b);
    burdenCuts = [values[Math.floor(values.length / 3)], values[Math.floor((2 * values.length) / 3)]];
  }

  function envPoints(tmax) {
    let pts = 0;
    CONFIG.env_tiers.forEach((t) => { if (tmax >= t.min_f) pts = t.points; });
    return pts;
  }

  function burdenTercile(value) {
    if (value < burdenCuts[0]) return 0;
    if (value < burdenCuts[1]) return 1;
    return 2;
  }

  function bandIndexForScore(score) {
    const i = CONFIG.bands.findIndex((b) => score <= b.max_score);
    return i === -1 ? CONFIG.bands.length - 1 : i; // personal points can push past 10
  }

  const TERCILE_NAMES = ["lowest third", "middle third", "highest third"];

  // How dangerous is this neighborhood during this episode (for anyone)?
  function neighborhood(ntaId, episode) {
    const m = metrics[ntaId];
    if (!m) return { hasData: false, reasons: ["No residents / no data for this area (park, airport, etc.)"] };
    const env = envPoints(episode.tmax);
    const hvi = m.hvi - CONFIG.hvi_offset;
    const tercile = burdenTercile(m.burden_index);
    const burden = CONFIG.burden_points_by_tercile[tercile];
    const score = env + hvi + burden;
    const bandIndex = bandIndexForScore(score);
    return {
      hasData: true, score, bandIndex, band: CONFIG.bands[bandIndex],
      parts: { env, hvi, burden }, hvi: m.hvi, burdenTercile: tercile,
      reasons: [
        `Max temperature ${episode.tmax}°F → +${env} heat points`,
        `Heat Vulnerability Index ${m.hvi} of 5 → +${hvi}`,
        `Chronic-disease burden in the ${TERCILE_NAMES[tercile]} of NYC → +${burden}`,
        `Total ${score} of 10 → ${CONFIG.bands[bandIndex].label}`,
      ],
    };
  }

  // The rule for one medication (may be a GREEN "no heat interaction" rule, or none).
  function ruleFor(med) {
    return med.class_id ? medRules[med.class_id] : null;
  }

  // The patient's medications that actually carry heat risk (RED or YELLOW tiers).
  function heatMeds(patient) {
    return patient.medications
      .map((med) => ({ med, rule: ruleFor(med) }))
      .filter((x) => x.rule && x.rule.risk_level !== "none");
  }

  function hasQualifyingCondition(patient) {
    const list = CONFIG.escalation.vulnerability_rule.qualifying_conditions;
    return patient.conditions.some((c) => list.some((q) => c.toLowerCase().includes(q)));
  }

  // How dangerous is this neighborhood during this episode FOR THIS PATIENT?
  function personal(patient, ntaId, episode) {
    const base = neighborhood(ntaId, episode);
    if (!base.hasData) return { ...base, rulesFired: [] };
    const E = CONFIG.escalation;
    const env = base.parts.env;
    const meds = heatMeds(patient);
    const classes = [...new Set(meds.map((m) => m.rule.id))];
    const fired = [];

    const highMeds = meds.filter((m) => m.rule.risk_level === "high");
    if (highMeds.length && env >= E.medication_rule.min_env_points) {
      fired.push({ id: "medication_rule", text: `Takes ${highMeds.map((m) => m.rule.label).join(", ")} (high heat risk) and it is ${episode.tmax}°F` });
    }
    if (classes.length >= E.stacking_rule.min_distinct_classes && env >= E.stacking_rule.min_env_points) {
      fired.push({ id: "stacking_rule", text: `Takes ${classes.length} different heat-risk medicine types` });
    }
    const V = E.vulnerability_rule;
    const vulnWhy = [];
    if (patient.age >= V.min_age) vulnWhy.push(`age ${patient.age}`);
    if (!patient.heat_profile.has_ac) vulnWhy.push("no AC at home");
    if (hasQualifyingCondition(patient)) vulnWhy.push("a chronic condition");
    if (vulnWhy.length && meds.length && env >= V.min_env_points) {
      fired.push({ id: "vulnerability_rule", text: `${vulnWhy.join(", ")} plus a heat-risk medicine` });
    }

    const added = Math.min(fired.length * E.points_per_rule, E.max_points);
    const score = Math.round((base.score + added) * 10) / 10;
    const bandIndex = bandIndexForScore(score);
    const band = CONFIG.bands[bandIndex];
    const reasons = [
      `Area risk for everyone: ${base.band.label} (score ${base.score}/10)`,
      ...fired.map((f) => `${f.text} → +${E.points_per_rule} points`),
    ];
    if (fired.length * E.points_per_rule > E.max_points) reasons.push(`Capped at +${E.max_points} points`);
    if (!fired.length) reasons.push("No personal medicine or health rules apply here");
    else reasons.push(`Your score ${score}/10 → ${band.patient_label}`);
    return {
      hasData: true, base, score, bandIndex, band, addedPoints: added, rulesFired: fired, reasons,
      heatMeds: meds, alertLevel: CONFIG.alert_for_band[band.id],
    };
  }

  const api = { CONFIG, init, envPoints, neighborhood, personal, heatMeds, ruleFor, burdenTercile };
  root.Scoring = api;
  if (typeof module !== "undefined") module.exports = api; // lets Node run tests
})(typeof window !== "undefined" ? window : globalThis);
