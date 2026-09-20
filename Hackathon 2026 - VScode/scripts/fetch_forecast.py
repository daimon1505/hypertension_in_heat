"""
fetch_forecast.py — saves the real National Weather Service forecast for NYC.

Run from the project folder whenever you want fresh weather:
    python3 scripts/fetch_forecast.py
    python3 scripts/bundle_data.py      # so the double-click version updates too

It writes data/processed/forecast.json: seven days of real highs and lows for
Central Park, with the source URL and the time it was fetched. The website reads
that file — it never calls the API itself, so the demo still works offline.

Source: api.weather.gov (National Weather Service, public domain).
"""
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "processed" / "forecast.json"

# Central Park, the station the rest of the project uses.
LAT, LON = 40.7823, -73.9655
LOCATION_ID = "nyc-central-park"
UA = "HeatSafeNYC hackathon demo (student project)"
DAYS = 7


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/geo+json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    point = get(f"https://api.weather.gov/points/{LAT},{LON}")
    forecast_url = point["properties"]["forecast"]
    grid = f'{point["properties"]["gridId"]}/{point["properties"]["gridX"]},{point["properties"]["gridY"]}'
    periods = get(forecast_url)["properties"]["periods"]

    # The API alternates day and night periods; pair them into one row per date.
    days = {}
    for p in periods:
        date = p["startTime"][:10]
        row = days.setdefault(date, {"date": date, "tmax": None, "tmin": None, "summary": ""})
        if p["isDaytime"]:
            row["tmax"] = p["temperature"]
            row["summary"] = p["shortForecast"]
        else:
            row["tmin"] = p["temperature"]

    rows = [d for d in sorted(days.values(), key=lambda r: r["date"]) if d["tmax"] is not None][:DAYS]

    OUT.write_text(json.dumps({
        "location_id": LOCATION_ID,
        "location_name": "Central Park, New York, NY",
        "latitude": LAT, "longitude": LON,
        "source": "National Weather Service (api.weather.gov)",
        "source_url": forecast_url,
        "grid": grid,
        "retrieved_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_mode": "cached",
        "note": ("Real NWS forecast, fetched at build time and cached in this file. "
                 "TODO: the model definition asks for official NWS HeatRisk (0-4) per location and date; "
                 "this file carries temperatures only."),
        "days": rows,
    }, indent=1))
    print(f"forecast.json: {len(rows)} days, {rows[0]['date']} to {rows[-1]['date']}")
    for r in rows:
        print(f"  {r['date']}  high {r['tmax']}°F  low {r['tmin']}°F  {r['summary']}")


if __name__ == "__main__":
    main()
