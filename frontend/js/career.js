/* ============================================================
   career.js — Career Guidance (resume-specific analysis)
   Uses /api/resume/analyze + /api/chat/career
   ============================================================ */

window.init_career = function () {
  renderCareerPage();
};

let careerConversation = [];
let careerResumeContext = null;

function renderCareerPage() {
  populateResumeSelector();
  setupCareerUploadZone();
  setupCareerChat();
}

function populateResumeSelector() {
  const select = document.getElementById("careerResumeSelect");
  if (!select) return;

  const resumes = getStoredResumes();
  select.innerHTML = `<option value="">-- Select a previously analyzed resume --</option>`;

  resumes.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} (${formatDate(r.uploaded_at)})`;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const id = select.value;
    if (!id) { careerResumeContext = null; return; }
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      careerResumeContext = {
        skills: resume.skills || [],
        experience_level: resume.experience_level || "Unknown",
        feedback: resume.feedback || [],
      };
      showToast(`Resume "${resume.name}" selected for guidance.`, "success");
      renderCareerContext(resume);
    }
  });
}

function renderCareerContext(resume) {
  const el = document.getElementById("careerContextPreview");
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `
    <div class="card" style="border-color:var(--color-primary);background:var(--color-primary-light)">
      <div class="flex items-center gap-3 mb-3">
        <span style="color:var(--color-primary)">${getIcon("file-text", 20)}</span>
        <div>
          <div class="font-600">${escHtml(resume.name)}</div>
          <div class="text-xs text-muted">${escHtml(resume.experience_level)} • ${(resume.skills || []).length} skills</div>
        </div>
        <span class="badge badge-primary" style="margin-left:auto">Selected</span>
      </div>
      <div class="pill-wrap">
        ${(resume.skills || []).slice(0, 8).map(s => `<span class="pill pill-skill">${escHtml(s)}</span>`).join("")}
        ${(resume.skills || []).length > 8 ? `<span class="text-xs text-muted">+${resume.skills.length - 8} more</span>` : ""}
      </div>
    </div>`;
}

function setupCareerUploadZone() {
  const zone = document.getElementById("careerUploadZone");
  const fileInput = document.getElementById("careerFileInput");
  const analyzeBtn = document.getElementById("careerAnalyzeNewBtn");
  let newFile = null;

  if (!zone || !fileInput) return;
  if (zone.dataset.bound) return;
  zone.dataset.bound = "1";

  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragging"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragging");
    if (e.dataTransfer.files[0]) setCareerFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) setCareerFile(fileInput.files[0]);
  });

  function setCareerFile(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (![".pdf", ".doc", ".docx"].includes(ext)) {
      showToast("Only PDF and DOCX are supported.", "error");
      return;
    }
    newFile = file;
    zone.querySelector(".upload-text").textContent = file.name;
    zone.querySelector(".upload-hint").textContent = `${(file.size / 1024).toFixed(0)} KB selected`;
    if (analyzeBtn) analyzeBtn.disabled = false;
  }

  analyzeBtn?.addEventListener("click", async () => {
    if (!newFile) return;
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("loading");
    try {
      const { ok, data } = await apiAnalyzeResume(newFile, "");
      if (!ok || data.error) { showToast(data.error || "Analysis failed.", "error"); return; }

      careerResumeContext = {
        skills: data.skills || [],
        experience_level: data.experience_level || "Unknown",
        feedback: data.feedback || [],
      };

      // Store it
      const resumes = getStoredResumes();
      const rec = {
        id: Date.now().toString(), name: newFile.name,
        skills: data.skills || [], experience_level: data.experience_level || "Unknown",
        feedback: data.feedback || [], jobs: data.jobs || [],
        uploaded_at: new Date().toISOString(), analyzed_at: new Date().toISOString(),
        ats_score: null,
      };
      resumes.push(rec);
      localStorage.setItem("storedResumes", JSON.stringify(resumes));

      renderCareerContext(rec);
      showToast(`Resume analyzed. Found ${(data.skills || []).length} skills.`, "success");
    } catch {
      showToast("Server error. Is the backend running?", "error");
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("loading");
    }
  });
}

function setupCareerChat() {
  const sendBtn = document.getElementById("careerSendBtn");
  const input = document.getElementById("careerChatInput");

  if (!sendBtn || !input) return;
  if (sendBtn.dataset.bound) return;
  sendBtn.dataset.bound = "1";

  sendBtn.addEventListener("click", sendCareerMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCareerMessage(); }
  });

  // Suggestion chips
  document.querySelectorAll(".career-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.msg;
      input.focus();
    });
  });
}

async function sendCareerMessage() {
  const input = document.getElementById("careerChatInput");
  const targetRoleInput = document.getElementById("careerTargetRole");
  const msg = input?.value.trim();
  if (!msg) return;

  if (!careerResumeContext) {
    showToast("Please select a resume or upload one before starting career guidance.", "warning");
    return;
  }

  const targetRole = targetRoleInput?.value.trim() || "not specified";

  appendCareerBubble("user", msg);
  input.value = "";

  const typingId = appendCareerTyping();

  try {
    const { ok, data } = await apiChatCareer(msg, targetRole, careerResumeContext);
    removeTyping(typingId);
    if (ok && data.reply) {
      appendCareerBubble("bot", data.reply);
    } else {
      appendCareerBubble("bot", data.error || "Something went wrong. Please try again.");
    }
  } catch {
    removeTyping(typingId);
    appendCareerBubble("bot", "Could not reach the AI service. Please check your backend and API keys.");
  }
}

function appendCareerBubble(role, text) {
  const window_ = document.getElementById("careerChatMessages");
  if (!window_) return;

  const wrap = document.createElement("div");
  wrap.className = `chat-bubble-wrap ${role}`;
  wrap.innerHTML = `
    <div class="chat-avatar ${role === "bot" ? "bot-avatar" : ""}">
      ${role === "bot" ? getIcon("compass", 14) : getUserName().charAt(0).toUpperCase()}
    </div>
    <div class="chat-bubble ${role}">${escHtml(text)}</div>`;
  window_.appendChild(wrap);
  window_.scrollTop = window_.scrollHeight;
}

function appendCareerTyping() {
  const window_ = document.getElementById("careerChatMessages");
  if (!window_) return null;
  const id = "typing-" + Date.now();
  const wrap = document.createElement("div");
  wrap.className = "chat-bubble-wrap bot";
  wrap.id = id;
  wrap.innerHTML = `
    <div class="chat-avatar bot-avatar">${getIcon("compass", 14)}</div>
    <div class="chat-bubble bot typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  window_.appendChild(wrap);
  window_.scrollTop = window_.scrollHeight;
  return id;
}

function removeTyping(id) {
  if (id) document.getElementById(id)?.remove();
}

window.clearCareerChat = function () {
  const win = document.getElementById("careerChatMessages");
  if (win) win.innerHTML = `
    <div class="chat-bubble-wrap bot">
      <div class="chat-avatar bot-avatar">${getIcon("compass", 14)}</div>
      <div class="chat-bubble bot">Hello! I am your career guidance coach. Select a resume above and tell me the target role you are aiming for. I will give you personalized career advice based on your actual skills.</div>
    </div>`;
};
