/* ============================================================
   ats.js — Multi-Factor ATS Analyzer Page
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

    // Save latest ATS score to localStorage
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
        experience_level: data.experience_analysis?.candidate_exp || "Fresher",
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
  const label = data.score_label || (score >= 90 ? "Excellent Match" : score >= 80 ? "Strong Match" : score >= 70 ? "Good Match" : score >= 60 ? "Moderate Match" : "Needs Improvement");
  
  const sb = data.score_breakdown || {
    required_keyword_match: data.keyword_match_pct || 0,
    skills_match: data.keyword_match_pct || 0,
    semantic_relevance: 70,
    experience_match: 80,
    project_relevance: 75,
    education_match: 90,
    structure_score: 90,
    formatting_score: data.formatting_score || 90
  };

  const reqMatched = data.matched_required_skills || data.matched_keywords || [];
  const reqMissing = data.missing_required_skills || data.missing_keywords || [];
  const prefMatched = data.matched_preferred_skills || [];
  const prefMissing = data.missing_preferred_skills || [];

  const issues = data.formatting_issues || [];
  const strengths = data.strengths || ["Resume parsed successfully."];
  const recs = data.recommendations || [];

  const scoreColor = score >= 80 ? "#10B981" : score >= 65 ? "#F59E0B" : "#EF4444";
  const scoreDash = Math.round(377 * (1 - score / 100));

  resultEl.innerHTML = `
    <div class="fade-in">
      <!-- Top Score Header Card -->
      <div class="card mb-4">
        <div class="card-header">
          <div>
            <div class="card-title">ATS Compatibility Score</div>
            <div class="card-subtitle">Multi-factor match analysis against target job description</div>
          </div>
          <span class="badge ${score >= 80 ? "badge-success" : score >= 65 ? "badge-warning" : "badge-danger"}" style="font-size:0.875rem;padding:6px 14px">
            ${label}
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
                <div class="score-label">OUT OF 100</div>
              </div>
            </div>
          </div>

          <div class="flex-1" style="min-width:280px">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px">
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${getMetricColor(sb.required_keyword_match)}">${sb.required_keyword_match}%</div>
                <div class="ats-metric-label">Required Skills</div>
              </div>
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${getMetricColor(sb.skills_match)}">${sb.skills_match}%</div>
                <div class="ats-metric-label">Overall Skills</div>
              </div>
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${getMetricColor(sb.semantic_relevance)}">${sb.semantic_relevance}%</div>
                <div class="ats-metric-label">Content Match</div>
              </div>
              <div class="ats-metric">
                <div class="ats-metric-value" style="color:${getMetricColor(sb.experience_match)}">${sb.experience_match}%</div>
                <div class="ats-metric-label">Experience</div>
              </div>
            </div>

            <!-- Additional sub-score bars -->
            <div class="grid-2 mt-4" style="gap:12px">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-muted">Project Relevance</span>
                  <span class="font-600">${sb.project_relevance}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${getMetricClass(sb.project_relevance)}" style="width:${sb.project_relevance}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-muted">Education Match</span>
                  <span class="font-600">${sb.education_match}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${getMetricClass(sb.education_match)}" style="width:${sb.education_match}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-muted">Resume Structure</span>
                  <span class="font-600">${sb.structure_score}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${getMetricClass(sb.structure_score)}" style="width:${sb.structure_score}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-muted">ATS Readability</span>
                  <span class="font-600">${sb.formatting_score}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${getMetricClass(sb.formatting_score)}" style="width:${sb.formatting_score}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categorized Skills Grid -->
      <div class="grid-2 mb-4">
        <!-- Required Skills -->
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-success)">${getIcon("check", 16)} Matched Required Skills</div>
            <span class="badge badge-success">${reqMatched.length}</span>
          </div>
          <div class="pill-wrap">
            ${reqMatched.length
              ? reqMatched.map(k => `<span class="pill pill-matched">${escHtml(k)}</span>`).join("")
              : `<span class="text-muted text-sm">No required skills detected.</span>`}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-danger)">${getIcon("x", 16)} Missing Required Skills</div>
            <span class="badge badge-danger">${reqMissing.length}</span>
          </div>
          <div class="pill-wrap mb-2">
            ${reqMissing.length
              ? reqMissing.map(k => `<span class="pill pill-missing">${escHtml(k)}</span>`).join("")
              : `<span class="text-sm" style="color:var(--color-success)">All required skills are present!</span>`}
          </div>
          ${reqMissing.length ? `<div class="text-xs text-muted mt-2" style="font-style:italic">Note: Add missing skills only if you genuinely have experience with them.</div>` : ""}
        </div>
      </div>

      ${(prefMatched.length || prefMissing.length) ? `
      <!-- Preferred Skills Grid -->
      <div class="grid-2 mb-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-primary)">${getIcon("award", 16)} Matched Preferred Skills</div>
            <span class="badge badge-primary">${prefMatched.length}</span>
          </div>
          <div class="pill-wrap">
            ${prefMatched.length
              ? prefMatched.map(k => `<span class="pill pill-skill">${escHtml(k)}</span>`).join("")
              : `<span class="text-muted text-sm">No preferred skills matched.</span>`}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-warning)">${getIcon("alert-circle", 16)} Missing Preferred Skills</div>
            <span class="badge badge-warning">${prefMissing.length}</span>
          </div>
          <div class="pill-wrap">
            ${prefMissing.length
              ? prefMissing.map(k => `<span class="pill pill-neutral">${escHtml(k)}</span>`).join("")
              : `<span class="text-sm" style="color:var(--color-success)">All preferred skills matched!</span>`}
          </div>
        </div>
      </div>` : ""}

      <!-- Strengths & Formatting Issues -->
      <div class="grid-2 mb-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="color:var(--color-success)">${getIcon("check", 16)} Key Strengths</div>
          </div>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:8px">
            ${strengths.map(s => `<li class="flex items-center gap-2 text-sm"><span style="color:var(--color-success);flex-shrink:0">${getIcon("check", 14)}</span>${escHtml(s)}</li>`).join("")}
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">${getIcon("alert-circle", 16)} ATS Formatting &amp; Structure</div>
            <span class="badge ${issues.length === 0 ? "badge-success" : "badge-warning"}">${issues.length === 0 ? "No issues" : issues.length + " issue" + (issues.length > 1 ? "s" : "")}</span>
          </div>
          ${issues.length === 0
            ? `<div class="flex items-center gap-2" style="color:var(--color-success)">${getIcon("check", 16)} <span class="text-sm font-600">No formatting issues detected. Your resume is ATS-friendly!</span></div>`
            : `<ul style="list-style:none;display:flex;flex-direction:column;gap:8px">
                ${issues.map(i => `
                  <li class="flex items-center gap-2 text-sm" style="color:var(--color-warning)">
                    <span style="flex-shrink:0">${getIcon("alert-circle", 14)}</span>
                    ${escHtml(i)}
                  </li>`).join("")}
              </ul>`}
        </div>
      </div>

      <!-- Actionable Guidance & Recommendations -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${getIcon("trending-up", 16)} Actionable Recommendations</div>
        </div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px">
          ${recs.map(r => `<li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>${escHtml(r)}</li>`).join("")}
          <li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Use standard section headers like Experience, Education, and Skills.</li>
          <li class="flex items-center gap-3 text-sm"><span style="color:var(--color-primary);flex-shrink:0">${getIcon("check", 14)}</span>Avoid complex tables, graphics, or multi-column layouts that ATS parsers may skip.</li>
        </ul>
        <div class="flex gap-2 mt-5">
          <button class="btn btn-primary btn-sm" onclick="navigateTo('career')">${getIcon("compass", 14)} Get Career Guidance</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('assistant')">${getIcon("message-square", 14)} Ask AI Assistant</button>
        </div>
      </div>
    </div>`;

  resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getMetricColor(pct) {
  if (pct >= 80) return "var(--color-success)";
  if (pct >= 60) return "var(--color-warning)";
  return "var(--color-danger)";
}

function getMetricClass(pct) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "danger";
}
