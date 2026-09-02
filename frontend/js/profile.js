/* ============================================================
   profile.js — User Profile Page
   ============================================================ */

window.init_profile = function () {
  renderProfilePage();
};

const PROFILE_FIELDS = [
  "phone", "location", "education", "skills_list",
  "linkedin", "github", "portfolio"
];

function renderProfilePage() {
  const name = getUserName();
  const email = getUserEmail();
  const profile = getSavedProfile();

  // Avatar
  document.querySelectorAll(".profile-avatar-text").forEach(el => {
    el.textContent = name.charAt(0).toUpperCase();
  });
  document.getElementById("profileDisplayName")?.setAttribute("value", name);

  // Email (readonly — from JWT)
  const emailEl = document.getElementById("profileEmail");
  if (emailEl) emailEl.value = email;

  // Fill saved fields
  PROFILE_FIELDS.forEach(field => {
    const el = document.getElementById(`profile_${field}`);
    if (el) el.value = profile[field] || "";
  });

  updateCompletionBar(name, email, profile);

  // Save button
  const saveBtn = document.getElementById("profileSaveBtn");
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = "1";
    saveBtn.addEventListener("click", saveProfile);
  }
}

function getSavedProfile() {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}"); } catch { return {}; }
}

function saveProfile() {
  const profile = {};
  PROFILE_FIELDS.forEach(field => {
    const el = document.getElementById(`profile_${field}`);
    if (el) profile[field] = el.value.trim();
  });

  // Update display name if changed
  const displayName = document.getElementById("profileDisplayName")?.value.trim();
  if (displayName) {
    localStorage.setItem("userName", displayName);
    // Update header avatar/name
    document.querySelectorAll(".user-avatar").forEach(el => {
      el.textContent = displayName.charAt(0).toUpperCase();
    });
    const headerName = document.getElementById("headerUserName");
    if (headerName) headerName.textContent = displayName;
  }

  localStorage.setItem("userProfile", JSON.stringify(profile));
  updateCompletionBar(displayName || getUserName(), getUserEmail(), profile);
  showToast("Profile saved successfully.", "success");
}

function updateCompletionBar(name, email, profile) {
  const fields = [name, email, ...PROFILE_FIELDS.map(f => profile[f])];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  const bar = document.getElementById("profileCompletionBar");
  const label = document.getElementById("profileCompletionPct");
  if (bar) bar.style.width = pct + "%";
  if (label) label.textContent = pct + "%";

  // Color
  if (bar) {
    bar.className = "progress-fill " + (pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger");
  }
}
