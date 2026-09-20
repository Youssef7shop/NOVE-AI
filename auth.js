/* =========================================================
   NIVEAU AI — AUTH.JS
   Supabase Authentication
   Email / Password + Google + Facebook + Apple
========================================================= */


/* =========================================================
   1. SUPABASE CONFIG
=========================================================

   IMPORTANT:
   Replace these two values with your Supabase project values.

   Supabase Dashboard:
   Project Settings
   → API
   → Project URL
   → Publishable / anon key
========================================================= */

const SUPABASE_URL =
    "https://vjuxcthutboicdiwcdfd.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_cYma5zLjbrIQwo-G5Ru8fQ_H_flWOSj";


/* =========================================================
   2. CREATE SUPABASE CLIENT
========================================================= */

let supabaseClient = null;

if (
    typeof window.supabase !== "undefined" &&
    SUPABASE_URL !== "https://vjuxcthutboicdiwcdfd.supabase.co" &&
    SUPABASE_ANON_KEY !== "sb_publishable_cYma5zLjbrIQwo-G5Ru8fQ_H_flWOSj"
) {

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

} else {

    console.warn(
        "Supabase is not configured yet."
    );

}


/* =========================================================
   3. GET CURRENT SESSION
========================================================= */

async function getCurrentSession() {

    if (!supabaseClient) {
        return null;
    }

    try {

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

    } catch (error) {

        console.error(
            "getCurrentSession error:",
            error
        );

        return null;
    }

}


/* =========================================================
   4. GET CURRENT USER
========================================================= */

async function getCurrentUser() {

    const session =
        await getCurrentSession();

    return session?.user || null;

}


/* =========================================================
   5. PROTECT DASHBOARD PAGE
=========================================================

   If user is not logged in:
   → redirect to login.html
========================================================= */

async function protectPage() {

    if (!supabaseClient) {

        console.error(
            "Supabase client is not initialized."
        );

        return null;
    }


    const session =
        await getCurrentSession();


    if (!session) {

        window.location.href =
            "login.html";

        return null;
    }


    return session.user;

}


/* =========================================================
   6. GET USER PROFILE
========================================================= */

function getUserProfile(user) {

    if (!user) {
        return null;
    }


    const metadata =
        user.user_metadata || {};


    /* -----------------------------------------
       NAME
    ----------------------------------------- */

    let name =
        metadata.full_name ||
        metadata.name ||
        "";


    if (!name) {

        const firstName =
            metadata.first_name ||
            metadata.firstName ||
            "";

        const lastName =
            metadata.last_name ||
            metadata.lastName ||
            "";

        name =
            `${firstName} ${lastName}`
                .trim();
    }


    if (!name) {

        name =
            user.email
                ?.split("@")[0] ||
            "User";

    }


    /* -----------------------------------------
       EMAIL
    ----------------------------------------- */

    const email =
        user.email || "";


    /* -----------------------------------------
       AVATAR
    ----------------------------------------- */

    const avatar =
        metadata.avatar_url ||
        metadata.picture ||
        metadata.avatar ||
        null;


    /* -----------------------------------------
       PROVIDER
    ----------------------------------------- */

    let provider =
        "email";


    if (
        user.app_metadata &&
        user.app_metadata.provider
    ) {

        provider =
            user.app_metadata.provider;

    }


    return {

        id:
            user.id,

        name,

        email,

        avatar,

        provider,

        createdAt:
            user.created_at || null

    };

}


/* =========================================================
   7. EMAIL + PASSWORD LOGIN
========================================================= */

async function loginWithEmail(
    email,
    password
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    email =
        String(email)
            .trim()
            .toLowerCase();


    password =
        String(password);


    if (!email) {

        throw new Error(
            "Please enter your email."
        );

    }


    if (!password) {

        throw new Error(
            "Please enter your password."
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithPassword({

                email,

                password

            });


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   8. REGISTER
========================================================= */

async function registerWithEmail({
    firstName,
    lastName,
    email,
    password,
    confirmPassword
}) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    firstName =
        String(firstName || "")
            .trim();


    lastName =
        String(lastName || "")
            .trim();


    email =
        String(email || "")
            .trim()
            .toLowerCase();


    password =
        String(password || "");


    confirmPassword =
        String(confirmPassword || "");


    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!firstName) {

        throw new Error(
            "Please enter your first name."
        );

    }


    if (!lastName) {

        throw new Error(
            "Please enter your last name."
        );

    }


    if (!email) {

        throw new Error(
            "Please enter your email."
        );

    }


    if (!isValidEmail(email)) {

        throw new Error(
            "Please enter a valid email address."
        );

    }


    if (password.length < 8) {

        throw new Error(
            "Password must contain at least 8 characters."
        );

    }


    if (password !== confirmPassword) {

        throw new Error(
            "Passwords do not match."
        );

    }


    /* -----------------------------------------
       FULL NAME
    ----------------------------------------- */

    const fullName =
        `${firstName} ${lastName}`
            .trim();


    /* -----------------------------------------
       SUPABASE SIGN UP
    ----------------------------------------- */

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signUp({

                email,

                password,

                options: {

                    data: {

                        first_name:
                            firstName,

                        last_name:
                            lastName,

                        full_name:
                            fullName,

                        name:
                            fullName

                    }

                }

            });


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   9. GOOGLE LOGIN
========================================================= */

async function loginWithGoogle() {

    return loginWithOAuth(
        "google"
    );

}


/* =========================================================
   10. FACEBOOK LOGIN
========================================================= */

async function loginWithFacebook() {

    return loginWithOAuth(
        "facebook"
    );

}


/* =========================================================
   11. APPLE LOGIN
========================================================= */

async function loginWithApple() {

    return loginWithOAuth(
        "apple"
    );

}


/* =========================================================
   12. GENERIC OAUTH LOGIN
========================================================= */

async function loginWithOAuth(
    provider
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    const allowedProviders = [
        "google",
        "facebook",
        "apple"
    ];


    if (
        !allowedProviders.includes(
            provider
        )
    ) {

        throw new Error(
            "Unsupported login provider."
        );

    }


    const redirectTo =
        `${window.location.origin}/dashboard.html`;


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithOAuth({

                provider,

                options: {

                    redirectTo,

                    queryParams:
                        provider === "google"
                            ? {
                                access_type:
                                    "offline",

                                prompt:
                                    "select_account"
                            }
                            : undefined

                }

            });


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   13. LOGOUT
========================================================= */

async function logoutUser() {

    if (!supabaseClient) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   14. PASSWORD RESET
========================================================= */

async function resetPassword(
    email
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    email =
        String(email || "")
            .trim()
            .toLowerCase();


    if (!isValidEmail(email)) {

        throw new Error(
            "Please enter a valid email address."
        );

    }


    const redirectTo =
        `${window.location.origin}/reset-password.html`;


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .resetPasswordForEmail(
                email,
                {
                    redirectTo
                }
            );


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   15. UPDATE PASSWORD
========================================================= */

async function updatePassword(
    newPassword
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    if (
        !newPassword ||
        newPassword.length < 8
    ) {

        throw new Error(
            "Password must contain at least 8 characters."
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .updateUser({

                password:
                    newPassword

            });


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   16. UPDATE PROFILE
========================================================= */

async function updateProfile({
    firstName,
    lastName
}) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase is not configured."
        );

    }


    const user =
        await getCurrentUser();


    if (!user) {

        throw new Error(
            "You are not logged in."
        );

    }


    firstName =
        String(firstName || "")
            .trim();


    lastName =
        String(lastName || "")
            .trim();


    const fullName =
        `${firstName} ${lastName}`
            .trim();


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .updateUser({

                data: {

                    first_name:
                        firstName,

                    last_name:
                        lastName,

                    full_name:
                        fullName,

                    name:
                        fullName

                }

            });


    if (error) {

        throw new Error(
            translateAuthError(
                error.message
            )
        );

    }


    return data;

}


/* =========================================================
   17. AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    "Auth event:",
                    event
                );


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentUser = null;

                    return;
                }


                if (
                    event ===
                        "SIGNED_IN" ||
                    event ===
                        "TOKEN_REFRESHED"
                ) {

                    if (
                        session?.user
                    ) {

                        currentUser =
                            session.user;

                        updateUserUIFromAuth(
                            session.user
                        );

                    }

                }

            }
        );

}


/* =========================================================
   18. UPDATE UI AFTER LOGIN
========================================================= */

function updateUserUIFromAuth(
    user
) {

    const profile =
        getUserProfile(user);


    if (!profile) return;


    setAuthText(
        "#userName",
        profile.name
    );


    setAuthText(
        "#userEmail",
        profile.email
    );


    setAuthText(
        "#menuUserName",
        profile.name
    );


    setAuthText(
        "#menuUserEmail",
        profile.email
    );


    setAuthText(
        "#settingsName",
        profile.name
    );


    setAuthText(
        "#settingsEmail",
        profile.email
    );


    setAuthAvatar(
        "#userAvatar",
        profile.avatar,
        profile.name
    );


    setAuthAvatar(
        "#topbarAvatar",
        profile.avatar,
        profile.name
    );


    setAuthAvatar(
        "#menuAvatar",
        profile.avatar,
        profile.name
    );


    setAuthAvatar(
        "#settingsAvatar",
        profile.avatar,
        profile.name
    );

}


/* =========================================================
   19. AUTH TEXT HELPER
========================================================= */

function setAuthText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value || "";

    }

}


/* =========================================================
   20. AUTH AVATAR HELPER
========================================================= */

function setAuthAvatar(
    selector,
    avatar,
    name
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    const letter =
        (
            name ||
            "U"
        )
            .trim()
            .charAt(0)
            .toUpperCase();


    if (!avatar) {

        element.innerHTML =
            letter;

        return;

    }


    element.innerHTML = "";


    const img =
        document.createElement(
            "img"
        );


    img.src =
        avatar;


    img.alt =
        name || "User";


    img.referrerPolicy =
        "no-referrer";


    img.onerror = () => {

        element.innerHTML =
            letter;

    };


    element.appendChild(
        img
    );

}


/* =========================================================
   21. EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   22. TRANSLATE SUPABASE ERRORS
========================================================= */

function translateAuthError(
    message
) {

    if (!message) {

        return "Authentication error.";

    }


    const text =
        message.toLowerCase();


    if (
        text.includes(
            "invalid login credentials"
        )
    ) {

        return "Email or password is incorrect.";

    }


    if (
        text.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email before logging in.";

    }


    if (
        text.includes(
            "user already registered"
        )
    ) {

        return "This email is already registered.";

    }


    if (
        text.includes(
            "password should be at least"
        )
    ) {

        return "Password is too short.";

    }


    if (
        text.includes(
            "rate limit"
        )
    ) {

        return "Too many attempts. Please try again later.";

    }


    if (
        text.includes(
            "network"
        )
    ) {

        return "Network error. Check your internet connection.";

    }


    return message;

}


/* =========================================================
   23. AUTO INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupAuthListener();

    }
);


/* =========================================================
   24. GLOBAL EXPORTS
=========================================================

   These functions can now be used by:
   login.html
   register.html
   app.js
   reset-password.html
========================================================= */

window.getCurrentSession =
    getCurrentSession;

window.getCurrentUser =
    getCurrentUser;

window.protectPage =
    protectPage;

window.getUserProfile =
    getUserProfile;

window.loginWithEmail =
    loginWithEmail;

window.registerWithEmail =
    registerWithEmail;

window.loginWithGoogle =
    loginWithGoogle;

window.loginWithFacebook =
    loginWithFacebook;

window.loginWithApple =
    loginWithApple;

window.loginWithOAuth =
    loginWithOAuth;

window.logoutUser =
    logoutUser;

window.resetPassword =
    resetPassword;

window.updatePassword =
    updatePassword;

window.updateProfile =
    updateProfile;