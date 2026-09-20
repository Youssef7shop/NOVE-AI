const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


let authMode = "register";


function openAuth(mode) {

  authMode = mode;

  document
    .getElementById("authModal")
    .classList.remove("hidden");

  updateAuthUI();
}


function closeAuth() {

  document
    .getElementById("authModal")
    .classList.add("hidden");

  document
    .getElementById("authMessage")
    .textContent = "";
}


function switchAuth() {

  authMode =
    authMode === "register"
      ? "login"
      : "register";

  updateAuthUI();
}


function updateAuthUI() {

  const register =
    authMode === "register";

  document.getElementById("authTitle").textContent =
    register
      ? "Create your account"
      : "Welcome back";

  document.getElementById("authDescription").textContent =
    register
      ? "Start building with NOVA."
      : "Login to your NOVA workspace.";

  document.getElementById("nameFields")
    .style.display =
    register
      ? "grid"
      : "none";

  document.getElementById("authButtonText")
    .textContent =
    register
      ? "Create account"
      : "Login";

  document.getElementById("switchText")
    .textContent =
    register
      ? "Already have an account?"
      : "Don't have an account?";

  document.getElementById("switchButton")
    .textContent =
    register
      ? "Login"
      : "Create account";
}


document
  .getElementById("authForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const message =
        document.getElementById(
          "authMessage"
        );

      message.textContent = "Loading...";
      message.style.color = "#999";


      const email =
        document.getElementById(
          "email"
        ).value.trim();

      const password =
        document.getElementById(
          "password"
        ).value;


      try {

        if (authMode === "register") {

          const firstName =
            document.getElementById(
              "firstName"
            ).value.trim();

          const lastName =
            document.getElementById(
              "lastName"
            ).value.trim();


          if (!firstName || !lastName) {

            throw new Error(
              "Enter your first and last name."
            );

          }


          const {
            data,
            error
          } =
            await supabaseClient.auth
              .signUp({

                email,

                password,

                options: {

                  data: {

                    first_name:
                      firstName,

                    last_name:
                      lastName

                  }

                }

              });


          if (error)
            throw error;


          message.style.color =
            "#4ade80";

          message.textContent =
            "Account created. Check your email to confirm your account.";

        }


        else {

          const {
            data,
            error
          } =
            await supabaseClient.auth
              .signInWithPassword({

                email,

                password

              });


          if (error)
            throw error;


          message.style.color =
            "#4ade80";

          message.textContent =
            "Login successful.";

          setTimeout(
            () => {

              window.location.href =
                "dashboard.html";

            },
            700
          );

        }


      }

      catch (error) {

        message.style.color =
          "#f87171";

        message.textContent =
          error.message;

      }

    }
  );


async function checkUser() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth
      .getSession();


  if (session) {

    console.log(
      "Logged in:",
      session.user.email
    );

  }

}


checkUser();