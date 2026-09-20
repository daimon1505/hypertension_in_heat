# Decisions log

Every **[DECISION]** / **[VERIFY]** item from PLAN.md is listed here. Record the answer as: date, choice, reason.

## Provisional choices made to start building (2026-09-19). Please confirm or change them.

| # | Item | Provisional choice | Why | Confirmed? |
|---|---|---|---|---|
| 1 | Unit of analysis | 2020 NTAs (262 areas, 197 residential) | First option in PLAN.md; boundaries downloaded from NYC Open Data. Easy to swap if HVI is published at another level. | ☐ |
| 2 | Weather metric | TMAX tiers | Daily summaries have no humidity | ☐ |
| 3 | PLACES measures | — (placeholder burden values) | Waiting for team | ☐ |
| 4 | Band cutoffs / env tiers | PLAN.md starter values (0–3 / 4–6 / 7–10; 85/90/95/100°F) | Not yet checked against NWS criteria | ☐ |
| 5 | Episodes | 4 placeholder episodes (84 / 92 / 97 / 101°F) | Waiting for NOAA data | ☐ |
| 6 | Patient personas | Superseded by #13 (all hypertension). See the table in README.md. | Chosen to show low / medium / high contrast; team to confirm | ☐ |
| 7 | Consent in demo | Maria = true, Robert = true, Aisha = **false** (shows the "degrade to prompt" flow) | PLAN.md recommendation | ☐ |
| 8 | Clinical sign-off | Nobody yet; all rules marked `UNREVIEWED` | — | ☐ |
| 9 | Patient view of own chart | Only medicines (with heat notes) | PLAN.md recommendation | ☐ |
| 10 | Hosting | Local for now | — | ☐ |
| 11 | Med-rule risk levels | Superseded by #14 — now taken from the team's drug-heat table (RED / YELLOW / GREEN) | Team's own knowledge base | ☐ |
| 12 | Qualifying chronic conditions (vulnerability rule) | heart failure, coronary, COPD, chronic kidney, diabetes, stroke, dementia, schizophrenia | Placeholder list in `scoring.js` | ☐ |

## Round 2 (2026-09-19) — from the team's edit list

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 13 | Scope | **Hypertension only.** All three personas have hypertension; their medicines come from the team's drug-heat table. The engine still supports every class in that table. | ☐ |
| 14 | Medication rules source | `Drug-Heat Risk Table.xlsx` (team knowledge base v0.1) replaces the CDC placeholders. RED → high, YELLOW → moderate, GREEN → no heat effect (does not raise risk). | ☐ |
| 15 | Patient-facing wording | Bands are shown to patients as **Low / Medium / High risk**. Clinician views keep Safe / Moderate / Dangerous, since alert levels are yellow/red. | ☐ |
| 16 | Physician notifications | **Red only.** Yellow situations never notify; a patient's note appears in a separate "Notes from patients" list. | ☐ |
| 17 | Physician map | Neighborhood **counts only** ("1 patient"), never names or addresses. Patient names stay in the patient list. | ☐ |
| 18 | 7-day forecast | Placeholder temperature series per episode, coloured by that patient's own risk. TODO_P1: real NOAA days. | ☐ |
| 19 | Cool places | Example location per neighborhood + link to NYC's official Cooling Center Finder and 311. The real list is only published during heat emergencies. | ☐ |
| 20 | 65+ prompt | Alert cards for patients aged 65+ suggest a phone call and show the healthcare proxy. | ☐ |

## Round 3 (2026-09-19) — layout sketch + icons

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 21 | Patient page layout | Rebuilt to follow `Reformat sketch.png`: status + "what heat can do to your body" on top, then note from the doctor, what to do today, then next-7-days (vertical) beside the heat map, with a floating ticket button. | ☐ |
| 22 | Icons | No emoji anywhere. All icons are line SVGs drawn in `site/js/icons.js` (one entry per icon, easy to swap for a licensed set later). | ☐ |
| 23 | **Personal risk is now points, not band jumps** | Each rule adds **+1.5 points** to the area score (max +3.5), instead of pushing the band up a whole level. A single band jump turned nearly every neighborhood red for anyone on a heat-risk medicine, which the sketch asked us to fix. Same three personas still read Low / Medium / High. | ☐ |
| 24 | Placeholder HVI distribution | Weighted (1:24%, 2:30%, 3:24%, 4:15%, 5:7%) instead of uniform, which matches the real index's shape and gives the map mostly Medium areas with a few High ones. Replaced by real HVI in P1. | ☐ |
| 25 | Low risk is grey | On the map and in the legend, low risk is grey rather than green, per the sketch. | ☐ |
| 26 | Map markers | Current location = blue dot; public cool spaces = small blue dots; saved places = icon only, no text. | ☐ |
| 27 | Note from the doctor | New section on the patient page. It shows notes the care team adds to an alert, plus status changes, and reads "N/A" when there is nothing. | ☐ |

## Round 4 (2026-09-19) — small fixes

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 28 | "Why am I … risk?" | Removed from the patient page. The reasons still drive the doctor's alert card and the Methods page. | ☐ |
| 29 | Doctor's note | Each patient now carries a simple simulated note (`doctor_note` in their JSON). Notes the care team adds during the demo appear above it. | ☐ |
| 30 | Medicines section | Now a patient-page section titled **"How heat affects my medicines"**, placed *above* "What to do today". The separate medicines page and its nav link are gone. "What to do today" no longer repeats any medicine, so each thing is said once. | ☐ |
| 31 | Next 7 days | Shows real dates ("July 20 … July 26") from a placeholder episode date; the first row is tagged "Today". TODO_P1 replaces these with the real NOAA dates. | ☐ |
| 32 | Patient map places | Home, work and family only. Clinic and pharmacy no longer appear as map markers or location chips (they are still in the patient record and the Demo controls drawer). | ☐ |

## Round 5 (2026-09-19) — patient page trim

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 33 | Status bar | Compact and **unboxed** — no card, border or tint behind it. Just the coloured risk icon, "Medium Risk", and the place + episode + temperature line. A short "Your doctor has been notified." shows only on high risk. | ☐ |
| 34 | "What heat can do to your body" | Removed from the page. The six icon + phrase items are still in `tips.json` (`consequences`) if you want them back. | ☐ |
| 35 | "What to do today" | Moved into the map column, directly under the heat map and beside "Cool places near you". | ☐ |

## Round 6 (2026-09-19)

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 36 | Patient map starting view | Starts fitted to the patient's own places (capped at zoom 12.5), then one level back out for context, instead of the whole city — the location dot and blue cool-space dots stay readable. Zoom out for the full city. It recentres when the patient "moves" to another place. The doctor's map still opens on the whole city. | ☐ |

## Round 7 (2026-09-19) — visual style

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 37 | Style pass | Inspired by `Style sample.jpg`, not copied: soft rounded cards (20px), pill buttons, pastel tints, generous spacing. **Type stayed the system font** — Urbanist read smaller and lighter at body sizes. | ☐ |
| 38 | Palette | Teal/mint as the brand (water + cooling), sage green highlights (green space), sky blue for the doctor's note and information boxes. Risk colours stay semantic but softer: grey-slate Low, amber Medium, coral High. | ☐ |
| 39 | Font | System font (San Francisco on Mac) for everything — clearest at small sizes. Urbanist stays vendored in `site/vendor/fonts/` and is switched on by adding it to `--font` in `style.css`, should you want it later. | ☐ |
| 40 | Reversible | `backup-before-restyle/` holds the previous `style.css` and `map.js`, with `HOW-TO-REVERT.md`. Two `cp` commands undo the whole restyle. | ☐ |

## Round 8 (2026-09-20) — my profile

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 41 | Patient profile | An avatar button beside "Hi, [Name]" opens a pop-up window: a simpler version of the record the doctor holds. | ☐ |
| 42 | What the patient may edit | Address, phone, emergency contact, "I have working AC at home", "I live alone", and the alert-sharing consent. These are things the patient knows best, and the cooling/support answers feed the advice. | ☐ |
| 43 | What stays read-only | Conditions, medicines, pharmacy, healthcare proxy and appointments, labelled "Only your care team can change these." Clinical records should not be patient-editable. | ☐ |
| 44 | Where edits live | In memory + sessionStorage only (`profileEdits` in `state.js`), never written back to the JSON files. The doctor's chart reflects them immediately, which demos the loop nicely. | ☐ |

## Round 9 (2026-09-20) — restyle from "Style sample 2"

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 45 | Navigation | Moved from a top bar to a **left sidebar**, as in the reference: logo, Main menu, About the model, then demo controls and the account chip at the bottom. Same destinations as before — no new pages. On phones it collapses to an icon-only top bar. | ☐ |
| 46 | Palette | Warm neutral ground, white cards, and **one accent (orange)** replacing the teal/mint. Risk colours now read grey / light orange / orange, matching the reference's own map legend. | ☐ |
| 47 | Shapes | Softer 16px cards, 12–13px buttons, tinted icon chips, segmented control with a black active pill, lighter hairline borders. | ☐ |
| 48 | Type | Left as the system font. The reference's geometric face would repeat the legibility problem we already rejected. | ☐ |
| 49 | Map | Low risk grey, medium light orange, high orange. "You are here" is now a dark dot, cool spaces orange, water a neutral blue-grey so it never reads as a risk colour. | ☐ |
| 50 | Content | **Unchanged.** No new panels, counters, search or menu items from the reference screenshots — only the visual language was taken. | ☐ |
| 51 | Reversible | `backup-before-style2/` holds the previous `style.css`, `ui.js`, `map.js` and `index.html`, with `HOW-TO-REVERT.md`. Four `cp` commands undo it. | ☐ |

## Round 10 (2026-09-20) — sidebar menu

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 52 | Main menu | Three fixed entries — Overview, Heat map, My health — that scroll to that part of the page (like a document outline) and highlight as you scroll. Page-to-page links sit below under "Go to". | ☐ |
| 53 | Entries on pages that lack the section | Kept visible and used as navigation instead: Heat map goes to the public map, My health to the signed-in patient's page, then scrolls there. An entry is dropped only when there is nowhere for it to go (My health when a care-team account is signed in). | ☐ |
| 54 | Removed from the interface | The "Placeholder data" banner, the "Example locations" note, "(placeholder)" in episode labels, and the consent sentence on the patient page. The consent control itself stays in My profile, and `data/SOURCES.md` still records what is real. | ☐ |

## Round 11 (2026-09-20) — real weather

| # | Item | Choice | Confirmed? |
|---|---|---|---|
| 55 | 7-day forecast | Now the **real National Weather Service forecast** for Central Park, fetched by `scripts/fetch_forecast.py` and cached in `data/processed/forecast.json` (the site never calls the API, so it still works offline). It is the default selection. | ☐ |
| 56 | Heat episodes kept | Real weather next week is mild (high 60s), so every patient reads Low risk. The placeholder heat episodes stay in Demo controls so the demo can still show medium and high risk. | ☐ |
| 57 | Still missing | The model definition asks for official **HeatRisk 0–4** per location and date. This feed carries temperatures only; HeatRisk ingestion is still to do. | ☐ |

## Questions found while building

- **The vulnerability rule has no temperature minimum in PLAN.md.** Robert (age 67, no AC) is therefore medium risk
  even on an ordinary 84°F day. Is that intended, or should it also require heat points ≥ 2? (One setting:
  `vulnerability_rule.min_env_points` in `scoring.js`.)
- **Robert is high risk almost everywhere** on his personal map during a severe episode. That follows from his profile
  (three heat-risk medicines, no AC, CKD, age 67) rather than from the map colours. Tell me if you would rather his
  map showed more variation.
- **Your spreadsheet has its own scoring** (RED 3 / YELLOW 2, ×1.5 stacking, +1 modifiers, thresholds 6 and 3).
  The site does not use it yet — it still uses the PLAN.md area score plus the points above. Say the word and
  I will switch the engine over to your table's scheme.
- **Dedup key.** An alert is one per patient + episode + place. The level is upgraded yellow → red in place.
  Switching episodes during a demo can therefore leave two cards for the same patient (one per episode).
  Use **Reset demo** between runs, or tell me if you want one card per patient instead.
- **Aisha stays "Low risk" at 97°F** because her neighborhood scores low and amlodipine adds nothing.
  If that reads oddly to judges, the band cutoffs or the heat tiers are the dials to turn (DECISIONS #4).
