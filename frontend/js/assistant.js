/* ============================================================
   assistant.js — General AI Assistant Chatbot
   Uses /api/chat/general (Bearer token auth)
   ============================================================ */

window.init_assistant = function () {
  setupAssistant();
};

function setupAssistant() {
  const sendBtn = document.getElementById("assistantSendBtn");
  const input   = document.getElementById("assistantInput");

  if (!sendBtn || !input) return;
  if (sendBtn.dataset.bound) return;
  sendBtn.dataset.bound = "1";

  sendBtn.addEventListener("click", sendAssistantMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAssistantMessage(); }
  });

  // Suggested question chips
  document.querySelectorAll(".assistant-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.msg;
      input.focus();
    });
  });
}

async function sendAssistantMessage() {
  const input = document.getElementById("assistantInput");
  const msg = input?.value.trim();
  if (!msg) return;

  appendAssistantBubble("user", msg);
  input.value = "";
  autoResizeTextarea(input);

  const typingId = appendAssistantTyping();

  try {
    const { ok, data } = await apiChatGeneral(msg);
    removeAssistantTyping(typingId);

    if (ok && data.reply) {
      appendAssistantBubble("bot", data.reply);
    } else if (data.error?.includes("Unauthorized")) {
      appendAssistantBubble("bot", "Your session has expired. Please log in again.");
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
    } else {
      appendAssistantBubble("bot", data.error || "Something went wrong. Please try again.");
    }
  } catch {
    removeAssistantTyping(typingId);
    appendAssistantBubble("bot", "Could not reach the AI service. Please check your backend configuration and API keys.");
  }
}

function appendAssistantBubble(role, text) {
  const win = document.getElementById("assistantMessages");
  if (!win) return;

  const wrap = document.createElement("div");
  wrap.className = `chat-bubble-wrap ${role} fade-in`;
  const name = getUserName();
  wrap.innerHTML = `
    <div class="chat-avatar ${role === "bot" ? "bot-avatar" : ""}">
      ${role === "bot" ? getIcon("cpu", 14) : name.charAt(0).toUpperCase()}
    </div>
    <div class="chat-bubble ${role}">${formatChatText(text)}</div>`;
  win.appendChild(wrap);
  win.scrollTop = win.scrollHeight;
}

function appendAssistantTyping() {
  const win = document.getElementById("assistantMessages");
  if (!win) return null;
  const id = "at-" + Date.now();
  const wrap = document.createElement("div");
  wrap.className = "chat-bubble-wrap bot";
  wrap.id = id;
  wrap.innerHTML = `
    <div class="chat-avatar bot-avatar">${getIcon("cpu", 14)}</div>
    <div class="chat-bubble bot typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  win.appendChild(wrap);
  win.scrollTop = win.scrollHeight;
  return id;
}

function removeAssistantTyping(id) {
  if (id) document.getElementById(id)?.remove();
}

function formatChatText(text) {
  // Convert basic markdown to HTML
  return escHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul style='margin:8px 0 8px 16px'>$1</ul>")
    .replace(/\n/g, "<br>");
}

function autoResizeTextarea(ta) {
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
}

window.clearAssistantChat = function () {
  const win = document.getElementById("assistantMessages");
  if (win) win.innerHTML = `
    <div class="chat-bubble-wrap bot">
      <div class="chat-avatar bot-avatar">${getIcon("cpu", 14)}</div>
      <div class="chat-bubble bot">Hello! I am your AI career assistant. I can help with resume tips, interview preparation, career advice, job search strategies, and more. What would you like to know?</div>
    </div>`;
};
