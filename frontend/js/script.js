const BASE_URL = "http://127.0.0.1:5000/api";

/* ---------------- SIGNUP ---------------- */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Signup successful! Please log in.");
        window.location.href = "login.html";
      } else {
        alert(data.error || "Signup failed. Try again!");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Something went wrong. Try again!");
    }
  });
}

/* ---------------- LOGIN ---------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        alert("✅ Login successful!");
        window.location.href = "dashboard.html";
      } else {
        alert(data.error || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Something went wrong. Try again!");
    }
  });
}

/* ---------------- DASHBOARD ACCESS CHECK ---------------- */
if (window.location.pathname.includes("dashboard.html")) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Please login first!");
    window.location.href = "login.html";
  }
}

/* ---------------- AUTO REDIRECT (if already logged in) ---------------- */
if (
  window.location.pathname.includes("login.html") ||
  window.location.pathname.includes("signup.html")
) {
  const token = localStorage.getItem("token");
  if (token) window.location.href = "dashboard.html";
}

/* ---------------- LOGOUT ---------------- */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    alert("👋 Logged out successfully!");
    window.location.href = "login.html";
  });
}

/* ---------------- RESUME ANALYSIS ---------------- */
const resumeForm = document.getElementById("resumeForm");
if (resumeForm) {
  resumeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("resumeFile");
    const location = document.getElementById("location").value;

    if (!fileInput.files.length) {
      alert("Please upload a resume file!");
      return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("location", location);

    try {
      const res = await fetch(`${BASE_URL}/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      displayResults(data);
    } catch (error) {
      console.error("Resume Analysis Error:", error);
      alert("Something went wrong during resume analysis!");
    }
  });
}

/* ---------------- DISPLAY RESULTS ---------------- */
function displayResults(data) {
  // Show results section if hidden
  const resultsSection = document.getElementById("results");
  if (resultsSection) resultsSection.style.display = "block";

  /*
  // Update skills
  const skillsEl = document.getElementById("skillsList");
  if (skillsEl)
    skillsEl.innerHTML =
      data.skills?.map((s) => `<li>${s}</li>`).join("") ||
      "<li>No skills found</li>";

  */

  // Update feedback
  const feedbackEl = document.getElementById("feedbackList");
  if (feedbackEl)
    feedbackEl.innerHTML =
      data.feedback?.map((f) => `<li>${f}</li>`).join("") ||
      "<li>No feedback available</li>";

  // Update job recommendations
  const jobEl = document.getElementById("jobResults");
  if (jobEl) {
    jobEl.innerHTML = "<h3>Recommended Jobs:</h3>";
    if (data.jobs && data.jobs.length > 0) {
      data.jobs.forEach((j) => {
        const div = document.createElement("div");
        div.className = "job-card";
        div.innerHTML = `
          <h3>${j.title}</h3>
          <p><strong>${j.company}</strong> - ${j.location}</p>
          <p>${j.description}</p>
          <a href="${j.url}" target="_blank" class="apply-btn">Apply Now</a>
        `;
        jobEl.appendChild(div);
      });
    } else {
      jobEl.innerHTML += "<p>No job recommendations found.</p>";
    }
  }

  // Save last analysis so the career chatbot can be grounded in it
  localStorage.setItem(
    "lastResumeContext",
    JSON.stringify({
      skills: data.skills || [],
      experience_level: data.experience_level || "",
      feedback: data.feedback || [],
    })
  );
}

/* ---------------- ATS SCORE ---------------- */
const atsForm = document.getElementById("atsForm");
if (atsForm) {
  atsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("atsResumeFile");
    const jobDescription = document.getElementById("jobDescription").value.trim();

    if (!fileInput.files.length) {
      alert("Please upload a resume file!");
      return;
    }
    if (!jobDescription) {
      alert("Please paste a job description!");
      return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("job_description", jobDescription);

    try {
      const res = await fetch(`${BASE_URL}/resume/ats-score`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not compute ATS score.");
        return;
      }

      displayAtsResults(data);
    } catch (error) {
      console.error("ATS Score Error:", error);
      alert("Something went wrong while checking the ATS score!");
    }
  });
}

function displayAtsResults(data) {
  const resultsEl = document.getElementById("atsResults");
  if (resultsEl) resultsEl.style.display = "block";

  const scoreEl = document.getElementById("atsScoreValue");
  if (scoreEl) scoreEl.textContent = `${data.overall_score}%`;

  const matchedEl = document.getElementById("matchedKeywords");
  if (matchedEl) {
    matchedEl.innerHTML =
      data.matched_keywords?.length
        ? data.matched_keywords.map((k) => `<span class="keyword-pill matched">${k}</span>`).join("")
        : "<p style='color:#cbd5e1;'>None matched.</p>";
  }

  const missingEl = document.getElementById("missingKeywords");
  if (missingEl) {
    missingEl.innerHTML =
      data.missing_keywords?.length
        ? data.missing_keywords.map((k) => `<span class="keyword-pill missing">${k}</span>`).join("")
        : "<p style='color:#cbd5e1;'>None missing 🎉</p>";
  }

  const issuesEl = document.getElementById("formattingIssues");
  if (issuesEl) {
    issuesEl.innerHTML =
      data.formatting_issues?.length
        ? data.formatting_issues.map((i) => `<p class="issue-item">⚠ ${i}</p>`).join("")
        : "<p style='color:#86efac;'>No formatting issues detected ✅</p>";
  }
}

/* ---------------- CHATBOTS ---------------- */
let activeChatTab = "general";

function switchChatTab(tab) {
  activeChatTab = tab;

  const tabGeneral = document.getElementById("tabGeneral");
  const tabCareer = document.getElementById("tabCareer");
  const targetRoleRow = document.getElementById("targetRoleRow");
  const chatWindow = document.getElementById("chatWindow");

  if (tabGeneral && tabCareer) {
    tabGeneral.classList.toggle("active", tab === "general");
    tabCareer.classList.toggle("active", tab === "career");
  }
  if (targetRoleRow) targetRoleRow.style.display = tab === "career" ? "block" : "none";
  if (chatWindow) chatWindow.innerHTML = "";
}

function appendChatBubble(role, text) {
  const chatWindow = document.getElementById("chatWindow");
  if (!chatWindow) return;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role === "user" ? "user" : "bot"}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

const chatSendBtn = document.getElementById("chatSendBtn");
const chatInput = document.getElementById("chatInput");

async function sendChatMessage() {
  if (!chatInput) return;
  const message = chatInput.value.trim();
  if (!message) return;

  appendChatBubble("user", message);
  chatInput.value = "";

  const token = localStorage.getItem("token");
  if (!token) {
    appendChatBubble("bot", "Please log in again to use the chat.");
    return;
  }

  const endpoint = activeChatTab === "career" ? "/chat/career" : "/chat/general";
  const body = { message };

  if (activeChatTab === "career") {
    const targetRoleEl = document.getElementById("targetRole");
    body.target_role = targetRoleEl ? targetRoleEl.value.trim() : "";

    const savedContext = localStorage.getItem("lastResumeContext");
    body.resume_context = savedContext ? JSON.parse(savedContext) : {};
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      appendChatBubble("bot", data.error || "Something went wrong.");
      return;
    }

    appendChatBubble("bot", data.reply);
  } catch (error) {
    console.error("Chat Error:", error);
    appendChatBubble("bot", "Something went wrong reaching the chatbot.");
  }
}

if (chatSendBtn) {
  chatSendBtn.addEventListener("click", sendChatMessage);
}
if (chatInput) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendChatMessage();
    }
  });
}
