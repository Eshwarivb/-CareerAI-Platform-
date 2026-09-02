/* ============================================================
   api.js — Centralized API Client
   All fetch calls go through this file. ONE place to change
   the base URL if the backend moves.
   ============================================================ */

const BASE_URL = "http://127.0.0.1:5000/api";

/* ── Token helpers ─────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/* ── Generic helpers ───────────────────────────────────────── */
async function apiPost(path, body, useAuth = false) {
  const headers = useAuth ? authHeaders() : { "Content-Type": "application/json" };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function apiPostForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/* ── Auth endpoints ────────────────────────────────────────── */
async function apiSignup(name, email, password) {
  return apiPost("/auth/signup", { name, email, password });
}

async function apiLogin(email, password) {
  return apiPost("/auth/login", { email, password });
}

/* ── Resume endpoints ──────────────────────────────────────── */
async function apiAnalyzeResume(file, location = "") {
  const fd = new FormData();
  fd.append("resume", file);
  fd.append("location", location);
  return apiPostForm("/resume/analyze", fd);
}

async function apiAtsScore(file, jobDescription) {
  const fd = new FormData();
  fd.append("resume", file);
  fd.append("job_description", jobDescription);
  return apiPostForm("/resume/ats-score", fd);
}

/* ── Chat endpoints ────────────────────────────────────────── */
async function apiChatGeneral(message) {
  return apiPost("/chat/general", { message }, true);
}

async function apiChatCareer(message, target_role, resume_context) {
  return apiPost("/chat/career", { message, target_role, resume_context }, true);
}

/* ── JWT decode (client-side, no verification) ─────────────── */
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getUserEmail() {
  const payload = decodeToken(getToken());
  return payload?.sub || payload?.email || payload?.identity || "";
}

function getUserName() {
  return localStorage.getItem("userName") || getUserEmail().split("@")[0] || "User";
}

/* ── Auth guard ─────────────────────────────────────────────── */
function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  if (getToken()) {
    window.location.href = "dashboard.html";
  }
}
