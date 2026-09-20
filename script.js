// ========================================
// NOVA AI — MAIN SCRIPT
// REAL SUPABASE AUTH
// ========================================


// ========================================
// SUPABASE CONFIG
// ========================================

const SUPABASE_URL = "https://ddwurpnnfelbmtoxqcwo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_aPy9crGAGr1QBkIn7E8gwA_GsTTI1iQ";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


// ========================================
// DOM
// ========================================

const loginModal =
  document.getElementById("loginModal");

const loginForm =
  document.getElementById("loginForm");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginMessage =
  document.getElementById("loginMessage");

const loginButton =
  document.getElementById("loginButton");

const loginOpenButton =
  document.getElementById("loginOpen");

const loginCloseButton =
  document.getElementById("closeLogin");

const logoutButton =
  document.getElementById("logoutButton");

const userNameElement =
  document.getElementById("userName");

const userEmailElement =
  document.getElementById("userEmail");

const userAvatarElement =
  document.getElementById("userAvatar");

const chatInput =
  document.getElementById("chatInput");

const sendButton =
  document.getElementById("sendButton");

const chatOutput =
  document.getElementById("chatOutput");


// ========================================
// AUTH STATE
// ========================================

let currentUser = null;
let currentProfile = null;
let currentConversation = null;


// ========================================
// LOGIN / SIGNUP MODE
// ========================================

let authMode = "login";


// ========================================
// OPEN LOGIN
// ========================================

if (loginOpenButton) {

  loginOpenButton.addEventListener(
    "click",
    () => {

      openLoginModal();

    }
  );

}


// ========================================
// CLOSE LOGIN
// ========================================

if (loginCloseButton) {

  loginCloseButton.addEventListener(
    "click",
    () => {

      closeLoginModal();

    }
  );

}


// ========================================
// CLICK OUTSIDE MODAL
// ========================================

if (loginModal) {

  loginModal.addEventListener(
    "click",
    event => {

      if (
        event.target === loginModal
      ) {

        closeLoginModal();

      }

    }
  );

}


// ========================================
// OPEN MODAL
// ========================================

function openLoginModal() {

  if (!loginModal) {
    return;
  }

  loginModal.classList.add("active");

  clearAuthMessage();

}


// ========================================
// CLOSE MODAL
// ========================================

function closeLoginModal() {

  if (!loginModal) {
    return;
  }

  loginModal.classList.remove("active");

  clearAuthMessage();

}


// ========================================
// AUTH MESSAGE
// ========================================

function showAuthMessage(
  message,
  type = "error"
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.className =
    `auth-message ${type}`;

}


function clearAuthMessage() {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = "";

  loginMessage.className =
    "auth-message";

}


// ========================================
// LOGIN
// ========================================

async function loginUser(
  email,
  password
) {

  if (!email || !password) {

    throw new Error(
      "دخل Email و Password."
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword(
      {
        email: email.trim(),
        password: password
      }
    );


  if (error) {

    throw new Error(
      getAuthErrorMessage(
        error
      )
    );

  }


  if (!data.user) {

    throw new Error(
      "تعذر تسجيل الدخول."
    );

  }


  currentUser =
    data.user;


  // Check profile from database
  const profile =
    await getUserProfile(
      data.user.id
    );


  if (!profile) {

    await supabaseClient.auth.signOut();

    throw new Error(
      "الحساب موجود ولكن Profile ديالو ما تلقاش فالـDatabase."
    );

  }


  currentProfile =
    profile;


  // Check account status
  if (
    profile.status ===
    "suspended"
  ) {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;

    throw new Error(
      "هاد الحساب موقوف. تواصل مع Support."
    );

  }


  if (
    profile.status !==
    "active"
  ) {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;

    throw new Error(
      "هاد الحساب غير متاح حالياً."
    );

  }


  // Update UI
  updateUserUI(
    data.user,
    profile
  );


  // Load conversation
  await loadOrCreateConversation();


  closeLoginModal();


  showToast(
    `مرحبا ${profile.full_name || ""} 👋`
  );

}


// ========================================
// REGISTER
// ========================================

async function registerUser(
  firstName,
  lastName,
  email,
  password,
  confirmPassword
) {

  firstName =
    firstName.trim();

  lastName =
    lastName.trim();

  email =
    email.trim();


  // Validate name
  if (!firstName) {

    throw new Error(
      "دخل الاسم."
    );

  }


  if (!lastName) {

    throw new Error(
      "دخل الكنية."
    );

  }


  // Validate email
  if (!email) {

    throw new Error(
      "دخل Email."
    );

  }


  if (!isValidEmail(email)) {

    throw new Error(
      "دخل Email صحيح."
    );

  }


  // Validate password
  if (!password) {

    throw new Error(
      "دخل كلمة السر."
    );

  }


  if (password.length < 8) {

    throw new Error(
      "كلمة السر خاصها تكون على الأقل 8 حروف."
    );

  }


  // Confirm password
  if (
    password !==
    confirmPassword
  ) {

    throw new Error(
      "كلمة السر وتأكيد كلمة السر ما متطابقينش."
    );

  }


  const fullName =
    `${firstName} ${lastName}`;


  // Create Auth account
  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp(
      {
        email: email,
        password: password,

        options: {

          data: {

            first_name:
              firstName,

            last_name:
              lastName,

            full_name:
              fullName

          }

        }

      }
    );


  if (error) {

    throw new Error(
      getAuthErrorMessage(
        error
      )
    );

  }


  if (!data.user) {

    throw new Error(
      "ما قدرناش ننشئو الحساب."
    );

  }


  /*
    The database trigger:
    handle_new_user()

    creates the profile automatically.
  */


  // Email confirmation may be enabled
  if (
    !data.session
  ) {

    return {
      success: true,
      needsConfirmation: true,
      user: data.user
    };

  }


  // If email confirmation is disabled,
  // user is logged in immediately.
  currentUser =
    data.user;


  const profile =
    await waitForProfile(
      data.user.id
    );


  if (!profile) {

    await supabaseClient.auth.signOut();

    currentUser = null;

    throw new Error(
      "الحساب تخلق ولكن Profile مازال ما بانش فالـDatabase."
    );

  }


  currentProfile =
    profile;


  updateUserUI(
    data.user,
    profile
  );


  await loadOrCreateConversation();


  closeLoginModal();


  return {
    success: true,
    needsConfirmation: false,
    user: data.user
  };

}


// ========================================
// GET USER PROFILE
// ========================================

async function getUserProfile(
  userId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        `
        id,
        full_name,
        avatar_url,
        role,
        status,
        plan,
        created_at
        `
      )
      .eq(
        "id",
        userId
      )
      .single();


  if (error) {

    if (
      error.code ===
      "PGRST116"
    ) {

      return null;

    }

    throw error;

  }


  return data;

}


// ========================================
// WAIT FOR PROFILE
// ========================================

async function waitForProfile(
  userId,
  attempts = 10
) {

  for (
    let i = 0;
    i < attempts;
    i++
  ) {

    const profile =
      await getUserProfile(
        userId
      );


    if (profile) {

      return profile;

    }


    await sleep(500);

  }


  return null;

}


// ========================================
// LOGOUT
// ========================================

async function logoutUser() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    console.error(
      "Logout error:",
      error
    );

    return;

  }


  currentUser = null;
  currentProfile = null;
  currentConversation = null;


  updateUserUI(
    null,
    null
  );


  showToast(
    "تم تسجيل الخروج."
  );

}


// ========================================
// LOGOUT BUTTON
// ========================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    logoutUser
  );

}


// ========================================
// AUTH STATE LISTENER
// ========================================

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

      currentUser = null;
      currentProfile = null;

      updateUserUI(
        null,
        null
      );

      return;

    }


    if (
      session?.user
    ) {

      currentUser =
        session.user;


      try {

        const profile =
          await getUserProfile(
            session.user.id
          );


        if (
          profile &&
          profile.status ===
          "active"
        ) {

          currentProfile =
            profile;


          updateUserUI(
            session.user,
            profile
          );

        }

      } catch (error) {

        console.error(
          "Profile error:",
          error
        );

      }

    }

  }
);


// ========================================
// CHECK CURRENT SESSION
// ========================================

async function checkCurrentSession() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(
      error
    );

    return;

  }


  if (
    !data.session
  ) {

    updateUserUI(
      null,
      null
    );

    return;

  }


  const user =
    data.session.user;


  try {

    const profile =
      await getUserProfile(
        user.id
      );


    if (!profile) {

      await supabaseClient.auth.signOut();

      return;

    }


    if (
      profile.status !==
      "active"
    ) {

      await supabaseClient.auth.signOut();

      showToast(
        "الحساب ديالك ماشي Active."
      );

      return;

    }


    currentUser =
      user;

    currentProfile =
      profile;


    updateUserUI(
      user,
      profile
    );


    await loadOrCreateConversation();


  } catch (error) {

    console.error(
      "Session check:",
      error
    );

  }

}


// ========================================
// UPDATE USER UI
// ========================================

function updateUserUI(
  user,
  profile
) {

  if (
    user &&
    profile
  ) {

    const name =
      profile.full_name ||
      user.email ||
      "User";


    if (userNameElement) {

      userNameElement.textContent =
        name;

    }


    if (userEmailElement) {

      userEmailElement.textContent =
        user.email || "";

    }


    if (userAvatarElement) {

      userAvatarElement.textContent =
        name
          .charAt(0)
          .toUpperCase();

    }


    if (loginOpenButton) {

      loginOpenButton.textContent =
        name;

    }


    if (logoutButton) {

      logoutButton.style.display =
        "block";

    }

  } else {

    if (userNameElement) {

      userNameElement.textContent =
        "Guest";

    }


    if (userEmailElement) {

      userEmailElement.textContent =
        "";

    }


    if (userAvatarElement) {

      userAvatarElement.textContent =
        "N";

    }


    if (loginOpenButton) {

      loginOpenButton.textContent =
        "Login";

    }


    if (logoutButton) {

      logoutButton.style.display =
        "none";

    }

  }

}


// ========================================
// AUTH FORM
// ========================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const formData =
        new FormData(
          loginForm
        );


      const mode =
        formData.get(
          "auth_mode"
        ) ||
        authMode;


      try {

        setLoginLoading(
          true
        );


        if (
          mode ===
          "register"
        ) {

          const firstName =
            formData.get(
              "first_name"
            ) || "";


          const lastName =
            formData.get(
              "last_name"
            ) || "";


          const email =
            formData.get(
              "email"
            ) || "";


          const password =
            formData.get(
              "password"
            ) || "";


          const confirmPassword =
            formData.get(
              "confirm_password"
            ) || "";


          const result =
            await registerUser(
              firstName,
              lastName,
              email,
              password,
              confirmPassword
            );


          if (
            result.needsConfirmation
          ) {

            showAuthMessage(
              "الحساب تخلق بنجاح. شيك Gmail ديالك وفعّل الحساب من الرابط.",
              "success"
            );

            return;

          }


          showAuthMessage(
            "تم إنشاء الحساب بنجاح.",
            "success"
          );


        } else {

          const email =
            formData.get(
              "email"
            ) || "";


          const password =
            formData.get(
              "password"
            ) || "";


          await loginUser(
            email,
            password
          );


          showAuthMessage(
            "تم تسجيل الدخول بنجاح.",
            "success"
          );

        }


      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );


        showAuthMessage(
          error.message ||
          "وقع خطأ. حاول مرة أخرى.",
          "error"
        );


      } finally {

        setLoginLoading(
          false
        );

      }

    }
  );

}


// ========================================
// LOGIN LOADING
// ========================================

function setLoginLoading(
  loading
) {

  if (!loginButton) {
    return;
  }


  loginButton.disabled =
    loading;


  loginButton.textContent =
    loading
      ? "Please wait..."
      : (
          authMode ===
          "register"
            ? "Create Account"
            : "Login"
        );

}


// ========================================
// SWITCH LOGIN / REGISTER
// ========================================

function setAuthMode(
  mode
) {

  authMode =
    mode;
 const authModeInput =
  document.querySelector(
    'input[name="auth_mode"]'
  );

if (authModeInput) {
  authModeInput.value = mode;
}

  const registerFields =
    document.querySelector(
      ".register-fields"
    );


  const confirmPassword =
    document.querySelector(
      '[name="confirm_password"]'
    );


  const firstName =
    document.querySelector(
      '[name="first_name"]'
    );


  const lastName =
    document.querySelector(
      '[name="last_name"]'
    );


  const authTitle =
    document.getElementById(
      "authTitle"
    );


  const authSubtitle =
    document.getElementById(
      "authSubtitle"
    );


  const authSwitch =
    document.getElementById(
      "authSwitch"
    );


  if (
    mode ===
    "register"
  ) {

    if (registerFields) {

      registerFields.style.display =
        "block";

    }


    if (confirmPassword) {

      confirmPassword.required =
        true;

    }


    if (firstName) {

      firstName.required =
        true;

    }


    if (lastName) {

      lastName.required =
        true;

    }


    if (authTitle) {

      authTitle.textContent =
        "Create your account";

    }


    if (authSubtitle) {

      authSubtitle.textContent =
        "Join NOVA AI Studio";

    }


    if (authSwitch) {

      authSwitch.innerHTML = `
        Already have an account?
        <button
          type="button"
          id="switchToLogin"
        >
          Login
        </button>
      `;

    }


    if (loginButton) {

      loginButton.textContent =
        "Create Account";

    }

  } else {

    if (registerFields) {

      registerFields.style.display =
        "none";

    }


    if (confirmPassword) {

      confirmPassword.required =
        false;

    }


    if (firstName) {

      firstName.required =
        false;

    }


    if (lastName) {

      lastName.required =
        false;

    }


    if (authTitle) {

      authTitle.textContent =
        "Welcome back";

    }


    if (authSubtitle) {

      authSubtitle.textContent =
        "Login to NOVA AI Studio";

    }


    if (authSwitch) {

      authSwitch.innerHTML = `
        Don't have an account?
        <button
          type="button"
          id="switchToRegister"
        >
          Create Account
        </button>
      `;

    }


    if (loginButton) {

      loginButton.textContent =
        "Login";

    }

  }


  attachAuthSwitch();

  clearAuthMessage();

}


// ========================================
// AUTH SWITCH BUTTON
// ========================================

function attachAuthSwitch() {

  const switchToRegister =
    document.getElementById(
      "switchToRegister"
    );


  const switchToLogin =
    document.getElementById(
      "switchToLogin"
    );


  if (
    switchToRegister
  ) {

    switchToRegister.onclick =
      () => {

        setAuthMode(
          "register"
        );

      };

  }


  if (
    switchToLogin
  ) {

    switchToLogin.onclick =
      () => {

        setAuthMode(
          "login"
        );

      };

  }

}


// ========================================
// EMAIL VALIDATION
// ========================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// ========================================
// AUTH ERROR TRANSLATION
// ========================================

function getAuthErrorMessage(
  error
) {

  const message =
    (
      error?.message ||
      ""
    ).toLowerCase();


  if (
    message.includes(
      "invalid login credentials"
    )
  ) {

    return "Email ولا Password غير صحيح.";

  }


  if (
    message.includes(
      "email not confirmed"
    )
  ) {

    return "خاصك تأكد Email ديالك من Gmail قبل Login.";

  }


  if (
    message.includes(
      "user already registered"
    )
  ) {

    return "هاد Email مسجل من قبل.";

  }


  if (
    message.includes(
      "password should be at least"
    )
  ) {

    return "كلمة السر خاصها تكون أقوى.";

  }


  if (
    message.includes(
      "invalid email"
    )
  ) {

    return "Email غير صحيح.";

  }


  if (
    message.includes(
      "rate limit"
    )
  ) {

    return "كاين بزاف ديال المحاولات. عاود من بعد.";

  }


  return (
    error?.message ||
    "وقع خطأ أثناء العملية."
  );

}


// ========================================
// CONVERSATIONS
// ========================================

async function loadOrCreateConversation() {

  if (!currentUser) {
    return null;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("conversations")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      )
      .limit(1);


  if (error) {

    console.error(
      "Conversation error:",
      error
    );

    return null;

  }


  if (
    data &&
    data.length > 0
  ) {

    currentConversation =
      data[0];

    return currentConversation;

  }


  const {
    data: newConversation,
    error: createError
  } =
    await supabaseClient
      .from("conversations")
      .insert({

        user_id:
          currentUser.id,

        title:
          "New Chat"

      })
      .select()
      .single();


  if (createError) {

    console.error(
      "Create conversation:",
      createError
    );

    return null;

  }


  currentConversation =
    newConversation;


  return newConversation;

}


// ========================================
// SEND MESSAGE
// ========================================

if (sendButton) {

  sendButton.addEventListener(
    "click",
    sendMessage
  );

}


if (chatInput) {

  chatInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


// ========================================
// SEND MESSAGE FUNCTION
// ========================================

async function sendMessage() {

  if (!currentUser) {

    openLoginModal();

    return;

  }


  const message =
    chatInput?.value?.trim();


  if (!message) {
    return;
  }


  if (
    !currentConversation
  ) {

    await loadOrCreateConversation();

  }


  if (
    !currentConversation
  ) {

    showToast(
      "ما قدرناش نفتحوا Chat."
    );

    return;

  }


  addMessageToUI(
    "user",
    message
  );


  chatInput.value = "";


  try {

    const {
      error
    } =
      await supabaseClient
        .from("messages")
        .insert({

          conversation_id:
            currentConversation.id,

          user_id:
            currentUser.id,

          role:
            "user",

          content:
            message

        });


    if (error) {

      throw error;

    }


    const response =
      await generateNovaResponse(
        message
      );


    addMessageToUI(
      "assistant",
      response
    );


    await supabaseClient
      .from("messages")
      .insert({

        conversation_id:
          currentConversation.id,

        user_id:
          currentUser.id,

        role:
          "assistant",

        content:
          response

      });


  } catch (error) {

    console.error(
      "Message error:",
      error
    );


    addMessageToUI(
      "assistant",
      "وقع مشكل فإرسال الرسالة. حاول مرة أخرى."
    );

  }

}


// ========================================
// TEMP NOVA RESPONSE
// ========================================

async function generateNovaResponse(
  message
) {

  return `
NOVA AI وصلاتو الرسالة ديالك:

"${escapeHTML(message)}"

الحساب ديالك مربوط بـ Supabase بنجاح.

المرحلة التالية هي ربط NOVA بمحرك AI حقيقي عبر Edge Function بشكل آمن.
`;

}


// ========================================
// ADD MESSAGE UI
// ========================================

function addMessageToUI(
  role,
  content
) {

  if (!chatOutput) {
    return;
  }


  const messageElement =
    document.createElement(
      "div"
    );


  messageElement.className =
    `chat-message ${role}`;


  messageElement.innerHTML = `
    <div class="message-role">
      ${
        role === "user"
          ? "You"
          : "NOVA"
      }
    </div>

    <div class="message-content">
      ${content}
    </div>
  `;


  chatOutput.appendChild(
    messageElement
  );


  chatOutput.scrollTop =
    chatOutput.scrollHeight;

}


// ========================================
// TOAST
// ========================================

function showToast(
  message
) {

  let toast =
    document.getElementById(
      "novaToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "novaToast";

    toast.style.position =
      "fixed";

    toast.style.bottom =
      "25px";

    toast.style.right =
      "25px";

    toast.style.padding =
      "12px 16px";

    toast.style.background =
      "#171a22";

    toast.style.color =
      "#fff";

    toast.style.border =
      "1px solid #292e3a";

    toast.style.borderRadius =
      "10px";

    toast.style.zIndex =
      "99999";

    toast.style.fontSize =
      "13px";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.style.opacity =
    "1";


  setTimeout(() => {

    toast.style.opacity =
      "0";

  }, 3000);

}


// ========================================
// HELPERS
// ========================================

function sleep(
  ms
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


function escapeHTML(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// ========================================
// QUICK ACTIONS
// ========================================

document
  .querySelectorAll(
    ".quick-card"
  )
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const prompt =
          card.dataset.prompt ||
          card.querySelector(
            "p"
          )?.textContent ||
          "";


        if (chatInput) {

          chatInput.value =
            prompt;

          chatInput.focus();

        }

      }
    );

  });


// ========================================
// MOBILE MENU
// ========================================

const menuButton =
  document.getElementById(
    "menuButton"
  );

const sidebar =
  document.querySelector(
    ".sidebar"
  );


if (menuButton) {

  menuButton.addEventListener(
    "click",
    () => {

      sidebar?.classList.toggle(
        "open"
      );

    }
  );

}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // Default auth mode
    setAuthMode(
      "login"
    );


    // Check existing session
    await checkCurrentSession();

  }
);