"""
prep_data.py — turns raw downloads (data/raw/) into small files the website uses (data/processed/).

Run from the project folder:
    python3 scripts/prep_data.py
    python3 scripts/bundle_data.py      # then refresh the "double-click" data bundle

What it does right now (Phase P0):
  1. Simplifies NYC 2020 Neighborhood Tabulation Areas (NTA) so the map loads fast.
  2. Writes PLACEHOLDER neighborhood metrics (HVI + burden) so the UI can be built.
     These are NOT real numbers. Phase P1 replaces them with NYC HVI + CDC PLACES.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

# NTA types: 0 = residential. Others are parks, cemeteries, airports, etc. (no residents → no score)
RESIDENTIAL_TYPE = "0"
SIMPLIFY_TOLERANCE = 0.0002  # degrees (~20 m). Bigger = smaller file, rougher shapes.


# ---------- geometry helpers (pure Python, no extra libraries) ----------

def _perp_dist(p, a, b):
    """Distance from point p to the line a-b."""
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2) ** 0.5


def simplify(points, tol):
    """Douglas-Peucker line simplification (iterative)."""
    if len(points) < 5:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        s, e = stack.pop()
        best, idx = 0, None
        for i in range(s + 1, e):
            d = _perp_dist(points[i], points[s], points[e])
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(s, idx), (idx, e)]
    out = [p for p, k in zip(points, keep) if k]
    return out if len(out) >= 4 else points


def simplify_geometry(geom):
    def ring(r):
        return [[round(x, 5), round(y, 5)] for x, y in simplify(r, SIMPLIFY_TOLERANCE)]

    if geom["type"] == "Polygon":
        polys = [geom["coordinates"]]
    else:
        polys = geom["coordinates"]
    new_polys = []
    for poly in polys:
        rings = [ring(r) for r in poly]
        if len(rings[0]) >= 4:
            new_polys.append(rings)
    return {"type": "MultiPolygon", "coordinates": new_polys}


def centroid(geom):
    """Area-weighted centroid of the largest polygon (good enough for a marker)."""
    best, best_area = None, -1
    for poly in geom["coordinates"]:
        r = poly[0]
        a = cx = cy = 0
        for (x1, y1), (x2, y2) in zip(r, r[1:]):
            f = x1 * y2 - x2 * y1
            a += f
            cx += (x1 + x2) * f
            cy += (y1 + y2) * f
        if a != 0 and abs(a) > best_area:
            best_area = abs(a)
            best = (cy / (3 * a), cx / (3 * a))  # (lat, lon)
    return [round(best[0], 5), round(best[1], 5)]


# ---------- steps ----------

def build_neighborhoods():
    raw = json.loads((RAW / "nta2020.geojson").read_text())
    feats = []
    for f in raw["features"]:
        p = f["properties"]
        geom = simplify_geometry(f["geometry"])
        feats.append({
            "type": "Feature",
            "properties": {
                "id": p["nta2020"],
                "name": p["ntaname"],
                "borough": p["boroname"],
                "residential": p["ntatype"] == RESIDENTIAL_TYPE,
                "centroid": centroid(geom),
            },
            "geometry": geom,
        })
    out = {"type": "FeatureCollection", "features": feats}
    (OUT / "neighborhoods.geojson").write_text(json.dumps(out, separators=(",", ":")))
    print(f"neighborhoods.geojson: {len(feats)} areas")
    return feats


def _fake_number(key, lo, hi):
    """Deterministic pseudo-random number from a string (PLACEHOLDER use only)."""
    h = int(hashlib.md5(key.encode()).hexdigest()[:8], 16)
    return lo + (h % 10_000) / 10_000 * (hi - lo)


# Most NYC neighborhoods sit in the middle of the Heat Vulnerability Index; only a few are 4–5.
# The placeholder follows that shape so the demo map isn't a sea of red.
HVI_WEIGHTS = [(1, 0.24), (2, 0.30), (3, 0.24), (4, 0.15), (5, 0.07)]


def _weighted_hvi(key):
    x = _fake_number(key, 0, 1)
    acc = 0
    for value, weight in HVI_WEIGHTS:
        acc += weight
        if x < acc:
            return value
    return HVI_WEIGHTS[-1][0]


def build_placeholder_metrics(feats):
    # TODO_P1: replace with real NYC HVI (1–5) and CDC PLACES burden composite.
    metrics = {}
    for f in feats:
        p = f["properties"]
        if not p["residential"]:
            continue
        metrics[p["id"]] = {
            "hvi": _weighted_hvi(p["id"] + "hvi"),
            "burden_index": round(_fake_number(p["id"] + "burden", -1.5, 1.5), 2),
        }
    out = {
        "placeholder": True,
        "note": "PLACEHOLDER values for UI building only. NOT real HVI or CDC PLACES data.",
        "metrics": metrics,
    }
    (OUT / "neighborhood_metrics.json").write_text(json.dumps(out, indent=1))
    print(f"neighborhood_metrics.json: {len(metrics)} residential areas (PLACEHOLDER)")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    feats = build_neighborhoods()
    build_placeholder_metrics(feats)
