# PLAN.md — HeatSafe NYC (working title) — v2

> Audience: Claude Code, working with a team of **non-engineers** during a **1.5-day hackathon** (NYC 2026 Climate + Health hackathon).
> Read this whole file before writing any code. Ask the team before making assumptions marked **[DECISION]** or **[VERIFY]**.
>
> **v2 changes:** added demo accounts ("switch account" login), per-patient personalized maps, a healthcare-team account with detailed synthetic charts, and a yellow/red alert workflow between patient and care team.

---

## 1. Project summary

A **static, click-through web demo** that shows (a) how dangerous a historical heat episode was across NYC, and (b) how **each patient's own conditions and medications** change which places are dangerous *for them*, and (c) how warnings flow between the patient and their healthcare team.

It merges two hackathon problem statements:

- **#5 — Targeting chronic disease burden, outreach, and care** → neighborhood heat map + care-team outreach queue.
- **#7 — Closing the medication blind spot for heat risks** → patient-specific risk from medication classes and health conditions.

**Core idea:** the same place can be Safe for one person and Dangerous for another. A neighborhood color answers "how dangerous is it here?"; a **personal color** answers "how dangerous is it here *for this patient*?". When the personal color turns yellow or red, the system warns the patient and, depending on severity, the care team.

**Demo mode = "Historical Heat Replay":** a demo control selects a real past heat episode from recorded data. No live APIs, no real login, no backend.

---

## 2. Judging criteria (design against these)

Total 22 points, plus bonus criteria.

| Area | Pts | How this project addresses it |
|---|---|---|
| Impact | 5 | Closes the medication/heat blind spot and connects patients to their care team before harm occurs |
| Team | 4 | Patient, clinician, and public-health perspectives designed in; clinical, data, product, and narrative roles |
| AI + Data | 4 | NYC HVI, CDC PLACES, NOAA, NYC heat-illness ED data, CDC medication guidance; built with Claude Code; synthetic charts drafted with AI and clinician-reviewed |
| Innovation | 3 | Location risk × personal medication/condition risk × automatic care-team escalation |
| Feasibility | 3 | Static site, transparent rules, no backend, works offline |
| Scalability | 3 | Engine is city-agnostic; swap data files for another city; care-team workflow fits any health system |
| Bonus: Sustainability | — | Static hosting, no runtime servers or API calls, small data files |
| Bonus: Evidence & Measurement | — | Validation page (model vs. recorded heat-illness ED visits) + proposed real-world success metrics |
| Bonus: Ethics & Governance | — | Consent model for alert sharing, synthetic data only, deterministic clinical rules, transparent "why this color" |

**Rule of thumb:** every feature must map to a row above. If it doesn't, cut it.

---

## 3. Product structure

### 3.1 Site map

```
#/                     Overview (public): NYC heat distribution map for the selected episode
#/login                Account chooser ("Switch account" style, clickable persona cards)
#/patient/:id          Patient home: personal status, personalized map, alerts, actions
#/patient/:id/meds     Patient's medications with heat notes (patient-friendly)
#/care                 Care-team home: alert inbox, patient list, patient locations map
#/care/patient/:id     Patient chart (tabs, see 3.4)
#/methods              How scores are computed (auto-rendered from CONFIG)
#/evidence             Validation vs. recorded ED data + proposed success metrics
#/ethics               Ethics, privacy, limitations
```

Top bar on every page: logo, current account chip with **"Switch account"**, and a **Demo controls** drawer (see 3.5).

### 3.2 Accounts (demo only — no real authentication)

The login page is styled like a "sign in again / choose an account" screen, with clickable cards:

| Account | Type | Notes |
|---|---|---|
| Patient 1, Patient 2, Patient 3 | Patient | Synthetic. Different conditions and medications (details to be added by the team), different home/regular places. |
| Care Team (e.g., "Dr. ___'s team") | Healthcare team | Sees all three patients, the alert inbox, and detailed charts. |

Clicking a card "signs in" instantly (no passwords). The current account is stored in the app's in-memory state. Every page shows a small **"Demo — synthetic data"** badge.

### 3.3 Patient experience

- **Personal status card:** color + icon + label (Safe ✓ / Moderate ! / Dangerous ⚠) at the patient's *current location* for the selected episode, with a **"Why this color"** list.
- **Personalized map of NYC:** every neighborhood colored by the *personal* band for this patient (what the risk would be for them if they were there). The patient's saved places (home, pharmacy, clinic, day program/work, family) appear as markers with their personal color.
- **"Risky places for you" list:** saved places ranked by personal risk in this episode.
- **Alerts area** (see 4).
- **My medications:** patient-friendly list with a heat note per heat-relevant class (from `med_rules.json`).
- **Tips + resources:** short plain-language tips, link to 211 New York; disclaimer.

### 3.4 Care-team experience

- **Alert inbox:** list of alerts (new / acknowledged / contacted / resolved), auto-sent red alerts and patient-reported yellow reports labeled distinctly.
- **Patient list:** all three patients ranked by current personal risk, showing current location and band.
- **Care-team map:** patient current locations as markers colored by personal band (only visible to this account; the public overview never shows patient locations).
- **Patient chart** (`#/care/patient/:id`), tabs:
  1. Overview (demographics, address, phone, healthcare proxy, current pharmacy)
  2. Medication list (name, dose, class, prescriber, start date, heat-relevant flag)
  3. Visit notes (very detailed; SOAP-style sections)
  4. After-visit summaries
  5. Next appointments
  6. Other health conditions
  7. Lab test history (table + simple trend)
  8. Imaging / scans (**placeholder images only**, with report text)
  9. Heat risk (patient's personal map, alert timeline, rule explanation)

### 3.5 Demo controls (drawer available on every page)

- **Heat episode** selector: 3–5 historical episodes + one "ordinary summer day".
- **Patient current location** selector (for the signed-in patient, or per patient in a care-team "simulate" panel): choose from the patient's saved places so the demo can show the same patient moving from a safe place to a dangerous one.
- **Reset demo** button: clears alerts and state.

---

## 4. Alert workflow (core interaction)

Alert level is derived from the patient's **personal band at their current location** for the selected episode:

| Personal band | Alert | What the patient sees | What the care team sees |
|---|---|---|---|
| Safe (green) | none | Status card only | Nothing |
| Moderate (yellow) | **Yellow warning** | Warning + tips + **"Report to my care team" button (patient's choice)**. If they tap it: optional symptom checklist + free-text note → submit | An alert of type **"Patient-reported"** appears only if the patient submits |
| Dangerous (red) | **Red warning** | Red banner: "Your care team has been notified" + urgent tips + contact info | An alert of type **"Auto-sent (red)"** appears **immediately, without asking the patient**, with reasons, location, and patient's heat-relevant medications |

Care-team actions on an alert (simulated): **Acknowledge**, **Call patient** (shows the chart's phone number), **Add note**, **Mark contacted**, **Resolve**. Status changes are reflected back to the patient ("Your care team has acknowledged this alert") — *stretch goal*.

**Rules**
- Alerts are generated by evaluating all patients whenever the episode or a patient's current location changes, so the care team sees red alerts even if nobody has opened that patient's account.
- Deduplicate by `patientId + episodeId + locationId + level`. Upgrading yellow→red creates/updates one alert with the higher level.
- Store alerts in the in-memory app state (optionally `sessionStorage` so a page reload doesn't wipe the demo). Synthetic data only; **no `localStorage`, no cookies, no analytics.**
- **Consent (ethics requirement):** each patient record has `consent.share_red_alerts_with_care_team = true`, shown to the patient in a clearly visible line ("You agreed that red alerts are shared with your care team — [what's shared]"). The red-alert flow only auto-sends when this flag is true; if false, it degrades to the yellow flow with a stronger prompt. Demo one patient with consent = true; include in the Ethics page why this matters.
- What a red alert shares is limited to: patient identity, current location (neighborhood-level), personal band, rules that fired, and heat-relevant medication classes. It does not send new clinical data.

---

## 5. Non-goals (do NOT build)

- Real authentication, real accounts, real backend, database, live/real-time data, weather APIs.
- Real patient data or real imaging. Everything in charts is **synthetic** and labeled; scan "images" are obvious placeholders (generated diagrams or clearly labeled stock placeholders).
- Medical advice, dosing, or medication-change recommendations. Language is "talk to your care team", never "stop/reduce your medication".
- Runtime calls to any LLM API (no keys in the browser). AI is used at **build time** only.
- Multi-city support (mention as future work in the pitch only).

---

## 6. Tech constraints and architecture

- **Plain HTML + CSS + vanilla JavaScript. No build step, no framework.** A tiny **hash-based router** (`#/...`) and a single in-memory **state store** (`state.js`) hold: current account, episode, patient locations, alerts. The team must be able to open `site/index.html` or drag the folder to a static host.
- **Map:** Leaflet, **vendored locally** in `site/vendor/`, choropleth from a GeoJSON. **Do not depend on online basemap tiles.** Neighborhood polygons + labels are enough.
- **Data:** small JSON/GeoJSON in `data/processed/`, loaded with `fetch()`. Provide `python3 -m http.server` instructions in README **and** an option to inline data into a JS file as `file://` fallback.
- **Data prep:** `scripts/prep_data.py` (pandas) turns raw downloads into processed files.
- **Scoring logic:** **one file** `site/js/scoring.js` with all thresholds in a `CONFIG` object. No scoring logic anywhere else. The alert engine (`alerts.js`) only calls `scoring.js`.
- **Accessibility:** color is never the only signal (color + icon + text). WCAG AA contrast, keyboard navigation, mobile layout, large readable status card.
- **Synthetic data disclosure:** visible "Demo — synthetic data" badge on all account pages.

### Suggested repo layout

```
/
├─ PLAN.md, README.md, DECISIONS.md
├─ data/
│  ├─ raw/                        # downloaded originals (gitignore if large)
│  ├─ processed/
│  │  ├─ neighborhoods.geojson
│  │  ├─ neighborhood_metrics.json     # HVI + chronic-disease burden per neighborhood
│  │  ├─ episodes.json                 # historical heat episodes
│  │  ├─ med_rules.json                # medication class → heat risk rules
│  │  ├─ patients/patient1.json ...    # synthetic patients incl. full chart (see 8)
│  │  ├─ care_team.json                # care-team account info
│  │  ├─ validation.json
│  │  └─ tips.json                     # patient tips / templates (EN; ES/ZH optional)
│  ├─ placeholders/                    # scan placeholder images
│  └─ SOURCES.md                       # each dataset: name, URL, date accessed, use, caveats
├─ scripts/prep_data.py
├─ site/
│  ├─ index.html, css/style.css
│  ├─ js/{state.js, router.js, scoring.js, alerts.js, map.js}
│  ├─ js/pages/{overview, login, patient, care, chart, methods, evidence, ethics}.js
│  └─ vendor/
└─ tests/scoring.test.md             # manual table: input → expected color / alert
```

---

## 7. Data sources (from the team's data tracker)

Use only these. **Do not invent numbers.** If a dataset can't be obtained in time, use the fallback and record it in `data/SOURCES.md`.

| Purpose | Dataset | Notes / fallback |
|---|---|---|
| Neighborhood geometry | NYC Open Data — Neighborhood Tabulation Areas (NTA) | **[DECISION]** Unit of analysis = NTA if HVI is NTA-level; else ZCTA/community district. Use one consistently. |
| Long-term heat vulnerability | **NYC Heat Vulnerability Index (HVI)**, NYC Environment & Health Data Portal | Believed 1–5 per neighborhood (surface temperature, green space, home AC, income). **[VERIFY]** granularity and vintage. |
| Chronic disease / mental health burden | **CDC PLACES** | Candidate measures: `CASTHMA`, `COPD`, `CHD`, `DIABETES`, `BPHIGH`, `STROKE`, `KIDNEY`, `DEPRESSION`, `MHLTH` **[VERIFY IDs and release year]**. Aggregate tracts → unit with a tract-to-NTA equivalency table; document the method. Model-based estimates. |
| Weather per historical day | **NOAA NCEI Daily Summaries** | Central Park station `USW00094728` **[VERIFY]**. TMAX/TMIN; humidity not in daily summaries → **[DECISION]** TMAX tiers vs. hourly-derived heat index. |
| Validation | **NYC Heat-Related Illness (syndromic surveillance)**, NYC Environment & Health Data Portal | Heat-attributed ED visits only. **[VERIFY]** temporal/geographic granularity. |
| Medication–heat rules | **CDC "Heat and Medications — Guidance for Clinicians"** | Source of truth for `med_rules.json`. Tracker names: lithium, clozapine, antipsychotics, anticholinergics, diuretics; add others only if on the CDC page. |
| Design inspiration | University of Sydney HeatWatch | Reference only. |
| Resources / referral | 211 New York (link only); APA extreme-heat resources (optional) | Link out; don't copy content. |
| Optional | NYC Open Data cooling centers; MTA bus stops | Stretch only (e.g., show nearest cooling center on patient page). |

---

## 8. Scoring model (deterministic and explainable)

All numbers are **starter placeholders**; clinical/public-health teammates review. Keep everything in `CONFIG`; `#/methods` renders CONFIG live so docs never drift.

### 8.1 Neighborhood score (0–10)

```
neighborhood_score = env_points + hvi_points + burden_points
```

- **env_points (0–4)** from the episode's max temperature. Starter tiers: `<85°F→0`, `85–89→1`, `90–94→2`, `95–99→3`, `≥100→4`. **[VERIFY]** against NWS New York heat-advisory criteria and cite.
- **hvi_points (0–4)** = `HVI − 1`.
- **burden_points (0–2)** = tercile of a composite PLACES burden (z-scored mean of chosen measures). **[DECISION]** measures.
- **Bands:** `0–3 Safe`, `4–6 Moderate`, `7–10 Dangerous`. **[DECISION]** cutoffs; sanity-check distributions (ordinary day mostly green/yellow; worst heat wave shows red clusters — don't force it).

### 8.2 Personal band (per patient, per location)

Start from the neighborhood band of the location, then escalate (each step = one level up, cap at Dangerous, never de-escalate):

1. **Medication rule:** any patient medication whose class is `high` in `med_rules.json` **and** `env_points ≥ 2` → +1.
2. **Stacking rule:** ≥2 distinct heat-relevant classes (and `env_points ≥ 2`) → +1.
3. **Vulnerability rule:** (age ≥ 65 **or** no home AC **or** a qualifying chronic condition) **combined with** ≥1 heat-relevant medication → +1.
4. Cap escalation at +2.

Compute the personal band for **every neighborhood** (to color the patient's personalized map) and for each saved place. Every result carries a `reasons[]` array that feeds "Why this color" and the care-team alert.

### 8.3 Medication rules (`med_rules.json`)

```json
{
  "id": "anticholinergic",
  "label": "Anticholinergic medications",
  "examples": ["<from CDC page>"],
  "risk_level": "high|moderate",
  "mechanism": "<one sentence from CDC guidance>",
  "patient_advice": "<plain language, 6th-grade reading level>",
  "clinician_note": "<counseling / monitoring points from CDC guidance>",
  "source_url": "<CDC page URL>",
  "reviewed_by": "<initials or 'UNREVIEWED'>"
}
```

Every entry must trace to the CDC page. Show a banner wherever an `UNREVIEWED` rule is used.

### 8.4 Episodes (`episodes.json`)

Let the prep script find high-TMAX days in the NOAA data. Candidates likely include the July 2019 and June 2025 heat waves **[VERIFY from data]**. Store `id, date, tmax, tmin, label`.

---

## 9. Synthetic patient data model

All patients are fictional (`"synthetic": true`), with fictional addresses (within the chosen neighborhood) and phone numbers in the reserved `555-01xx` range. The team will supply condition details later; until then use `TODO_` placeholders and let Claude Code build the UI against a filled-in sample.

```json
{
  "id": "patient1",
  "synthetic": true,
  "display_name": "TODO",
  "age": 0, "sex": "TODO",
  "conditions": ["TODO"],
  "medications": [
    { "name": "TODO", "dose": "TODO", "class_id": "<med_rules id or null>", "prescriber": "TODO", "start_date": "TODO" }
  ],
  "heat_profile": { "has_ac": true, "lives_alone": false, "mobility": "TODO" },
  "locations": [
    { "id": "home", "label": "Home", "type": "home", "nta_id": "TODO", "address": "fictional", "lat": 0, "lon": 0 },
    { "id": "pharmacy", "label": "Pharmacy", "type": "pharmacy", "nta_id": "TODO" },
    { "id": "clinic", "label": "Clinic", "type": "clinic", "nta_id": "TODO" }
  ],
  "current_location_id": "home",
  "consent": { "share_red_alerts_with_care_team": true, "date": "TODO" },
  "chart": {
    "demographics": { "address": "", "phone": "", "emergency_contact": {} },
    "healthcare_proxy": { "name": "", "relationship": "", "phone": "" },
    "pharmacy": { "name": "", "address": "", "phone": "" },
    "visit_notes": [ { "date": "", "type": "", "provider": "", "subjective": "", "objective": "", "assessment": "", "plan": "" } ],
    "after_visit_summaries": [ { "date": "", "summary": "" } ],
    "appointments": [ { "date": "", "provider": "", "reason": "" } ],
    "other_conditions": [],
    "labs": [ { "date": "", "panel": "", "results": [ { "name": "", "value": 0, "unit": "", "ref_range": "", "flag": "" } ] } ],
    "imaging": [ { "date": "", "modality": "", "body_part": "", "report": "", "image_file": "data/placeholders/xxx.png" } ]
  }
}
```

**Depth tiers (time-boxing):** make **Patient 1 the headline demo case** with the full chart (multiple detailed visit notes, labs, appointments, imaging). Patients 2 and 3 get lighter but complete charts (at least meds, conditions, 1–2 visit notes, appointments, pharmacy, proxy, contacts). Charts are drafted with Claude at build time from short persona briefs; a clinical teammate reviews for plausibility (e.g., heat-relevant labs such as sodium, creatinine/eGFR, and a lithium level when relevant).

**Choose the three patients so the demo shows contrast:** the same neighborhood/episode yields different personal colors (e.g., Patient with no heat-relevant meds stays green while another with stacked classes and no AC turns red), and each has at least one saved place that is dangerous for them and one that is safe.

---

## 10. Page specs (acceptance criteria)

**Overview (`#/`)**: NYC map colored by neighborhood band for the selected episode; hover/tap shows neighborhood name, score, HVI, burden, why. Top-10 highest-risk list. Legend. "Sign in" entry to `#/login`. No patient data shown.

**Login (`#/login`)**: four clickable account cards; clicking routes to the right home page. "Switch account" always reachable.

**Patient home**: status card, personalized map, saved places ranking, alert area (yellow/red behavior exactly as section 4), medication page, disclaimer, consent line. Acceptance: switching episode or current location updates status, map, and alerts immediately.

**Care-team home**: alert inbox with actions, patient list ranked by risk, care-team map. Acceptance: a red alert produced by a patient's location change appears in the inbox without visiting the patient account; a yellow report appears only after the patient submits it.

**Patient chart**: all tabs in 3.4 render from JSON; imaging shows placeholders and reports; Heat-risk tab shows alert timeline and "why".

**Methods / Evidence / Ethics**
- *Methods*: auto-rendered CONFIG, data sources, limitations.
- *Evidence*: day-level check (citywide daily heat-illness ED visits vs. `env_points`, honest correlation), area-level check only if the data granularity allows; otherwise state limits. Proposed real-world success metrics (alerts delivered, time-to-acknowledgement, outreach calls, heat-related ED visits among enrolled patients).
- *Ethics*: not medical advice; synthetic data; consent for red-alert sharing and what is shared; data minimization; simplified rules and clinician-review status; area-level scores (ecological fallacy); PLACES are modeled estimates; single weather station; language/digital-access equity; false alarms and alert fatigue; sustainability note.

---

## 11. Build order and time plan

| Phase | Deliverable | Owner (suggested) |
|---|---|---|
| **P0 (1h)** | Scaffold, router, state store, empty pages, placeholder data so UI work can start in parallel | Claude Code |
| **P1 (3–4h)** | `prep_data.py` → neighborhoods, HVI, PLACES burden, episodes; `SOURCES.md` | Data person + Claude Code |
| **P2 (parallel)** | `med_rules.json` from CDC page + clinical review; 3 patient briefs → synthetic charts, placeholder scans | Clinical person + Claude |
| **P3 (3h)** | `scoring.js` + manual tests; Overview map | Claude Code |
| **P4 (3h)** | Login page; Patient home with personalized map, saved places, "why" | Claude Code |
| **P5 (3h)** | `alerts.js` + yellow/red workflow; Care-team home (inbox, patient list, map) | Claude Code |
| **P6 (3h)** | Patient chart tabs | Claude Code + clinical reviewer |
| **P7 (2h)** | Evidence page (real ED data or honest fallback) | Data person + Claude Code |
| **P8 (2h)** | Methods + Ethics pages, accessibility/mobile pass, offline test, deploy, demo rehearsal | Everyone |

**Cut order if time runs short (cut from the bottom):** ES/ZH tip translations → care-team acknowledgement shown to patient → area-level validation → imaging tab (keep placeholder only) → extra episodes. **Never cut:** Overview map, account switcher, patient personalized map + alert workflow, care-team alert inbox, chart basics (meds, visit notes, conditions, appointments, pharmacy/proxy/contacts), Ethics page, `SOURCES.md`.

---

## 12. Working agreements for Claude Code

1. **Ask first** on every **[DECISION]** and **[VERIFY]**; log answers in `DECISIONS.md` (date, choice, reason).
2. **Never fabricate real data or clinical content.** Unavailable values → obvious `TODO_` placeholders, listed in README under "Open TODOs". Synthetic patient charts are allowed only if clearly labeled synthetic and flagged for clinical review.
3. **Explain simply.** After each phase, tell the team in plain language what changed, how to run it, what to check. Short, plain code comments.
4. **Boring and robust:** no dependencies beyond vendored Leaflet (and pandas for the prep script).
5. **Scoring is the single source of truth** (`scoring.js`); alerts, maps, and Methods page all read from it.
6. **Test with the manual table:** ≥10 cases (input → expected band and alert level), including each patient across at least two episodes and locations. Confirm before demo.
7. **Show your work in the UI:** every color has a "why"; every alert lists the rules that fired.
8. Commit small and often; suggest a commit message after each phase.

---

## 13. Open decisions (resolve early)

1. Unit of analysis (NTA vs ZCTA vs community district).
2. Weather metric (TMAX tiers vs computed heat index).
3. PLACES measures for the burden composite.
4. Final band cutoffs and env tiers (after checking NWS criteria and score distributions).
5. Which 3–5 episodes to feature.
6. The three patients' conditions, medications, saved places (team to supply; Claude Code drafts charts).
7. Which patient has `consent = true/false` in the demo (recommend: at least one true; optionally one false to show the degrade-to-yellow flow).
8. Who clinically signs off medication rules and synthetic charts.
9. Whether patients can view any part of their own chart (recommend: only meds + upcoming appointments).
10. Hosting target (GitHub Pages / Netlify Drop / local).

---

## 14. 3-minute demo script (target)

1. **Problem (20s):** heat is dangerous for people on certain medications, but weather alerts treat everyone the same.
2. **Overview map (25s):** pick a historical heat wave → NYC turns yellow/red in high-vulnerability neighborhoods.
3. **Patient A (35s):** sign in as Patient 1 → the *same* map looks different, with their risky places marked → they move to a Moderate place → **yellow warning** → tap "Report to care team".
4. **Patient B (35s):** switch to Patient 2, a red place → **red warning**, "your care team has been notified".
5. **Care team (45s):** switch to Care Team → inbox shows the yellow report and the auto-sent red alert → open the chart (meds, notes, labs) → acknowledge and mark contacted.
6. **Evidence + ethics (15s):** validation against real ED data; consent model; what we don't claim.
7. **Scale (5s):** swap data files → another city.
