// router.js — shows the right page for the address after "#", e.g. #/patient/patient1.

window.Router = (function () {
  const routes = []; // { pattern, render, needs }

  // needs: null (public), "patient" or "care" — who must be signed in.
  function add(path, render, needs = null) {
    const names = [];
    const regex = new RegExp("^" + path.replace(/:(\w+)/g, (_, n) => (names.push(n), "([^/]+)")) + "$");
    routes.push({ regex, names, render, needs });
  }

  function current() {
    const path = (location.hash || "#/").slice(1) || "/";
    for (const r of routes) {
      const m = path.match(r.regex);
      if (m) {
        const params = {};
        r.names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
        return { route: r, params };
      }
    }
    return null;
  }

  function render() {
    const found = current();
    const app = document.getElementById("app");
    NycMap.clearAll();
    if (!found) { app.innerHTML = `<section class="page"><h1>Page not found</h1><p><a href="#/">Go to the map</a></p></section>`; return; }
    const acct = State.get().account;
    const { route, params } = found;
    // Demo "sign in" check: send people to the account chooser if needed.
    if (route.needs === "care" && (!acct || acct.type !== "care")) return go("#/login");
    if (route.needs === "patient" && (!acct || acct.type !== "patient" || acct.id !== params.id)) return go("#/login");
    route.render(app, params);
    if (window.UI && UI.renderTopbar) UI.renderTopbar(); // also rebuilds the main menu
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  return { add, render, go };
})();
