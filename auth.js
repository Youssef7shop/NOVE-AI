const SUPABASE_URL =
  "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =====================================
   REGISTER
===================================== */

async function registerUser(
  firstName,
  lastName,
  email,
  password
) {

  const {
    data,
    error
  } = await supabaseClient.auth.signUp({

    email,

    password,

    options: {

      data: {
        first_name: firstName,
        last_name: lastName
      }

    }

  });


  if (error) {

    throw error;

  }


  return data;

}


/* =====================================
   LOGIN
===================================== */

async function loginUser(
  email,
  password
) {

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({

      email,

      password

    });


  if (error) {

    throw error;

  }


  return data;

}


/* =====================================
   GOOGLE LOGIN
===================================== */

async function loginWithGoogle() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithOAuth({

      provider: "google",

      options: {

        redirectTo:
          window.location.origin +
          "/frontend/index.html"

      }

    });


  if (error) {

    throw error;

  }

}


/* =====================================
   LOGOUT
===================================== */

async function logoutUser() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    console.error(error);

    return;

  }


  window.location.href =
    "login.html";

}


/* =====================================
   CURRENT USER
===================================== */

async function getCurrentUser() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  return user;

}


/* =====================================
   PROTECT PAGE
===================================== */

async function protectPage() {

  const user =
    await getCurrentUser();


  if (!user) {

    window.location.href =
      "login.html";

  }


  return user;

}


/* =====================================
   AUTH STATE
===================================== */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Auth event:",
      event
    );

  }
);