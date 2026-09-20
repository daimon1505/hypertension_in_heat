# HeatSafe NYC (hackathon demo)

A click-through website demo for the NYC 2026 Climate + Health hackathon. **Scope: hypertension.**

1. **How dangerous a past heat episode was across NYC**, as a neighborhood map.
2. **What each patient should do today**: their risk level, what heat can do to their body, any note from their doctor, steps matched to their own medicines, a 7-day personal forecast, a heat map with nearby cool spaces, and a floating button to send a ticket to the care team.
3. **What the doctor sees**: a notification only when a patient is at **high (red) risk**, with the rules that fired, the patient's current medications (heat-risky ones flagged in red with their source), and a prompt to phone patients aged 65+.

Everything is static: no server, no login, no live data. All patients are **synthetic** (made up).
The full product plan is in [PLAN.md](PLAN.md).

---

## How to view the website

### Option A: Double-click (quickest)
In Finder, open this folder and double-click **`index.html`**. It opens the site in your browser.

### Option B: Local web server (recommended when you change data)
1. In VS Code, open the terminal: menu **Terminal → New Terminal** (or press **Ctrl + `**).
2. Type this and press Enter:
   ```
   python3 -m http.server 8000
   ```
3. Open **http://localhost:8000/site/** in your browser.
4. To stop the server, click in the terminal and press **Ctrl + C**.

After changing a file, refresh the browser (**Cmd + R**).

> **Why two options?** Browsers block data files when you double-click. To work around this, the site also reads
> `site/js/data_bundle.js`, a copy of all data files. If you edit anything in `data/processed/`, either use
> Option B or rebuild the copy with `python3 scripts/bundle_data.py`.

---

## The three patients (all have hypertension)

Pick **"Heat episode B — severe"** in ⚙ Demo controls and all three risk levels show at once:

| Patient | Age | Blood-pressure medicines | At home |
|---|---|---|---|
| Aisha Khan | 34 | amlodipine (no heat interaction) | ✓ **Low risk** |
| Maria Santos | 58 | hydrochlorothiazide (water pill — RED) | ! **Medium risk** |
| Robert Hayes | 67 | furosemide + metoprolol (RED), lisinopril (YELLOW), no AC, CKD | ⚠ **High risk** |

## Demo walkthrough (about 3 minutes)

1. **Heat map** (home page): click **⚙ Demo controls** (top right) and pick a heat episode. The map changes color.
2. **Sign in → Aisha Khan**: low risk. Same city, same day, but nothing on her list is urgent.
3. **Switch account → Maria Santos**: medium risk. She sees a note from her doctor, how heat affects each of her
   medicines, CDC steps for her situation, and a 7-day list showing which dates are risky *for her*.
   Click **My profile** (top right of the page) to see and edit her own details — untick "I have air conditioning"
   and her advice changes straight away.
4. **Switch account → Robert Hayes**: high risk. His doctor was told automatically (he consented), and his
   steps start with going somewhere cool.
5. On any patient page, the orange **Submit a ticket to the Care Team** button (bottom right) sends symptoms and a note.
6. **Switch account → Care Team**: only Robert's red alert notifies. Maria's note sits under *"Notes from patients"*.
   Open the alert: rules that fired, then his medications with the red ones flagged and sourced, plus a prompt to
   phone him (he is 67). The map shows *"1 patient"* per neighborhood — no names. Click his name for the full chart.
7. Add a note on that alert, then switch back to the patient: it appears under **Note from my doctor**.
8. Show **Methods**, **Evidence** and **Ethics** in the top menu.
9. **Demo controls → Reset demo** clears all alerts before the next run.

---

## How to add or change things

### Ask Claude (easiest)
Edit [PLAN.md](PLAN.md) or just describe what you want, for example:
- "Read PLAN.md and update the website."
- "Patient 2 should have COPD and take furosemide. Update their chart."
- "Change the heat-temperature tiers to 88/93/98/103."

### Where things live

| I want to change… | Edit this file |
|---|---|
| A patient's conditions, medicines, places, doctor's note, or chart | `data/processed/patients/patient1.json` (2, 3) |
| Medication heat rules (from your drug-heat spreadsheet) | `data/processed/med_rules.json` |
| Patient advice, symptoms, icon + phrase list (CDC) | `data/processed/tips.json` |
| Cool places shown to patients | `data/processed/cooling_sites.json` |
| Heat episodes (the replayed hot days) | `data/processed/episodes.json` |
| The real 7-day forecast | `python3 scripts/fetch_forecast.py` → `data/processed/forecast.json` |
| Care team name / phone | `data/processed/care_team.json` |
| **Any scoring number or threshold** | `site/js/scoring.js` → the `CONFIG` object at the top |
| Colors, fonts, spacing | `site/css/style.css` (the `:root` block at the top) |
| Undo the latest restyle | see `backup-before-style2/HOW-TO-REVERT.md` |
| Undo the earlier restyle | see `backup-before-restyle/HOW-TO-REVERT.md` |
| Icons (all line SVGs, no emoji) | `site/js/icons.js` |
| Page layouts | `site/js/pages/*.js` |

After editing anything in `data/processed/`, run `python3 scripts/bundle_data.py` so double-click mode stays up to date.

### Project layout

```
PLAN.md, README.md, DECISIONS.md
data/raw/              downloaded originals (NYC neighborhood boundaries)
data/processed/        small files the site reads
data/placeholders/     placeholder "scan" images (not real)
data/SOURCES.md        where each dataset comes from
scripts/prep_data.py   raw → processed
scripts/bundle_data.py processed → site/js/data_bundle.js
site/                  the website (index.html, css, js, vendor/leaflet)
tests/scoring.test.md  manual test table: input → expected color and alert
```

---

## Open TODOs

**Weather:** the 7-day forecast is real (National Weather Service, Central Park). Refresh it before a demo with
`python3 scripts/fetch_forecast.py` then `python3 scripts/bundle_data.py`. Note that on a mild week every patient
reads Low risk — pick a heat episode in **Demo controls** to show the risk story.

**Data (the map still uses PLACEHOLDER neighborhood numbers):**
- [ ] TODO_P1: real NYC Heat Vulnerability Index per neighborhood → `prep_data.py`
- [ ] TODO_P1: real CDC PLACES burden composite → `prep_data.py`
- [ ] TODO_P1: real heat episodes from NOAA (Central Park) → `episodes.json`
- [ ] TODO_P2: pharmacist/physician review of `med_rules.json` (built from `Drug-Heat Risk Table.xlsx`, still marked UNREVIEWED)
- [ ] TODO_P2: team to confirm the 3 patient personas (current ones are samples); clinical review of charts
- [ ] TODO_P2: replace the example cool places with NYC's official cooling-center list
- [ ] TODO_P7: validation against NYC heat-illness ED data → `validation.json`

**Decisions:** see [DECISIONS.md](DECISIONS.md).

**Later:** Spanish / Chinese tips, cooling-center finder, hosting (GitHub Pages or Netlify Drop).
