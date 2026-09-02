/* ============================================================
   ats.js — ATS Analyzer Page
   ============================================================ */

window.init_ats = function () {
  setupAtsPage();
};

function setupAtsPage() {
  const zone = document.getElementById("atsUploadZone");
  const fileInput = document.getElementById("atsFileInput");
  const form = document.getElementById("atsForm");
  let selectedFile = null;

  if (!zone || !fileInput || !form) return;
  if (form.dataset.bound) return;
  form.dataset.bound = "1";

  // File zone
  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragging"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragging");
    if (e.dataTransfer.files[0]) setAtsFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) setAtsFile(fileInput.files[0]);
  });

  function setAtsFile(file) {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) { showToast("Only PDF and DOCX are supported.", "error"); return; }
    selectedFile = file;
    zone.querySelector(".upload-text").textContent = file.name;
    zone.querySelector(".upload-hint").textContent = `${(file.size / 1024).toFixed(0)} KB selected`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const jd = document.getElementById("atsJobDescription").value.trim();
    if (!selectedFile) { showToast("Please select a resume file.", "warning"); return; }
    if (!jd) { showToast("Please paste the job description.", "warning"); return; }
    await runAtsScore(selectedFile, jd);
  });
}

async function runAtsScore(file, jd) {
  const submitBtn = document.getElementById("atsSubmitBtn");
  const loadingEl = document.getElementById("atsLoading");
  const resultEl = document.getElementById("atsResult");

  if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add("loading"); }
  if (loadingEl) loadingEl.style.display = "flex";
  if (resultEl) resultEl.style.display = "none";

  try {
    const { ok, data } = await apiAtsScore(file, jd);

    if (!ok || data.error) {
      showToast(data.error || "Could not compute ATS score.", "error");
      return;
    }

    // Always save latest ATS score to localStorage
    localStorage.setItem("latestAtsScore", String(data.overall_score));

    // Update last context
    const ctx = getLastResumeContext() || {};
    ctx.ats_score = data.overall_score;
    localStorage.setItem("lastResumeContext", JSON.stringify(ctx));

    // Save to stored resumes list
    const resumes = getStoredResumes();
    if (resumes.length > 0) {
      const last = resumes[resumes.length - 1];
      last.ats_score = data.overall_score;
      localStorage.setItem("storedResumes", JSON.stringify(resumes));
    } else {
      // Create a resume record for this ATS check
      const newResume = {
        id: Date.now().toString(),
        name: file.name,
        skills: data.matched_keywords || [],
        experience_level: "Fresher",
        feedback: data.formatting_issues || [],
        jobs: [],
        uploaded_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
        ats_score: data.overall_score,
      };
      localStorage.setItem("storedResumes", JSON.stringify([newResume]));
    }

    if (typeof renderDashboard === "function") renderDashboard();

    displayAtsResults(data);

  } catch (err) {
    console.error(err);
    showToast("Could not reach the backend. Is the server running?", "error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove("loading"); }
    if (loadingEl) loadingEl.style.display = "none";
  }
}

function displayAtsResults(data) {
  const resultEl = document.getElementById("atsResult");
  if (!resultEl) return;
  resultEl.style.display = "block";

  const score = data.overall_score ?? 0;
  const kwPct = data.keyword_match_pct ?? 0;
  const fmtScore = data.formatting_score ?? 0;
  const matched = data.matched_keywords || [];
  const missing = data.missing_keywords || [];
  const issues = data.formatting_issues || [];

  const scoreColor = score >= 70 ? "#10B981" : score >= 45 ? "#F59E0B" : "#EF4444";
  const scoreDash = Math.round(377 * (1 - score / 100));

  resultEl.innerHTML = `
    <div class="fade-in">
      <!-- Score Overview -->
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">ATS Score Overview</div>
          <span class="badge ${score >= 70 ? "badge-success" : score >= 45 ? "badge-warning" : "badge-danger"} text-sm">
            ${score >= 70 ? "Good Match" : score >= 45 ? "Needs Improvement" : "Needs Work"}
          </span>
        </div>
        <div class="flex items-center gap-8 flex-wrap">
          <div class="score-ring-wrap">
            <div class="score-ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle class="score-ring-bg" cx="70" cy="70" r="60"/>
                <circle class="score-ring-fill" cx="70" cy="70" r="60"
                  style="stroke:${scoreColor}; stroke-dashoffset:${scoreDash}"/>
              </svg>
              <div class="score-ring-text">
                <div class="score-value" style="color:${scoreColor}">${score}</div>
                <div class="score-label">ATS Score</div>
              </div>
            </div>
          </div>

          <div class="flex-1" style="min-width:240px">
            <div class="ats-breakdown">
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${kwPct>=70?"var(--color-success)":kwPct>=45?"var(--color-warning)":"var(--color-danger)"}">${kwPct}%</div>
                <div class="ats-metric-label">Keyword Match</div>
              </div>
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${fmtScore>=70?"var(--color-success)":fmtScore>=45?"var(--color-warning)":"var(--color-danger)"}">${fmtScore}%</div>
                <div class="ats-metric-label">Formatting</div>
              </div>
              <div class="ats-metric">
                <div class="ats-metric-value">${matched.length}</div>
                <div class="ats-metric-label">Keywords Matched</div>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-muted">Keyword Match</span>
                <span class="font-600">${kwPct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${kwPct>=70?"success":kwPct>=45?"warning":"danger"}" style="width:${kwPct}%"></div>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-muted">Formatting Score</span>
                <span class="font-600">${fmtScore}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${fmtScore>=70?"success":fmtScore>=45?"warning":"danger"}" style="width:${fmtScore}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Keywords -->
      <div class="grid-2 mb-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-success)">${getIcon("check", 16)} Matched Keywords</div>
            <span class="badge badge-success">${matched.length}</span>
          </div>
          <div class="pill-wrap">
            ${matched.length
              ? matched.map(k => `<span class="pill pill-matched">${escHtml(k)}</span>`).join("")
              : `<span class="text-muted text-sm">No keywords matched.</span>`}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-danger)">${getIcon("x", 16)} Missing Keywords</div>
            <span class="badge badge-danger">${missing.length}</span>
          </div>
          <div class="pill-wrap">
            ${missing.length
              ? missing.map(k => `<span class="pill pill-missing">${escHtml(k)}</span>`).join("")
              : `<span class="text-sm" style="color:var(--color-success)">No missing keywords — great job!</span>`}
          </div>
        </div>
      </div>

      <!-- Formatting Issues -->
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">${getIcon("alert-circle", 16)} Formatting Issues</div>
          <span class="badge ${issues.length === 0 ? "badge-success" : "badge-warning"}">${issues.length === 0 ? "No issues" : issues.length + " issue" + (issues.length > 1 ? "s" : "")}</span>
        </div>
        ${issues.length === 0
          ? `<div class="flex items-center gap-2" style="color:var(--color-success)">${getIcon("check", 16)} <span class="text-sm font-600">No formatting issues detected. Your resume is ATS-friendly!</span></div>`
          : `<ul style="list-style:none;display:flex;flex-direction:column;gap:10px">
              ${issues.map(i => `
                <li class="flex items-center gap-3 text-sm" style="color:var(--color-warning)">
                  <span style="flex-shrink:0">${getIcon("alert-circle", 16)}</span>
                  ${escHtml(i)}
                </li>`).join("")}
            </ul>`}
      </div>

      <!-- Recommendations -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${getIcon("trending-up", 16)} Recommendations</div>
        </div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px">
          ${missing.length > 0 ? `<li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Add these missing keywords to your resume: <strong>${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}</strong></li>` : ""}
          ${issues.length > 0 ? `<li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Fix the ${issues.length} formatting issue${issues.length > 1 ? "s" : ""} listed above.</li>` : ""}
          ${kwPct < 50 ? `<li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Tailor your resume more closely to the job description language.</li>` : ""}
          <li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Use standard section headers like Experience, Education, and Skills.</li>
          <li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Avoid tables, graphics, or multi-column layouts that ATS parsers may skip.</li>
        </ul>
        <div class="flex gap-2 mt-5">
          <button class="btn btn-primary btn-sm" onclick="navigateTo('career')">${getIcon("compass", 14)} Get Career Guidance</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('assistant')">${getIcon("message-square", 14)} Ask AI Assistant</button>
        </div>
      </div>
    </div>`;

  resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
