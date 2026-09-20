// Methods, Evidence and Ethics pages.

(function () {
  const esc = UI.esc;
  const C = () => Scoring.CONFIG;

  // Methods — built from Scoring.CONFIG so it can never drift from the real rules.
  Router.add("/methods", (app) => {
    const cfg = C();
    const rules = State.getData().medRules.rules;
    const E = cfg.escalation;
    const tiers = [{ min_f: null, points: 0 }, ...cfg.env_tiers];
    app.innerHTML = `
      <section class="page narrow prose">
        <h1>How the colors are calculated</h1>
        ${UI.banner("warn", `<strong>${esc(cfg.status)}.</strong> This page is generated live from the scoring code (<code>site/js/scoring.js</code>).`)}
        <h2>1. Neighborhood score (0–10)</h2>
        <p><strong>score = heat points + vulnerability points + burden points</strong></p>
        <h3>Heat points (from the episode's max temperature)</h3>
        <table><thead><tr><th>Max temperature</th><th>Points</th></tr></thead><tbody>
          ${tiers.map((t, i) => { const next = tiers[i + 1]; const range = t.min_f == null ? `below ${next.min_f}°F` : next ? `${t.min_f}–${next.min_f - 1}°F` : `${t.min_f}°F or more`; return `<tr><td>${range}</td><td>+${t.points}</td></tr>`; }).join("")}
        </tbody></table>
        <h3>Vulnerability points</h3><p>NYC Heat Vulnerability Index (1–5) minus ${cfg.hvi_offset} → 0–4 points.</p>
        <h3>Chronic-disease burden points</h3><p>Neighborhoods are split into thirds by a combined CDC PLACES burden measure: lowest / middle / highest third → ${cfg.burden_points_by_tercile.join(" / ")} points.</p>
        <h3>Bands</h3>
        <table><thead><tr><th>Score</th><th>Band</th></tr></thead><tbody>
          ${cfg.bands.map((b, i) => `<tr><td>${i ? cfg.bands[i - 1].max_score + 1 : 0}–${b.max_score}</td><td>${UI.bandPill(b)}</td></tr>`).join("")}
        </tbody></table>

        <h2>2. Personal score (per patient)</h2>
        <p>Each rule that applies adds <strong>+${E.points_per_rule} points</strong> to the neighborhood score (at most +${E.max_points}). The bands above then apply to that personal score.</p>
        <ol>
          <li><strong>Medication rule:</strong> takes a <em>high</em> heat-risk medicine (RED tier) and heat points ≥ ${E.medication_rule.min_env_points}.</li>
          <li><strong>Stacking rule:</strong> takes ≥ ${E.stacking_rule.min_distinct_classes} different heat-risk medicine types and heat points ≥ ${E.stacking_rule.min_env_points}.</li>
          <li><strong>Vulnerability rule:</strong> (age ≥ ${E.vulnerability_rule.min_age}, or no home AC, or a qualifying condition) plus at least one heat-risk medicine${E.vulnerability_rule.min_env_points ? ` and heat points ≥ ${E.vulnerability_rule.min_env_points}` : ""}.
            <br><span class="small muted">Qualifying conditions: ${E.vulnerability_rule.qualifying_conditions.map(esc).join(", ")}</span></li>
        </ol>
        <p class="small muted">Medicines in the GREEN tier (no significant heat interaction) never add points.</p>
        <h2>3. Alerts</h2>
        <table><thead><tr><th>Personal band</th><th>Alert</th></tr></thead><tbody>
          ${cfg.bands.map((b) => `<tr><td>${UI.bandPill(b)}</td><td>${esc(cfg.alert_for_band[b.id])}</td></tr>`).join("")}
        </tbody></table>
        <p>Yellow: nothing is sent; the patient can submit a ticket if they want to. Red: sent to the doctor automatically, <em>only</em> if the patient consented.</p>

        <h2>4. Medication rules</h2>
        ${UI.unreviewedBanner(rules)}
        <table><thead><tr><th>Class</th><th>Heat risk</th><th>Reviewed by</th></tr></thead><tbody>
          ${rules.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.tier)} — ${esc(r.risk_level)}</td><td>${esc(r.reviewed_by)}</td></tr>`).join("")}
        </tbody></table>
        <p class="small">Source: ${esc(State.getData().medRules.source)}. ${esc(State.getData().medRules.source_note)}</p>
        <p class="small">Patient advice wording is drawn from <a href="${esc(State.getData().tips.source.url)}" target="_blank" rel="noopener">${esc(State.getData().tips.source.label)}</a>.</p>

        <h2>5. Data sources</h2>
        <ul>
          <li>Neighborhood boundaries: NYC Open Data, 2020 Neighborhood Tabulation Areas.</li>
          <li>Heat Vulnerability Index: NYC Environment &amp; Health Data Portal <em>(not yet loaded — placeholder)</em>.</li>
          <li>Chronic-disease burden: CDC PLACES <em>(not yet loaded — placeholder)</em>.</li>
          <li>Historical temperatures and the 7-day forecast: NOAA NCEI Daily Summaries, Central Park <em>(not yet loaded — placeholder)</em>.</li>
          <li>Medication heat risk: the team's drug-heat knowledge base (demo draft, pending review).</li>
          <li>Heat-health advice: CDC — About Heat and Your Health.</li>
          <li>Cool places: example locations; the real list is NYC's official Cooling Center Finder.</li>
        </ul>
        <p>See <code>data/SOURCES.md</code> for details.</p>
        <h2>6. Limitations</h2>
        <p>Rules are simplified and deterministic. Area scores describe neighborhoods, not individuals. See the <a href="#/ethics">Ethics page</a>.</p>
      </section>`;
  });

  // Evidence — validation against real ED data (to be filled in P7).
  Router.add("/evidence", (app) => {
    const v = State.getData().validation;
    app.innerHTML = `
      <section class="page narrow prose">
        <h1>Evidence and measurement</h1>
        <h2>Does the heat score match real illness?</h2>
        ${v.placeholder
          ? UI.banner("placeholder", `<strong>Not done yet.</strong> ${esc(v.note)}`)
          : `<p>Correlation between daily heat points and citywide heat-illness ED visits: <strong>${esc(v.correlation)}</strong></p>`}
        <p>Planned checks:</p>
        <ul>
          <li><strong>Day-level:</strong> citywide daily heat-related ED visits vs. heat points. We will report the correlation honestly, even if it is weak.</li>
          <li><strong>Area-level:</strong> only if the data is available by neighborhood. Otherwise we say so.</li>
        </ul>
        <h2>Scope of this demo</h2>
        <p>This demo covers <strong>hypertension</strong> only: three synthetic patients on blood-pressure medicines. The engine itself is condition-agnostic — the drug-heat knowledge base already covers other classes.</p>
        <h2>How we would measure success in the real world</h2>
        <ul>
          <li>Alerts delivered to patients and care teams</li>
          <li>Time from red alert to care-team acknowledgement</li>
          <li>Outreach calls completed during heat episodes</li>
          <li>Heat-related ED visits among enrolled patients vs. similar patients not enrolled</li>
          <li>Patient-reported usefulness, and false alarm rate (alert fatigue)</li>
        </ul>
      </section>`;
  });

  // Ethics — privacy, consent, limits.
  Router.add("/ethics", (app) => {
    app.innerHTML = `
      <section class="page narrow prose">
        <h1>Ethics, privacy and limits</h1>
        <h2>Not medical advice</h2>
        <p>This is a hackathon demo. It never tells anyone to stop or change a medicine. It says “talk to your care team”.</p>
        <h2>Synthetic data only</h2>
        <p>Every patient, chart, lab and scan is made up and labeled. Scan images are placeholders. No real patient data is used.</p>
        <h2>Consent for red alerts</h2>
        <p>Red alerts go to the care team automatically <strong>only if the patient agreed</strong>. The consent is shown on the patient's own page. Without consent, the patient gets a strong prompt to report, but nothing is sent for them. This respects autonomy while still encouraging safety.</p>
        <h2>Data minimization</h2>
        <p>A red alert shares only: who the patient is, their neighborhood (not an exact address), the risk color, the rules that fired, and heat-risk medicine types. The public map never shows patient locations.</p>
        <h2>Transparent, simple rules</h2>
        <p>Colors come from fixed rules, not an AI model, and every color has a “why”. Medication rules are drafted from CDC guidance and must be reviewed by a clinician. Unreviewed rules are flagged.</p>
        <h2>Known limitations</h2>
        <ul>
          <li><strong>Area scores ≠ individual risk</strong> (ecological fallacy). A neighborhood score describes the area, not a person.</li>
          <li><strong>CDC PLACES</strong> values are modeled estimates, not counts.</li>
          <li><strong>One weather station</strong> (Central Park) stands in for the whole city. Street-level heat varies a lot.</li>
          <li><strong>Equity:</strong> people without smartphones or who don't read English may miss alerts. Translations (Spanish, Chinese) and phone outreach are planned.</li>
          <li><strong>Alert fatigue:</strong> too many false alarms make people ignore alerts. Thresholds must be tuned with clinicians.</li>
        </ul>
        <h2>Sustainability</h2>
        <p>A static website: no servers, no live API calls, small data files. It can be hosted for free with very little energy use.</p>
      </section>`;
  });
})();
