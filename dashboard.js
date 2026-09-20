const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =====================================
// ELEMENTS
// =====================================

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const avatar = document.getElementById("avatar");

const projectCount = document.getElementById("projectCount");
const usageCount = document.getElementById("usageCount");

const projectsContainer =
  document.getElementById("projectsContainer");

const projectModal =
  document.getElementById("projectModal");

const projectForm =
  document.getElementById("projectForm");

const projectName =
  document.getElementById("projectName");

const projectDescription =
  document.getElementById("projectDescription");

const formMessage =
  document.getElementById("formMessage");


// =====================================
// CURRENT USER
// =====================================

let currentUser = null;


// =====================================
// INITIALIZE
// =====================================

async function initDashboard() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (!session) {

    window.location.href = "index.html";

    return;
  }


  currentUser = session.user;


  await loadProfile();

  await loadProjects();

  await loadUsage();
}


// =====================================
// PROFILE
// =====================================

async function loadProfile() {

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();


  if (error) {

    console.error(error);

    userName.textContent =
      currentUser.email?.split("@")[0] || "User";

    userEmail.textContent =
      currentUser.email || "";

    avatar.textContent =
      (currentUser.email || "N")
      .charAt(0)
      .toUpperCase();

    return;
  }


  const firstName = data.first_name || "";
  const lastName = data.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim();


  userName.textContent =
    fullName || currentUser.email;


  userEmail.textContent =
    data.email || currentUser.email;


  avatar.textContent =
    (firstName || currentUser.email || "N")
      .charAt(0)
      .toUpperCase();
}


// =====================================
// PROJECTS
// =====================================

async function loadProjects() {

  projectsContainer.innerHTML =
    `<div class="loading">Loading projects...</div>`;


  const {
    data,
    error
  } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    projectsContainer.innerHTML =
      `<div class="loading">
        Unable to load projects.
      </div>`;

    return;
  }


  projectCount.textContent =
    data.length;


  if (!data.length) {

    projectsContainer.innerHTML =
      `<div class="loading">
        No projects yet. Create your first project 🚀
      </div>`;

    return;
  }


  projectsContainer.innerHTML = "";


  data.forEach(project => {

    const card =
      document.createElement("div");

    card.className = "project-card";


    const createdDate =
      project.created_at
        ? new Date(project.created_at)
            .toLocaleDateString()
        : "";


    card.innerHTML = `

      <div class="project-icon">
        ✦
      </div>

      <h3>
        ${escapeHTML(project.name)}
      </h3>

      <p>
        ${escapeHTML(
          project.description ||
          "No description"
        )}
      </p>

      <span class="project-date">
        Created ${createdDate}
      </span>

      <button
        class="delete-project"
        data-id="${project.id}">
        Delete project
      </button>

    `;


    const deleteBtn =
      card.querySelector(".delete-project");


    deleteBtn.addEventListener(
      "click",
      () => deleteProject(project.id)
    );


    projectsContainer.appendChild(card);

  });
}


// =====================================
// CREATE PROJECT
// =====================================

async function createProject(event) {

  event.preventDefault();


  const name =
    projectName.value.trim();

  const description =
    projectDescription.value.trim();


  if (!name) {

    formMessage.textContent =
      "Project name is required.";

    return;
  }


  formMessage.textContent =
    "Creating project...";


  const {
    error
  } = await supabaseClient
    .from("projects")
    .insert({

      user_id: currentUser.id,

      name: name,

      description: description

    });


  if (error) {

    console.error(error);

    formMessage.textContent =
      error.message;

    return;
  }


  formMessage.textContent =
    "Project created successfully ✓";


  projectForm.reset();


  setTimeout(() => {

    closeModal();

    loadProjects();

  }, 600);
}


// =====================================
// DELETE PROJECT
// =====================================

async function deleteProject(projectId) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this project?"
    );


  if (!confirmed) return;


  const {
    error
  } = await supabaseClient
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", currentUser.id);


  if (error) {

    alert(error.message);

    return;
  }


  await loadProjects();
}


// =====================================
// USAGE
// =====================================

async function loadUsage() {

  const {
    data,
    error
  } = await supabaseClient
    .from("usage_daily")
    .select("*")
    .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    usageCount.textContent = "0";

    return;
  }


  let total = 0;


  data.forEach(row => {

    total +=
      Number(row.ai_requests || 0);

  });


  usageCount.textContent = total;
}


// =====================================
// MODAL
// =====================================

function openModal() {

  projectModal.classList.remove("hidden");

  projectName.focus();
}


function closeModal() {

  projectModal.classList.add("hidden");

  formMessage.textContent = "";
}


// =====================================
// LOGOUT
// =====================================

async function logout() {

  await supabaseClient.auth.signOut();

  window.location.href = "index.html";
}


// =====================================
// HTML SECURITY
// =====================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// =====================================
// EVENTS
// =====================================

document
  .getElementById("newProjectBtn")
  .addEventListener(
    "click",
    openModal
  );


document
  .getElementById("newProjectBtn2")
  .addEventListener(
    "click",
    openModal
  );


document
  .getElementById("closeModal")
  .addEventListener(
    "click",
    closeModal
  );


projectForm.addEventListener(
  "submit",
  createProject
);


document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    logout
);


projectModal.addEventListener(
  "click",
  event => {

    if (event.target === projectModal) {

      closeModal();

    }

  }
);


// =====================================
// START
// =====================================

initDashboard();