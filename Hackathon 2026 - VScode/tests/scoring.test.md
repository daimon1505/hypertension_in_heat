# Scoring manual test table

Expected results with the current placeholder area data, the team drug-heat knowledge base, and CONFIG in `site/js/scoring.js`.
Re-check each row in the app (Demo controls → episode + location) whenever data or rules change.

| # | Patient (age) | Location | Episode | Area score | Personal points | Total | Patient sees | Doctor sees | Checked |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Maria Santos (58) | Home | Ordinary summer day (placeholder) (84°F) | 0 | +0 (none) | 0 | **Low risk** | none | ☐ |
| 2 | Maria Santos (58) | Home | Heat episode B — severe (placeholder) (97°F) | 3 | +1.5 (medication) | 4.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 3 | Maria Santos (58) | Clinic | Heat episode B — severe (placeholder) (97°F) | 4 | +1.5 (medication) | 5.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 4 | Maria Santos (58) | Work | Heat episode A — moderate (placeholder) (92°F) | 3 | +1.5 (medication) | 4.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 5 | Robert Hayes (67) | Home | Ordinary summer day (placeholder) (84°F) | 2 | +1.5 (vulnerability) | 3.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 6 | Robert Hayes (67) | Home | Heat episode B — severe (placeholder) (97°F) | 5 | +3.5 (medication, stacking, vulnerability) | 8.5 | **High risk** | RED — auto-sent to doctor | ☐ |
| 7 | Robert Hayes (67) | Pharmacy | Heat episode A — moderate (placeholder) (92°F) | 3 | +3.5 (medication, stacking, vulnerability) | 6.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 8 | Aisha Khan (34) | Home | Heat episode B — severe (placeholder) (97°F) | 3 | +0 (none) | 3 | **Low risk** | none | ☐ |
| 9 | Aisha Khan (34) | Work | Heat episode B — severe (placeholder) (97°F) | 5 | +0 (none) | 5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 10 | Aisha Khan (34) | Work | Heat episode C — extreme (placeholder) (101°F) | 6 | +0 (none) | 6 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 11 | Aisha Khan (34) | Family | Heat episode C — extreme (placeholder) (101°F) | 4 | +0 (none) | 4 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |
| 12 | Maria Santos (58) | Home | Heat episode C — extreme (placeholder) (101°F) | 4 | +1.5 (medication) | 5.5 | **Medium risk** | Yellow — no doctor alert; patient may send a ticket | ☐ |

Also check:
- [ ] A patient ticket (medium risk) appears under "Notes from patients" and does **not** create a red notification.
- [ ] A red alert (consent = true) reaches the doctor **without** opening the patient account.
- [ ] Red alert cards list current medications, RED ones highlighted, each with its source.
- [ ] Patients aged 65+ show the "consider phoning them" prompt.
- [ ] The doctor's map shows only neighborhood counts, never names.
- [ ] A note added by the doctor appears on that patient's page under "Note from my doctor".
- [ ] Reset demo clears all alerts.
