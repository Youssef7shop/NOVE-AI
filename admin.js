// ========================================
// NOVA AI — ADMIN PANEL
// ========================================

// ================================
// SUPABASE CONFIG
// ================================

const SUPABASE_URL = "https://ddwurpnnfelbmtoxqcwo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aPy9crGAGr1QBkIn7E8gwA_GsTTI1iQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ================================
// GLOBAL
// ================================

let currentAdmin = null;


// ================================
// DOM
// ================================

const navButtons = document.querySelectorAll(".admin-nav");
const sections = document.querySelectorAll(".admin-section");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");

const usersCount = document.getElementById("usersCount");
const projectsCount = document.getElementById("projectsCount");
const ticketsCount = document.getElementById("ticketsCount");

const recentActivity = document.getElementById("recentActivity");

const usersTable = document.getElementById("usersTable");
const projectsTable = document.getElementById("projectsTable");
const ticketsTable = document.getElementById("ticketsTable");

const activityContainer = document.getElementById(
  "activityContainer"
);

const settingsContainer = document.getElementById(
  "settingsContainer"
);

const guardEnabled = document.getElementById(
  "guardEnabled"
);

const promptProtection = document.getElementById(
  "promptProtection"
);

const rateLimiting = document.getElementById(
  "rateLimiting"
);

const contentFiltering = document.getElementById(
  "contentFiltering"
);

const maxRequestsPerMinute =
  document.getElementById(
    "maxRequestsPerMinute"
  );

const guardMessage =
  document.getElementById("guardMessage");

const toast =
  document.getElementById("toast");


// ================================
// PAGE CONFIG
// ================================

const pageConfig = {

  dashboard: {
    title: "Dashboard",
    subtitle: "Manage your NOVA AI platform"
  },

  users: {
    title: "Users",
    subtitle: "Manage registered users"
  },

  projects: {
    title: "Projects",
    subtitle: "Manage user projects"
  },

  tickets: {
    title: "Support Tickets",
    subtitle: "Manage customer support"
  },

  settings: {
    title: "Settings",
    subtitle: "Platform configuration"
  },

  guard: {
    title: "NOVA Guard",
    subtitle: "Security and AI protection"
  },

  activity: {
    title: "Activity Logs",
    subtitle: "Platform activity history"
  }

};


// ================================
// NAVIGATION
// ================================

navButtons.forEach(button => {

  button.addEventListener("click", async () => {

    const section =
      button.dataset.section;

    switchSection(section);

    if (section === "dashboard") {
      await loadDashboard();
    }

    if (section === "users") {
      await loadUsers();
    }

    if (section === "projects") {
      await loadProjects();
    }

    if (section === "tickets") {
      await loadTickets();
    }

    if (section === "settings") {
      await loadSettings();
    }

    if (section === "guard") {
      await loadGuard();
    }

    if (section === "activity") {
      await loadActivity();
    }

  });

});


// ================================
// SWITCH SECTION
// ================================

function switchSection(section) {

  navButtons.forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === section
    );

  });


  sections.forEach(currentSection => {

    currentSection.classList.toggle(
      "active",
      currentSection.id === `${section}Section`
    );

  });


  const config = pageConfig[section];

  if (config) {

    pageTitle.textContent =
      config.title;

    pageSubtitle.textContent =
      config.subtitle;

  }

}


// ================================
// SUPABASE SESSION
// ================================

async function getSession() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;

}


// ================================
// ADMIN API
// ================================

async function adminAPI(
  action,
  options = {}
) {

  const session =
    await getSession();

  if (!session) {

    window.location.href =
      "index.html";

    throw new Error(
      "No active session"
    );

  }


  const response =
    await fetch(
      `${SUPABASE_URL}/functions/v1/admin-api?action=${encodeURIComponent(action)}`,
      {

        method:
          options.method || "GET",

        headers: {

          "Authorization":
            `Bearer ${session.access_token}`,

          "apikey":
            SUPABASE_PUBLISHABLE_KEY,

          "Content-Type":
            "application/json"

        },

        body:
          options.body
            ? JSON.stringify(options.body)
            : undefined

      }
    );


  let result;

  try {

    result =
      await response.json();

  } catch {

    throw new Error(
      "Invalid server response"
    );

  }


  if (!response.ok) {

    throw new Error(
      result.error ||
      "Admin API error"
    );

  }


  return result;

}


// ================================
// CHECK ADMIN
// ================================

async function checkAdmin() {

  const session =
    await getSession();

  if (!session) {

    window.location.href =
      "index.html";

    return false;

  }


  try {

    const profile =
      await loadCurrentProfile(
        session.user.id
      );

    if (
      !profile ||
      profile.role !== "admin"
    ) {

      showToast(
        "Admin access required"
      );

      await supabaseClient.auth.signOut();

      setTimeout(() => {

        window.location.href =
          "index.html";

      }, 1000);

      return false;

    }


    currentAdmin =
      profile;


    updateAdminProfile(
      profile
    );


    return true;

  } catch (error) {

    console.error(error);

    showToast(
      "Could not verify admin account"
    );

    return false;

  }

}


// ================================
// LOAD CURRENT PROFILE
// ================================

async function loadCurrentProfile(
  userId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, avatar_url, role, status, plan"
      )
      .eq("id", userId)
      .single();


  if (error) {
    throw error;
  }


  return data;

}


// ================================
// UPDATE ADMIN UI
// ================================

function updateAdminProfile(
  profile
) {

  const name =
    profile.full_name ||
    "Administrator";


  adminName.textContent =
    name;


  adminAvatar.textContent =
    name
      .charAt(0)
      .toUpperCase();

}


// ================================
// DASHBOARD
// ================================

async function loadDashboard() {

  setLoading(
    recentActivity,
    "Loading dashboard..."
  );


  try {

    const data =
      await adminAPI(
        "dashboard"
      );


    usersCount.textContent =
      data.users ?? 0;


    projectsCount.textContent =
      data.projects ?? 0;


    ticketsCount.textContent =
      data.tickets ?? 0;


    renderActivity(
      data.logs || [],
      recentActivity
    );


  } catch (error) {

    console.error(error);

    usersCount.textContent = "0";
    projectsCount.textContent = "0";
    ticketsCount.textContent = "0";

    setEmpty(
      recentActivity,
      error.message
    );

  }

}


// ================================
// USERS
// ================================

async function loadUsers() {

  setTableLoading(
    usersTable,
    5
  );


  try {

    const users =
      await adminAPI(
        "users"
      );


    if (
      !Array.isArray(users) ||
      users.length === 0
    ) {

      setTableEmpty(
        usersTable,
        5,
        "No users found"
      );

      return;

    }


    usersTable.innerHTML =
      users
        .map(user => {

          const name =
            escapeHTML(
              user.full_name ||
              "Unnamed User"
            );

          const role =
            user.role || "user";

          const plan =
            user.plan || "free";

          const status =
            user.status || "active";


          return `
            <tr>

              <td>
                <strong>${name}</strong>
              </td>

              <td>
                <span class="badge ${
                  role === "admin"
                    ? "badge-admin"
                    : "badge-user"
                }">
                  ${escapeHTML(role)}
                </span>
              </td>

              <td>
                ${escapeHTML(plan)}
              </td>

              <td>
                <span class="badge ${
                  status === "active"
                    ? "badge-active"
                    : "badge-suspended"
                }">
                  ${escapeHTML(status)}
                </span>
              </td>

              <td>
                ${formatDate(
                  user.created_at
                )}
              </td>

            </tr>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

    setTableEmpty(
      usersTable,
      5,
      error.message
    );

  }

}


// ================================
// PROJECTS
// ================================

async function loadProjects() {

  setTableLoading(
    projectsTable,
    4
  );


  try {

    const projects =
      await adminAPI(
        "projects"
      );


    if (
      !Array.isArray(projects) ||
      projects.length === 0
    ) {

      setTableEmpty(
        projectsTable,
        4,
        "No projects found"
      );

      return;

    }


    projectsTable.innerHTML =
      projects
        .map(project => {

          return `
            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    project.name ||
                    "Untitled Project"
                  )}
                </strong>
              </td>

              <td>
                <span class="muted-id">
                  ${escapeHTML(
                    project.user_id ||
                    "-"
                  )}
                </span>
              </td>

              <td>
                ${escapeHTML(
                  project.type ||
                  project.project_type ||
                  "Project"
                )}
              </td>

              <td>
                ${formatDate(
                  project.created_at
                )}
              </td>

            </tr>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

    setTableEmpty(
      projectsTable,
      4,
      error.message
    );

  }

}


// ================================
// SUPPORT TICKETS
// ================================

async function loadTickets() {

  setTableLoading(
    ticketsTable,
    5
  );


  try {

    const tickets =
      await adminAPI(
        "tickets"
      );


    if (
      !Array.isArray(tickets) ||
      tickets.length === 0
    ) {

      setTableEmpty(
        ticketsTable,
        5,
        "No support tickets found"
      );

      return;

    }


    ticketsTable.innerHTML =
      tickets
        .map(ticket => {

          const status =
            ticket.status ||
            "open";


          const priority =
            ticket.priority ||
            "normal";


          return `
            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    ticket.subject ||
                    "No subject"
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  ticket.user_id ||
                  "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  priority
                )}
              </td>

              <td>

                <span class="badge ${
                  status === "closed"
                    ? "badge-closed"
                    : "badge-open"
                }">

                  ${escapeHTML(
                    status
                  )}

                </span>

              </td>

              <td>
                ${formatDate(
                  ticket.created_at
                )}
              </td>

            </tr>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

    setTableEmpty(
      ticketsTable,
      5,
      error.message
    );

  }

}


// ================================
// SETTINGS
// ================================

async function loadSettings() {

  setLoading(
    settingsContainer,
    "Loading settings..."
  );


  try {

    const settings =
      await adminAPI(
        "settings"
      );


    if (
      !Array.isArray(settings) ||
      settings.length === 0
    ) {

      setEmpty(
        settingsContainer,
        "No settings found"
      );

      return;

    }


    settingsContainer.innerHTML =
      settings
        .map(setting => {

          return `
            <div class="settings-item">

              <div>

                <strong>
                  ${escapeHTML(
                    setting.key ||
                    "Setting"
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    String(
                      setting.value ??
                      ""
                    )
                  )}
                </span>

              </div>

            </div>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

    setEmpty(
      settingsContainer,
      error.message
    );

  }

}


// ================================
// NOVA GUARD
// ================================

async function loadGuard() {

  try {

    const guard =
      await adminAPI(
        "guard"
      );


    guardEnabled.checked =
      Boolean(
        guard.enabled
      );


    promptProtection.checked =
      Boolean(
        guard.prompt_protection
      );


    rateLimiting.checked =
      Boolean(
        guard.rate_limiting
      );


    contentFiltering.checked =
      Boolean(
        guard.content_filtering
      );


    maxRequestsPerMinute.value =
      guard.max_requests_per_minute ??
      60;


  } catch (error) {

    console.error(error);

    showGuardMessage(
      error.message,
      true
    );

  }

}


// ================================
// SAVE GUARD
// ================================

document
  .getElementById("saveGuard")
  ?.addEventListener(
    "click",
    async () => {

      const button =
        document.getElementById(
          "saveGuard"
        );


      button.disabled = true;

      button.textContent =
        "Saving...";


      showGuardMessage(
        ""
      );


      try {

        const result =
          await adminAPI(
            "update-guard",
            {

              method: "POST",

              body: {

                enabled:
                  guardEnabled.checked,

                prompt_protection:
                  promptProtection.checked,

                rate_limiting:
                  rateLimiting.checked,

                content_filtering:
                  contentFiltering.checked,

                max_requests_per_minute:
                  Number(
                    maxRequestsPerMinute.value
                  )

              }

            }
          );


        showGuardMessage(
          "NOVA Guard settings saved."
        );


        showToast(
          "NOVA Guard updated"
        );


      } catch (error) {

        console.error(error);

        showGuardMessage(
          error.message,
          true
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "Save NOVA Guard";

      }

    }
  );


// ================================
// ACTIVITY
// ================================

async function loadActivity() {

  setLoading(
    activityContainer,
    "Loading activity..."
  );


  try {

    const logs =
      await adminAPI(
        "dashboard"
      );


    renderActivity(
      logs.logs || [],
      activityContainer
    );


  } catch (error) {

    console.error(error);

    setEmpty(
      activityContainer,
      error.message
    );

  }

}


// ================================
// RENDER ACTIVITY
// ================================

function renderActivity(
  logs,
  container
) {

  if (
    !Array.isArray(logs) ||
    logs.length === 0
  ) {

    setEmpty(
      container,
      "No activity yet"
    );

    return;

  }


  container.innerHTML =
    logs
      .map(log => {

        const action =
          log.action ||
          log.event ||
          "Activity";


        const description =
          log.description ||
          log.details ||
          "";


        return `
          <div class="activity-item">

            <div class="activity-dot"></div>

            <div class="activity-content">

              <strong>
                ${escapeHTML(
                  action
                )}
              </strong>

              <span>
                ${
                  escapeHTML(
                    description
                  )
                }
                ${
                  log.created_at
                    ? " • " +
                      formatDate(
                        log.created_at
                      )
                    : ""
                }
              </span>

            </div>

          </div>
        `;

      })
      .join("");

}


// ================================
// REFRESH BUTTONS
// ================================

document
  .getElementById("refreshUsers")
  ?.addEventListener(
    "click",
    loadUsers
  );


document
  .getElementById("refreshProjects")
  ?.addEventListener(
    "click",
    loadProjects
  );


document
  .getElementById("refreshTickets")
  ?.addEventListener(
    "click",
    loadTickets
  );


// ================================
// BACK TO APP
// ================================

document
  .getElementById("backToApp")
  ?.addEventListener(
    "click",
    () => {

      window.location.href =
        "index.html";

    }
  );


// ================================
// LOGOUT
// ================================

document
  .getElementById("adminLogout")
  ?.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      window.location.href =
        "index.html";

    }
  );


// ================================
// TOAST
// ================================

function showToast(message) {

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 3000);

}


// ================================
// GUARD MESSAGE
// ================================

function showGuardMessage(
  message,
  isError = false
) {

  guardMessage.textContent =
    message;

  guardMessage.style.color =
    isError
      ? "#ef4444"
      : "#22c55e";

}


// ================================
// LOADING
// ================================

function setLoading(
  element,
  message
) {

  element.innerHTML = `
    <div class="empty-state">
      ${escapeHTML(message)}
    </div>
  `;

}


function setEmpty(
  element,
  message
) {

  element.innerHTML = `
    <div class="empty-state">
      ${escapeHTML(message)}
    </div>
  `;

}


function setTableLoading(
  tbody,
  columns
) {

  tbody.innerHTML = `
    <tr>
      <td colspan="${columns}">
        Loading...
      </td>
    </tr>
  `;

}


function setTableEmpty(
  tbody,
  columns,
  message
) {

  tbody.innerHTML = `
    <tr>
      <td colspan="${columns}">
        ${escapeHTML(message)}
      </td>
    </tr>
  `;

}


// ================================
// FORMAT DATE
// ================================

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleDateString(
    "en-GB",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


// ================================
// HTML SECURITY
// ================================

function escapeHTML(
  value
) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ================================
// START
// ================================

async function initAdmin() {

  const isAdmin =
    await checkAdmin();


  if (!isAdmin) {
    return;
  }


  await loadDashboard();

}


// Start Admin Panel
initAdmin();