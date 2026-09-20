/* =========================================================
   NIVEAU AI — COMPLETE APP.JS
========================================================= */

const API_URL = "http://localhost:3000";

const FREE_LIMIT = 20;

let currentUser = null;
let currentConversationId = null;
let usageCount = 0;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   DOM ELEMENTS
========================================================= */

const sidebar = $("#sidebar");
const mobileMenuBtn = $("#mobileMenuBtn");

const profileButton = $("#profileButton");
const profileMenu = $("#profileMenu");

const settingsBtn = $("#settingsBtn");
const settingsModal = $("#settingsModal");
const closeSettings = $("#closeSettings");

const themeBtn = $("#themeBtn");
const settingsThemeBtn = $("#settingsThemeBtn");

const logoutBtn = $("#logoutBtn");

const newChatBtn = $("#newChatBtn");

const chatForm = $("#chatForm");
const messageInput = $("#messageInput");
const messages = $("#messages");

const chatSearch = $("#chatSearch");

const searchBtn = $("#searchBtn");

const attachBtn = $("#attachBtn");
const imageToolBtn = $("#imageToolBtn");
const codeToolBtn = $("#codeToolBtn");

const upgradeBtn = $("#upgradeBtn");

const newProjectBtn = $("#newProjectBtn");

const connectionStatus = $("#connectionStatus");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializeNiveau);


async function initializeNiveau() {

    console.log("Niveau AI starting...");

    loadSavedTheme();

    setupNavigation();

    setupProfileMenu();

    setupSettings();

    setupTheme();

    setupMobileMenu();

    setupChat();

    setupQuickTools();

    setupSearch();

    setupTools();

    setupProjects();

    setupUpgrade();

    setupCodeEditor();

    setupKeyboardShortcuts();

    setupConnectionStatus();

    await initializeUser();

    console.log("Niveau AI ready.");
}


/* =========================================================
   USER / AUTH
========================================================= */

async function initializeUser() {

    try {

        if (typeof protectPage === "function") {

            const user = await protectPage();

            if (!user) return;

            currentUser = user;

        } else {

            console.warn(
                "protectPage() was not found in auth.js"
            );

            return;

        }

        updateUserInterface();

        await loadConversations();

        await loadProjects();

        await loadUsage();

    } catch (error) {

        console.error(
            "User initialization error:",
            error
        );

    }
}


/* =========================================================
   USER UI
========================================================= */

function updateUserInterface() {

    if (!currentUser) return;

    let profile = null;

    if (typeof getUserProfile === "function") {

        profile =
            getUserProfile(currentUser);

    }

    if (!profile) {

        const metadata =
            currentUser.user_metadata || {};

        profile = {

            name:
                metadata.full_name ||
                metadata.name ||
                currentUser.email?.split("@")[0] ||
                "User",

            email:
                currentUser.email ||
                "",

            avatar:
                metadata.avatar_url ||
                metadata.picture ||
                null

        };

    }


    const name =
        profile.name || "User";

    const email =
        profile.email ||
        currentUser.email ||
        "";

    const avatar =
        profile.avatar || null;


    setText(
        "#userName",
        name
    );

    setText(
        "#userEmail",
        email
    );

    setText(
        "#menuUserName",
        name
    );

    setText(
        "#menuUserEmail",
        email
    );

    setText(
        "#settingsName",
        name
    );

    setText(
        "#settingsEmail",
        email
    );


    setAvatar(
        "#userAvatar",
        avatar,
        name
    );

    setAvatar(
        "#topbarAvatar",
        avatar,
        name
    );

    setAvatar(
        "#menuAvatar",
        avatar,
        name
    );

    setAvatar(
        "#settingsAvatar",
        avatar,
        name
    );

}


function setText(selector, value) {

    const element = $(selector);

    if (element) {
        element.textContent = value;
    }

}


function setAvatar(
    selector,
    avatar,
    name
) {

    const element = $(selector);

    if (!element) return;


    const letter =
        (name || "U")
            .trim()
            .charAt(0)
            .toUpperCase();


    if (avatar) {

        element.innerHTML = "";

        const img =
            document.createElement("img");

        img.src = avatar;

        img.alt = name || "User";

        img.referrerPolicy =
            "no-referrer";

        img.onerror = () => {

            element.innerHTML = letter;

        };

        element.appendChild(img);

    } else {

        element.innerHTML = letter;

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    $$(".nav-item").forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;

                if (!page) return;

                navigateTo(page);

            }
        );

    });

}


function navigateTo(page) {

    $$(".nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === page
        );

    });


    $$(".page").forEach(section => {

        section.classList.remove("active");

    });


    const target =
        $(`#page-${page}`);

    if (target) {

        target.classList.add("active");

    }


    const titles = {

        chat: "Chat",
        projects: "Projects",
        images: "Images",
        video: "Video",
        coding: "AI Coding",
        website: "Website Builder",
        pdf: "PDF",
        documents: "Documents",
        publishing: "Publishing",
        planning: "Planning"

    };


    setText(
        "#pageTitle",
        titles[page] || "Niveau AI"
    );


    closeProfileMenu();

    closeSidebarMobile();

}


/* =========================================================
   NEW CHAT
========================================================= */

function setupChat() {

    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            createNewChat
        );

    }


    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const text =
                    messageInput.value.trim();

                if (!text) return;

                await sendMessage(text);

            }
        );

    }


    if (messageInput) {

        messageInput.addEventListener(
            "input",
            autoResizeTextarea
        );


        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    chatForm?.requestSubmit();

                }

            }
        );

    }

}


function createNewChat() {

    currentConversationId = null;

    if (messages) {

        messages.innerHTML = "";

    }


    const welcome =
        $(".chat-welcome");

    if (welcome) {

        welcome.style.display = "";

    }


    navigateTo("chat");

    messageInput?.focus();

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(text) {

    if (!currentUser) {

        window.location.href =
            "login.html";

        return;

    }


    if (usageCount >= FREE_LIMIT) {

        showSystemMessage(
            "You have reached your Free plan limit. Upgrade your plan to continue."
        );

        return;

    }


    const welcome =
        $(".chat-welcome");

    if (welcome) {

        welcome.style.display = "none";

    }


    addMessage(
        "user",
        text
    );


    messageInput.value = "";

    autoResizeTextarea();


    const loadingId =
        addMessage(
            "assistant",
            "Thinking..."
        );


    try {

        const sessionData =
            await getSession();


        if (!sessionData) {

            throw new Error(
                "Your session has expired. Please log in again."
            );

        }


        const response =
            await fetch(
                `${API_URL}/api/chat`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${sessionData.access_token}`

                    },

                    body: JSON.stringify({

                        conversationId:
                            currentConversationId,

                        message:
                            text

                    })

                }
            );


        if (!response.ok) {

            let errorMessage =
                "Unable to contact AI server.";

            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.error ||
                    errorData.message ||
                    errorMessage;

            } catch {}

            throw new Error(
                errorMessage
            );

        }


        const data =
            await response.json();


        if (data.conversationId) {

            currentConversationId =
                data.conversationId;

        }


        removeMessage(loadingId);


        const assistantText =
            data.message ||
            data.reply ||
            data.content ||
            "I received your message.";


        addMessage(
            "assistant",
            assistantText
        );


        usageCount++;

        updateUsageUI();

        await loadConversations();

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        removeMessage(loadingId);


        addMessage(
            "assistant",
            `⚠️ ${error.message}`
        );

    }

}


/* =========================================================
   MESSAGE UI
========================================================= */

function addMessage(
    role,
    content
) {

    if (!messages) return null;


    const message =
        document.createElement("div");

    const id =
        `message-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;


    message.id = id;

    message.className =
        `message ${role}`;


    const contentBox =
        document.createElement("div");

    contentBox.className =
        "message-content";


    contentBox.textContent =
        content;


    message.appendChild(
        contentBox
    );


    messages.appendChild(
        message
    );


    messages.scrollTop =
        messages.scrollHeight;


    return id;

}


function removeMessage(id) {

    if (!id) return;

    const element =
        document.getElementById(id);

    if (element) {

        element.remove();

    }

}


function showSystemMessage(text) {

    addMessage(
        "assistant",
        text
    );

}


/* =========================================================
   AUTO RESIZE
========================================================= */

function autoResizeTextarea() {

    if (!messageInput) return;

    messageInput.style.height =
        "auto";

    messageInput.style.height =
        `${Math.min(
            messageInput.scrollHeight,
            170
        )}px`;

}


/* =========================================================
   QUICK TOOLS
========================================================= */

function setupQuickTools() {

    $$(".quick-tool").forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const prompt =
                    button.dataset.prompt;

                if (!prompt) return;

                navigateTo("chat");

                messageInput.value =
                    prompt;

                autoResizeTextarea();

                messageInput.focus();

            }
        );

    });

}


/* =========================================================
   PROFILE MENU
========================================================= */

function setupProfileMenu() {

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleProfileMenu();

            }
        );

    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                if (
                    typeof logoutUser ===
                    "function"
                ) {

                    await logoutUser();

                } else {

                    window.location.href =
                        "login.html";

                }

            }
        );

    }


    const profileMenuItem =
        $("#profileMenuItem");


    if (profileMenuItem) {

        profileMenuItem.addEventListener(
            "click",
            () => {

                closeProfileMenu();

                openSettings();

            }
        );

    }


    const settingsMenuItem =
        $("#settingsMenuItem");


    if (settingsMenuItem) {

        settingsMenuItem.addEventListener(
            "click",
            () => {

                closeProfileMenu();

                openSettings();

            }
        );

    }


    const billingMenuItem =
        $("#billingMenuItem");


    if (billingMenuItem) {

        billingMenuItem.addEventListener(
            "click",
            () => {

                closeProfileMenu();

                showUpgradeModal();

            }
        );

    }


    document.addEventListener(
        "click",
        event => {

            if (
                profileMenu &&
                !profileMenu.contains(event.target) &&
                !profileButton?.contains(event.target)
            ) {

                closeProfileMenu();

            }

        }
    );

}


function toggleProfileMenu() {

    if (!profileMenu) return;

    profileMenu.classList.toggle(
        "show"
    );

}


function closeProfileMenu() {

    profileMenu?.classList.remove(
        "show"
    );

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    if (settingsBtn) {

        settingsBtn.addEventListener(
            "click",
            openSettings
        );

    }


    if (closeSettings) {

        closeSettings.addEventListener(
            "click",
            closeSettingsModal
        );

    }


    if (settingsModal) {

        settingsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    settingsModal
                ) {

                    closeSettingsModal();

                }

            }
        );

    }

}


function openSettings() {

    updateUserInterface();

    if (settingsModal) {

        settingsModal.classList.add(
            "show"
        );

    }

}


function closeSettingsModal() {

    settingsModal?.classList.remove(
        "show"
    );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    themeBtn?.addEventListener(
        "click",
        toggleTheme
    );


    settingsThemeBtn?.addEventListener(
        "click",
        toggleTheme
    );

}


function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );


    const isLight =
        document.body.classList.contains(
            "light"
        );


    localStorage.setItem(
        "niveau-theme",
        isLight
            ? "light"
            : "dark"
    );

}


function loadSavedTheme() {

    const theme =
        localStorage.getItem(
            "niveau-theme"
        );


    if (theme === "light") {

        document.body.classList.add(
            "light"
        );

    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    mobileMenuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );

        }
    );

}


function closeSidebarMobile() {

    sidebar?.classList.remove(
        "open"
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    if (!chatSearch) return;


    chatSearch.addEventListener(
        "input",
        event => {

            const query =
                event.target.value
                    .trim()
                    .toLowerCase();


            $$(".conversation-item")
                .forEach(item => {

                    const text =
                        item.textContent
                            .toLowerCase();


                    item.style.display =
                        !query ||
                        text.includes(query)
                            ? ""
                            : "none";

                });

        }
    );


    searchBtn?.addEventListener(
        "click",
        () => {

            chatSearch.focus();

            chatSearch.select();

        }
    );

}


/* =========================================================
   ATTACH / IMAGE / CODE TOOLS
========================================================= */

function setupTools() {

    attachBtn?.addEventListener(
        "click",
        () => {

            openFilePicker();

        }
    );


    imageToolBtn?.addEventListener(
        "click",
        () => {

            navigateTo("images");

        }
    );


    codeToolBtn?.addEventListener(
        "click",
        () => {

            navigateTo("coding");

        }
    );

}


function openFilePicker() {

    const input =
        document.createElement("input");

    input.type = "file";

    input.multiple = true;

    input.accept =
        ".pdf,.txt,.doc,.docx,.csv,.png,.jpg,.jpeg,.webp";


    input.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );


            if (!files.length) return;


            const names =
                files
                    .map(file => file.name)
                    .join(", ");


            showSystemMessage(
                `Selected files: ${names}`
            );

        }
    );


    input.click();

}


/* =========================================================
   PROJECTS
========================================================= */

function setupProjects() {

    newProjectBtn?.addEventListener(
        "click",
        createProject
    );

}


async function createProject() {

    const name =
        window.prompt(
            "Project name:"
        );


    if (!name?.trim()) return;


    const description =
        window.prompt(
            "Project description:"
        ) || "";


    try {

        const session =
            await getSession();


        if (!session) {

            throw new Error(
                "Please log in first."
            );

        }


        const response =
            await fetch(
                `${API_URL}/api/projects`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body: JSON.stringify({

                        name:
                            name.trim(),

                        description:
                            description.trim()

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Project server is not available yet."
            );

        }


        await loadProjects();


    } catch (error) {

        console.error(
            "Create project:",
            error
        );


        createLocalProject(
            name.trim(),
            description.trim()
        );

    }

}


function createLocalProject(
    name,
    description
) {

    const projects =
        JSON.parse(
            localStorage.getItem(
                "niveau-projects"
            ) || "[]"
        );


    const project = {

        id:
            crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),

        name,

        description,

        createdAt:
            new Date().toISOString()

    };


    projects.unshift(
        project
    );


    localStorage.setItem(
        "niveau-projects",
        JSON.stringify(projects)
    );


    renderProjects(
        projects
    );


    navigateTo("projects");

}


async function loadProjects() {

    try {

        const session =
            await getSession();


        if (!session) return;


        const response =
            await fetch(
                `${API_URL}/api/projects`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${session.access_token}`

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                "Projects API unavailable"
            );

        }


        const data =
            await response.json();


        renderProjects(
            data.projects ||
            data ||
            []
        );


    } catch {

        const projects =
            JSON.parse(
                localStorage.getItem(
                    "niveau-projects"
                ) || "[]"
            );


        renderProjects(
            projects
        );

    }

}


function renderProjects(projects) {

    const grid =
        $("#projectsGrid");


    if (!grid) return;


    if (!projects.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <div>◫</div>

                <h3>
                    No projects yet
                </h3>

                <p>
                    Create your first project
                    and start building.
                </p>

            </div>

        `;

        return;

    }


    grid.innerHTML = "";


    projects.forEach(project => {

        const card =
            document.createElement("div");

        card.className =
            "project-card";


        card.innerHTML = `

            <div class="project-card-icon">
                ◫
            </div>

            <h3></h3>

            <p></p>

            <div class="project-card-meta">
                ${formatDate(project.createdAt || project.created_at)}
            </div>

        `;


        card.querySelector("h3")
            .textContent =
                project.name || "Untitled project";


        card.querySelector("p")
            .textContent =
                project.description ||
                "AI project";


        card.addEventListener(
            "click",
            () => {

                openProject(
                    project
                );

            }
        );


        grid.appendChild(
            card
        );

    });

}


function openProject(project) {

    navigateTo("coding");


    const editor =
        $("#codeEditor");


    if (editor) {

        editor.value =
            project.content ||
            `// ${project.name}\n\n// Start building your project here...`;

        editor.focus();

    }

}


/* =========================================================
   UPGRADE / PLANS
========================================================= */

function setupUpgrade() {

    upgradeBtn?.addEventListener(
        "click",
        showUpgradeModal
    );

}


function showUpgradeModal() {

    const choice =
        window.confirm(
            "Niveau AI Plans\n\n" +
            "Free — 20 AI messages\n" +
            "Pro — Higher limits + advanced tools\n\n" +
            "Would you like to continue to the upgrade page?"
        );


    if (choice) {

        navigateTo("planning");

        showSystemMessage(
            "The billing system will be connected here."
        );

    }

}


/* =========================================================
   USAGE
========================================================= */

async function loadUsage() {

    try {

        const session =
            await getSession();


        if (!session) return;


        const response =
            await fetch(
                `${API_URL}/api/usage`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${session.access_token}`

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                "Usage API unavailable"
            );

        }


        const data =
            await response.json();


        usageCount =
            Number(
                data.usage ??
                data.count ??
                0
            );


    } catch {

        usageCount =
            Number(
                localStorage.getItem(
                    "niveau-usage"
                ) || 0
            );

    }


    updateUsageUI();

}


function updateUsageUI() {

    const percentage =
        Math.min(
            (usageCount / FREE_LIMIT) *
            100,
            100
        );


    setText(
        "#usageText",
        `${usageCount} / ${FREE_LIMIT}`
    );


    const progress =
        $("#usageProgress");


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   CONVERSATIONS
========================================================= */

async function loadConversations() {

    try {

        const session =
            await getSession();


        if (!session) return;


        const response =
            await fetch(
                `${API_URL}/api/conversations`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${session.access_token}`

                    }

                }
            );


        if (!response.ok) return;


        const data =
            await response.json();


        renderConversations(
            data.conversations ||
            data ||
            []
        );


    } catch (error) {

        console.log(
            "Conversation API not connected yet."
        );

    }

}


function renderConversations(
    conversations
) {

    const sidebarNav =
        $(".sidebar-nav");


    if (!sidebarNav) return;


    const existing =
        $(".conversation-history");


    existing?.remove();


    if (!conversations.length) return;


    const container =
        document.createElement("div");


    container.className =
        "conversation-history";


    const title =
        document.createElement("div");


    title.className =
        "nav-section-title";


    title.textContent =
        "RECENT CHATS";


    container.appendChild(
        title
    );


    conversations
        .slice(0, 10)
        .forEach(conversation => {

            const button =
                document.createElement("button");


            button.className =
                "nav-item conversation-item";


            button.innerHTML = `
                <span class="nav-icon">◌</span>
                <span></span>
            `;


            button.querySelector(
                "span:nth-child(2)"
            ).textContent =
                conversation.title ||
                "New conversation";


            button.addEventListener(
                "click",
                () => {

                    loadConversation(
                        conversation.id
                    );

                }
            );


            container.appendChild(
                button
            );

        });


    sidebarNav.appendChild(
        container
    );

}


async function loadConversation(
    conversationId
) {

    if (!conversationId) return;


    try {

        const session =
            await getSession();


        if (!session) return;


        const response =
            await fetch(
                `${API_URL}/api/conversations/${conversationId}/messages`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${session.access_token}`

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load conversation."
            );

        }


        const data =
            await response.json();


        currentConversationId =
            conversationId;


        messages.innerHTML = "";


        $(".chat-welcome").style.display =
            "none";


        const items =
            data.messages ||
            data ||
            [];


        items.forEach(message => {

            addMessage(
                message.role,
                message.content
            );

        });


        navigateTo("chat");


    } catch (error) {

        showSystemMessage(
            error.message
        );

    }

}


/* =========================================================
   CODE EDITOR
========================================================= */

function setupCodeEditor() {

    const editor =
        $("#codeEditor");


    if (!editor) return;


    editor.addEventListener(
        "input",
        () => {

            localStorage.setItem(
                "niveau-code-draft",
                editor.value
            );

        }
    );


    const saved =
        localStorage.getItem(
            "niveau-code-draft"
        );


    if (saved) {

        editor.value =
            saved;

    }


    $$(".code-file").forEach(file => {

        file.addEventListener(
            "click",
            () => {

                $$(".code-file")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                file.classList.add(
                    "active"
                );


                const filename =
                    file.textContent.trim();


                editor.placeholder =
                    `Write ${filename} here...`;

            }
        );

    });

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setupConnectionStatus() {

    if (!connectionStatus) return;


    window.addEventListener(
        "online",
        () => {

            connectionStatus.innerHTML =
                "<i></i> Connected";

        }
    );


    window.addEventListener(
        "offline",
        () => {

            connectionStatus.innerHTML =
                "<i style='background:#ff5c70'></i> Offline";

        }
    );


    if (!navigator.onLine) {

        connectionStatus.innerHTML =
            "<i style='background:#ff5c70'></i> Offline";

    }

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                chatSearch?.focus();

            }


            if (
                event.key === "Escape"
            ) {

                closeProfileMenu();

                closeSettingsModal();

            }

        }
    );

}


/* =========================================================
   SESSION
========================================================= */

async function getSession() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        return null;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return null;

    }


    return data.session;

}


/* =========================================================
   DATE
========================================================= */

function formatDate(date) {

    if (!date) return "";

    try {

        return new Date(date)
            .toLocaleDateString(
                undefined,
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

    } catch {

        return "";

    }

}


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "Niveau AI error:",
            event.error
        );

    }
);