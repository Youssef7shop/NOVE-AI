/* =====================================================
   NIVEAU AI
   Frontend MVP
   ===================================================== */


/* ================= NAVIGATION ================= */

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {

  item.addEventListener("click", () => {

    const page = item.dataset.page;

    if (!page) return;

    navItems.forEach(button => {
      button.classList.remove("active");
    });

    item.classList.add("active");

    pages.forEach(p => {
      p.classList.remove("active-page");
    });

    const selectedPage =
      document.getElementById(`${page}-page`);

    if (selectedPage) {
      selectedPage.classList.add("active-page");
    }

    const titles = {
      chat: "Niveau AI",
      image: "Image Studio",
      video: "Video Studio",
      code: "Code Studio",
      website: "Website Builder",
      projects: "Projects",
      planning: "Planning",
      upgrade: "Plans",
      settings: "Settings"
    };

    document.getElementById("pageTitle").textContent =
      titles[page] || "Niveau AI";

    closeSidebar();

  });

});


/* ================= SIDEBAR MOBILE ================= */

function toggleSidebar() {

  const sidebar =
    document.querySelector(".sidebar");

  sidebar.classList.toggle("open");

}

function closeSidebar() {

  const sidebar =
    document.querySelector(".sidebar");

  sidebar.classList.remove("open");

}


/* ================= CHAT ================= */

const chatForm =
  document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");

const messages =
  document.getElementById("messages");


chatForm.addEventListener("submit", function(event) {

  event.preventDefault();

  const message =
    messageInput.value.trim();

  if (!message) return;

  addMessage(message, "user");

  messageInput.value = "";

  setTimeout(() => {

    const response =
      generateDemoResponse(message);

    addMessage(response, "ai");

  }, 600);

});


function addMessage(text, type) {

  const div =
    document.createElement("div");

  div.className =
    `message ${type}`;

  div.textContent = text;

  messages.appendChild(div);

  messages.scrollTop =
    messages.scrollHeight;

}


function generateDemoResponse(message) {

  const lower =
    message.toLowerCase();

  if (lower.includes("website") ||
      lower.includes("site") ||
      lower.includes("موقع")) {

    return "Great! I can help you build that website. In the next version, this chat will be connected to the AI backend and will generate the actual project files.";

  }

  if (lower.includes("code") ||
      lower.includes("كود")) {

    return "I can help you write and debug code. The Code Studio is ready for the next backend integration.";

  }

  if (lower.includes("image") ||
      lower.includes("صورة")) {

    return "Image generation will be connected to an AI image provider in the next version.";

  }

  return "I'm Niveau AI. This is the frontend MVP. Next we'll connect me to Gemini so I can generate real AI responses.";

}


function useSuggestion(text) {

  messageInput.value = text;

  messageInput.focus();

}


function newChat() {

  messages.innerHTML = "";

  messageInput.value = "";

  addMessage(
    "New conversation started. How can I help?",
    "ai"
  );

}


/* ================= CODE PREVIEW ================= */

function runCode() {

  const code =
    document.getElementById("codeInput").value;

  const frame =
    document.getElementById("previewFrame");

  frame.srcdoc = code;

}


/* ================= WEBSITE BUILDER ================= */

function buildWebsite() {

  alert(
    "Website Builder demo ready. Next we'll connect it to the AI backend to generate real HTML, CSS and JavaScript."
  );

}


/* ================= IMAGE / VIDEO ================= */

function demoGenerate(type) {

  if (type === "image") {

    alert(
      "Image generation is currently a frontend demo. We will connect the AI API later."
    );

  }

  if (type === "video") {

    alert(
      "Video generation will be connected to a video AI provider later."
    );

  }

}


/* ================= PROFILE ================= */

function openProfile() {

  document
    .getElementById("profileModal")
    .classList.remove("hidden");

}


function closeProfile() {

  document
    .getElementById("profileModal")
    .classList.add("hidden");

}


/* ================= THEME ================= */

const themeSelect =
  document.getElementById("themeSelect");

themeSelect.addEventListener(
  "change",
  function() {

    if (this.value === "light") {

      document.documentElement.style.setProperty(
        "--bg",
        "#f5f6f8"
      );

      document.documentElement.style.setProperty(
        "--sidebar",
        "#ffffff"
      );

      document.documentElement.style.setProperty(
        "--card",
        "#ffffff"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#15161a"
      );

      document.documentElement.style.setProperty(
        "--muted",
        "#666b78"
      );

    } else {

      document.documentElement.style.setProperty(
        "--bg",
        "#090a0f"
      );

      document.documentElement.style.setProperty(
        "--sidebar",
        "#0d0e13"
      );

      document.documentElement.style.setProperty(
        "--card",
        "#12141b"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#f4f5f7"
      );

      document.documentElement.style.setProperty(
        "--muted",
        "#9499a8"
      );

    }

  }
);


/* ================= STARTUP ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    addMessage(
      "Welcome to Niveau AI. What would you like to create?",
      "ai"
    );

  }
);
