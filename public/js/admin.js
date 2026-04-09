// ============================================================
// Dopamine Travel — Admin Dashboard
// ============================================================

const API_BASE = '/api';
let allDestinations = []; // cache for city dropdown

async function apiFetch(url, opts = {}) {
  opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  return fetch(url, opts);
}

// ── Tab Navigation ──────────────────────────────────────────
document.querySelectorAll('.tab-link[data-view]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const view = link.dataset.view;

    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');

    // Load data for the selected tab
    if (view === 'destinations') loadDestinations();
    if (view === 'cities')       { loadCitiesList(); populateCityDestSelect(); populateSvcDestSelect(); loadServicesList(); }
    if (view === 'quotations')   loadQuotations();
    if (view === 'staff')        loadUsers();
  });
});

// ── Initialise ──────────────────────────────────────────────
function initDashboard() {
  loadDestinations();
}

window.addEventListener('load', () => {
  initDashboard();
});

// ── Alert utility ────────────────────────────────────────────
function showAlert(message, type = 'success') {
  const container = document.getElementById('alertContainer');
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

// ============================================================
// DESTINATIONS
// ============================================================

async function loadDestinations() {
  const body = document.getElementById('destinationsBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-on-surface-variant">Loading...</td></tr>';

  try {
    const res = await apiFetch(`${API_BASE}/admin/destinations`);
    const result = await res.json();

    if (result.success) {
      allDestinations = result.data;
      populateCityDestSelect();
      populateSvcDestSelect();

      if (result.data.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-on-surface-variant">No destinations found. Add your first destination!</td></tr>';
        return;
      }

      body.innerHTML = '';
      result.data.forEach(d => {
        const cityCount = Array.isArray(d.cities) ? d.cities.length : 0;
        const date = new Date(d.createdAt).toLocaleDateString();
        const cityBadges = (d.cities || []).slice(0, 3).map(c =>
          `<span class="inline-block text-[10px] font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full mr-1">${c}</span>`
        ).join('') + (cityCount > 3 ? `<span class="text-xs text-on-surface-variant">+${cityCount - 3}</span>` : '');

        body.innerHTML += `
          <tr class="group">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <span class="material-symbols-outlined" style="font-size:20px">location_on</span>
                </div>
                <div>
                  <p class="font-bold text-on-surface">${d.name}</p>
                  <p class="text-xs text-on-surface-variant">${d.description || ''}</p>
                </div>
              </div>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">${cityBadges || '<span class="text-xs text-on-surface-variant">No cities</span>'}</div>
            </td>
            <td>
              <span class="badge badge-featured">Active</span>
            </td>
            <td class="text-xs text-on-surface-variant">${date}</td>
            <td class="text-right">
              <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="action-btn action-btn-danger" onclick="deleteDestination('${d._id}')">
                  <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                </button>
              </div>
            </td>
          </tr>`;
      });
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    body.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-600 text-sm">${e.message}</td></tr>`;
  }
}

async function createDestination() {
  const name = document.getElementById('newDestName').value.trim();
  const desc = document.getElementById('newDestDesc').value.trim();
  if (!name) { showAlert('Please enter a destination name', 'error'); return; }

  try {
    const res = await apiFetch(`${API_BASE}/destinations`, {
      method: 'POST',
      body: JSON.stringify({ name, description: desc })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ "${name}" added successfully!`, 'success');
      document.getElementById('newDestName').value = '';
      document.getElementById('newDestDesc').value = '';
      loadDestinations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

// Modal version
function openAddDestModal() {
  document.getElementById('addDestModal').classList.remove('hidden');
  document.getElementById('modalDestName').focus();
}
function closeAddDestModal() {
  document.getElementById('addDestModal').classList.add('hidden');
}

async function createDestinationModal() {
  const name   = document.getElementById('modalDestName').value.trim();
  const desc   = document.getElementById('modalDestDesc').value.trim();
  const cities = document.getElementById('modalDestCities').value.split(',').map(c => c.trim()).filter(Boolean);

  if (!name) { showAlert('Destination name is required', 'error'); return; }

  try {
    const res = await apiFetch(`${API_BASE}/destinations`, {
      method: 'POST',
      body: JSON.stringify({ name, description: desc, cities })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ "${name}" created successfully!`, 'success');
      closeAddDestModal();
      document.getElementById('modalDestName').value = '';
      document.getElementById('modalDestDesc').value = '';
      document.getElementById('modalDestCities').value = '';
      loadDestinations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

async function deleteDestination(id) {
  if (!confirm('Delete this destination? This cannot be undone.')) return;
  try {
    const res = await apiFetch(`${API_BASE}/admin/destinations/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showAlert('Destination deleted', 'success');
      loadDestinations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

// ============================================================
// CITIES
// ============================================================

function populateCityDestSelect() {
  const select = document.getElementById('cityDestSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Select destination...</option>';
  allDestinations.forEach(d => {
    select.innerHTML += `<option value="${d._id}">${d.name}</option>`;
  });
  if (current) select.value = current;
}

async function addCityToDestination() {
  const destId = document.getElementById('cityDestSelect').value;
  const city   = document.getElementById('newCityName').value.trim();

  if (!destId) { showAlert('Please select a destination', 'error'); return; }
  if (!city)   { showAlert('Please enter a city name', 'error'); return; }

  const dest = allDestinations.find(d => d._id === destId);
  if (!dest) return;

  const existingCities = Array.isArray(dest.cities) ? dest.cities : [];
  if (existingCities.includes(city)) {
    showAlert(`"${city}" already exists in ${dest.name}`, 'error');
    return;
  }

  const updatedCities = [...existingCities, city];

  try {
    const res = await apiFetch(`${API_BASE}/destinations/${destId}`, {
      method: 'PUT',
      body: JSON.stringify({ cities: updatedCities })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ "${city}" added to ${dest.name}!`, 'success');
      document.getElementById('newCityName').value = '';
      // Update local cache
      const idx = allDestinations.findIndex(d => d._id === destId);
      if (idx !== -1) allDestinations[idx].cities = updatedCities;
      loadCitiesList();
      loadDestinations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

async function loadCitiesList() {
  const container = document.getElementById('citiesListContainer');
  if (!container) return;

  // Use cached destinations or fetch fresh
  let dests = allDestinations;
  if (!dests.length) {
    try {
      const res = await apiFetch(`${API_BASE}/admin/destinations`);
      const result = await res.json();
      if (result.success) { dests = result.data; allDestinations = dests; }
    } catch {}
  }

  if (!dests.length) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-4">No destinations found.</p>';
    return;
  }

  container.innerHTML = '';
  dests.forEach(d => {
    const cities = Array.isArray(d.cities) ? d.cities : [];
    container.innerHTML += `
      <div class="border-b border-outline-variant/20 pb-4 last:border-0">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-primary" style="font-size:16px">location_on</span>
          <p class="font-bold text-sm">${d.name}</p>
          <span class="text-xs text-on-surface-variant ml-auto">${cities.length} cities</span>
        </div>
        <div class="flex flex-wrap gap-1.5 pl-6">
          ${cities.length > 0
            ? cities.map(c => `
              <span class="inline-flex items-center gap-1 text-xs bg-surface-container px-2.5 py-1 rounded-full font-medium">
                ${c}
                <button onclick="removeCity('${d._id}','${c}')" class="text-on-surface-variant hover:text-error ml-0.5 transition-colors" title="Remove">
                  <span class="material-symbols-outlined" style="font-size:12px">close</span>
                </button>
              </span>`).join('')
            : '<span class="text-xs text-on-surface-variant italic">No cities yet</span>'}
        </div>
      </div>`;
  });
}

async function removeCity(destId, cityName) {
  if (!confirm(`Remove "${cityName}" from this destination?`)) return;
  const dest = allDestinations.find(d => d._id === destId);
  if (!dest) return;
  const updatedCities = (dest.cities || []).filter(c => c !== cityName);
  try {
    const res = await apiFetch(`${API_BASE}/destinations/${destId}`, {
      method: 'PUT',
      body: JSON.stringify({ cities: updatedCities })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`"${cityName}" removed`, 'success');
      const idx = allDestinations.findIndex(d => d._id === destId);
      if (idx !== -1) allDestinations[idx].cities = updatedCities;
      loadCitiesList();
      loadDestinations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

// ============================================================
// QUOTATIONS
// ============================================================

async function loadQuotations() {
  const body = document.getElementById('quotationsBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-on-surface-variant">Loading...</td></tr>';

  const params = new URLSearchParams({ limit: '50', sort: '-createdAt' });
  const dest   = document.getElementById('qFilterDest')?.value.trim();
  const status = document.getElementById('qFilterStatus')?.value;
  const dStart = document.getElementById('qFilterDateStart')?.value;
  const dEnd   = document.getElementById('qFilterDateEnd')?.value;
  if (dest)   params.set('destination', dest);
  if (status) params.set('status', status);
  if (dStart) params.set('startDate', dStart);
  if (dEnd)   params.set('endDate', dEnd);

  try {
    // Quotations list is public (no auth needed), but we try with auth anyway
    const res = await fetch(`${API_BASE}/quotations?${params}`);
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      body.innerHTML = '';
      result.data.forEach(q => {
        const date   = new Date(q.createdAt).toLocaleDateString();
        const status = q.status || 'draft';
        body.innerHTML += `
          <tr class="group">
            <td class="text-xs text-on-surface-variant">${date}</td>
            <td><span class="font-mono font-bold text-primary text-xs">${q.refId}</span></td>
            <td class="font-medium">${q.destination}</td>
            <td class="text-sm text-on-surface-variant">${q.userName || (q.staff?.sales) || '—'}</td>
            <td class="text-sm">A:${q.pax?.adults || 0} C:${q.pax?.children || 0}</td>
            <td class="text-right font-bold text-primary">${(q.total || 0).toFixed(2)}</td>
            <td><span class="badge badge-${status}">${status}</span></td>
            <td class="text-right">
              <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="action-btn action-btn-danger" onclick="deleteAdminQuotation('${q._id}')" title="Delete quotation">
                  <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                </button>
              </div>
            </td>
          </tr>`;
      });
    } else {
      body.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-on-surface-variant">No quotations found.</td></tr>';
    }
  } catch (e) {
    body.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-600 text-sm">${e.message}</td></tr>`;
  }
}

function clearQFilters() {
  ['qFilterDest', 'qFilterStatus', 'qFilterDateStart', 'qFilterDateEnd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  loadQuotations();
}

async function deleteAdminQuotation(id) {
  if (!confirm('Delete this quotation? This cannot be undone.')) return;
  try {
    const res = await apiFetch(`${API_BASE}/quotations/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showAlert('Quotation deleted', 'success');
      loadQuotations();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

function exportCSV() {
  fetch(`${API_BASE}/admin/export`)
    .then(res => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotations_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(e => showAlert(`❌ ${e.message}`, 'error'));
}

// ============================================================
// CITY SERVICES
// ============================================================

function populateSvcDestSelect() {
  const select = document.getElementById('svcDestSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Select destination...</option>';
  allDestinations.forEach(d => {
    select.innerHTML += `<option value="${d._id}">${d.name}</option>`;
  });
  if (current) select.value = current;
}

function populateSvcCitySelect() {
  const destId = document.getElementById('svcDestSelect')?.value;
  const select = document.getElementById('svcCitySelect');
  if (!select) return;
  select.innerHTML = '<option value="">Select city...</option>';
  if (!destId) return;
  const dest = allDestinations.find(d => d._id === destId);
  if (!dest) return;
  (dest.cities || []).forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

async function addCityService() {
  const destId = document.getElementById('svcDestSelect')?.value;
  const city   = document.getElementById('svcCitySelect')?.value;
  const name   = document.getElementById('newSvcName')?.value.trim();
  const type   = document.getElementById('newSvcType')?.value;
  const rate   = parseFloat(document.getElementById('newSvcRate')?.value) || 0;

  if (!destId) { showAlert('Please select a destination', 'error'); return; }
  if (!city)   { showAlert('Please select a city', 'error'); return; }
  if (!name)   { showAlert('Please enter a service name', 'error'); return; }

  const dest = allDestinations.find(d => d._id === destId);
  if (!dest) return;

  const existingServices = Array.isArray(dest.cityServices) ? dest.cityServices : [];
  const updatedServices  = [...existingServices, { city, name, type, rate }];

  try {
    const res = await apiFetch(`${API_BASE}/destinations/${destId}`, {
      method: 'PUT',
      body: JSON.stringify({ cityServices: updatedServices })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ Service "${name}" added to ${city}!`, 'success');
      document.getElementById('newSvcName').value = '';
      document.getElementById('newSvcRate').value = '';
      const idx = allDestinations.findIndex(d => d._id === destId);
      if (idx !== -1) allDestinations[idx].cityServices = updatedServices;
      loadServicesList();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

async function loadServicesList() {
  const container = document.getElementById('servicesListContainer');
  if (!container) return;

  let dests = allDestinations;
  if (!dests.length) {
    try {
      const res = await apiFetch(`${API_BASE}/admin/destinations`);
      const result = await res.json();
      if (result.success) { dests = result.data; allDestinations = dests; }
    } catch {}
  }

  const allServices = [];
  dests.forEach(d => {
    (d.cityServices || []).forEach((s, i) => {
      allServices.push({ destId: d._id, destName: d.name, svcIdx: i, ...s });
    });
  });

  if (!allServices.length) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-4">No services in catalog yet. Add your first service above.</p>';
    return;
  }

  // Group by destination
  const byDest = {};
  allServices.forEach(s => {
    if (!byDest[s.destName]) byDest[s.destName] = [];
    byDest[s.destName].push(s);
  });

  container.innerHTML = '';
  Object.entries(byDest).forEach(([destName, svcs]) => {
    const byCity = {};
    svcs.forEach(s => {
      if (!byCity[s.city]) byCity[s.city] = [];
      byCity[s.city].push(s);
    });

    let cityHtml = '';
    Object.entries(byCity).forEach(([city, citySvcs]) => {
      const svcItems = citySvcs.map(s => `
        <div class="flex items-center justify-between py-1.5">
          <div>
            <span class="text-sm font-medium text-on-surface">${s.name}</span>
            <span class="text-xs text-on-surface-variant ml-2">${s.type}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-primary">$${(s.rate || 0).toFixed(2)}</span>
            <button onclick="removeCityService('${s.destId}', ${s.svcIdx})"
                    class="p-1 text-on-surface-variant hover:text-error transition-colors rounded" title="Remove">
              <span class="material-symbols-outlined" style="font-size:14px">close</span>
            </button>
          </div>
        </div>`).join('');

      cityHtml += `
        <div class="mb-3">
          <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
            <span class="material-symbols-outlined" style="font-size:12px">location_on</span>${city}
          </p>
          <div class="pl-4 divide-y divide-outline-variant/20">${svcItems}</div>
        </div>`;
    });

    container.innerHTML += `
      <div class="border-b border-outline-variant/20 pb-4 last:border-0">
        <p class="font-bold text-sm text-primary mb-3">${destName}</p>
        ${cityHtml}
      </div>`;
  });
}

async function removeCityService(destId, svcIdx) {
  if (!confirm('Remove this service from the catalog?')) return;
  const dest = allDestinations.find(d => d._id === destId);
  if (!dest) return;
  const updatedServices = (dest.cityServices || []).filter((_, i) => i !== svcIdx);
  try {
    const res = await apiFetch(`${API_BASE}/destinations/${destId}`, {
      method: 'PUT',
      body: JSON.stringify({ cityServices: updatedServices })
    });
    const result = await res.json();
    if (result.success) {
      showAlert('Service removed', 'success');
      const idx = allDestinations.findIndex(d => d._id === destId);
      if (idx !== -1) allDestinations[idx].cityServices = updatedServices;
      loadServicesList();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

function exportServicesCsv() {
  fetch(`${API_BASE}/admin/export/catalog`)
    .then(res => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `services_catalog_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(e => showAlert(`❌ ${e.message}`, 'error'));
}

async function importServicesCsv(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('csv', file);

  try {
    showAlert('Importing services...', 'info');
    const res = await fetch(`${API_BASE}/admin/import/catalog`, { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ ${result.message}`, 'success');
      // Refresh cache
      const refreshRes = await apiFetch(`${API_BASE}/admin/destinations`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) allDestinations = refreshData.data;
      loadServicesList();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
  input.value = '';
}

// ============================================================
// STAFF / USERS
// ============================================================

async function loadUsers() {
  const body = document.getElementById('usersBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-on-surface-variant">Loading...</td></tr>';

  try {
    const res = await apiFetch(`${API_BASE}/admin/users`);
    const result = await res.json();

    if (result.success) {
      if (!result.data.length) {
        body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-on-surface-variant">No users found.</td></tr>';
        return;
      }
      body.innerHTML = '';
      result.data.forEach(u => {
        const initials = u.name ? u.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'U';
        body.innerHTML += `
          <tr class="group">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">${initials}</div>
                <span class="font-medium">${u.name}</span>
              </div>
            </td>
            <td class="text-sm text-on-surface-variant">${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-featured' : 'badge-standard'}">${u.role}</span></td>
            <td class="text-right">
              <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="action-btn action-btn-danger" onclick="deleteUser('${u._id}')">
                  <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                </button>
              </div>
            </td>
          </tr>`;
      });
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    body.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-600 text-sm">${e.message}</td></tr>`;
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  try {
    const res = await apiFetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showAlert('User deleted', 'success');
      loadUsers();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}

async function registerStaff() {
  const name     = document.getElementById('newStaffName').value.trim();
  const email    = document.getElementById('newStaffEmail').value.trim();
  const password = document.getElementById('newStaffPassword').value;
  const role     = document.getElementById('newStaffRole').value;

  if (!name || !email || !password) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  try {
    const res = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    const result = await res.json();
    if (result.success) {
      showAlert(`✅ "${name}" registered successfully!`, 'success');
      document.getElementById('newStaffName').value = '';
      document.getElementById('newStaffEmail').value = '';
      document.getElementById('newStaffPassword').value = '';
      loadUsers();
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  }
}
