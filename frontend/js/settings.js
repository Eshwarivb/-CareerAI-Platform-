/* ============================================================
   settings.js — Settings Page
   ============================================================ */

window.init_settings = function () {
  renderSettingsPage();
};

function renderSettingsPage() {
  setupSettingsNav();
  setupThemeToggle();
  setupNotificationToggles();
  setupPasswordChange();
  setupDeleteAccount();
}

/* ── Settings sub-navigation ───────────────────────────────── */
function setupSettingsNav() {
  const navBtns = document.querySelectorAll(".settings-nav-item");
  const sections = document.querySelectorAll(".settings-section");

  navBtns.forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(`settings-${btn.dataset.tab}`);
      if (target) target.classList.add("active");
    });
  });
}

/* ── Theme Toggle ──────────────────────────────────────────── */
function setupThemeToggle() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  // Sync to current theme
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  toggle.checked = isDark;

  if (toggle.dataset.bound) return;
  toggle.dataset.bound = "1";

  toggle.addEventListener("change", () => {
    applyTheme(toggle.checked);
    showToast(`${toggle.checked ? "Dark" : "Light"} mode enabled.`, "info");
  });
}

/* ── Notification Toggles ──────────────────────────────────── */
function setupNotificationToggles() {
  const notifKeys = ["notif_email", "notif_jobs", "notif_updates"];
  notifKeys.forEach(key => {
    const el = document.getElementById(key);
    if (!el || el.dataset.bound) return;
    el.dataset.bound = "1";

    // Restore saved state
    el.checked = localStorage.getItem(key) === "1";

    el.addEventListener("change", () => {
      localStorage.setItem(key, el.checked ? "1" : "0");
      showToast(`Notification preference saved.`, "success");
    });
  });
}

/* ── Password Change (frontend only) ──────────────────────── */
function setupPasswordChange() {
  const form = document.getElementById("passwordChangeForm");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const current = document.getElementById("currentPassword")?.value;
    const newPwd  = document.getElementById("newPassword")?.value;
    const confirm = document.getElementById("confirmNewPassword")?.value;

    if (!current || !newPwd || !confirm) {
      showToast("Please fill in all password fields.", "warning");
      return;
    }
    if (newPwd.length < 6) {
      showToast("New password must be at least 6 characters.", "warning");
      return;
    }
    if (newPwd !== confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }

    // No backend password change endpoint — inform user
    showToast("Password change is not supported in the current backend version. Contact your administrator.", "info", 5000);
  });
}

/* ── Delete Account ─────────────────────────────────────────── */
function setupDeleteAccount() {
  const btn = document.getElementById("deleteAccountBtn");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const modal = document.getElementById("deleteAccountModal");
    if (modal) modal.classList.add("open");
  });

  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    document.getElementById("deleteAccountModal")?.classList.remove("open");
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
    // Clear all local data
    localStorage.clear();
    showToast("Account data cleared. Redirecting...", "info");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  });
}
