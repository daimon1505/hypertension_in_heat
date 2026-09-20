# Hypertension in Heat

Hypertension in Heat is an explainable hackathon project for preventive heat
outreach to adults with hypertension. The repository now contains two related
artifacts:

1. **HeatSafe NYC**, a static click-through website that demonstrates
   neighborhood, patient, and care-team workflows with synthetic patient data.
2. **The v0.3 assessment notebook**, a Python reference implementation that
   combines patient vulnerability with official NWS HeatRisk.

> [!WARNING]
> This project is a non-validated prototype, not a medical device. It does not
> diagnose or rule out heat illness, estimate an individual's probability of
> harm, or recommend medication or prescribed-fluid changes. Urgent or new
> symptoms require clinical assessment independently of any score shown here.

## Start the HeatSafe NYC demo

The website has no package installation or build step. From the repository
root, run:

```bash
cd "Hackathon 2026 - VScode"
python3 -m http.server 8000
```

Then open [http://localhost:8000/site/](http://localhost:8000/site/).

For a quick offline preview, double-click
`Hackathon 2026 - VScode/index.html`. The site falls back to its generated data
bundle when opened directly from the filesystem.

The full walkthrough, demo accounts, and editing guide are in the
[HeatSafe NYC README](<Hackathon 2026 - VScode/README.md>).

## What the web demo includes

- A public NYC neighborhood heat-risk map.
- Three synthetic patient personas with hypertension and different medicines,
  conditions, cooling access, and support needs.
- Personalized patient risk, medication information, a cached seven-day
  forecast, nearby example cool spaces, and a care-team ticket flow.
- A care-team dashboard with red-risk alerts, patient charts, medication flags,
  notes, and privacy-preserving neighborhood counts.
- Methods, evidence, and ethics pages that expose the rules and limitations.
- In-memory and `sessionStorage` demo state; no backend, real authentication,
  analytics, cookies, or real patient records.

Use **Demo controls → Heat episode B — severe** to show low, medium, and high
patient-risk states during a walkthrough.

## Two complementary implementations

The website and notebook illustrate different stages of the project. They do
not currently share one scoring engine.

| | HeatSafe NYC web demo | v0.3 notebook |
| --- | --- | --- |
| Primary purpose | Demonstrate patient and care-team workflows | Demonstrate an uncertainty-aware outreach rule |
| Environmental input | Episode temperature plus neighborhood HVI and chronic-disease burden | Official NWS HeatRisk `H = 0–4` for a ZIP code and local date |
| Patient logic | Adds personal medication and vulnerability points to a neighborhood score | Calculates four patient domains totaling `V = 0–8` |
| Output | Low, medium, or high personal risk with yellow/red workflow behavior | Routine, targeted, or priority outreach |
| Main rules | `Hackathon 2026 - VScode/site/js/scoring.js` | `heat_outreach_model_definition_v0_3.json` |
| Runtime | Static HTML, CSS, and JavaScript | Python/Jupyter |

The website's `heat_outreach_model_definition.json` is a v0.1 specification
artifact. The live demo's current risk colors are determined by the `CONFIG`
object in `site/js/scoring.js`.

## Current data status

| Data | Status |
| --- | --- |
| NYC 2020 Neighborhood Tabulation Area boundaries | Loaded and simplified from NYC Open Data |
| Seven-day Central Park forecast | Real NWS high/low temperature forecast cached at build time |
| Medication rules | 17 classes loaded from the team spreadsheet; all remain unreviewed |
| Patient records | Fully synthetic |
| NYC Heat Vulnerability Index | Placeholder neighborhood values |
| CDC PLACES chronic-disease burden | Placeholder neighborhood values |
| Historical heat episodes | Placeholder replay scenarios |
| Cool spaces | Example map locations, not verified cooling centers |
| Heat-illness validation data | Not yet loaded |
| Official HeatRisk in the website | Not yet integrated; the cached website forecast contains temperatures only |

See [data/SOURCES.md](<Hackathon 2026 - VScode/data/SOURCES.md>) for the
source-by-source status and caveats. Placeholder values are for interface
demonstration only and must not be presented as measured neighborhood risk.

## Refresh or rebuild website data

Run these commands from `Hackathon 2026 - VScode/`.

Refresh the cached NWS forecast and rebuild the offline bundle:

```bash
python3 scripts/fetch_forecast.py
python3 scripts/bundle_data.py
```

Recreate the simplified map and placeholder neighborhood metrics, then rebuild
the bundle:

```bash
python3 scripts/prep_data.py
python3 scripts/bundle_data.py
```

The scripts use the Python standard library. Refreshing the forecast requires
internet access; the website itself runs offline from committed files.

## Run the v0.3 notebook

The notebook requires Python 3.11 or newer, JupyterLab or Jupyter Notebook, and
internet access for live NWS lookups.

```bash
jupyter lab heat_outreach_risk_assessment.ipynb
```

Run the cells from top to bottom and call:

```python
assessment = assess_patient_for_zip(
    patient=patient,
    zip_code="72301",
    forecast_date=None,  # today at the ZIP code
)
show_assessment(assessment)
```

ZIP codes with leading zeroes must be strings, such as `"02108"`. The
patient's `location_id` must match the requested ZIP in `ZIP:12345` format.

For offline development or a synthetic forecast:

```python
assessment = assess_heat_outreach(
    patient=patient,
    heatrisk_level=2,
    forecast_date="2026-07-15",
)
```

### Notebook scoring model

The notebook keeps patient vulnerability and environmental risk separate:

- **Patient vulnerability (`V`, 0–8):** clinical susceptibility, medication
  considerations, cooling access, and support/assistance, each scored `0–2`.
- **NWS HeatRisk (`H`, 0–4):** the official forecast category for the ZIP code
  and local date.

`H` and `V` are never added together. An explicit matrix maps them to routine,
targeted, or priority outreach. Expected heat exposure, cooling breaks, and
strenuous activity may personalize actions but do not change the notebook's
score or priority.

Missing scored inputs remain unknown. The notebook calculates the minimum and
maximum possible score and checks every priority in that range:

- A stable priority is returned with `partial` status.
- A range that crosses priority levels returns `needs_information` and lists
  the possible priorities.
- An unusable forecast returns `forecast_unavailable`; it is never replaced
  with HeatRisk 0.

## Repository map

| Path | Purpose |
| --- | --- |
| [`Hackathon 2026 - VScode/`](<Hackathon 2026 - VScode/>) | HeatSafe NYC demo and supporting assets |
| [`site/`](<Hackathon 2026 - VScode/site/>) | Static HTML, CSS, JavaScript, maps, and vendored Leaflet assets |
| [`data/processed/`](<Hackathon 2026 - VScode/data/processed/>) | Website-ready map, forecast, medication, patient, and content data |
| [`scripts/`](<Hackathon 2026 - VScode/scripts/>) | Data preparation, forecast refresh, bundling, and slide-generation scripts |
| [`Drug-Heat Risk Table.xlsx`](<Hackathon 2026 - VScode/Drug-Heat Risk Table.xlsx>) | Team medication-risk knowledge base |
| [`tests/scoring.test.md`](<Hackathon 2026 - VScode/tests/scoring.test.md>) | Manual scoring and workflow test cases |
| [`PLAN.md`](<Hackathon 2026 - VScode/PLAN.md>) | Product scope, architecture, and backlog |
| [`DECISIONS.md`](<Hackathon 2026 - VScode/DECISIONS.md>) | Provisional product and scoring decisions |
| [`heat_scoring_visual_guide.pdf`](<Hackathon 2026 - VScode/heat_scoring_visual_guide.pdf>) | Visual scoring guide |
| [`docs/`](<Hackathon 2026 - VScode/docs/>) | Service blueprint and journey/system presentation pages |
| [`Demostration/`](<Hackathon 2026 - VScode/Demostration/>) | Exported journey and service-system maps |
| [`Styles/`](<Hackathon 2026 - VScode/Styles/>) | Visual references used during design |
| `backup-before-restyle/`, `backup-before-style2/` | Reversible snapshots of earlier website styles |
| [`heat_outreach_risk_assessment.ipynb`](heat_outreach_risk_assessment.ipynb) | v0.3 Python assessment, medication mapper, NWS lookup, and example |
| [`heat_outreach_model_definition_v0_3.json`](heat_outreach_model_definition_v0_3.json) | Executable notebook rules, actions, messages, and source registry |

## Privacy, evidence, and limitations

- All website patients, charts, addresses, phone numbers, alerts, and clinical
  notes are synthetic.
- The website is a static demonstration. Its account switcher is not real
  authentication, and its alert workflow does not contact a healthcare system.
- The notebook sends only a ZIP code to the NWS forecast service; patient and
  medication information remain local.
- The scoring weights, thresholds, bands, and escalation rules are provisional
  design choices and have not been clinically validated or calibrated.
- Medication mappings require pharmacist or physician review before any
  clinical use.
- A real pilot would require validated data, automated tests, prospective and
  equity evaluation, governance, security review, and defined escalation and
  monitoring procedures.

Primary external references include the
[NWS National Digital Forecast Database](https://digital.weather.gov/xml/rest.php)
and [CDC Heat and Medications guidance](https://www.cdc.gov/heat-health/hcp/clinical-guidance/heat-and-medications-guidance-for-clinicians.html).
