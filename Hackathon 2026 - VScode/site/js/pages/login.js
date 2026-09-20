// Login (#/login) — "choose an account" screen. Demo only: no passwords.

Router.add("/login", (app) => {
  const data = State.getData();
  const acct = State.get().account;
  const esc = UI.esc;

  const cards = [
    ...data.patients.map((p, i) => ({
      account: { type: "patient", id: p.id },
      name: p.display_name,
      sub: `Patient ${i + 1} · ${p.age}, ${p.conditions.join(", ")}`,
      kind: "Patient",
    })),
    { account: { type: "care" }, name: data.careTeam.display_name, sub: data.careTeam.subtitle, kind: "Healthcare team" },
  ];
  const isCurrent = (a) => acct && acct.type === a.type && acct.id === a.id;

  app.innerHTML = `
    <section class="page login-page">
      <div class="login-box card">
        <div class="login-logo" aria-hidden="true">🌡️</div>
        <h1>Choose an account</h1>
        <p class="muted">to continue to HeatSafe NYC</p>
        ${UI.synthBadge()}
        <ul class="account-list">
          ${cards.map((c, i) => `
            <li>
              <button class="account-card" data-action="signin" data-arg="${i}">
                <span class="avatar avatar-lg ${c.account.type === "care" ? "avatar-care" : ""}">${c.account.type === "care" ? "🩺" : esc(UI.initials(c.name))}</span>
                <span class="account-card-text">
                  <span class="account-card-name">${esc(c.name)}</span>
                  <span class="muted small">${esc(c.sub)}</span>
                </span>
                <span class="tag">${isCurrent(c.account) ? "Signed in" : c.kind}</span>
              </button>
            </li>`).join("")}
        </ul>
        ${acct ? `<button class="link-button" data-action="signout">Sign out</button>` : ""}
        <p class="small muted">Demo only — clicking an account signs in instantly. No real accounts or passwords.</p>
      </div>
    </section>`;

  UI.onActions(app, {
    signin: (i) => {
      const a = cards[Number(i)].account;
      State.set({ account: a });
      Router.go(UI.homeHash(a));
    },
    signout: () => { State.set({ account: null }); Router.go("#/"); },
  });
});
