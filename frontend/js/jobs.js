/* ============================================================
   jobs.js — Job Recommendations, Saved Jobs, Applications
   ============================================================ */

const APP_STATUSES = ["Saved", "Applied", "Under Review", "Interview", "Offer", "Rejected"];

// Global Job Store to avoid JSON escaping issues in inline HTML onclick attributes
window.jobCache = window.jobCache || {};

function cacheJob(job) {
  if (!job || (!job.url && !job.title)) return "";
  const key = job.url || `${job.title}_${job.company}`;
  window.jobCache[key] = job;
  return key;
}

window.init_jobs = function () { renderJobsPage(); };
window["init_saved-jobs"] = function () { renderSavedJobsPage(); };
window.init_applications = function () { renderApplicationsPage(); };

/* ── Job Recommendations ───────────────────────────────────── */
function renderJobsPage() {
  const container = document.getElementById("jobsGrid");
  if (!container) return;

  const ctx = getLastResumeContext();
  const jobs = ctx?.jobs || [];

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getIcon("briefcase", 28)}</div>
        <div class="empty-title">No job recommendations yet</div>
        <div class="empty-desc">Upload and analyze a resume to get personalized job recommendations based on your skills and experience.</div>
        <button class="btn btn-primary mt-3" onclick="navigateTo('resumes')">${getIcon("upload", 16)} Analyze Resume</button>
      </div>`;
    return;
  }

  const skillFilter = document.getElementById("jobSkillFilter")?.value?.toLowerCase() || "";
  const sortBy = document.getElementById("jobSortBy")?.value || "match";

  let filtered = [...jobs];
  if (skillFilter) {
    filtered = filtered.filter(j =>
      (j.title || "").toLowerCase().includes(skillFilter) ||
      (j.company || "").toLowerCase().includes(skillFilter) ||
      (j.description || "").toLowerCase().includes(skillFilter)
    );
  }
  if (sortBy === "match") filtered.sort((a, b) => (b.match_pct ?? 0) - (a.match_pct ?? 0));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-title">No jobs match your filter.</div></div>`;
    return;
  }

  container.innerHTML = `<div class="jobs-grid">${filtered.map(j => buildJobCard(j)).join("")}</div>`;
}

function buildJobCard(job) {
  const matchPct = job.match_pct ?? 0;
  const matchClass = matchPct >= 70 ? "badge-success" : matchPct >= 40 ? "badge-warning" : "badge-neutral";
  const saved = getStoredSavedJobs();
  const isSaved = saved.some(s => s.url === job.url);
  const key = cacheJob(job);

  return `
    <div class="job-card fade-in">
      <div class="job-card-top">
        <div style="flex:1;min-width:0">
          <div class="job-title">${escHtml(job.title || "Role")}</div>
          <div class="job-company">${escHtml(job.company || "Company")}</div>
        </div>
        <span class="badge ${matchClass}" style="flex-shrink:0">${matchPct}% match</span>
      </div>
      <div class="job-meta">
        <span class="job-meta-item">${getIcon("map-pin", 13)} ${escHtml(job.location || "Remote")}</span>
      </div>
      <p class="job-description">${escHtml((job.description || "").substring(0, 200))}...</p>
      <div class="job-card-actions">
        ${job.url
          ? `<a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">${getIcon("external-link", 13)} Apply Now</a>`
          : ""}
        <button class="btn ${isSaved ? "btn-secondary" : "btn-ghost"} btn-sm" onclick="toggleSaveJobByKey('${escJs(key)}', this)">
          ${getIcon("bookmark", 13)} ${isSaved ? "Saved" : "Save"}
        </button>
        <button class="btn btn-ghost btn-sm" onclick="trackApplicationByKey('${escJs(key)}')">
          ${getIcon("send", 13)} Track
        </button>
      </div>
    </div>`;
}

window.toggleSaveJobByKey = function (key, btn) {
  const job = window.jobCache[key];
  if (!job) {
    showToast("Error locating job details.", "error");
    return;
  }
  const saved = getStoredSavedJobs();
  const idx = saved.findIndex(s => s.url === job.url);
  if (idx === -1) {
    saved.push({ ...job, saved_at: new Date().toISOString() });
    localStorage.setItem("savedJobs", JSON.stringify(saved));
    if (btn) { btn.innerHTML = `${getIcon("bookmark", 13)} Saved`; btn.className = "btn btn-secondary btn-sm"; }
    showToast("Job saved to Saved Jobs!", "success");
  } else {
    saved.splice(idx, 1);
    localStorage.setItem("savedJobs", JSON.stringify(saved));
    if (btn) { btn.innerHTML = `${getIcon("bookmark", 13)} Save`; btn.className = "btn btn-ghost btn-sm"; }
    showToast("Job removed from Saved Jobs.", "info");
  }
  // Refresh dashboard stats if active
  if (typeof renderDashboard === "function") renderDashboard();
};

window.trackApplicationByKey = function (key) {
  const job = window.jobCache[key];
  if (!job) { showToast("Error locating job details.", "error"); return; }

  const apps = getStoredApplications();
  if (apps.some(a => a.url === job.url)) {
    showToast("Already tracking this application.", "info");
    navigateTo("applications");
    return;
  }
  apps.push({ ...job, status: "Applied", applied_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  localStorage.setItem("applications", JSON.stringify(apps));
  showToast("Application added to tracker.", "success");
  navigateTo("applications");
};

/* ── Saved Jobs Page ────────────────────────────────────────── */
function renderSavedJobsPage() {
  const container = document.getElementById("savedJobsGrid");
  if (!container) return;

  const saved = getStoredSavedJobs();

  if (saved.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getIcon("bookmark", 28)}</div>
        <div class="empty-title">No saved jobs yet</div>
        <div class="empty-desc">Browse job recommendations and click "Save" to keep track of your favorite roles.</div>
        <button class="btn btn-primary mt-3" onclick="navigateTo('jobs')">${getIcon("briefcase", 16)} Browse Jobs</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="jobs-grid">
      ${saved.map(j => {
        const key = cacheJob(j);
        return `
        <div class="job-card fade-in">
          <div class="job-card-top">
            <div style="flex:1;min-width:0">
              <div class="job-title">${escHtml(j.title || "Role")}</div>
              <div class="job-company">${escHtml(j.company || "Company")}</div>
            </div>
            <span class="badge ${(j.match_pct??0)>=70?"badge-success":(j.match_pct??0)>=40?"badge-warning":"badge-neutral"}">${j.match_pct??0}% match</span>
          </div>
          <div class="job-meta">
            <span class="job-meta-item">${getIcon("map-pin", 13)} ${escHtml(j.location || "Remote")}</span>
            <span class="job-meta-item">${getIcon("save", 13)} Saved ${formatDate(j.saved_at)}</span>
          </div>
          <p class="job-description">${escHtml((j.description || "").substring(0, 180))}...</p>
          <div class="job-card-actions">
            ${j.url ? `<a href="${j.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">${getIcon("external-link", 13)} Apply</a>` : ""}
            <button class="btn btn-ghost btn-sm" onclick="trackApplicationByKey('${escJs(key)}')">
              ${getIcon("send", 13)} Track
            </button>
            <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="removeSavedJob('${escJs(j.url)}')">
              ${getIcon("trash", 13)} Remove
            </button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

window.removeSavedJob = function (url) {
  const saved = getStoredSavedJobs().filter(j => j.url !== url);
  localStorage.setItem("savedJobs", JSON.stringify(saved));
  showToast("Job removed from saved.", "info");
  renderSavedJobsPage();
  if (typeof renderDashboard === "function") renderDashboard();
};

/* ── Applications Tracker ──────────────────────────────────── */
function renderApplicationsPage() {
  const container = document.getElementById("applicationsContainer");
  if (!container) return;

  const apps = getStoredApplications();

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getIcon("send", 28)}</div>
        <div class="empty-title">No applications tracked yet</div>
        <div class="empty-desc">Apply to jobs and click "Track" to monitor your application status here.</div>
        <button class="btn btn-primary mt-3" onclick="navigateTo('jobs')">${getIcon("briefcase", 16)} Browse Jobs</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>Match</th>
            <th>Status</th>
            <th>Applied</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${apps.map((app, idx) => `
            <tr>
              <td>
                <div class="font-600">${escHtml(app.title || "—")}</div>
                ${app.url ? `<a href="${app.url}" target="_blank" class="text-xs text-primary-color" style="display:flex;align-items:center;gap:3px;margin-top:2px">${getIcon("external-link", 11)} View Job</a>` : ""}
              </td>
              <td>${escHtml(app.company || "—")}</td>
              <td><span class="text-sm text-muted">${escHtml(app.location || "—")}</span></td>
              <td><span class="badge ${(app.match_pct??0)>=70?"badge-success":(app.match_pct??0)>=40?"badge-warning":"badge-neutral"}">${app.match_pct??0}%</span></td>
              <td>
                <select class="form-select" style="padding:4px 8px;font-size:0.8125rem;width:auto"
                  onchange="updateAppStatus(${idx}, this.value)">
                  ${APP_STATUSES.map(s => `<option value="${s}" ${app.status===s?"selected":""}>${s}</option>`).join("")}
                </select>
              </td>
              <td><span class="text-sm text-muted">${formatDate(app.applied_at)}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--color-danger)" onclick="deleteApplication(${idx})" title="Delete">
                  ${getIcon("trash", 14)}
                </button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Status Summary -->
    <div class="card mt-4">
      <div class="card-title mb-4">Application Pipeline</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${APP_STATUSES.map(s => {
          const count = apps.filter(a => a.status === s).length;
          return `<div class="ats-metric" style="min-width:100px">
            <div class="ats-metric-value">${count}</div>
            <div class="ats-metric-label">${s}</div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

window.updateAppStatus = function (idx, status) {
  const apps = getStoredApplications();
  if (apps[idx]) {
    apps[idx].status = status;
    apps[idx].updated_at = new Date().toISOString();
    localStorage.setItem("applications", JSON.stringify(apps));
    showToast(`Status updated to "${status}".`, "success");
    if (typeof renderDashboard === "function") renderDashboard();
  }
};

window.deleteApplication = function (idx) {
  const apps = getStoredApplications();
  apps.splice(idx, 1);
  localStorage.setItem("applications", JSON.stringify(apps));
  showToast("Application removed.", "info");
  renderApplicationsPage();
  if (typeof renderDashboard === "function") renderDashboard();
};

function escJs(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("jobSkillFilter")?.addEventListener("input", renderJobsPage);
  document.getElementById("jobSortBy")?.addEventListener("change", renderJobsPage);
});
