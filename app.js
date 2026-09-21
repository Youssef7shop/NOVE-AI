/* =========================================================================
   app.js — Phase 1 (frontend demo) behavior for index.html
   Everything here is client-side only: chat replies are canned, images are
   placeholders, kanban/projects live in memory. Search "PHASE 2" for every
   spot that should be swapped for a real Supabase / Gemini API call.
   ========================================================================= */

let state = {
  user: null,
  mediaTab: 'image',
  kanban: {
    todo: [
      { id: cid(), text: 'Design the pricing page' },
      { id: cid(), text: 'Pick a name: ChatAI vs Niveau AI' },
    ],
    inprogress: [
      { id: cid(), text: 'Wire up Supabase Auth (Google, email)' },
      { id: cid(), text: 'Write the database schema' },
    ],
    done: [
      { id: cid(), text: 'Ship the Phase 1 frontend' },
      { id: cid(), text: 'Sketch the sidebar navigation' },
    ],
  },
  projects: [
    { id: cid(), name: 'Bakery landing page', desc: 'One-page site with menu, hours and a contact form.', updated: '2 days ago' },
    { id: cid(), name: 'Portfolio v2', desc: 'Personal portfolio rebuild with a project gallery.', updated: '5 days ago' },
  ],
  codeFiles: {
    'app.js': [
      'function sendMessage() {',
      '  const text = chatInput.value.trim();',
      '  if (!text) return;',
      '  appendMessage("user", text);',
      '  chatInput.value = "";',
      '  showTyping();',
      '  setTimeout(() => {',
      '    hideTyping();',
      '    appendMessage("assistant", pickDemoReply());',
      '  }, 700);',
      '}',
    ],
    'style.css': [
      ':root {',
      '  --bg-app: #15151a;',
      '  --accent: #ef9857;',
      '  --accent-cool: #5b8def;',
      '  --radius-md: 14px;',
      '}',
    ],
    'index.html': [
      '<button class="nav-item active" data-view="chat">',
      '  <svg class="icon"><use href="#i-chat"/></svg> Chat',
      '</button>',
      '<section class="view active" id="view-chat">',
      '  ...',
      '</section>',
    ],
  },
  activeCodeFile: 'app.js',
};

const demoReplies = [
  "Here's a first pass — once Phase 2 is wired up, this reply will come straight from the Gemini API instead of this demo text.",
  "Good idea. In the real version I'd pull this from your saved conversation in Supabase and answer with full context.",
  "Noted — this is a placeholder so you can see the chat flow end to end before the backend is connected.",
  "That's doable. Once the server-side proxy is live (see backend/server.js), this is where a real answer would appear.",
];

/* ---------------- init ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  renderResultsGrid(true);
  renderExploreGrid();
  renderKanban();
  renderProjects();
  renderFileTree();
  selectCodeFile(state.activeCodeFile);
  wireOverlayClickToClose();
});

function cid() { return 'c' + Math.random().toString(36).slice(2, 9); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function wireOverlayClickToClose() {
  document.querySelectorAll('.modal-overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.hidden = true; });
  });
}
function closeModal(id) { document.getElementById(id).hidden = true; }

/* ---------------- user / profile ---------------- */
function loadUser() {
  // PHASE 2: replace with supabase.auth.getUser() / onAuthStateChange().
  let user;
  try { user = JSON.parse(localStorage.getItem('chatai_user')); } catch (e) { user = null; }
  if (!user) {
    user = { name: 'Guest', email: 'guest@demo.local', plan: 'free', provider: 'email', messagesUsedToday: 6 };
    localStorage.setItem('chatai_user', JSON.stringify(user));
  }
  state.user = user;
  paintUser();
}

function paintUser() {
  const u = state.user;
  const initial = (u.name || '?').trim().charAt(0).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = u.name;
  document.getElementById('profileEmail').textContent = u.email;
  document.getElementById('profileProvider').textContent = u.provider === 'email' ? 'Email & password' : u.provider;

  const isPro = u.plan === 'pro';
  document.getElementById('sidebarPlan').textContent = isPro ? 'Pro plan' : 'Free plan';
  document.getElementById('profilePlanBadge').textContent = isPro ? 'Pro' : 'Free';

  if (isPro) {
    document.getElementById('usageMiniText').textContent = 'Unlimited';
    document.getElementById('profileUsageText').textContent = 'Unlimited';
    document.getElementById('usageFill').style.width = '100%';
  } else {
    const used = u.messagesUsedToday || 0;
    document.getElementById('usageMiniText').textContent = `${used}/20`;
    document.getElementById('profileUsageText').textContent = `${used} / 20`;
    document.getElementById('usageFill').style.width = Math.min(100, (used / 20) * 100) + '%';
  }
}

function logout() {
  localStorage.removeItem('chatai_user');
  window.location.href = 'login.html';
}

/* ---------------- view switching ---------------- */
function switchView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === name));
  if (window.innerWidth <= 860) document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

/* ---------------- chat ---------------- */
function newChat() {
  document.getElementById('chatInner').innerHTML = `
    <div class="chat-empty" id="chatEmpty">
      <span class="brand-mark">A</span>
      <h3>What are we building today?</h3>
      <p>Ask for a website, an idea, or a piece of code — or try one of these.</p>
      <div class="suggestion-chips">
        <button class="chip" onclick="sendSuggestion('Build me a one-page site for a bakery')">Build a bakery landing page</button>
        <button class="chip" onclick="sendSuggestion('Give me 5 name ideas for my AI app')">Name ideas for my app</button>
        <button class="chip" onclick="sendSuggestion('Explain how Supabase Auth works')">Explain Supabase Auth</button>
      </div>
    </div>`;
  switchView('chat');
}

function loadHistoryDemo(title) {
  document.getElementById('chatInner').innerHTML = '';
  appendMessage('user', title);
  appendMessage('assistant', pickDemoReply());
  switchView('chat');
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(160, el.scrollHeight) + 'px';
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const empty = document.getElementById('chatEmpty');
  if (empty) empty.remove();

  appendMessage('user', text);
  input.value = '';
  input.style.height = 'auto';

  bumpUsage();
  showTyping();

  // PHASE 2: replace this timeout with a fetch() to your own /api/chat
  // endpoint (backend/server.js), which calls the Gemini API server-side.
  setTimeout(() => {
    hideTyping();
    appendMessage('assistant', pickDemoReply());
  }, 700 + Math.random() * 500);
}

function pickDemoReply() { return demoReplies[Math.floor(Math.random() * demoReplies.length)]; }

function appendMessage(role, text) {
  const wrap = document.getElementById('chatInner');
  const row = document.createElement('div');
  row.className = 'msg ' + role;
  row.innerHTML = `
    <span class="msg-avatar">${role === 'user' ? (state.user.name || '?').charAt(0).toUpperCase() : '<svg class="icon icon-sm"><use href="#i-chat"/></svg>'}</span>
    <span class="msg-bubble"></span>`;
  row.querySelector('.msg-bubble').textContent = text;
  wrap.appendChild(row);
  document.getElementById('chatScroll').scrollTop = document.getElementById('chatScroll').scrollHeight;
}

function showTyping() {
  const wrap = document.getElementById('chatInner');
  const row = document.createElement('div');
  row.className = 'msg assistant';
  row.id = 'typingRow';
  row.innerHTML = `<span class="msg-avatar"><svg class="icon icon-sm"><use href="#i-chat"/></svg></span>
    <span class="msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></span>`;
  wrap.appendChild(row);
  document.getElementById('chatScroll').scrollTop = document.getElementById('chatScroll').scrollHeight;
}
function hideTyping() { const r = document.getElementById('typingRow'); if (r) r.remove(); }

function bumpUsage() {
  if (state.user.plan === 'pro') return;
  state.user.messagesUsedToday = (state.user.messagesUsedToday || 0) + 1;
  localStorage.setItem('chatai_user', JSON.stringify(state.user));
  paintUser();
}

/* ---------------- images & video ---------------- */
function setMediaTab(tab, btn) {
  state.mediaTab = tab;
  document.querySelectorAll('.media-tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mediaPrompt').placeholder = tab === 'video'
    ? 'A 5-second loop of tea steaming in a Moroccan glass…'
    : 'A copper-toned poster for a Moroccan tea brand…';
}

function renderResultsGrid(seedSamples) {
  const grid = document.getElementById('resultsGrid');
  grid.innerHTML = '';
  if (seedSamples) {
    for (let i = 1; i <= 3; i++) addResultCard('image', `Sample result ${i}`);
  }
}

function addResultCard(kind, label) {
  const grid = document.getElementById('resultsGrid');
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `<svg class="icon-lg"><use href="#i-${kind === 'video' ? 'video' : 'image'}"/></svg><span></span>`;
  card.querySelector('span').textContent = label;
  grid.prepend(card);
}

function generateMedia() {
  const promptEl = document.getElementById('mediaPrompt');
  const text = promptEl.value.trim();
  if (!text) { toast('Type a prompt first'); return; }
  // PHASE 2: send `text` to your server, which calls an image/video model
  // and returns a real URL instead of this placeholder tile.
  addResultCard(state.mediaTab, text.length > 34 ? text.slice(0, 34) + '…' : text);
  promptEl.value = '';
  toast('Demo placeholder added — real generation connects in Phase 2');
}

/* ---------------- explore ---------------- */
const exploreSeed = [
  { title: 'Minimal recipe card app', author: 'Yasmine', likes: 142, hue: 24 },
  { title: 'Souk-themed portfolio', author: 'Reda', likes: 98, hue: 200 },
  { title: 'Budget tracker widget', author: 'Salma', likes: 76, hue: 300 },
  { title: 'AI trip planner for Fes', author: 'Omar', likes: 211, hue: 150 },
  { title: 'Arabic typography poster set', author: 'Nour', likes: 64, hue: 40 },
  { title: 'Kanban for freelancers', author: 'Imane', likes: 53, hue: 260 },
];
function renderExploreGrid() {
  const grid = document.getElementById('exploreGrid');
  grid.innerHTML = '';
  exploreSeed.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'explore-card';
    card.innerHTML = `
      <div class="explore-thumb" style="background:linear-gradient(140deg, hsl(${item.hue} 70% 55%), hsl(${item.hue + 40} 70% 40%))"></div>
      <div class="explore-body">
        <span class="explore-title"></span>
        <div class="explore-meta">
          <span class="explore-author"><span class="explore-avatar"></span><span></span></span>
          <span class="explore-likes"><svg class="icon icon-sm"><use href="#i-heart"/></svg><span></span></span>
        </div>
      </div>`;
    card.querySelector('.explore-title').textContent = item.title;
    card.querySelector('.explore-author span:last-child').textContent = item.author;
    card.querySelector('.explore-likes span').textContent = item.likes;
    grid.appendChild(card);
  });
}

/* ---------------- planning (kanban) ---------------- */
const kanbanCols = [
  { key: 'todo', label: 'To do' },
  { key: 'inprogress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];
function renderKanban() {
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';
  kanbanCols.forEach((col) => {
    const el = document.createElement('div');
    el.className = 'kanban-col';
    el.dataset.col = col.key;
    el.innerHTML = `
      <div class="kanban-col-head">
        <span class="kanban-col-title">${col.label} <span class="badge badge-neutral">${state.kanban[col.key].length}</span></span>
      </div>
      <div class="kanban-cards" data-col="${col.key}"></div>
      <div class="kanban-add-wrap"><button class="btn btn-ghost btn-block" style="justify-content:flex-start;font-size:13px;" onclick="addCard('${col.key}')"><svg class="icon icon-sm"><use href="#i-plus"/></svg> Add task</button></div>`;
    board.appendChild(el);

    const cardsWrap = el.querySelector('.kanban-cards');
    cardsWrap.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
    cardsWrap.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    cardsWrap.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const cardId = e.dataTransfer.getData('text/plain');
      moveCard(cardId, col.key);
    });

    state.kanban[col.key].forEach((card) => cardsWrap.appendChild(buildKanbanCard(card)));
  });
}
function buildKanbanCard(card) {
  const el = document.createElement('div');
  el.className = 'kanban-card';
  el.draggable = true;
  el.textContent = card.text;
  el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', card.id); el.classList.add('dragging'); });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  return el;
}
function moveCard(cardId, destCol) {
  let card, sourceCol;
  for (const key of Object.keys(state.kanban)) {
    const idx = state.kanban[key].findIndex((c) => c.id === cardId);
    if (idx > -1) { card = state.kanban[key][idx]; sourceCol = key; state.kanban[key].splice(idx, 1); break; }
  }
  if (!card) return;
  state.kanban[destCol].push(card);
  renderKanban();
}
function addCard(colKey) {
  const text = window.prompt('Task description:');
  if (!text || !text.trim()) return;
  state.kanban[colKey].push({ id: cid(), text: text.trim() });
  renderKanban();
}

/* ---------------- projects ---------------- */
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';
  state.projects.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <span class="project-icon"><svg class="icon"><use href="#i-folder"/></svg></span>
      <span class="project-name"></span>
      <span class="project-desc"></span>
      <span class="project-meta"></span>`;
    card.querySelector('.project-name').textContent = p.name;
    card.querySelector('.project-desc').textContent = p.desc;
    card.querySelector('.project-meta').textContent = 'Updated ' + p.updated;
    card.addEventListener('click', () => { newChat(); toast(`Opening "${p.name}" — project-scoped chat arrives in Phase 2`); });
    grid.appendChild(card);
  });
  const addCardEl = document.createElement('div');
  addCardEl.className = 'project-card new-project';
  addCardEl.innerHTML = `<svg class="icon-lg"><use href="#i-plus"/></svg><span>New project</span>`;
  addCardEl.addEventListener('click', openProjectModal);
  grid.appendChild(addCardEl);
}
function openProjectModal() {
  document.getElementById('newProjectName').value = '';
  document.getElementById('newProjectDesc').value = '';
  document.getElementById('projectModal').hidden = false;
}
function createProject() {
  const name = document.getElementById('newProjectName').value.trim();
  const desc = document.getElementById('newProjectDesc').value.trim();
  if (!name) { toast('Give the project a name first'); return; }
  state.projects.unshift({ id: cid(), name, desc: desc || 'No description yet.', updated: 'just now' });
  renderProjects();
  closeModal('projectModal');
  toast('Project created');
}

/* ---------------- code viewer ---------------- */
function renderFileTree() {
  const tree = document.getElementById('fileTree');
  tree.innerHTML = '';
  Object.keys(state.codeFiles).forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'file-item' + (name === state.activeCodeFile ? ' active' : '');
    btn.innerHTML = `<svg class="icon icon-sm"><use href="#i-code"/></svg><span></span>`;
    btn.querySelector('span').textContent = name;
    btn.onclick = () => selectCodeFile(name);
    tree.appendChild(btn);
  });
}
function selectCodeFile(name) {
  state.activeCodeFile = name;
  document.getElementById('codeFileName').textContent = name;
  document.querySelectorAll('.file-item').forEach((b) => b.classList.toggle('active', b.textContent.trim() === name));
  const body = document.getElementById('codeBody');
  body.innerHTML = '';
  state.codeFiles[name].forEach((line, i) => {
    const row = document.createElement('div');
    row.className = 'code-line';
    row.innerHTML = `<span class="code-line-num"></span><span class="code-line-text"></span>`;
    row.querySelector('.code-line-num').textContent = i + 1;
    row.querySelector('.code-line-text').textContent = line;
    body.appendChild(row);
  });
}
function codeAsk() {
  const input = document.getElementById('codeAskInput');
  if (!input.value.trim()) return;
  toast('Connects to a live code assistant once the Phase 2 backend is running');
  input.value = '';
}

/* ---------------- pricing ---------------- */
function openPricing() { document.getElementById('pricingModal').hidden = false; }
function mockUpgrade() {
  state.user.plan = 'pro';
  localStorage.setItem('chatai_user', JSON.stringify(state.user));
  paintUser();
  closeModal('pricingModal');
  toast('Upgraded to Pro (demo) — no real payment was made');
}