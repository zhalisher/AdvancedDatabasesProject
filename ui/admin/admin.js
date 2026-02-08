// ui/admin/admin.js
document.addEventListener('DOMContentLoaded', () => {
  // selectors
  const actionSelector = document.getElementById('actionSelector');
  const typeSelector = document.getElementById('typeSelector');
  const masterForm = document.getElementById('masterForm');
  const submitBtn = document.getElementById('submitBtn');
  const searchResults = document.getElementById('search-results');
  const titleInput = document.getElementById('title');
  const genreInput = document.getElementById('genre');
  const dataFields = document.getElementById('dataFields');
  const tvFields = document.getElementById('tvSpecificFields');
  const currTitleGroup = document.getElementById('currTitleGroup');

  function redirectToLogin(msg) {
    if (msg) alert(msg);
    window.location.href = '/login.html?error=login_required';
  }

  function redirectForbidden(msg) {
    if (msg) alert(msg);
    window.location.href = '/main.html?error=forbidden';
  }


  async function apiFetch(url, options = {}) {
    const res = await fetch(url, options);

    if (res.status === 401) {
      redirectToLogin('Please log in as admin.');
      throw new Error('401 Unauthorized');
    }
    if (res.status === 403) {
      redirectForbidden('Admin access required.');
      throw new Error('403 Forbidden');
    }

    return res;
  }


  // dynamic controls (Exact title only)
  const selectControls = document.createElement('div');
  selectControls.id = 'selectControls';
  selectControls.className = 'mb-2 d-flex gap-2 align-items-center hidden';
  selectControls.innerHTML = `
    <label class="mb-0 text-white small">Exact title</label>
    <input id="exactControl" type="checkbox" />
  `;
  titleInput.parentNode.insertBefore(selectControls, titleInput.nextSibling);

  const exactCheckbox = document.getElementById('exactControl');

  // UI logic
  function toggleFields() {
    const action = actionSelector.value;
    const type = typeSelector.value;

    if (action === 'stats') {
      masterForm.classList.add('hidden');
      document.getElementById('typeGroup')?.classList.add('hidden');
      submitBtn.classList.add('hidden');
      selectControls.classList.add('hidden'); 
      searchResults.innerHTML = '';
      renderStats();
      return;
    }
    masterForm.classList.remove('hidden');
    document.getElementById('typeGroup')?.classList.remove('hidden');
    submitBtn.classList.remove('hidden');


    currTitleGroup.classList.toggle('hidden', action !== 'update');
    tvFields.classList.toggle('hidden', type !== 'tv');
    dataFields.classList.toggle('hidden', action === 'delete' || action === 'select');

    if (action === 'select') {
      selectControls.classList.remove('hidden');
    }else {
      selectControls.classList.add('hidden');
    }

    submitBtn.innerText = `${action.toUpperCase()} ${type.toUpperCase()}`;
    searchResults.innerHTML = '';
  }

  function fillForm(item) {
    currTitleGroup.classList.remove('hidden');

    const fields = ['title', 'poster', 'season', 'episode', 'description', 'genre', 'duration', 'iframe'];
    fields.forEach(f => {
      const el = document.getElementById(f);
      if (el) el.value = item[f] || '';
    });

    document.getElementById('CurrTitle').value = item.title || '';
    typeSelector.value = item.__type === 'tv' ? 'tv' : 'movie';
    actionSelector.value = 'update';

    toggleFields();
    window.scrollTo(0, 0);
  }

  function renderTable(items) {
    searchResults.innerHTML = '';

    if (!items || !items.length) {
      searchResults.innerHTML = '<p class="text-warning">No results</p>';
      return;
    }

    const row = document.createElement('div');
    row.className = 'row g-3';

    items.forEach(it => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-xl-4';

      const card = document.createElement('div');
      card.className = 'card bg-dark text-light h-100 border-secondary';

      const body = document.createElement('div');
      body.className = 'card-body p-3';

      const title = document.createElement('h5');
      title.className = 'card-title text-warning';
      title.innerText = it.title || '(no title)';
      body.appendChild(title);

      Object.entries(it).forEach(([key, value]) => {
        if (key === '_id' || key === 'title') return;
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);

        const row = document.createElement('div');
        row.className = 'small text-light';
        row.innerHTML = `<strong>${key}:</strong> ${value ?? ''}`;
        body.appendChild(row);
      });

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-warning mt-2';
      btn.innerText = 'Edit';
      btn.onclick = () => fillForm(it);

      body.appendChild(btn);
      card.appendChild(body);
      col.appendChild(card);
      row.appendChild(col);
    });

    searchResults.appendChild(row);
  }
  async function renderStats() {
  try {
    const res = await apiFetch('/api/stats/overview');

    if (!res.ok) {
      searchResults.innerHTML = `<p class="text-danger">Stats failed: HTTP ${res.status}</p>`;
      return;
    }

    const data = await res.json().catch(() => null);
    if (!data) {
      searchResults.innerHTML = '<p class="text-danger">Stats error: invalid JSON</p>';
      return;
    }

    searchResults.innerHTML = `
      <div class="card bg-dark text-white p-3 border-secondary">
        <h4 class="mb-3">Database Overview</h4>
        <p><b>Movies:</b> ${data.totals.movies}</p>
        <p><b>TV Series:</b> ${data.totals.tvSeries}</p>
        <p><b>Users:</b> ${data.totals.users}</p>
        <p><b>Total Likes:</b> ${data.totals.likes}</p>

        <hr class="border-secondary">
        <h5 class="mt-2">Top 5 Liked</h5>

        <div class="mt-2">
          ${(data.topLiked || []).map(t => `
            <div class="d-flex justify-content-between small py-1 border-bottom border-secondary">
              <span>${t._id?.type} - ${t._id?.itemId}</span>
              <span class="text-warning">${t.likes} likes</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) {
    console.error(e);
    // если редирект уже случился — ок. Но если нет, покажем текст
    if (!document.hidden) searchResults.innerHTML = '<p class="text-danger">Stats failed</p>';
  }
}

  // API select
  async function performSelect() {
    if (actionSelector.value !== 'select') return;

    const payload = {
      title: titleInput.value.trim(),
      type: typeSelector.value,
      genre: genreInput.value.trim(),
      exact: exactCheckbox.checked
    };

    try {
      const res = await apiFetch('/api/admin/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const items = await res.json().catch(() => []);
      renderTable(items);

      if (exactCheckbox.checked && items.length === 1) {
        searchResults.insertAdjacentHTML('afterbegin', '<p class="text-success small">Exact match found</p>');
      }
    } catch (err) {
      console.error(err);
      // no JSON shown
      searchResults.innerHTML = '<p class="text-danger">Error loading results</p>';
    }
  }

  // submit
  masterForm.addEventListener('submit', async e => {
    e.preventDefault();

    const action = actionSelector.value;
    const type = typeSelector.value;
    const payload = {};

    const ids = ['CurrTitle', 'title', 'poster', 'season', 'episode', 'description', 'genre', 'duration', 'iframe'];
    ids.forEach(f => {
      const el = document.getElementById(f);
      if (el && el.value) payload[f] = el.value;
    });

    if (action === 'delete') payload.type = type;

    const endpoint =
      action === 'insert'
        ? (type === 'tv' ? '/api/admin/inserttv' : '/api/admin/insert')
        : action === 'update'
        ? (type === 'tv' ? '/api/admin/updatetv' : '/api/admin/update')
        : '/api/admin/delete';

    const method =
      action === 'update' ? 'PUT' :
      action === 'delete' ? 'DELETE' :
      'POST';

    try {
      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`${action.toUpperCase()} OK`);
        if (action !== 'select') masterForm.reset();
        performSelect();
      } else {
        // no JSON shown
        alert('Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  });

  // events
  actionSelector.addEventListener('change', toggleFields);
  typeSelector.addEventListener('change', toggleFields);
  titleInput.addEventListener('input', performSelect);
  exactCheckbox.addEventListener('change', performSelect);

  toggleFields();
});
