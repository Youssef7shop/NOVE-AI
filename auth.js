/* =========================================================================
   auth.js — Phase 1 (demo) auth for login.html
   Nothing here talks to a real server yet. It only stores a mock user
   object in localStorage so index.html has something to display, and
   redirects like a real login flow would.

   PHASE 2: replace the bodies of handleOAuth() and handleSubmit() with real
   Supabase Auth calls. Example shape (after adding the Supabase JS SDK):

     const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     const { data, error } = await supabase.auth.signUp({ email, password });

   See README.md → "Phase 2" for the full checklist.
   ========================================================================= */

let mode = 'login'; // or 'signup'

function toggleMode() {
  mode = mode === 'login' ? 'signup' : 'login';
  const isSignup = mode === 'signup';

  document.getElementById('formTitle').textContent = isSignup ? 'Create your account' : 'Welcome back';
  document.getElementById('formSubtitle').textContent = isSignup
    ? 'A free plan is included — upgrade any time.'
    : 'Sign in to continue to your workspace.';
  document.getElementById('nameField').style.display = isSignup ? 'flex' : 'none';
  document.getElementById('fullName').required = isSignup;
  document.getElementById('submitBtn').textContent = isSignup ? 'Create account' : 'Sign in';
  document.getElementById('toggleWrap').innerHTML = isSignup
    ? `Already have an account? <button type="button" onclick="toggleMode()">Sign in</button>`
    : `Don't have an account? <button type="button" onclick="toggleMode()">Sign up</button>`;
  hideError();
}

function handleOAuth(provider) {
  // Demo-only: pretend the OAuth round trip happened and log the person in.
  showToast(`Signing in with ${provider} (demo)…`);
  const user = {
    name: `${provider} User`,
    email: `demo.${provider.toLowerCase()}@example.com`,
    plan: 'free',
    provider,
    messagesUsedToday: 6,
  };
  localStorage.setItem('chatai_user', JSON.stringify(user));
  setTimeout(() => { window.location.href = 'index.html'; }, 550);
}

function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('fullName').value.trim();

  if (!email || !password) {
    showError('Please fill in both email and password.');
    return;
  }
  if (mode === 'signup' && !name) {
    showError('Please tell us your name.');
    return;
  }

  const user = {
    name: name || email.split('@')[0],
    email,
    plan: 'free',
    provider: 'email',
    messagesUsedToday: 6,
  };
  localStorage.setItem('chatai_user', JSON.stringify(user));
  window.location.href = 'index.html';
}

function showError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.add('show');
}
function hideError() {
  document.getElementById('authError').classList.remove('show');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}