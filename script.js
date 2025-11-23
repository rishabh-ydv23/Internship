// script.js
// Fetches users from RandomUser API, renders cards, provides search and nationality filter.
// Written with clarity & comments for easy customization.

// ----- Config -----
const API_URL = 'https://randomuser.me/api/?results=24&nat=us,gb,ca,au,nl,fr,de,es,br,dk,ie,fi,nz,ch,be,tr';
const cardsContainer = document.getElementById('cardsContainer');
const spinner = document.getElementById('spinner');
const messageEl = document.getElementById('message');
const searchInput = document.getElementById('searchInput');
const natFilter = document.getElementById('natFilter');
const refreshBtn = document.getElementById('refreshBtn');

let users = [];      // full fetched set
let filtered = [];   // current filtered set

// --- Utils ---
function showSpinner(show = true) {
  spinner.style.display = show ? 'flex' : 'none';
  spinner.setAttribute('aria-hidden', String(!show));
}

function showMessage(text = '', isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#ffb4b4' : '';
}

// Debounce helper to avoid filtering on every keystroke instantly
function debounce(fn, wait = 200){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// --- Rendering ---
function createUserCard(u){
  // Build DOM for one user card
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="avatar">
      <img src="${u.picture.large}" alt="Avatar of ${u.name.first} ${u.name.last}" loading="lazy">
    </div>
    <div class="info">
      <div class="name">${escapeHtml(u.name.first)} ${escapeHtml(u.name.last)} <span class="badge">${u.nat}</span></div>
      <div class="meta">
        <span title="Email">✉️ ${escapeHtml(u.email)}</span>
        <span title="Phone">📞 ${escapeHtml(u.phone)}</span>
      </div>
      <div class="card-footer">
        <div class="meta">${escapeHtml(u.location.city)}, ${escapeHtml(u.location.country)} • ${u.dob.age} yrs</div>
      </div>
    </div>
  `;
  return card;
}

function renderList(list){
  cardsContainer.innerHTML = '';
  if (!list.length) {
    showMessage('No results match your search / filter.');
    return;
  }
  showMessage('');
  const frag = document.createDocumentFragment();
  list.forEach(u => frag.appendChild(createUserCard(u)));
  cardsContainer.appendChild(frag);
}

// Simple HTML escaping for safety (though data is trusted here)
function escapeHtml(s){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- Fetching data ---
async function fetchUsers(){
  showMessage('');
  showSpinner(true);
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`);
    }
    const data = await res.json();
    // RandomUser returns `{ results: [...] }`
    if (!data.results) throw new Error('Unexpected API response shape.');
    users = data.results;
    filtered = users.slice();
    renderList(filtered);
  } catch (err) {
    console.error('Fetch error:', err);
    showMessage('Failed to load data. Try again or check your connection.', true);
    cardsContainer.innerHTML = '';
  } finally {
    showSpinner(false);
  }
}

// --- Filtering & searching ---
function applyFilters(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const nat = (natFilter.value || '').toUpperCase();

  filtered = users.filter(u => {
    // combine searchable fields
    const name = `${u.name.first} ${u.name.last}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const anywhere = `${name} ${email} ${u.location.city} ${u.location.country}`.toLowerCase();

    const matchesQuery = !q || anywhere.includes(q);
    const matchesNat = !nat || u.nat.toUpperCase() === nat;
    return matchesQuery && matchesNat;
  });

  renderList(filtered);
}

// Debounced input handler
const debouncedFilter = debounce(applyFilters, 180);

// --- Wiring events ---
searchInput.addEventListener('input', debouncedFilter);
natFilter.addEventListener('change', applyFilters);
refreshBtn.addEventListener('click', () => {
  // refetch new users
  fetchUsers();
});

// --- On load ---
document.addEventListener('DOMContentLoaded', () => {
  // First load
  fetchUsers();
});
