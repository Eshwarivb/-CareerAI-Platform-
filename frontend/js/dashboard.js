/* ============================================================
   dashboard.js — Dashboard Overview Panel
   ============================================================ */

window.init_dashboard = function () {
  renderDashboard();
};

function renderDashboard() {
  const resumes = getStoredResumes();
  const savedJobs = getStoredSavedJobs();
  const apps = getStoredApplications();
  const lastContext = getLastResumeContext();

  const atsScore = lastContext?.ats_score ?? "--";
  const atsColor = atsScore === "--" ? "neutral" : atsScore >= 70 ? "success" : atsScore >= 45 ? "warning" : "danger";

  /* ── Stat Cards ─────────────────────────────────────── */
  const statsEl = document.getElementById("dashStats");
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon-wrap primary">${getIcon("bar-chart-2", 22)}</div>
        <div class="stat-body">
          <div class="stat-value" style="color: ${atsScore === "--" ? "var(--color-text-muted)" : getScoreColor(atsScore)}">${atsScore}${atsScore !== "--" ? "%" : ""}</div>
          <div class="stat-label">Latest ATS Score</div>
          <div class="stat-change neutral">${atsScore === "--" ? "Upload a resume to get started" : (atsScore >= 70 ? "Good match" : atsScore >= 45 ? "Needs improvement" : "Needs work")}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap info">${getIcon("file-text", 22)}</div>
        <div class="stat-body">
          <div class="stat-value">${resumes.length}</div>
          <div class="stat-label">Resumes Uploaded</div>
          <div class="stat-change neutral">${resumes.length === 0 ? "No resumes yet" : `${resumes.length} resume${resumes.length > 1 ? "s" : ""} analyzed`}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap success">${getIcon("briefcase", 22)}</div>
        <div class="stat-body">
          <div class="stat-value">${savedJobs.length}</div>
          <div class="stat-label">Saved Jobs</div>
          <div class="stat-change neutral">${savedJobs.length === 0 ? "No saved jobs yet" : `${savedJobs.length} job${savedJobs.length > 1 ? "s" : ""} saved`}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap warning">${getIcon("send", 22)}</div>
        <div class="stat-body">
          <div class="stat-value">${apps.length}</div>
          <div class="stat-label">Applications</div>
          <div class="stat-change neutral">${apps.length === 0 ? "No applications yet" : `${apps.filter(a => a.status === "Interview" || a.status === "Offer").length} active`}</div>
        </div>
      </div>
    `;
  }

  /* ── Recent Resumes ──────────────────────────────────── */
  const resumesEl = document.getElementById("dashRecentResumes");
  if (resumesEl) {
    if (resumes.length === 0) {
      resumesEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon("file-text", 28)}</div>
          <div class="empty-title">No resumes yet</div>
          <div class="empty-desc">Upload your first resume to get AI-powered analysis and job recommendations.</div>
          <button class="btn btn-primary mt-3" onclick="navigateTo('resumes')">${getIcon("upload", 16)} Upload Resume</button>
        </div>`;
    } else {
      const recent = [...resumes].reverse().slice(0, 5);
      resumesEl.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Resume</th>
                <th>ATS Score</th>
                <th>Skills Found</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(r => `
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <span style="color:var(--color-primary)">${getIcon("file-text", 16)}</span>
                      <span class="font-600">${escHtml(r.name)}</span>
                    </div>
                  </td>
                  <td>
                    ${r.ats_score != null
                      ? `<span class="badge ${r.ats_score >= 70 ? "badge-success" : r.ats_score >= 45 ? "badge-warning" : "badge-danger"}">${r.ats_score}%</span>`
                      : `<span class="badge badge-neutral">Not scored</span>`}
                  </td>
                  <td><span class="text-sm">${(r.skills || []).slice(0, 3).join(", ") || "—"}</span></td>
                  <td><span class="text-sm text-muted">${formatDate(r.uploaded_at)}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('ats')" title="Check ATS Score">
                      ${getIcon("bar-chart-2", 14)} Analyze
                    </button>
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-3">
          <button class="btn btn-ghost btn-sm" onclick="navigateTo('resumes')">View all resumes ${getIcon("chevron-right", 14)}</button>
        </div>`;
    }
  }

  /* ── Recent Jobs ─────────────────────────────────────── */
  const jobsEl = document.getElementById("dashRecentJobs");
  if (jobsEl) {
    const jobs = lastContext?.jobs || [];
    if (jobs.length === 0) {
      jobsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon("briefcase", 28)}</div>
          <div class="empty-title">No job recommendations yet</div>
          <div class="empty-desc">Analyze a resume to get personalized job matches from live job listings.</div>
          <button class="btn btn-primary mt-3" onclick="navigateTo('resumes')">${getIcon("upload", 16)} Analyze Resume</button>
        </div>`;
    } else {
      const recent = jobs.slice(0, 4);
      jobsEl.innerHTML = `
        <div class="jobs-grid">
          ${recent.map(j => renderMiniJobCard(j)).join("")}
        </div>
        <div class="flex justify-end mt-3">
          <button class="btn btn-ghost btn-sm" onclick="navigateTo('jobs')">View all jobs ${getIcon("chevron-right", 14)}</button>
        </div>`;
    }
  }
}

function renderMiniJobCard(job) {
  const matchPct = job.match_pct ?? 0;
  const matchClass = matchPct >= 70 ? "badge-success" : matchPct >= 40 ? "badge-warning" : "badge-neutral";
  const initial = (job.company || "?").charAt(0).toUpperCase();
  return `
    <div class="job-card">
      <div class="job-card-top">
        <div>
          <div class="job-title">${escHtml(job.title || "Untitled Role")}</div>
          <div class="job-company">${escHtml(job.company || "Unknown Company")}</div>
        </div>
        <span class="badge ${matchClass}">${matchPct}% match</span>
      </div>
      <div class="job-meta">
        <span class="job-meta-item">${getIcon("map-pin", 13)} ${escHtml(job.location || "Remote")}</span>
      </div>
      <div class="job-card-actions">
        ${job.url ? `<a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">${getIcon("external-link", 13)} Apply</a>` : ""}
        <button class="btn btn-secondary btn-sm" onclick="quickSaveJob(${JSON.stringify(JSON.stringify(job))})">${getIcon("bookmark", 13)} Save</button>
      </div>
    </div>`;
}

function quickSaveJob(jobStr) {
  const job = JSON.parse(jobStr);
  const saved = getStoredSavedJobs();
  if (saved.some(j => j.url === job.url)) {
    showToast("Already in saved jobs.", "info");
    return;
  }
  saved.push({ ...job, saved_at: new Date().toISOString() });
  localStorage.setItem("savedJobs", JSON.stringify(saved));
  showToast("Job saved successfully.", "success");
}

/* ── Shared localStorage helpers ───────────────────────────── */
function getStoredResumes() {
  try { return JSON.parse(localStorage.getItem("storedResumes") || "[]"); } catch { return []; }
}

function getStoredSavedJobs() {
  try { return JSON.parse(localStorage.getItem("savedJobs") || "[]"); } catch { return []; }
}

function getStoredApplications() {
  try { return JSON.parse(localStorage.getItem("applications") || "[]"); } catch { return []; }
}

function getLastResumeContext() {
  try { return JSON.parse(localStorage.getItem("lastResumeContext") || "null"); } catch { return null; }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function getScoreColor(score) {
  if (score >= 70) return "var(--color-success)";
  if (score >= 45) return "var(--color-warning)";
  return "var(--color-danger)";
}

// Make helpers globally available for other modules
window.getStoredResumes = getStoredResumes;
window.getStoredSavedJobs = getStoredSavedJobs;
window.getStoredApplications = getStoredApplications;
window.getLastResumeContext = getLastResumeContext;
window.formatDate = formatDate;
window.escHtml = escHtml;
window.getScoreColor = getScoreColor;
window.quickSaveJob = quickSaveJob;
