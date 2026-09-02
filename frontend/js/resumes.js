/* ============================================================
   resumes.js — My Resumes Page
   ============================================================ */

window.init_resumes = function () {
  renderResumesPage();
};

function renderResumesPage() {
  renderResumesList();
  setupResumeUpload();
}

function setupResumeUpload() {
  const zone = document.getElementById("resumeUploadZone");
  const fileInput = document.getElementById("resumeFileInput");
  const analyzeBtn = document.getElementById("resumeAnalyzeBtn");
  const locationInput = document.getElementById("resumeLocationInput");
  let selectedFile = null;

  if (!zone || !fileInput) return;

  // Already bound — avoid double-binding
  if (zone.dataset.bound) return;
  zone.dataset.bound = "1";

  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragging"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragging");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
  });

  analyzeBtn?.addEventListener("click", async () => {
    if (!selectedFile) { showToast("Please select a resume file first.", "warning"); return; }
    const location = locationInput?.value.trim() || "";
    await analyzeResume(selectedFile, location);
  });

  function handleFileSelected(file) {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      showToast("Only PDF and DOCX files are supported.", "error");
      return;
    }
    selectedFile = file;
    const uploadText = zone.querySelector(".upload-text");
    if (uploadText) uploadText.textContent = file.name;
    const uploadHint = zone.querySelector(".upload-hint");
    if (uploadHint) uploadHint.textContent = `${(file.size / 1024).toFixed(0)} KB — ready to analyze`;
    if (analyzeBtn) analyzeBtn.disabled = false;
    showToast(`File selected: ${file.name}`, "info");
  }
}

async function analyzeResume(file, location) {
  const analyzeBtn = document.getElementById("resumeAnalyzeBtn");
  const statusEl = document.getElementById("resumeAnalysisStatus");

  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add("loading"); }
  if (statusEl) { statusEl.textContent = "Analyzing resume..."; statusEl.style.display = "block"; }

  try {
    const { ok, data } = await apiAnalyzeResume(file, location);

    if (!ok || data.error) {
      showToast(data.error || "Analysis failed. Please try again.", "error");
      return;
    }

    // Store resume record
    const resumes = getStoredResumes();
    const newResume = {
      id: Date.now().toString(),
      name: file.name,
      skills: data.skills || [],
      experience_level: data.experience_level || "Unknown",
      feedback: data.feedback || [],
      jobs: data.jobs || [],
      uploaded_at: new Date().toISOString(),
      analyzed_at: new Date().toISOString(),
      location: location,
      ats_score: null,
    };
    resumes.push(newResume);
    localStorage.setItem("storedResumes", JSON.stringify(resumes));

    // Update last resume context
    localStorage.setItem("lastResumeContext", JSON.stringify({
      resume_id: newResume.id,
      skills: data.skills || [],
      experience_level: data.experience_level || "Unknown",
      feedback: data.feedback || [],
      jobs: data.jobs || [],
    }));

    showToast(`Resume analyzed successfully! Found ${(data.skills || []).length} skills.`, "success");

    // Reset upload zone
    const zone = document.getElementById("resumeUploadZone");
    if (zone) {
      zone.querySelector(".upload-text").textContent = "Drop your resume here or click to browse";
      zone.querySelector(".upload-hint").textContent = "PDF or DOCX • Max 10 MB";
      zone.dataset.bound = "";
    }
    document.getElementById("resumeFileInput").value = "";

    renderResumesList();
    renderAnalysisResult(newResume, data);

  } catch (err) {
    console.error(err);
    showToast("Could not reach the backend. Make sure the server is running.", "error");
  } finally {
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove("loading"); }
    if (statusEl) statusEl.style.display = "none";
  }
}

function renderAnalysisResult(resume, data) {
  const container = document.getElementById("resumeAnalysisResult");
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = `
    <div class="card fade-in">
      <div class="card-header">
        <div>
          <div class="card-title">Analysis Result — ${escHtml(resume.name)}</div>
          <div class="card-subtitle">${resume.experience_level} • ${(data.skills || []).length} skills detected</div>
        </div>
        <span class="badge badge-success">${getIcon("check", 12)} Analyzed</span>
      </div>

      <div class="grid-2 mt-4">
        <div>
          <div class="text-sm font-600 mb-4" style="color:var(--color-text-secondary)">Detected Skills</div>
          <div class="pill-wrap">
            ${(data.skills || []).length ? data.skills.map(s => `<span class="pill pill-skill">${escHtml(s)}</span>`).join("") : '<span class="text-muted text-sm">No skills detected</span>'}
          </div>
        </div>
        <div>
          <div class="text-sm font-600 mb-4" style="color:var(--color-text-secondary)">AI Feedback</div>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:8px">
            ${(data.feedback || []).map(f => `
              <li class="flex items-center gap-2 text-sm">
                <span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>
                ${escHtml(f)}
              </li>`).join("")}
          </ul>
        </div>
      </div>

      ${(data.jobs || []).length ? `
      <div class="divider"></div>
      <div class="card-title mb-4">Job Recommendations (${data.jobs.length} found)</div>
      <div class="jobs-grid">
        ${data.jobs.slice(0, 6).map(j => renderJobCard(j)).join("")}
      </div>` : ""}

      <div class="flex gap-2 mt-4">
        <button class="btn btn-primary btn-sm" onclick="navigateTo('ats')">${getIcon("bar-chart-2", 14)} Check ATS Score</button>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('jobs')">${getIcon("briefcase", 14)} View All Jobs</button>
        <button class="btn btn-ghost btn-sm" onclick="navigateTo('career')">${getIcon("compass", 14)} Career Guidance</button>
      </div>
    </div>`;
}

function renderResumesList() {
  const listEl = document.getElementById("resumesList");
  if (!listEl) return;

  const resumes = getStoredResumes();

  if (resumes.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getIcon("file-text", 28)}</div>
        <div class="empty-title">No resumes yet</div>
        <div class="empty-desc">Upload your first resume above to get started with AI analysis.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Resume Name</th>
            <th>ATS Score</th>
            <th>Skills</th>
            <th>Experience</th>
            <th>Uploaded</th>
            <th>Analyzed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${[...resumes].reverse().map(r => `
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
              <td>
                <div class="flex flex-wrap gap-1">
                  ${(r.skills || []).slice(0, 3).map(s => `<span class="pill pill-skill" style="font-size:0.7rem">${escHtml(s)}</span>`).join("")}
                  ${(r.skills || []).length > 3 ? `<span class="text-xs text-muted">+${r.skills.length - 3}</span>` : ""}
                </div>
              </td>
              <td><span class="badge badge-info">${escHtml(r.experience_level || "—")}</span></td>
              <td><span class="text-sm text-muted">${formatDate(r.uploaded_at)}</span></td>
              <td><span class="text-sm text-muted">${formatDate(r.analyzed_at)}</span></td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm btn-icon" title="View analysis" onclick="viewResumeAnalysis('${r.id}')">${getIcon("eye", 14)}</button>
                  <button class="btn btn-ghost btn-sm btn-icon" title="ATS Check" onclick="goToAts('${r.id}')">${getIcon("bar-chart-2", 14)}</button>
                  <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--color-danger)" title="Delete" onclick="deleteResume('${r.id}')">${getIcon("trash", 14)}</button>
                </div>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

window.deleteResume = function (id) {
  const resumes = getStoredResumes().filter(r => r.id !== id);
  localStorage.setItem("storedResumes", JSON.stringify(resumes));
  showToast("Resume deleted.", "success");
  renderResumesList();
};

window.viewResumeAnalysis = function (id) {
  const resume = getStoredResumes().find(r => r.id === id);
  if (!resume) return;
  renderAnalysisResult(resume, resume);
  document.getElementById("resumeAnalysisResult")?.scrollIntoView({ behavior: "smooth" });
};

window.goToAts = function () {
  navigateTo("ats");
};

function renderJobCard(job) {
  const matchPct = job.match_pct ?? 0;
  const matchClass = matchPct >= 70 ? "badge-success" : matchPct >= 40 ? "badge-warning" : "badge-neutral";
  window.jobCache = window.jobCache || {};
  const key = job.url || `${job.title}_${job.company}`;
  window.jobCache[key] = job;
  const saved = getStoredSavedJobs();
  const isSaved = saved.some(s => s.url === job.url);

  return `
    <div class="job-card">
      <div class="job-card-top">
        <div>
          <div class="job-title">${escHtml(job.title || "Untitled Role")}</div>
          <div class="job-company">${escHtml(job.company || "Unknown")}</div>
        </div>
        <span class="badge ${matchClass}">${matchPct}%</span>
      </div>
      <div class="job-meta">
        <span class="job-meta-item">${getIcon("map-pin", 13)} ${escHtml(job.location || "Remote")}</span>
      </div>
      <p class="job-description">${escHtml((job.description || "").substring(0, 180))}...</p>
      <div class="job-card-actions">
        ${job.url ? `<a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">${getIcon("external-link", 13)} Apply</a>` : ""}
        <button class="btn ${isSaved ? "btn-secondary" : "btn-ghost"} btn-sm" onclick="toggleSaveJobByKey('${escJs(key)}', this)">
          ${getIcon("bookmark", 13)} ${isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>`;
}

function escJs(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

window.renderJobCard = renderJobCard;
