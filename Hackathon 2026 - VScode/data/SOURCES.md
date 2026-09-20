# Data sources

| Dataset | URL | Accessed | Used for | Status / caveats |
|---|---|---|---|---|
| NYC Open Data — 2020 Neighborhood Tabulation Areas (NTAs) | https://data.cityofnewyork.us/d/9nt8-h7nd | 2026-09-19 | Map shapes (`neighborhoods.geojson`) | ✅ Loaded. Simplified (~20 m tolerance) for speed. Non-residential areas (parks, airports, cemeteries) shown grey. |
| NYC Heat Vulnerability Index | NYC Environment & Health Data Portal | — | `hvi` in `neighborhood_metrics.json` | ⏳ TODO_P1. **Placeholder values in use.** [VERIFY] granularity and vintage. |
| CDC PLACES | https://www.cdc.gov/places/ | — | `burden_index` in `neighborhood_metrics.json` | ⏳ TODO_P1. **Placeholder values in use.** Modeled estimates; tract → NTA via NYC equivalency table (`hm78-6dwm`). |
| **National Weather Service forecast** | https://api.weather.gov/gridpoints/OKX/34,45/forecast (Central Park) | 2026-09-20 | `forecast.json` — real 7-day highs and lows, shown as the default "Live forecast" | ✅ Loaded. Public domain. Refresh with `python3 scripts/fetch_forecast.py`. Temperatures only — **not** the official HeatRisk 0–4 the model definition asks for. |
| NOAA NCEI Daily Summaries (Central Park, USW00094728) | https://www.ncei.noaa.gov/ | — | `episodes.json` | ⏳ TODO_P1. Placeholder heat episodes, kept so the demo can replay a hot day. [VERIFY] station ID. |
| NYC Heat-Related Illness (syndromic surveillance) | NYC Environment & Health Data Portal | — | `validation.json` | ⏳ TODO_P7. |
| **Team drug-heat knowledge base v0.1** | `Drug-Heat Risk Table.xlsx` (in this folder) | 2026-09-19 | `med_rules.json` — 17 drug classes, RED/YELLOW/GREEN tiers, mechanisms, heat-wave guidance | ✅ Loaded. Team's own compilation from published literature. **Demo draft — not medical advice; needs pharmacist/physician review.** |
| **CDC — About Heat and Your Health** | https://www.cdc.gov/heat-health/about/index.html (page updated July 20, 2026) | 2026-09-19 | `tips.json` — patient actions, symptoms, icon + phrase list | ✅ Loaded, reworded in plain language. |
| NYC Cooling Center Finder | https://finder.nyc.gov/coolingcenters | 2026-09-19 | Linked from every patient page | ✅ Link only. The official list opens during heat emergencies. |
| Cool places shown in-app | — | — | `cooling_sites.json` | ⚠️ **Example locations**, one per neighborhood at its centre. Not real cooling centers. TODO_P2. |
| Leaflet 1.9.4 | https://leafletjs.com | 2026-09-19 | Map library (vendored in `site/vendor/leaflet/`) | ✅ BSD-2 license. No online map tiles used. |
