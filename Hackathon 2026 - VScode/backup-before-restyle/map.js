// map.js — draws NYC neighborhoods with Leaflet. No online map tiles: works offline.

window.NycMap = (function () {
  const BAND_ICON = { safe: "check", moderate: "alert", dangerous: "warning" };
  const FILL = { safe: "#dde2e9", moderate: "#f8c266", dangerous: "#d6452b", none: "#f1f2f5" };
  const openMaps = [];
  const savedViews = {}; // remember zoom/position per map so redraws don't jump

  // Call before drawing a new page.
  function clearAll() {
    while (openMaps.length) openMaps.pop().remove();
  }

  // el: container element
  // opts.key: name for remembering the view
  // opts.focusOn: [[lat, lon], …] — points the starting view should cover (otherwise the whole city)
  // opts.bandFor(props) → band object or null (grey)
  // opts.popupFor(props) → HTML shown when a neighborhood is clicked
  // opts.markers: [{ lat, lon, band, label, popup }]
  function draw(el, opts) {
    const data = State.getData();
    const map = L.map(el, { zoomSnap: 0.25, minZoom: 9, maxZoom: 15, scrollWheelZoom: false });
    openMaps.push(map);
    map.attributionControl.setPrefix(false).addAttribution("Boundaries: NYC DCP 2020 NTAs");

    const layer = L.geoJSON(data.neighborhoods, {
      style: (f) => {
        const band = opts.bandFor(f.properties);
        return { color: "#ffffff", weight: 0.8, fillColor: band ? FILL[band.id] : FILL.none, fillOpacity: opts.fillOpacity || 0.9 };
      },
      onEachFeature: (f, lyr) => {
        const band = opts.bandFor(f.properties);
        lyr.bindTooltip(`<strong>${UI.esc(f.properties.name)}</strong><br>${band ? (opts.patientWords ? band.patient_label : band.label) : "No data"}`, { sticky: true });
        lyr.bindPopup(opts.popupFor(f.properties), { maxWidth: 280 });
        lyr.on("mouseover", () => lyr.setStyle({ weight: 2.5, color: "#222" }));
        lyr.on("mouseout", () => layer.resetStyle(lyr));
      },
    }).addTo(map);

    // Markers come in a few kinds:
    //   kind "you"   → a dot showing where the patient is now
    //   kind "place" → an icon only (home, work, clinic, pharmacy, family) — no text
    //   kind "cool"  → a small blue dot for a public cooling space
    //   default      → a text pill (used on the care-team map for "2 patients")
    const placed = []; // text pills close together are stacked so none are hidden
    (opts.markers || []).forEach((m) => {
      let html, size = null;
      if (m.kind === "you") {
        html = `<div class="map-you" title="You are here"><span></span></div>`;
      } else if (m.kind === "cool") {
        html = `<div class="map-cool" title="${UI.esc(m.label || "Public cool space")}"></div>`;
      } else if (m.kind === "place") {
        html = `<div class="map-icon band-${m.band ? m.band.id : "none"}" title="${UI.esc(m.label || "")}">${Icons.svg(m.icon || "pin", { size: 16 })}</div>`;
      } else {
        const n = placed.filter((q) => Math.abs(q.lat - m.lat) < 0.03 && Math.abs(q.lon - m.lon) < 0.05).length;
        placed.push(m);
        html = `<div class="map-pin band-${m.band ? m.band.id : "none"}" style="margin-top:${n * 34}px">${m.band ? Icons.svg(BAND_ICON[m.band.id], { size: 13 }) : ""} ${UI.esc(m.label)}</div>`;
      }
      const marker = L.marker([m.lat, m.lon], {
        icon: L.divIcon({ className: "", html, iconSize: size }),
        keyboard: true, title: m.label || "", zIndexOffset: (m.kind === "cool" ? 100 : 500) + placed.length * 50,
      }).addTo(map);
      if (m.popup) marker.bindPopup(m.popup);
    });

    const saved = savedViews[opts.key];
    if (saved) map.setView(saved.center, saved.zoom);
    else if (opts.focusOn) {
      // Start near the patient's places so the dots are readable, then one level back out for context.
      map.fitBounds(L.latLngBounds(opts.focusOn), { padding: [50, 50], maxZoom: opts.maxFocusZoom || 12.5 });
      map.setZoom(map.getZoom() - 1);
    }
    else map.fitBounds(layer.getBounds(), { padding: [8, 8] });
    map.on("moveend", () => (savedViews[opts.key] = { center: map.getCenter(), zoom: map.getZoom() }));
    return map;
  }

  // Marker position for a saved place: its own lat/lon, or the neighborhood center.
  function placeLatLon(loc) {
    if (loc.lat && loc.lon) return [loc.lat, loc.lon];
    return State.place(loc.nta_id).centroid || [40.73, -73.95];
  }

  return { draw, clearAll, placeLatLon, FILL, BAND_ICON };
})();
