// icons.js — simple line icons drawn as SVG. No emoji anywhere in the UI.
// Use: Icons.svg("droplet")  →  an <svg> string that takes the colour of its text.
// Add a new icon by adding one entry below (24 × 24 drawing area).

window.Icons = (function () {
  const P = {
    // status
    warning: '<path d="M12 4.5 2.8 20h18.4L12 4.5Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5"/><circle cx="12" cy="16.2" r=".9" fill="currentColor" stroke="none"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12.2 2.8 2.8L16 9.6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.9" r=".9" fill="currentColor" stroke="none"/>',
    // body effects
    droplet: '<path d="M12 3.5c3.6 4 5.5 6.7 5.5 9.2a5.5 5.5 0 0 1-11 0c0-2.5 1.9-5.2 5.5-9.2Z"/>',
    dizzy: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.8a3.2 3.2 0 1 0 1 2.4c0-2.3-2-4.2-4.6-4.2S6.4 9.9 6.4 12.2"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20Z"/><path d="M4.8 12.8h3l1.6-2.6 1.9 4.3 1.7-3 1 1.3h3.3"/>',
    salt: '<path d="M7.8 8.6h8.4l1 11.6H6.8l1-11.6Z"/><path d="M8.6 8.6a3.4 3.4 0 0 1 6.8 0"/><circle cx="10.4" cy="5.6" r=".8" fill="currentColor" stroke="none"/><circle cx="13.6" cy="5.6" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="3.6" r=".8" fill="currentColor" stroke="none"/><path d="M9.6 13h4.8"/>',
    brain: '<path d="M15.5 20V6.2A2.7 2.7 0 0 0 10.4 5a3 3 0 0 0-4 2.1 2.9 2.9 0 0 0-.6 5.3A3 3 0 0 0 8 17.4 2.8 2.8 0 0 0 12 19"/><path d="M15.5 8.6h1.2a2.6 2.6 0 0 1 0 5.2h-1.2"/><path d="M15.5 20h4"/>',
    emergency: '<path d="M12 3.2 4 6.4v5.4c0 4.4 3.3 7.9 8 9 4.7-1.1 8-4.6 8-9V6.4L12 3.2Z"/><path d="M12 9v6M9 12h6"/>',
    // actions
    ac: '<rect x="3.5" y="5" width="17" height="8" rx="1.6"/><path d="M6.5 9h11"/><path d="M8 16.5c1 1.6 1 2.4 0 4M12 16.5c1 1.6 1 2.4 0 4M16 16.5c1 1.6 1 2.4 0 4"/>',
    snowflake: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="m9.4 4.9 2.6 2.1 2.6-2.1M9.4 19.1l2.6-2.1 2.6 2.1"/>',
    building: '<path d="M4 20V9.5l8-5 8 5V20"/><path d="M3 20h18"/><rect x="9" y="13" width="6" height="7"/><path d="M7.5 10.5h1.5M15 10.5h1.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    fan: '<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2C12 6.6 13.4 4 15.4 4c1.6 0 2.6 1.5 1.9 3.2-.6 1.5-2.4 2.6-5.3 3"/><path d="M10.4 12.9c-3.2 1.6-6 1.5-7-.3-.8-1.4 0-3 1.8-3.4 1.6-.3 3.6.5 5.6 2.5"/><path d="M13.2 13.2c1.9 2.9 2.3 5.7.7 6.8-1.3.9-2.9 0-3.5-1.7-.5-1.5-.2-3.6 1.1-6"/>',
    bottle: '<path d="M10 3.5h4v2.2l1.4 1.8V20a.9.9 0 0 1-.9.9h-5a.9.9 0 0 1-.9-.9V7.5L10 5.7V3.5Z"/><path d="M8.6 11.5h6.8"/>',
    nodrink: '<path d="M6.5 5h11l-4.3 6.4V19h3M8.8 19h1.4"/><path d="m4.5 4 15 16"/>',
    urine: '<path d="M12 3.5c3.6 4 5.5 6.7 5.5 9.2a5.5 5.5 0 0 1-11 0c0-2.5 1.9-5.2 5.5-9.2Z"/><path d="M7 14.2h10"/>',
    pill: '<rect x="3.4" y="9" width="17.2" height="6" rx="3" transform="rotate(-38 12 12)"/><path d="m9.7 8.3 4.6 7.4"/>',
    thermometer: '<path d="M13.8 13.6V5.4a1.8 1.8 0 1 0-3.6 0v8.2a3.6 3.6 0 1 0 3.6 0Z"/><circle cx="12" cy="16.8" r="1.4" fill="currentColor" stroke="none"/>',
    power: '<path d="M13.4 3 5.6 13.4h5.2L10.6 21l7.8-10.4h-5.2L13.4 3Z"/>',
    phone: '<path d="M7.4 3.8 9.9 4l1.2 4-2 1.5a11 11 0 0 0 5.4 5.4l1.5-2 4 1.2.2 2.5a1.6 1.6 0 0 1-1.8 1.6C11.4 17.6 6.4 12.6 5.8 5.6a1.6 1.6 0 0 1 1.6-1.8Z"/>',
    users: '<circle cx="9" cy="8.6" r="3.1"/><path d="M3.6 19.4a5.4 5.4 0 0 1 10.8 0"/><path d="M15.4 6a3.1 3.1 0 0 1 0 5.6M16.6 14.8a5.4 5.4 0 0 1 3.8 4.6"/>',
    shield: '<path d="M12 3.2 4.6 6v6c0 4.3 3 8 7.4 9 4.4-1 7.4-4.7 7.4-9V6L12 3.2Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="1.6"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/>',
    note: '<path d="M4.5 4.8h10.2l4.8 4.8v9.6H4.5V4.8Z"/><path d="M14.3 4.8v5h5"/><path d="M8 13h7M8 16h5"/>',
    message: '<path d="M4.5 5.5h15v10.2h-8.6L6.6 19v-3.3H4.5V5.5Z"/><path d="M8 9.2h8M8 12.2h5"/>',
    ticket: '<path d="M4 8.2A2 2 0 0 0 4 15.8v2.4h16v-2.4a2 2 0 0 1 0-7.6V5.8H4v2.4Z"/><path d="M12 7.5v1.8M12 11.2v1.8M12 14.8v1.8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.4v2M12 18.6v2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M3.4 12h2M18.6 12h2M5.9 18.1l1.4-1.4M16.7 7.3l1.4-1.4"/>',
    // places
    home: '<path d="M4 11 12 4.4 20 11v8.6H4V11Z"/><path d="M9.6 19.6v-5.4h4.8v5.4"/>',
    work: '<rect x="3.5" y="7.6" width="17" height="11.4" rx="1.6"/><path d="M9 7.6V5.8a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5.8v1.8"/><path d="M3.5 12.6h17"/>',
    clinic: '<path d="M4.5 9.5 12 4l7.5 5.5V20h-15V9.5Z"/><path d="M12 10.6v5M9.5 13.1h5"/>',
    pharmacy: '<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="3"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
    pin: '<path d="M12 21s6.4-6.2 6.4-10.4a6.4 6.4 0 1 0-12.8 0C5.6 14.8 12 21 12 21Z"/><circle cx="12" cy="10.4" r="2.4"/>',
    you: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8"/>',
    map: '<path d="M3.5 6.6 9 4.4l6 2.2 5.5-2.2v13L15 19.6l-6-2.2-5.5 2.2v-13Z"/><path d="M9 4.4v13M15 6.6v13"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.7 4.7l1.7 1.7M17.6 17.6l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.7 19.3l1.7-1.7M17.6 6.4l1.7-1.7"/>',
    calendar: '<rect x="3.8" y="5.6" width="16.4" height="14.6" rx="1.8"/><path d="M3.8 10h16.4M8.4 3.6v4M15.6 3.6v4"/>',
    stethoscope: '<path d="M6.4 3.8v5a4 4 0 0 0 8 0v-5"/><path d="M5 3.8h2.6M13.2 3.8h2.6"/><path d="M10.4 12.8v2a4.2 4.2 0 0 0 8.4 0v-1.2"/><circle cx="18.8" cy="11.4" r="2"/>',
  };

  // size: pixels. cls: extra CSS classes.
  function svg(name, { size = 20, cls = "", title = "" } = {}) {
    const d = P[name] || P.info;
    return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>${d}</svg>`;
  }

  const has = (name) => Object.prototype.hasOwnProperty.call(P, name);
  return { svg, has, names: Object.keys(P) };
})();
