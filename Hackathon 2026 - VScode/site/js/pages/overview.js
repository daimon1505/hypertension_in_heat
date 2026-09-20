// Overview (#/) — public NYC heat map for the selected episode. Never shows patient data.

Router.add("/", (app) => {
  const data = State.getData();
  const ep = State.episode();
  const esc = UI.esc;

  // Score every neighborhood once.
  const scored = data.neighborhoods.features.map((f) => ({ props: f.properties, r: Scoring.neighborhood(f.properties.id, ep) }));
  const withData = scored.filter((x) => x.r.hasData);
  const counts = Scoring.CONFIG.bands.map((b) => withData.filter((x) => x.r.band.id === b.id).length);
  const top10 = [...withData].sort((a, b) => b.r.score - a.r.score).slice(0, 10);

  app.innerHTML = `
    <section class="page">
      ${UI.placeholderBanner()}
      <div class="page-head">
        <div>
          <p class="eyebrow">Historical heat replay</p>
          <h1>How dangerous was the heat across NYC?</h1>
          <p class="lead">${esc(ep.label)} · max <strong>${ep.tmax}°F</strong>. Each neighborhood is colored by risk for an average resident.
          <a href="#/login">Sign in</a> to see how risk changes for one patient.</p>
        </div>
        <button class="button" data-action="controls">Change episode</button>
      </div>

      <div class="stat-row">
        ${Scoring.CONFIG.bands.map((b, i) => `<div class="stat band-${b.id}-soft"><span class="stat-num">${counts[i]}</span><span>${Icons.svg(NycMap.BAND_ICON[b.id], { size: 15 })} ${b.label} neighborhoods</span></div>`).join("")}
      </div>

      <div class="grid-map">
        <div class="card map-card">
          <div id="overview-map" class="map" role="img" aria-label="Map of NYC neighborhoods colored by heat risk. The list beside it shows the highest-risk areas."></div>
          ${UI.legend()}
        </div>
        <aside class="card">
          <h2 class="h3">Top 10 highest-risk neighborhoods</h2>
          <ol class="rank-list">
            ${top10.map((x) => `<li><span class="rank-name">${esc(x.props.name)}<small>${esc(x.props.borough)}</small></span>${UI.bandPill(x.r.band)}<span class="score">${x.r.score}/10</span></li>`).join("")}
          </ol>
          <p class="small muted">Click any neighborhood on the map to see why it has its color. <a href="#/methods">How scores work →</a></p>
        </aside>
      </div>
    </section>`;

  NycMap.draw(document.getElementById("overview-map"), {
    key: "overview",
    bandFor: (p) => { const r = Scoring.neighborhood(p.id, ep); return r.hasData ? r.band : null; },
    popupFor: (p) => {
      const r = Scoring.neighborhood(p.id, ep);
      return `<strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.borough)}</span><br>
        ${r.hasData ? `${UI.bandPill(r.band)} <strong>${r.score}/10</strong><ul class="why">${r.reasons.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : esc(r.reasons[0])}`;
    },
  });

  UI.onActions(app, { controls: () => UI.toggleDrawer(true) });
});
