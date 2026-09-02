/* ============================================================
   app.js — SPA Router, Sidebar, Header, Toast System
   ============================================================ */

/* ── Toast System ──────────────────────────────────────────── */
function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const icons = {
    success: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    error:   `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info:    `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type} fade-in`;
  toast.innerHTML = `
    <span class="toast-icon ${type}">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ── Navigation config ─────────────────────────────────────── */
const NAV_ITEMS = [
  {
    section: "Main",
    items: [
      { id: "dashboard",    label: "Dashboard",         icon: "grid" },
      { id: "resumes",      label: "My Resumes",        icon: "file-text" },
      { id: "ats",          label: "ATS Analyzer",      icon: "bar-chart-2" },
    ],
  },
  {
    section: "Jobs",
    items: [
      { id: "jobs",         label: "Job Recommendations", icon: "briefcase" },
      { id: "saved-jobs",   label: "Saved Jobs",         icon: "bookmark" },
      { id: "applications", label: "Applications",       icon: "send" },
    ],
  },
  {
    section: "Career",
    items: [
      { id: "career",       label: "Career Guidance",   icon: "compass" },
      { id: "assistant",    label: "AI Assistant",      icon: "message-square" },
    ],
  },
  {
    section: "Account",
    items: [
      { id: "profile",      label: "Profile",           icon: "user" },
      { id: "settings",     label: "Settings",          icon: "settings" },
    ],
  },
];

/* ── Lucide-style SVG icons ────────────────────────────────── */
function getIcon(name, size = 20) {
  const icons = {
    grid:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    "file-text":    `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    "bar-chart-2":  `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    briefcase:      `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    bookmark:       `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    send:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    compass:        `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    "message-square": `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    user:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings:       `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    "log-out":      `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    "chevron-left": `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    "chevron-right":`<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    menu:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    bell:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    "chevron-down": `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    home:           `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    "zap":          `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    upload:         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
    trash:          `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    eye:            `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    "eye-off":      `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    check:          `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x:              `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    "map-pin":      `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    "plus":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    "rotate-ccw":   `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>`,
    "edit":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    "save":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    "external-link":`<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    "alert-circle": `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    "award":        `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    "trending-up":  `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    "book-open":    `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    "shield":       `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    "lock":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    "sun":          `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    "moon":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    "mail":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    "phone":        `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    "link":         `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    "github":       `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    "linkedin":     `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    "globe":        `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    "refresh-cw":   `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    "cpu":          `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  };
  return icons[name] || `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
}

/* ── Sidebar Builder ───────────────────────────────────────── */
function buildSidebar() {
  const nav = document.getElementById("sidebarNav");
  if (!nav) return;

  let html = "";
  NAV_ITEMS.forEach(({ section, items }) => {
    html += `<div class="nav-section-label">${section}</div>`;
    items.forEach(({ id, label, icon }) => {
      html += `
        <button class="nav-item" data-section="${id}" id="nav-${id}">
          <span class="nav-icon">${getIcon(icon)}</span>
          <span class="nav-item-label">${label}</span>
        </button>`;
    });
  });

  // Logout
  html += `
    <div class="nav-section-label">More</div>
    <button class="nav-item nav-logout" id="navLogoutBtn">
      <span class="nav-icon">${getIcon("log-out")}</span>
      <span class="nav-item-label">Logout</span>
    </button>`;

  nav.innerHTML = html;

  // Events
  nav.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateTo(btn.dataset.section);
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });

  document.getElementById("navLogoutBtn")?.addEventListener("click", logout);
}

/* ── Router ────────────────────────────────────────────────── */
let currentSection = "dashboard";

function navigateTo(sectionId) {
  // Hide all panels
  document.querySelectorAll(".section-panel").forEach((p) => p.classList.remove("active"));

  // Show target panel
  const panel = document.getElementById(`section-${sectionId}`);
  if (panel) {
    panel.classList.add("active");
    panel.classList.add("fade-in");
    setTimeout(() => panel.classList.remove("fade-in"), 400);
  }

  // Update active nav
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  document.getElementById(`nav-${sectionId}`)?.classList.add("active");

  // Update breadcrumb
  updateBreadcrumb(sectionId);

  currentSection = sectionId;

  // Trigger section init if needed
  if (typeof window[`init_${sectionId.replace("-", "_")}`] === "function") {
    window[`init_${sectionId.replace("-", "_")}`]();
  }
}

function updateBreadcrumb(sectionId) {
  const el = document.getElementById("breadcrumbCurrent");
  if (!el) return;
  const allItems = NAV_ITEMS.flatMap((g) => g.items);
  const item = allItems.find((i) => i.id === sectionId);
  el.textContent = item ? item.label : sectionId;
}

/* ── Sidebar Toggle ────────────────────────────────────────── */
let sidebarCollapsed = false;

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainArea = document.getElementById("mainArea");
  const toggleBtn = document.getElementById("sidebarToggleBtn");

  if (window.innerWidth <= 768) {
    // Mobile: toggle mobile-open
    toggleMobileSidebar();
    return;
  }

  sidebarCollapsed = !sidebarCollapsed;
  sidebar?.classList.toggle("collapsed", sidebarCollapsed);
  mainArea?.classList.toggle("sidebar-collapsed", sidebarCollapsed);

  // Flip arrow icon
  if (toggleBtn) {
    toggleBtn.innerHTML = sidebarCollapsed ? getIcon("chevron-right", 14) : getIcon("chevron-left", 14);
  }

  localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "1" : "0");
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isOpen = sidebar?.classList.contains("mobile-open");
  sidebar?.classList.toggle("mobile-open", !isOpen);
  overlay?.classList.toggle("active", !isOpen);
}

function closeMobileSidebar() {
  document.getElementById("sidebar")?.classList.remove("mobile-open");
  document.getElementById("sidebarOverlay")?.classList.remove("active");
}

/* ── User dropdown ─────────────────────────────────────────── */
function setupUserDropdown() {
  const btn = document.getElementById("userMenuBtn");
  const dropdown = document.getElementById("userDropdown");

  btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("open");
  });

  document.addEventListener("click", () => dropdown?.classList.remove("open"));

  // Populate user info
  const name = getUserName();
  const email = getUserEmail();
  const initial = name.charAt(0).toUpperCase();

  document.querySelectorAll(".user-avatar").forEach((el) => {
    el.textContent = initial;
  });
  const nameEl = document.getElementById("headerUserName");
  if (nameEl) nameEl.textContent = name;

  const dropdownName = document.getElementById("dropdownUserName");
  const dropdownEmail = document.getElementById("dropdownUserEmail");
  if (dropdownName) dropdownName.textContent = name;
  if (dropdownEmail) dropdownEmail.textContent = email;
}

/* ── Logout ────────────────────────────────────────────────── */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("lastResumeContext");
  window.location.href = "login.html";
}

/* ── Theme ─────────────────────────────────────────────────── */
function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem("theme", dark ? "dark" : "light");
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved === "dark" || (!saved && prefersDark));
}

/* ── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  initTheme();
  buildSidebar();
  setupUserDropdown();

  // Restore sidebar collapse state
  const wasCollapsed = localStorage.getItem("sidebarCollapsed") === "1";
  if (wasCollapsed && window.innerWidth > 768) {
    sidebarCollapsed = true;
    document.getElementById("sidebar")?.classList.add("collapsed");
    document.getElementById("mainArea")?.classList.add("sidebar-collapsed");
    const btn = document.getElementById("sidebarToggleBtn");
    if (btn) btn.innerHTML = getIcon("chevron-right", 14);
  }

  // Sidebar toggle button
  document.getElementById("sidebarToggleBtn")?.addEventListener("click", toggleSidebar);

  // Hamburger
  document.getElementById("hamburgerBtn")?.addEventListener("click", toggleMobileSidebar);

  // Sidebar overlay
  document.getElementById("sidebarOverlay")?.addEventListener("click", closeMobileSidebar);

  // Header logout
  document.getElementById("headerLogoutBtn")?.addEventListener("click", logout);

  // Profile link in dropdown
  document.getElementById("dropdownProfileLink")?.addEventListener("click", () => {
    navigateTo("profile");
    document.getElementById("userDropdown")?.classList.remove("open");
  });

  // Settings link in dropdown
  document.getElementById("dropdownSettingsLink")?.addEventListener("click", () => {
    navigateTo("settings");
    document.getElementById("userDropdown")?.classList.remove("open");
  });

  // Hash-based routing
  const hash = window.location.hash.replace("#", "") || "dashboard";
  navigateTo(hash);

  // Update hash on navigation
  window.addEventListener("hashchange", () => {
    const h = window.location.hash.replace("#", "");
    if (h) navigateTo(h);
  });
});

// Make navigateTo globally accessible for buttons inside sections
window.navigateTo = navigateTo;
window.getIcon = getIcon;
window.showToast = showToast;
window.applyTheme = applyTheme;
window.logout = logout;
