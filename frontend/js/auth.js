/* ============================================================
   auth.js — Login & Signup form logic
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* Auto-redirect if already logged in */
  redirectIfLoggedIn();

  /* ── Login ──────────────────────────────────────────── */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const loginBtn = document.getElementById("loginBtn");
    const loginError = document.getElementById("loginError");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        showAuthError(loginError, "Please fill in all fields.");
        return;
      }

      loginBtn.classList.add("loading");
      loginBtn.disabled = true;

      try {
        const { ok, data } = await apiLogin(email, password);
        if (ok && data.token) {
          localStorage.setItem("token", data.token);
          // Store name from signup if available, else derive from email
          if (!localStorage.getItem("userName")) {
            localStorage.setItem("userName", email.split("@")[0]);
          }
          window.location.href = "dashboard.html";
        } else {
          showAuthError(loginError, data.error || "Invalid email or password.");
        }
      } catch (err) {
        showAuthError(loginError, "Could not reach the server. Make sure the backend is running.");
      } finally {
        loginBtn.classList.remove("loading");
        loginBtn.disabled = false;
      }
    });

    /* Toggle password visibility */
    setupPasswordToggle("loginPassword", "toggleLoginPwd");
  }

  /* ── Signup ─────────────────────────────────────────── */
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    const signupBtn = document.getElementById("signupBtn");
    const signupError = document.getElementById("signupError");

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const confirm = document.getElementById("signupConfirm").value;

      if (!name || !email || !password || !confirm) {
        showAuthError(signupError, "Please fill in all fields.");
        return;
      }
      if (password.length < 6) {
        showAuthError(signupError, "Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        showAuthError(signupError, "Passwords do not match.");
        return;
      }

      signupBtn.classList.add("loading");
      signupBtn.disabled = true;

      try {
        const { ok, data } = await apiSignup(name, email, password);
        if (ok) {
          // Store name for display after login
          localStorage.setItem("userName", name);
          showAuthSuccess(signupError, "Account created! Redirecting to login...");
          setTimeout(() => { window.location.href = "login.html"; }, 1200);
        } else {
          showAuthError(signupError, data.error || "Signup failed. Please try again.");
        }
      } catch (err) {
        showAuthError(signupError, "Could not reach the server. Make sure the backend is running.");
      } finally {
        signupBtn.classList.remove("loading");
        signupBtn.disabled = false;
      }
    });

    setupPasswordToggle("signupPassword", "toggleSignupPwd");
    setupPasswordToggle("signupConfirm", "toggleSignupConfirm");

    /* Password strength meter */
    const pwdInput = document.getElementById("signupPassword");
    if (pwdInput) {
      pwdInput.addEventListener("input", () => {
        updatePasswordStrength(pwdInput.value);
      });
    }
  }
});

function showAuthError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.className = "auth-msg auth-msg-error";
  el.style.display = "flex";
}

function showAuthSuccess(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.className = "auth-msg auth-msg-success";
  el.style.display = "flex";
}

function setupPasswordToggle(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;

  btn.addEventListener("click", () => {
    const shown = input.type === "text";
    input.type = shown ? "password" : "text";
    btn.innerHTML = shown
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  });
}

function updatePasswordStrength(pwd) {
  const meter = document.getElementById("pwdStrengthBar");
  const label = document.getElementById("pwdStrengthLabel");
  if (!meter || !label) return;

  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: "", color: "", width: "0%" },
    { label: "Weak", color: "var(--color-danger)", width: "20%" },
    { label: "Fair", color: "var(--color-warning)", width: "40%" },
    { label: "Good", color: "var(--color-warning)", width: "60%" },
    { label: "Strong", color: "var(--color-success)", width: "80%" },
    { label: "Very Strong", color: "var(--color-success)", width: "100%" },
  ];

  const lvl = levels[Math.min(score, 5)];
  meter.style.width = lvl.width;
  meter.style.background = lvl.color;
  label.textContent = lvl.label;
  label.style.color = lvl.color;
}
