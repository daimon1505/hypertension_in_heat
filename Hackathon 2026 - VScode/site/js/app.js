// app.js — starts everything: load data → set up scoring and state → draw the page.

(async function start() {
  const app = document.getElementById("app");
  try {
    const data = await Data.load();
    Scoring.init(data);
    State.init(data);

    // Whenever anything changes: re-check alerts, then redraw.
    State.subscribe(() => {
      Alerts.evaluateAll();
      State.save();
      UI.renderTopbar();
      UI.renderDrawer();
      Router.render();
    });

    Alerts.evaluateAll();
    State.save();
    UI.renderTopbar();
    Router.render();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<section class="page narrow"><h1>Could not load the data</h1>
      <p>${UI.esc(err.message)}</p>
      <p>Try running <code>python3 -m http.server 8000</code> in the project folder and opening
      <a href="http://localhost:8000/site/">http://localhost:8000/site/</a>. See README.md.</p></section>`;
  }
})();
