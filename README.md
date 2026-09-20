# Hypertension in Heat

An explainable prototype for prioritizing preventive heat outreach to adults
with hypertension. It combines patient vulnerability with the official National
Weather Service (NWS) HeatRisk forecast and returns one of three
outreach levels: **routine**, **targeted**, or **priority**.

> [!WARNING]
> This project is a non-validated decision-support prototype. It does not
> diagnose heat illness, estimate an individual's probability of harm, or
> provide medication or fluid-management advice. Do not stop or change
> medications or prescribed fluid limits based on its output. Emergency or new
> heat-related symptoms require clinical assessment independent of the score.

## How it works

The v0.3 model keeps two concepts separate:

- **Patient vulnerability (`V`, 0–8):** the sum of four scored domains.
- **NWS HeatRisk (`H`, 0–4):** the forecast category for a ZIP code and local
  date.

`H` and `V` are never added together. The model uses them as separate inputs to
an outreach-priority matrix.

| Scored domain | Range | Summary |
| --- | ---: | --- |
| Clinical susceptibility | 0–2 | Age 65+, heart failure, chronic kidney disease, diabetes, and previous heat illness; capped at 2 |
| Medication considerations | 0–2 | Heat-relevant medication classes, with the maximum assigned to a diuretic plus an ACE inhibitor, ARB, or ARNI |
| Cooling access | 0–2 | Reliable home cooling or a confirmed, usable alternative cooling location |
| Support and assistance | 0–2 | Reliable check-ins and help carrying out the heat-safety plan |

Expected heat exposure, cooling breaks, and strenuous activity are optional
action-personalization fields. They do not affect the score, assessment status,
or outreach priority.

### Outreach matrix

| NWS HeatRisk | V 0–2 | V 3–5 | V 6–8 |
| --- | --- | --- | --- |
| 0 — Little to none | Routine | Routine | Routine |
| 1 — Minor | Routine | Targeted | Targeted |
| 2 — Moderate | Targeted | Targeted | Priority |
| 3 — Major | Targeted | Priority | Priority |
| 4 — Extreme | Priority | Priority | Priority |

The weights, score bands, and matrix cells are provisional project policy, not
a clinically validated risk model.

## Features

- Retrieves NWS HeatRisk for a five-digit U.S. ZIP code.
- Validates the forecast location, issue time, valid period, value, and freshness.
- Recognizes a deliberately limited set of common generic hypertension
  medications from the CDC's heat-and-medications guidance.
- Preserves unknown patient data as score ranges instead of treating it as
  negative.
- Reports when missing information could change the outreach decision.
- Routes reported emergency or other new symptoms before preventive scoring.
- Supports offline or synthetic HeatRisk values for development and testing.
- Returns structured, auditable results with reason codes, action IDs, source
  references, and validation errors.

## Repository contents

| Path | Purpose |
| --- | --- |
| `heat_outreach_risk_assessment.ipynb` | Model implementation, medication mapping, NWS lookup, and worked example |
| `heat_outreach_model_definition_v0_3.json` | Required scoring rules, messages, actions, and source metadata |

## Requirements

- Python 3.11 or newer
- JupyterLab or Jupyter Notebook
- Internet access for live NWS lookups

The prototype implementation otherwise uses only the Python standard library.

## Quick start

1. Clone the repository and enter the project directory.
2. Start Jupyter:

   ```bash
   jupyter lab heat_outreach_risk_assessment.ipynb
   ```

3. Run the notebook from top to bottom, edit the example patient record, and
   call the main entry point:

   ```python
   assessment = assess_patient_for_zip(
       patient=patient,
       zip_code="72301",
       forecast_date=None,  # today at the ZIP code
   )
   show_assessment(assessment)
   ```

ZIP codes with leading zeroes must be strings, for example `"02108"`. The
patient's `location_id` must match the requested ZIP in `ZIP:12345` format.

For offline development or a synthetic forecast, bypass the network helper:

```python
assessment = assess_heat_outreach(
    patient=patient,
    heatrisk_level=2,
    forecast_date="2026-07-15",
)
```

## Patient data

The scorer is scoped to adults with confirmed hypertension. A patient record
uses a non-empty pseudonymous `patient_id`, an integer `age`, and `True`,
`False`, or `None` for clinical and social fields. Missing keys and `None` stay
unknown.

Medication names can be normalized into model fields before assessment:

```python
patient, medication_check = apply_hypertension_medications(
    patient,
    [
        "lisinopril 10 MG Oral Tablet",
        "hydrochlorothiazide 25 MG Oral Tablet",
    ],
    medication_list_complete=True,
)
```

Set `medication_list_complete=True` only when the supplied active medication
list is complete. Unrecognized medication entries leave the review incomplete;
they are not assumed to be safe or irrelevant.

## Missing data and failure behavior

For unknown scored inputs, the model calculates minimum and maximum domain
scores and evaluates every possible score in that range:

- If every completion produces the same priority, the assessment returns that
  priority with `partial` status.
- If the priority could change, it returns `needs_information` and lists the
  possible priorities.
- If the NWS forecast cannot be verified, it returns `forecast_unavailable` and
  never substitutes HeatRisk 0.
- Invalid inputs return `invalid_input`; patients outside the model's scope
  return `out_of_scope`.

## Privacy and data handling

The live lookup sends only the ZIP code to the NWS service. Do not send patient
identifiers, clinical details, or medication information to NWS. Avoid placing
direct identifiers in the notebook; use a pseudonymous patient ID and follow
the data-handling requirements of the environment in which the prototype runs.

## Data sources

- [NWS National Digital Forecast Database XML service](https://digital.weather.gov/xml/rest.php)
- [CDC Heat and Medications guidance for clinicians](https://www.cdc.gov/heat-health/hcp/clinical-guidance/heat-and-medications-guidance-for-clinicians.html)

Consult the current NWS documentation before deployment. The medication mapping
is intentionally non-exhaustive and should be pharmacist-reviewed before any
clinical deployment.

## How we built it

We built the prototype as a Python notebook backed by a versioned JSON model
definition. The JSON keeps the scoring policy, priority matrix, actions,
messages, and evidence references separate from the implementation so every
decision can be inspected and revised.

The pipeline calculates a patient vulnerability score from clinical
susceptibility, medication considerations, cooling access, and available
support. It then retrieves the NWS HeatRisk forecast for the patient's ZIP code
and combines the two values through an explicit priority matrix. A small
medication-normalization layer maps common generic hypertension medicines to
the model's heat-relevant classes. The final result includes the score or score
range, outreach priority, reason codes, suggested actions, missing fields, and
forecast provenance.

## Challenges we ran into

The hardest challenge was translating broad public-health guidance into rules
without making the prototype look more clinically certain than it is. We kept
HeatRisk and patient vulnerability separate, documented the provisional
weights, and added clear boundaries around diagnosis and medication advice.

Missing data also required careful handling. Treating an unanswered question
as “no” could systematically understate risk, so the model calculates minimum
and maximum possible scores and reports when uncertainty could change the
outreach decision. We also had to handle stale or malformed forecasts, ZIP-code
and location mismatches, incomplete medication lists, and urgent symptoms that
must be surfaced before any network request or preventive score.

## Accomplishments that we're proud of

- Built an explainable, end-to-end path from patient and ZIP-code inputs to an
  auditable outreach recommendation.
- Made uncertainty a first-class output instead of silently filling missing
  clinical or social data.
- Added both live NWS lookup and offline assessment modes without treating an
  unavailable forecast as low risk.
- Limited the live request to a ZIP code, keeping patient and medication data
  out of the weather service call.
- Created a human-readable, versioned model definition that reproduces the
  notebook's scoring, symptom-routing, and action behavior.

## What we learned

Heat outreach is not only a medical-risk problem. Access to cooling,
transportation, check-in support, and help carrying out a safety plan can shape
whether prevention advice is actionable. We also learned that provenance and
failure behavior matter as much as the score: a recommendation should show
which rule version and forecast produced it, what remains unknown, and when it
should not be used.

Most importantly, explainability does not equal validation. Transparent rules
make review and testing easier, but clinical usefulness, fairness, calibration,
and real-world benefit still need to be demonstrated.

## What's next for Hypertension in Heat

Next steps are to review the policy with clinicians, pharmacists, public-health
teams, and community health workers; test it on representative de-identified
and historical scenarios; and evaluate performance and equity across patient
groups and locations. We also plan to extract the notebook into a tested Python
package, add automated schema and regression tests, expand forecast and
medication coverage carefully, and build a simple workflow for outreach teams.

Any clinical pilot would require governance, privacy and security review,
prospective validation, clear escalation procedures, and monitoring for both
missed risk and unnecessary outreach.
