// ============================================================
// Dopamine Travel Quotation System — Main Application
// ============================================================

const API_BASE = '/api';
let editingId = null; // Track if we're editing an existing quotation
let currentUploadId = null; // Track the current quotation being uploaded to
let currentItemPhotosInput = null; // Track item-level photo input being filled
let allCityServices = []; // Cache of city services from destination catalog

// ===== INITIALIZATION =====
async function init() {
    const connected = await checkAPI();
    if (connected) {
        await Promise.all([loadDestinations(), loadStaff(), loadHistory()]);
    }
    setupEventListeners();
    setupPhotoUploadListener();
    setupItemPhotoUploadListener();
    calculateTotal();
}

async function checkAPI() {
    const el = document.getElementById('apiStatus');
    try {
        const res = await fetch('/health');
        const data = await res.json();
        if (data.success) {
            el.innerHTML = '<div class="status-dot"></div><span>✅ Connected to API</span>';
            el.classList.remove('error');
            return true;
        }
    } catch (e) {
        el.innerHTML = '<span>❌ API Not Connected — Make sure the server is running</span>';
        el.classList.add('error');
    }
    return false;
}

// ===== DATA LOADING =====
async function loadDestinations() {
    try {
        const res = await fetch(`${API_BASE}/destinations`);
        const data = await res.json();

        const destList = document.getElementById('destinationsList');
        const citiesList = document.getElementById('citiesList');
        const hotelsList = document.getElementById('hotelsList');

        if (destList) destList.innerHTML = '';
        if (citiesList) citiesList.innerHTML = '';
        if (hotelsList) hotelsList.innerHTML = '';

        if (data.success && data.data) {
            allCityServices = [];
            data.data.forEach(d => {
                if (destList) destList.innerHTML += `<option value="${d.name}"></option>`;
                if (d.cities) {
                    d.cities.forEach(c => {
                        if (citiesList && !citiesList.innerHTML.includes(`value="${c}"`)) {
                            citiesList.innerHTML += `<option value="${c}"></option>`;
                        }
                    });
                }
                if (d.hotels) {
                    d.hotels.forEach(h => {
                        if (hotelsList && !hotelsList.innerHTML.includes(`value="${h.name}"`)) {
                            hotelsList.innerHTML += `<option value="${h.name}"></option>`;
                        }
                    });
                }
                if (d.cityServices) {
                    d.cityServices.forEach(s => allCityServices.push({ ...s, destName: d.name }));
                }
            });
        }
    } catch (e) {
        showAlert('Failed to load destinations', 'error');
    }
}

async function loadStaff() {
    try {
        const res = await fetch(`${API_BASE}/staff`);
        const data = await res.json();

        const usersList = document.getElementById('usersList');
        if (usersList) usersList.innerHTML = '';

        if (data.success && data.data) {
            data.data.forEach(s => {
                if (usersList && !usersList.innerHTML.includes(`value="${s.name}"`)) {
                    usersList.innerHTML += `<option value="${s.name}"></option>`;
                }
            });
        }
    } catch (e) {
        showAlert('Failed to load staff', 'error');
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Dates → auto-calculate nights + enforce min + regenerate itinerary
    document.getElementById('startDate').addEventListener('change', function () {
        updateEndDateMin();
        calcNights();
    });
    document.getElementById('endDate').addEventListener('change', calcNights);

    // Nights editable → recalculate endDate
    document.getElementById('nights').addEventListener('input', calcEndDate);

    // Children count → show age inputs
    document.getElementById('chd').addEventListener('input', updateChildrenAges);

    // Hotel table delegation
    document.getElementById('hotelBody').addEventListener('change', function (e) {
        const row = e.target.closest('tr');
        if (!row) return;
        if (e.target.classList.contains('h-checkin')) {
            updateHotelCheckoutMin(row);
            autoCheckout(row);
        }
        if (e.target.classList.contains('h-nights')) {
            autoCheckout(row);
        }
        if (e.target.classList.contains('h-checkout')) {
            reverseCalcHotelNights(row);
        }
        if (e.target.classList.contains('h-cost')) {
            calculateTotal();
        }
    });

    // Pax change → update car types for transfer services
    document.getElementById('adt').addEventListener('input', updateAllCarTypes);
    document.getElementById('chd').addEventListener('input', updateAllCarTypes);
}

// ===== NIGHTS CALCULATION =====
function calcNights() {
    const s = new Date(document.getElementById('startDate').value);
    const e = new Date(document.getElementById('endDate').value);
    const nightsEl = document.getElementById('nights');
    if (s && e && e > s) {
        nightsEl.value = Math.ceil((e - s) / 86400000);
    } else {
        nightsEl.value = 0;
    }
    syncFirstHotelCheckin();
    generateItineraryDays();
}

// Enforce endDate min = startDate + 1; clear endDate if it became invalid
function updateEndDateMin() {
    const startVal = document.getElementById('startDate').value;
    const endEl = document.getElementById('endDate');
    if (!startVal) return;
    const minDate = new Date(startVal);
    minDate.setDate(minDate.getDate() + 1);
    const minStr = minDate.toISOString().split('T')[0];
    endEl.min = minStr;
    if (endEl.value && endEl.value <= startVal) {
        endEl.value = '';
        document.getElementById('nights').value = 0;
    }
}

// Nights input changed → recalculate endDate
function calcEndDate() {
    const startVal = document.getElementById('startDate').value;
    const nights = parseInt(document.getElementById('nights').value) || 0;
    if (!startVal || nights < 1) return;
    const end = new Date(startVal);
    end.setDate(end.getDate() + nights);
    document.getElementById('endDate').value = end.toISOString().split('T')[0];
    generateItineraryDays();
}

function syncFirstHotelCheckin() {
    const mainStart = document.getElementById('startDate').value;
    if (!mainStart) return;
    const firstHotelCheckin = document.querySelector('#hotelBody tr:first-child .h-checkin');
    if (firstHotelCheckin && !firstHotelCheckin.value) {
        firstHotelCheckin.value = mainStart;
        autoCheckout(firstHotelCheckin.closest('tr'));
    }
}

// ===== CHILDREN AGES =====
function updateChildrenAges() {
    const count = parseInt(document.getElementById('chd').value) || 0;
    const container = document.getElementById('childrenAgesContainer');

    if (count <= 0) {
        container.innerHTML = '';
        return;
    }

    // Preserve existing ages
    const existingAges = [];
    container.querySelectorAll('.child-age-input').forEach(input => {
        existingAges.push(input.value);
    });

    let html = '<div class="children-ages-row">';
    for (let i = 0; i < count; i++) {
        const age = existingAges[i] || '';
        html += `
      <div class="age-item">
        <label>Child ${i + 1} Age</label>
        <input type="number" class="child-age-input" min="0" max="17" value="${age}" placeholder="Age">
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

// ===== HOTEL FUNCTIONS =====
function updateHotelCheckoutMin(row) {
    const checkin = row.querySelector('.h-checkin').value;
    const checkoutEl = row.querySelector('.h-checkout');
    if (!checkin) return;
    const min = new Date(checkin);
    min.setDate(min.getDate() + 1);
    const minStr = min.toISOString().split('T')[0];
    checkoutEl.min = minStr;
    if (checkoutEl.value && checkoutEl.value <= checkin) checkoutEl.value = '';
}

function autoCheckout(row) {
    const checkin = row.querySelector('.h-checkin').value;
    const nights = parseInt(row.querySelector('.h-nights').value) || 0;
    if (checkin && nights > 0) {
        const d = new Date(checkin);
        d.setDate(d.getDate() + nights);
        row.querySelector('.h-checkout').value = d.toISOString().split('T')[0];
    }
}

// Checkout changed directly → reverse-calc nights
function reverseCalcHotelNights(row) {
    const ci = row.querySelector('.h-checkin').value;
    const co = row.querySelector('.h-checkout').value;
    if (ci && co && co > ci) {
        row.querySelector('.h-nights').value = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
    }
    calculateTotal();
}

function addHotel() {
    const tbody = document.getElementById('hotelBody');
    const first = tbody.rows[0];
    const newRow = first.cloneNode(true);
    newRow.querySelectorAll('input').forEach(inp => {
        if (inp.type === 'number') inp.value = inp.classList.contains('h-nights') ? 1 : 0;
        else inp.value = '';
    });
    newRow.querySelector('.h-mealplan').value = 'RO';
    tbody.appendChild(newRow);
}

// ===== ITINERARY DAY CARDS =====

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function generateItineraryDays(force = false, skipAutoFill = false) {
    const startVal = document.getElementById('startDate').value;
    const endVal   = document.getElementById('endDate').value;
    const container = document.getElementById('itineraryDaysContainer');
    if (!container) return;

    if (!startVal || !endVal || endVal <= startVal) {
        container.innerHTML = `
          <div id="itineraryPlaceholder" class="py-14 text-center bg-surface-container-lowest rounded-xl text-on-surface-variant">
            <span class="material-symbols-outlined block mb-2" style="font-size:40px">event_note</span>
            <p class="text-sm">Set check-in and check-out dates above to generate the itinerary.</p>
          </div>`;
        return;
    }

    // If already has user-added services and not forced, preserve existing cards
    if (!force && container.querySelector('.service-entry')) return;

    const startDate = new Date(startVal);
    const endDate   = new Date(endVal);
    const nights    = Math.ceil((endDate - startDate) / 86400000);
    const totalDays = nights + 1;

    container.innerHTML = '';

    for (let i = 0; i < totalDays; i++) {
        const dayDate  = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + i);
        const isFirst  = i === 0;
        const isLast   = i === totalDays - 1;
        const dayName  = DAY_NAMES[dayDate.getDay()];
        const dateStr  = dayDate.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
        const dayLabel = isFirst ? 'Arrival Day' : isLast ? 'Departure Day' : `Day ${i + 1}`;

        const card = document.createElement('div');
        card.className = 'day-card';
        card.dataset.dayIndex = i;
        card.innerHTML = `
          <div class="day-card-header">
            <div>
              <div class="day-num">Day ${String(i + 1).padStart(2, '0')} — ${dayName}</div>
              <div class="day-title">${dayLabel}</div>
            </div>
            <div class="day-date">${dateStr}</div>
          </div>
          <div class="day-services" id="day-services-${i}">
            ${(!isFirst && !isLast) ? '<p class="free-day-label">Free Day — no services scheduled</p>' : ''}
          </div>
          <button type="button" class="add-day-service-btn" onclick="addServiceToDay(${i})">
            <span class="material-symbols-outlined" style="font-size:16px">add_circle</span>
            Add Service for Day ${i + 1}
          </button>`;
        container.appendChild(card);

        // Auto-fill first and last day with airport transfers (skipped when loading saved quotation)
        if (!skipAutoFill) {
            if (isFirst) {
                addServiceToDay(i, { type: 'AirportTransfer', source: 'Airport', destination: 'Hotel', pickupTime: '' });
            } else if (isLast) {
                addServiceToDay(i, { type: 'AirportTransfer', source: 'Hotel', destination: 'Airport', pickupTime: '' });
            }
        }
    }

    syncItineraryTextarea();
}

function addServiceToDay(dayIndex, prefill) {
    const container = document.getElementById(`day-services-${dayIndex}`);
    if (!container) return;

    // Remove "free day" placeholder if present
    const placeholder = container.querySelector('.free-day-label');
    if (placeholder) placeholder.remove();

    const entry = document.createElement('div');
    entry.className = 'service-entry';
    const typeVal = (prefill && prefill.type) || 'AirportTransfer';
    entry.innerHTML = buildServiceHTML(typeVal, prefill);
    container.appendChild(entry);

    const typeSelect = entry.querySelector('.svc-type');
    typeSelect.addEventListener('change', function () {
        entry.querySelector('.service-fields').innerHTML = buildServiceFields(this.value, null);
        attachServiceFieldListeners(entry);
        const carInput = entry.querySelector('.svc-carType');
        if (carInput) carInput.value = getDefaultCarType();
        recalcServiceTotal(entry);
    });

    attachServiceFieldListeners(entry);

    const carInput = entry.querySelector('.svc-carType');
    if (carInput && !prefill) carInput.value = getDefaultCarType();

    recalcServiceTotal(entry);
}

// Build hidden textarea text from day structure (used for PDF compat)
function syncItineraryTextarea() {
    const container = document.getElementById('itineraryDaysContainer');
    const textarea  = document.getElementById('itinerary');
    if (!container || !textarea) return;
    const lines = [];
    container.querySelectorAll('.day-card').forEach(card => {
        const title = card.querySelector('.day-title')?.textContent || '';
        const date  = card.querySelector('.day-date')?.textContent || '';
        lines.push(`${title} (${date})`);
        card.querySelectorAll('.service-entry').forEach(entry => {
            const type = entry.querySelector('.svc-type')?.value || '';
            const src  = entry.querySelector('.svc-source')?.value || '';
            const dst  = entry.querySelector('.svc-destination')?.value || '';
            const det  = entry.querySelector('.svc-details')?.value || '';
            if (src && dst) lines.push(`  - ${type}: ${src} → ${dst}`);
            else if (det)   lines.push(`  - ${type}: ${det}`);
            else            lines.push(`  - ${type}`);
        });
        const freeLbl = card.querySelector('.free-day-label');
        if (freeLbl) lines.push('  - Free Day');
        lines.push('');
    });
    textarea.value = lines.join('\n').trim();
}

// ===== SERVICE FUNCTIONS =====

// Service type config: defines which fields each service type needs
const SERVICE_CONFIG = {
    AirportTransfer: {
        label: '🚗 Airport Transfer',
        fields: ['source', 'destination', 'carType', 'pickupTime', 'rate']
    },
    DayTour: {
        label: '🗺️ Day Tour',
        fields: ['details', 'carType', 'startTime', 'duration', 'rate']
    },
    HotelTransfer: {
        label: '🚌 Hotel / Station Transfer',
        fields: ['source', 'destination', 'carType', 'pickupTime', 'rate']
    },
    TourGuide: {
        label: '🧑‍🏫 Tour Guide',
        fields: ['details', 'duration', 'rate']
    },
    Visa: {
        label: '📄 Visa Service',
        fields: ['details', 'pax', 'rate']
    },
    CarRental: {
        label: '🚘 Car Rental',
        fields: ['carType', 'pickupLocation', 'pickupTime', 'dropoffLocation', 'dropoffTime', 'rate']
    },
    Other: {
        label: '📝 Other Service',
        fields: ['details', 'rate']
    }
};

// Field display names + input types
const FIELD_META = {
    source: { label: 'Pick-up From', type: 'text', placeholder: 'e.g. Airport' },
    destination: { label: 'Drop-off To', type: 'text', placeholder: 'e.g. Hotel' },
    details: { label: 'Details', type: 'text', placeholder: 'Service details' },
    carType: { label: 'Car Type', type: 'text', placeholder: 'Sedan / Van / Sprinter' },
    pickupTime: { label: 'Pick-up Time', type: 'time', placeholder: '' },
    startTime: { label: 'Start Time', type: 'time', placeholder: '' },
    dropoffTime: { label: 'Drop-off Time', type: 'time', placeholder: '' },
    pickupLocation: { label: 'Pick-up Location', type: 'text', placeholder: 'Location' },
    dropoffLocation: { label: 'Drop-off Location', type: 'text', placeholder: 'Location' },
    duration: { label: 'Duration', type: 'text', placeholder: 'e.g. 4 hours' },
    pax: { label: 'Pax', type: 'number', placeholder: '1' },
    rate: { label: 'Rate', type: 'number', placeholder: '0.00' }
};

function getDefaultCarType() {
    const adults = parseInt(document.getElementById('adt').value) || 1;
    const children = parseInt(document.getElementById('chd').value) || 0;
    const total = adults + children;
    if (total <= 2) return 'Sedan';
    if (total <= 6) return 'Van';
    return 'Sprinter';
}

function updateAllCarTypes() {
    const carType = getDefaultCarType();
    // Only update fields that haven't been manually edited
    document.querySelectorAll('.svc-carType').forEach(inp => {
        if (!inp.dataset.manuallyEdited) {
            inp.value = carType;
        }
    });
}

function addService(prefill) {
    const container = document.getElementById('servicesContainer');
    const entry = document.createElement('div');
    entry.className = 'service-entry';

    const typeVal = (prefill && prefill.type) || 'AirportTransfer';

    entry.innerHTML = buildServiceHTML(typeVal, prefill);
    container.appendChild(entry);

    // Attach type-change listener
    const typeSelect = entry.querySelector('.svc-type');
    typeSelect.addEventListener('change', function () {
        const fields = entry.querySelector('.service-fields');
        fields.innerHTML = buildServiceFields(this.value, null);
        attachServiceFieldListeners(entry);
        // Set default car type for new type if applicable
        const carInput = entry.querySelector('.svc-carType');
        if (carInput) {
            carInput.value = getDefaultCarType();
        }
        recalcServiceTotal(entry);
    });

    attachServiceFieldListeners(entry);

    // Auto-set car type
    const carInput = entry.querySelector('.svc-carType');
    if (carInput && !prefill) {
        carInput.value = getDefaultCarType();
    }

    recalcServiceTotal(entry);
}

function buildCatalogOptions() {
    if (!allCityServices.length) return '<option value="">No catalog services yet</option>';
    const opts = ['<option value="">— Load from catalog —</option>'];
    // Group by city
    const byCityMap = {};
    allCityServices.forEach((s, i) => {
        const key = `${s.destName} / ${s.city}`;
        if (!byCityMap[key]) byCityMap[key] = [];
        byCityMap[key].push({ ...s, idx: i });
    });
    Object.entries(byCityMap).forEach(([label, svcs]) => {
        opts.push(`<optgroup label="${label}">`);
        svcs.forEach(s => {
            opts.push(`<option value="${s.idx}">${s.name} — $${(s.rate || 0).toFixed(2)}</option>`);
        });
        opts.push('</optgroup>');
    });
    return opts.join('');
}

function applyCatalogService(select) {
    const idx = parseInt(select.value);
    if (isNaN(idx) || idx < 0) return;
    const svc = allCityServices[idx];
    if (!svc) return;

    const entry = select.closest('.service-entry');

    // Set service type if valid
    const typeSelect = entry.querySelector('.svc-type');
    if (svc.type && SERVICE_CONFIG[svc.type] && typeSelect.value !== svc.type) {
        typeSelect.value = svc.type;
        entry.querySelector('.service-fields').innerHTML = buildServiceFields(svc.type, null);
        attachServiceFieldListeners(entry);
    }

    // Fill details / name
    const detailsInput = entry.querySelector('.svc-details');
    if (detailsInput) detailsInput.value = svc.name;

    // Set rate (fixed from catalog)
    const rateInput = entry.querySelector('.svc-rate');
    if (rateInput) {
        rateInput.value = svc.rate || 0;
        rateInput.dataset.catalogRate = svc.rate || 0;
    }

    recalcServiceTotal(entry);
    calculateTotal();
}

function buildServiceHTML(type, prefill) {
    const typeOptions = Object.entries(SERVICE_CONFIG)
        .map(([k, v]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${v.label}</option>`)
        .join('');

    const existingPhotos = (prefill && prefill.photos) ? prefill.photos : [];
    const photosPreviewHTML = `<div class="item-photos-preview" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
      ${existingPhotos.map(p => `<img src="${p}" style="height:48px;width:64px;object-fit:cover;border-radius:4px;" loading="lazy">`).join('')}
    </div>`;

    return `
    <div class="service-entry-header">
      <select class="svc-catalog" onchange="applyCatalogService(this)" style="font-size:12px;background:#f3f3fc;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;max-width:220px;flex-shrink:0;">${buildCatalogOptions()}</select>
      <select class="svc-type">${typeOptions}</select>
      <button class="btn btn-sm btn-ghost attach-btn" type="button" onclick="attachItemPhoto(this, 'service')" title="Attach Photo">📷${existingPhotos.length > 0 ? ` (${existingPhotos.length})` : ''}</button>
      <input type="hidden" class="s-photos" value='${JSON.stringify(existingPhotos)}'>
      <button class="btn btn-sm btn-danger" type="button" onclick="removeService(this)">✕ Remove</button>
    </div>
    ${photosPreviewHTML}
    <div class="service-fields">${buildServiceFields(type, prefill)}</div>
    <div class="service-total-row">
      <span style="color:var(--text-muted);font-size:12px;">Service Total:</span>
      <span class="total-val svc-total-display">0.00</span>
    </div>`;
}

function buildServiceFields(type, prefill) {
    const config = SERVICE_CONFIG[type];
    if (!config) return '';

    return config.fields.map(field => {
        const meta = FIELD_META[field];
        const val = (prefill && prefill[field] !== undefined) ? prefill[field] : '';
        const inputType = meta.type;

        return `
      <div class="form-group">
        <label>${meta.label}</label>
        <input type="${inputType}" 
               class="svc-${field}" 
               placeholder="${meta.placeholder}" 
               value="${val}"
               ${inputType === 'number' ? 'min="0" step="0.01"' : ''}>
      </div>`;
    }).join('');
}

function attachServiceFieldListeners(entry) {
    // Listen for rate/pax changes to recalc total
    entry.querySelectorAll('.svc-rate, .svc-pax').forEach(inp => {
        inp.addEventListener('input', () => {
            recalcServiceTotal(entry);
            calculateTotal();
        });
    });

    // Mark car type as manually edited when user changes it
    const carInput = entry.querySelector('.svc-carType');
    if (carInput) {
        carInput.addEventListener('input', () => {
            carInput.dataset.manuallyEdited = 'true';
        });
    }
}

function recalcServiceTotal(entry) {
    const rate = parseFloat(entry.querySelector('.svc-rate')?.value) || 0;
    const paxInput = entry.querySelector('.svc-pax');
    const pax = paxInput ? (parseFloat(paxInput.value) || 1) : 1;
    const total = rate * pax;
    const display = entry.querySelector('.svc-total-display');
    if (display) display.textContent = total.toFixed(2);
    calculateTotal();
}

function removeService(btn) {
    const entry = btn.closest('.service-entry');
    const dayContainer = entry.closest('[id^="day-services-"]');
    entry.remove();
    if (dayContainer && dayContainer.querySelectorAll('.service-entry').length === 0) {
        dayContainer.innerHTML = '<p class="free-day-label">Free Day — no services scheduled</p>';
    }
    calculateTotal();
}

// ===== GENERIC ROW REMOVE =====
function removeRow(btn, tableType) {
    const tbody = btn.closest('tbody');
    if (tbody.rows.length > 1) {
        btn.closest('tr').remove();
        calculateTotal();
    } else {
        showAlert('At least one row must remain', 'error');
    }
}

// ===== TOTAL CALCULATION =====
function calculateTotal() {
    let total = 0;
    // Hotels
    document.querySelectorAll('#hotelBody .h-cost').forEach(inp => {
        total += parseFloat(inp.value) || 0;
    });
    // Services
    document.querySelectorAll('.svc-total-display').forEach(el => {
        total += parseFloat(el.textContent) || 0;
    });
    document.getElementById('grandTotal').textContent = total.toFixed(2);
}

// ===== SAVE QUOTATION =====
async function saveQuotation() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = '💾 Saving...';

    try {
        const data = collectFormData();
        validate(data);

        const url = editingId
            ? `${API_BASE}/quotations/${editingId}`
            : `${API_BASE}/quotations`;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            const action = editingId ? 'updated' : 'created';
            showAlert(`✅ Quotation ${result.data.refId} ${action} successfully!`, 'success');
            document.getElementById('refId').textContent = result.data.refId;

            // Stay in edit mode to allow overwriting
            editingId = result.data._id;
            document.getElementById('editBanner').classList.add('active');
            document.getElementById('editingRefId').textContent = result.data.refId;
            document.getElementById('cancelBtn').style.display = 'inline-flex';

            loadHistory();
            return result.data;
        } else {
            throw new Error(result.message || result.errors?.join(', ') || 'Failed to save');
        }
    } catch (e) {
        showAlert(`❌ ${e.message}`, 'error');
        return null;
    } finally {
        btn.disabled = false;
        btn.textContent = editingId ? '💾 Update Quotation' : '💾 Save Quotation';
    }
}

function collectFormData() {
    const data = {
        destination: document.getElementById('destination').value,
        dates: {
            start: document.getElementById('startDate').value,
            end: document.getElementById('endDate').value,
            nights: parseInt(document.getElementById('nights').value) || 0
        },
        pax: {
            adults: parseInt(document.getElementById('adt').value) || 1,
            children: parseInt(document.getElementById('chd').value) || 0,
            childrenAges: []
        },
        userName: document.getElementById('userName').value.trim(),
        hotels: [],
        services: [],
        itinerary: document.getElementById('itinerary').value
    };

    // Children ages
    document.querySelectorAll('.child-age-input').forEach(inp => {
        data.pax.childrenAges.push(parseInt(inp.value) || 0);
    });

    // Hotels
    document.querySelectorAll('#hotelBody tr').forEach(row => {
        const city = row.querySelector('.h-city').value.trim();
        const hotel = row.querySelector('.h-name').value.trim();
        if (city && hotel) {
            const photosInput = row.querySelector('.h-photos');
            let photos = [];
            if (photosInput && photosInput.value) photos = JSON.parse(photosInput.value);

            data.hotels.push({
                city,
                hotel,
                checkIn: row.querySelector('.h-checkin').value,
                nights: parseInt(row.querySelector('.h-nights').value) || 1,
                checkOut: row.querySelector('.h-checkout').value,
                roomType: row.querySelector('.h-roomtype').value.trim(),
                rooms: parseInt(row.querySelector('.h-rooms')?.value) || 1,
                mealPlan: row.querySelector('.h-mealplan').value,
                cost: parseFloat(row.querySelector('.h-cost').value) || 0,
                cancellationPolicy: row.querySelector('.h-cancel').value.trim(),
                photos
            });
        }
    });

    // Services — iterate day containers if they exist, else fall back to flat .service-entry
    const dayContainers = document.querySelectorAll('[id^="day-services-"]');
    const collectEntry = (entry, dayIndex) => {
        const type = entry.querySelector('.svc-type').value;
        const config = SERVICE_CONFIG[type];
        if (!config) return;

        const svc = { type };
        if (dayIndex !== undefined) svc.day = dayIndex + 1;
        config.fields.forEach(field => {
            const inp = entry.querySelector(`.svc-${field}`);
            if (!inp) return;
            if (field === 'rate' || field === 'pax') {
                svc[field] = parseFloat(inp.value) || 0;
            } else {
                svc[field] = inp.value;
            }
        });

        const rate = svc.rate || 0;
        const pax = svc.pax || 1;
        svc.total = rate * pax;

        const hasContent = config.fields.some(f => {
            if (f === 'rate' || f === 'pax') return svc[f] > 0;
            return svc[f] && svc[f].toString().trim() !== '';
        });

        if (hasContent) {
            const photosInput = entry.querySelector('.s-photos');
            if (photosInput && photosInput.value) svc.photos = JSON.parse(photosInput.value);
            data.services.push(svc);
        }
    };

    if (dayContainers.length > 0) {
        dayContainers.forEach(container => {
            const dayIndex = parseInt(container.id.replace('day-services-', ''));
            container.querySelectorAll('.service-entry').forEach(entry => collectEntry(entry, dayIndex));
        });
    } else {
        document.querySelectorAll('.service-entry').forEach(entry => collectEntry(entry));
    }

    syncItineraryTextarea();

    return data;
}

function validate(data) {
    if (!data.destination) throw new Error('Please select a destination');
    if (!data.dates.start || !data.dates.end) throw new Error('Please select check-in and check-out dates');
    if (!data.userName) throw new Error('Please enter a User Name');
    if (data.hotels.length === 0) throw new Error('Please add at least one hotel');
}

// ===== HISTORY =====
async function loadHistory() {
    const body = document.getElementById('historyBody');
    const loading = document.getElementById('historyLoading');
    loading.style.display = 'block';
    body.innerHTML = '';

    try {
        // Build query params from filters
        const params = new URLSearchParams({ limit: '20', sort: '-createdAt' });
        const dest = document.getElementById('filterDest').value.trim();
        const staff = document.getElementById('filterStaff').value.trim();
        const dateStart = document.getElementById('filterDateStart').value;
        const dateEnd = document.getElementById('filterDateEnd').value;

        if (dest) params.set('destination', dest);
        if (staff) params.set('sales', staff);
        if (dateStart) params.set('startDate', dateStart);
        if (dateEnd) params.set('endDate', dateEnd);

        const res = await fetch(`${API_BASE}/quotations?${params}`);
        const data = await res.json();
        loading.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            // Client-side cost filtering
            const minCost = parseFloat(document.getElementById('filterMinCost').value) || 0;
            const maxCost = parseFloat(document.getElementById('filterMaxCost').value) || Infinity;

            const filtered = data.data.filter(q => q.total >= minCost && q.total <= maxCost);

            if (filtered.length === 0) {
                body.innerHTML = '<tr><td colspan="8" class="loading-msg">No quotations match your filters</td></tr>';
                return;
            }

            filtered.forEach(q => {
                const date = new Date(q.createdAt).toLocaleDateString();
                const row = document.createElement('tr');
                row.innerHTML = `
          <td>${date}</td>
          <td><strong style="color:var(--primary-light)">${q.refId}</strong></td>
          <td>${q.destination}</td>
          <td style="font-size:12px">${q.userName || (q.staff ? q.staff.sales : 'N/A')}</td>
          <td>A:${q.pax.adults} C:${q.pax.children}</td>
          <td style="font-weight:700;color:var(--accent)">${q.total.toFixed(2)}</td>
          <td><span class="status-badge ${q.status}">${q.status}</span></td>
          <td>
            <div class="history-actions">
              <button class="btn btn-sm btn-ghost" onclick="editQuotation('${q._id}')" title="Edit">✏️</button>
              <button class="btn btn-sm btn-ghost" onclick="copyQuotation('${q._id}')" title="Copy">📋</button>
              <button class="btn btn-sm btn-ghost" onclick="uploadPhotos('${q._id}')" title="Upload Photos">📸</button>
              <button class="btn btn-sm btn-ghost" onclick="exportPDF('${q._id}')" title="Export PDF">📄</button>
            </div>
          </td>`;
                body.appendChild(row);
            });
        } else {
            body.innerHTML = '<tr><td colspan="8" class="loading-msg">No quotations found</td></tr>';
        }
    } catch (e) {
        loading.style.display = 'none';
        body.innerHTML = '<tr><td colspan="8" class="loading-msg" style="color:var(--danger)">Failed to load quotations</td></tr>';
    }
}

function clearFilters() {
    ['filterDest', 'filterStaff', 'filterDateStart', 'filterDateEnd', 'filterMinCost', 'filterMaxCost']
        .forEach(id => document.getElementById(id).value = '');
    loadHistory();
}

// ===== EDIT QUOTATION =====
async function editQuotation(id) {
    try {
        const res = await fetch(`${API_BASE}/quotations/${id}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        const q = result.data;
        editingId = id;

        // Show edit banner
        document.getElementById('editBanner').classList.add('active');
        document.getElementById('editingRefId').textContent = q.refId;
        document.getElementById('refId').textContent = q.refId;
        document.getElementById('saveBtn').textContent = '💾 Update Quotation';

        // Populate basic info
        document.getElementById('destination').value = q.destination;
        document.getElementById('startDate').value = q.dates.start?.split('T')[0] || '';
        document.getElementById('endDate').value = q.dates.end?.split('T')[0] || '';
        document.getElementById('nights').value = q.dates.nights;
        document.getElementById('adt').value = q.pax.adults;
        document.getElementById('chd').value = q.pax.children;
        document.getElementById('userName').value = q.userName || '';
        document.getElementById('salesStaff').value = q.staff?.sales || '';
        document.getElementById('opsStaff').value = q.staff?.ops || '';
        document.getElementById('itinerary').value = q.itinerary || '';

        // Children ages
        updateChildrenAges();
        if (q.pax.childrenAges && q.pax.childrenAges.length > 0) {
            const ageInputs = document.querySelectorAll('.child-age-input');
            q.pax.childrenAges.forEach((age, i) => {
                if (ageInputs[i]) ageInputs[i].value = age;
            });
        }

        // Hotels
        const hotelBody = document.getElementById('hotelBody');
        hotelBody.innerHTML = '';
        q.hotels.forEach(h => {
            const row = createHotelRow(h);
            hotelBody.appendChild(row);
        });

        // Services — rebuild day cards (no auto-fill), then distribute each service to its correct day
        generateItineraryDays(true, true);
        if (q.services && q.services.length > 0) {
            const typeMap = { 'Transport': 'AirportTransfer', 'Guide': 'TourGuide', 'Ticket': 'DayTour', 'Insurance': 'Other' };
            q.services.forEach(s => {
                const mappedType = typeMap[s.type] || s.type;
                const finalType = SERVICE_CONFIG[mappedType] ? mappedType : 'Other';
                const prefill = { ...s, type: finalType };
                if (!SERVICE_CONFIG[mappedType]) prefill.details = `${s.type}: ${s.details || ''}`;
                // s.day is 1-based; convert to 0-based dayIndex
                const dayIndex = (s.day != null && s.day > 0) ? s.day - 1 : 0;
                const dayContainer = document.getElementById(`day-services-${dayIndex}`);
                if (dayContainer) {
                    addServiceToDay(dayIndex, prefill);
                } else {
                    // day out of range — put it on the last available day
                    const allContainers = document.querySelectorAll('[id^="day-services-"]');
                    const lastIdx = allContainers.length > 0
                        ? parseInt(allContainers[allContainers.length - 1].id.replace('day-services-', ''))
                        : 0;
                    addServiceToDay(lastIdx, prefill);
                }
            });
        }

        // Attachments
        const attachmentsCard = document.getElementById('attachmentsCard');
        const attachmentsContainer = document.getElementById('attachmentsContainer');
        if (q.photos && q.photos.length > 0) {
            attachmentsCard.style.display = 'block';
            attachmentsContainer.innerHTML = '';
            q.photos.forEach(photoUrl => {
                attachmentsContainer.innerHTML += `<img src="${photoUrl}" style="height:120px; border-radius:8px; object-fit:cover;">`;
            });
        } else {
            attachmentsCard.style.display = 'none';
        }

        calculateTotal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        showAlert(`❌ Failed to load quotation: ${e.message}`, 'error');
    }
}

function createHotelRow(h) {
    const row = document.createElement('tr');
    const checkin = h.checkIn ? new Date(h.checkIn).toISOString().split('T')[0] : '';
    const checkout = h.checkOut ? new Date(h.checkOut).toISOString().split('T')[0] : '';

    const mealOptions = ['RO', 'BB', 'HB', 'FB', 'AI', 'Iftar', 'Suhur']
        .map(m => `<option value="${m}" ${m === (h.mealPlan || 'RO') ? 'selected' : ''}>${m}</option>`)
        .join('');

    const existingHotelPhotos = h.photos || [];
    const hotelPhotoPreview = existingHotelPhotos.length > 0
        ? `<div class="item-photos-preview" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">${existingHotelPhotos.map(p => `<img src="${p}" style="height:36px;width:48px;object-fit:cover;border-radius:3px;" loading="lazy">`).join('')}</div>`
        : '';

    row.innerHTML = `
    <td><input type="text" class="h-city hotel-input" list="citiesList" value="${h.city || ''}"></td>
    <td><input type="text" class="h-name hotel-input" value="${h.hotel || ''}"></td>
    <td><input type="date" class="h-checkin hotel-input" value="${checkin}"></td>
    <td><input type="number" class="h-nights hotel-input" value="${h.nights || 1}" min="1" style="width:56px"></td>
    <td><input type="date" class="h-checkout hotel-input" value="${checkout}"></td>
    <td><input type="text" class="h-roomtype hotel-input" value="${h.roomType || ''}"></td>
    <td><input type="number" class="h-rooms hotel-input" value="${h.rooms || 1}" min="1" style="width:56px"></td>
    <td><select class="h-mealplan hotel-input">${mealOptions}</select></td>
    <td><input type="number" class="h-cost hotel-input text-right" value="${h.cost || 0}" min="0" step="0.01" style="width:90px"></td>
    <td><input type="text" class="h-cancel hotel-input" value="${h.cancellationPolicy || ''}"></td>
    <td>
      <button class="btn btn-sm btn-ghost attach-btn" type="button" onclick="attachItemPhoto(this, 'hotel')" title="Attach Photo">📷${existingHotelPhotos.length > 0 ? ` (${existingHotelPhotos.length})` : ''}</button>
      <input type="hidden" class="h-photos" value='${JSON.stringify(existingHotelPhotos)}'>
      <button class="btn btn-sm btn-danger" type="button" onclick="removeRow(this,'hotel')">✕</button>
      ${hotelPhotoPreview}
    </td>`;
    return row;
}

function cancelEdit() {
    editingId = null;
    document.getElementById('editBanner').classList.remove('active');
    document.getElementById('refId').textContent = 'NEW QUOTATION';
    document.getElementById('saveBtn').textContent = '💾 Save Quotation';
    document.getElementById('attachmentsCard').style.display = 'none';
    resetForm();
}

// ===== COPY QUOTATION =====
async function copyQuotation(id) {
    try {
        const res = await fetch(`${API_BASE}/quotations/${id}/copy`, { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            showAlert(`✅ ${result.message}`, 'success');
            loadHistory();
            // Load the copy into the form for editing
            editQuotation(result.data._id);
        } else {
            throw new Error(result.message);
        }
    } catch (e) {
        showAlert(`❌ Failed to copy: ${e.message}`, 'error');
    }
}

// ===== RESET FORM =====
function resetForm() {
    document.getElementById('destination').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('nights').value = 0;
    document.getElementById('adt').value = 1;
    document.getElementById('chd').value = 0;
    document.getElementById('userName').value = '';
    document.getElementById('itinerary').value = '';
    document.getElementById('childrenAgesContainer').innerHTML = '';

    // Reset hotels to one empty row
    const hotelBody = document.getElementById('hotelBody');
    hotelBody.innerHTML = '';
    hotelBody.appendChild(createHotelRow({}));

    // Reset itinerary
    document.getElementById('itineraryDaysContainer').innerHTML =
        '<div id="itineraryPlaceholder" class="py-14 text-center text-on-surface-variant">' +
        '<span class="material-symbols-outlined block mb-2" style="font-size:40px">event_note</span>' +
        '<p class="text-sm">Set check-in and check-out dates above to generate the itinerary.</p></div>';
    document.getElementById('itinerary').value = '';

    calculateTotal();
}

// ===== ALERTS =====
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

// ===== PHOTO UPLOAD =====
function uploadPhotos(id) {
    currentUploadId = id;
    const input = document.getElementById('photoUploadInput');
    input.value = '';
    input.click();
}

function setupPhotoUploadListener() {
    const input = document.getElementById('photoUploadInput');
    if (!input) return;
    input.addEventListener('change', async function (e) {
        if (!currentUploadId || !this.files.length) return;

        const formData = new FormData();
        for (let file of this.files) {
            formData.append('photos', file);
        }

        try {
            showAlert('Uploading photos...', 'info');
            const res = await fetch(`${API_BASE}/quotations/${currentUploadId}/photos`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                showAlert('✅ Photos uploaded successfully!', 'success');
                if (editingId === currentUploadId) {
                    editQuotation(editingId);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showAlert(`❌ Upload failed: ${error.message}`, 'error');
        } finally {
            currentUploadId = null;
        }
    });
}

function attachItemPhoto(btn, type) {
    currentItemPhotosInput = btn.parentElement.querySelector(type === 'hotel' ? '.h-photos' : '.s-photos');
    const uploadInput = document.getElementById('itemPhotoUploadInput');
    if (!uploadInput) return;
    uploadInput.value = '';
    uploadInput.click();
}

function setupItemPhotoUploadListener() {
    const input = document.getElementById('itemPhotoUploadInput');
    if (!input) return;
    input.addEventListener('change', async function (e) {
        if (!currentItemPhotosInput || !this.files.length) return;

        const formData = new FormData();
        for (let file of this.files) {
            formData.append('photos', file);
        }

        try {
            showAlert('Uploading image...', 'info');
            const res = await fetch(`${API_BASE}/quotations/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                showAlert('✅ Image attached!', 'success');
                const existing = JSON.parse(currentItemPhotosInput.value || '[]');
                existing.push(...result.data);
                currentItemPhotosInput.value = JSON.stringify(existing);

                // Update attach button count
                const attachBtn = currentItemPhotosInput.parentElement.querySelector('.attach-btn');
                if (attachBtn) {
                    attachBtn.style.background = '#e0f2fe';
                    attachBtn.textContent = `📷 (${existing.length})`;
                }

                // Show thumbnail previews
                // For service entries: preview is sibling of the service-entry-header
                const entryHeader = currentItemPhotosInput.closest('.service-entry-header');
                const hotelRow    = currentItemPhotosInput.closest('tr');
                if (entryHeader) {
                    // Service entry: find or create photo preview div
                    let preview = entryHeader.nextElementSibling;
                    if (preview && preview.classList.contains('item-photos-preview')) {
                        // exists — append
                    } else {
                        preview = document.createElement('div');
                        preview.className = 'item-photos-preview';
                        preview.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;';
                        entryHeader.insertAdjacentElement('afterend', preview);
                    }
                    result.data.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.style.cssText = 'height:48px;width:64px;object-fit:cover;border-radius:4px;';
                        preview.appendChild(img);
                    });
                } else if (hotelRow) {
                    // Hotel row: show in the last cell
                    let preview = hotelRow.querySelector('.item-photos-preview');
                    if (!preview) {
                        const lastCell = hotelRow.querySelector('td:last-child');
                        preview = document.createElement('div');
                        preview.className = 'item-photos-preview';
                        preview.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;';
                        lastCell.appendChild(preview);
                    }
                    result.data.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.style.cssText = 'height:36px;width:48px;object-fit:cover;border-radius:3px;';
                        preview.appendChild(img);
                    });
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showAlert(`❌ Upload failed: ${error.message}`, 'error');
        } finally {
            currentItemPhotosInput = null;
        }
    });
}


// ===== PDF EXPORT =====
async function printQuotation() {
    const data = await saveQuotation();
    if (data && data._id) {
        exportPDF(data._id);
    }
}

async function exportPDF(id) {
    try {
        showAlert('Opening print preview…', 'info');

        const res = await fetch(`${API_BASE}/quotations/${id}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        const q = result.data;

        const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        const fmtMoney = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });

        // ── build service detail string ──────────────────────
        function svcDetails(s) {
            if (s.type === 'AirportTransfer' || s.type === 'HotelTransfer') {
                let d = `${s.source || ''} → ${s.destination || ''}`;
                if (s.carType)    d += ` &bull; ${s.carType}`;
                if (s.pickupTime) d += ` &bull; ${s.pickupTime}`;
                return d;
            }
            if (s.type === 'DayTour') {
                let d = s.details || '';
                if (s.carType)   d += ` &bull; ${s.carType}`;
                if (s.startTime) d += ` &bull; ${s.startTime}`;
                if (s.duration)  d += ` &bull; ${s.duration}`;
                return d;
            }
            if (s.type === 'CarRental') {
                let d = s.carType || '';
                if (s.pickupLocation)  d += ` from ${s.pickupLocation}`;
                if (s.dropoffLocation) d += ` to ${s.dropoffLocation}`;
                if (s.pickupTime)      d += ` &bull; ${s.pickupTime}`;
                return d;
            }
            if (s.type === 'TourGuide') {
                return (s.details || '') + (s.duration ? ` &bull; ${s.duration}` : '');
            }
            return s.details || '';
        }

        // ── accommodation rows ───────────────────────────────
        const origin = window.location.origin;
        let hotelRows = '';
        (q.hotels || []).forEach((h, i) => {
            const bg = i % 2 === 0 ? '#fff' : '#f7f8ff';
            const photoThumb = (h.photos && h.photos.length > 0)
                ? `<div style="margin-top:4px;">${h.photos.slice(0,2).map(p => `<img src="${p.startsWith('http') ? p : origin + p}" style="height:44px;width:60px;object-fit:cover;border-radius:4px;margin-right:3px;" loading="lazy">`).join('')}</div>`
                : '';
            hotelRows += `
            <tr style="background:${bg};">
              <td class="td"><strong>${h.hotel || ''}</strong>${photoThumb}</td>
              <td class="td">${h.city || ''}</td>
              <td class="td">${fmtDate(h.checkIn)}</td>
              <td class="td c">${h.nights || 1}</td>
              <td class="td">${h.roomType || ''}</td>
              <td class="td c">${h.rooms || 1}</td>
              <td class="td c">${h.mealPlan || 'RO'}</td>
            </tr>`;
        });

        // ── service rows ─────────────────────────────────────
        let svcRows = '';
        (q.services || []).forEach((s, i) => {
            const bg = i % 2 === 0 ? '#fff' : '#f7f8ff';
            const photoThumb = (s.photos && s.photos.length > 0)
                ? `<div style="margin-top:4px;">${s.photos.slice(0,2).map(p => `<img src="${p.startsWith('http') ? p : origin + p}" style="height:44px;width:60px;object-fit:cover;border-radius:4px;margin-right:3px;" loading="lazy">`).join('')}</div>`
                : '';
            svcRows += `
            <tr style="background:${bg};">
              <td class="td c">${s.day || '—'}</td>
              <td class="td"><strong>${s.type.replace(/([A-Z])/g, ' $1').trim()}</strong>${photoThumb}</td>
              <td class="td">${svcDetails(s)}</td>
              <td class="td c">${s.pax || 1}</td>
            </tr>`;
        });

        // ── itinerary block ──────────────────────────────────
        const itineraryBlock = q.itinerary ? `
          <h2 class="section-title">Daily Itinerary</h2>
          <div class="itinerary">${q.itinerary.replace(/\n/g, '<br>')}</div>` : '';

        // ── photos block ─────────────────────────────────────
        let photosBlock = '';
        if (q.photos && q.photos.length > 0) {
            const imgs = q.photos.map(p => {
                const src = p.startsWith('http') ? p : window.location.origin + p;
                return `<img src="${src}" class="photo-img">`;
            }).join('');
            photosBlock = `<div class="page-break"></div>
              <h2 class="section-title">Photos</h2>
              <div class="photos-grid">${imgs}</div>`;
        }

        // ── full HTML document ───────────────────────────────
        const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quotation ${q.refId}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.5;
  }

  /* ── header ── */
  .header {
    display: table;
    width: 100%;
    border-bottom: 3px solid #00327d;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .header-left  { display: table-cell; vertical-align: middle; }
  .header-right { display: table-cell; vertical-align: middle; text-align: right; }
  .company-name {
    font-size: 22px;
    font-weight: 800;
    color: #00327d;
    letter-spacing: -0.3px;
  }
  .company-sub  { font-size: 11px; color: #888; margin-top: 2px; }
  .ref-id       { font-size: 16px; font-weight: 700; color: #00327d; }
  .ref-date     { font-size: 11px; color: #888; margin-top: 3px; }

  /* ── summary box ── */
  .summary {
    display: table;
    width: 100%;
    background: #f0f4ff;
    border-radius: 8px;
    margin-bottom: 22px;
  }
  .summary-col {
    display: table-cell;
    width: 50%;
    padding: 14px 18px;
    vertical-align: top;
  }
  .summary-col + .summary-col { border-left: 1px solid #cdd8f5; }
  .col-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .09em;
    color: #6b7280;
    margin-bottom: 8px;
  }
  .summary-col p { margin-bottom: 3px; }

  /* ── section title ── */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #00327d;
    border-bottom: 2px solid #00327d;
    padding-bottom: 5px;
    margin: 22px 0 10px 0;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* ── tables ── */
  table { width: 100%; border-collapse: collapse; }
  .th {
    background: #00327d;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 9px 10px;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .td {
    padding: 9px 10px;
    font-size: 12px;
    vertical-align: top;
    border-bottom: 1px solid #e8eaf0;
  }
  .c { text-align: center; }

  /* ── itinerary ── */
  .itinerary {
    font-size: 12px;
    line-height: 1.8;
    color: #333;
    padding: 10px 0;
  }

  /* ── photos ── */
  .photos-grid { display: table; width: 100%; }
  .photo-img   { width: 220px; height: 160px; object-fit: cover; border-radius: 6px; margin: 4px; }

  /* ── footer ── */
  .footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e8eaf0;
    text-align: center;
    font-size: 10px;
    color: #aaa;
  }

  /* ── page break ── */
  .page-break { page-break-before: always; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <div class="company-name">DOPAMINE TRAVEL</div>
    <div class="company-sub">Official Travel Quotation</div>
  </div>
  <div class="header-right">
    <div class="ref-id">REF: ${q.refId}</div>
    <div class="ref-date">Date: ${fmtDate(q.createdAt)}</div>
  </div>
</div>

<!-- TRIP SUMMARY -->
<div class="summary">
  <div class="summary-col">
    <div class="col-label">Trip Details</div>
    <p><strong>Destination:</strong> ${q.destination}</p>
    <p><strong>Check-In:</strong> ${fmtDate(q.dates.start)}</p>
    <p><strong>Check-Out:</strong> ${fmtDate(q.dates.end)}</p>
    <p><strong>Duration:</strong> ${q.dates.nights} Night${q.dates.nights !== 1 ? 's' : ''}</p>
  </div>
  <div class="summary-col">
    <div class="col-label">Guests &amp; Agent</div>
    <p><strong>Adults:</strong> ${q.pax.adults}</p>
    ${q.pax.children > 0 ? `<p><strong>Children:</strong> ${q.pax.children}</p>` : ''}
    <p><strong>Agent:</strong> ${q.userName || (q.staff ? q.staff.sales : 'Dopamine Travel')}</p>
  </div>
</div>

<!-- ACCOMMODATION -->
${hotelRows ? `
<h2 class="section-title">Accommodation</h2>
<table>
  <thead>
    <tr>
      <th class="th">Hotel</th>
      <th class="th">City</th>
      <th class="th">Check-In</th>
      <th class="th c">Nights</th>
      <th class="th">Room Type</th>
      <th class="th c">Rooms</th>
      <th class="th c">Meal</th>
    </tr>
  </thead>
  <tbody>${hotelRows}</tbody>
</table>` : ''}

<!-- SERVICES -->
${svcRows ? `
<h2 class="section-title">Included Services</h2>
<table>
  <thead>
    <tr>
      <th class="th c">Day</th>
      <th class="th">Service</th>
      <th class="th">Details</th>
      <th class="th c">Pax</th>
    </tr>
  </thead>
  <tbody>${svcRows}</tbody>
</table>` : ''}

<!-- ITINERARY -->
${itineraryBlock}

<!-- PHOTOS -->
${photosBlock}

<!-- FOOTER -->
<div class="footer">
  Thank you for choosing Dopamine Travel &mdash; we look forward to curating your perfect journey.
</div>

<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
</script>
</body>
</html>`;

        const printWin = window.open('', '_blank', 'width=900,height=700');
        if (!printWin) {
            showAlert('Pop-up blocked — please allow pop-ups for this site and try again.', 'error');
            return;
        }
        printWin.document.open();
        printWin.document.write(doc);
        printWin.document.close();

    } catch (error) {
        showAlert(`❌ PDF Export failed: ${error.message}`, 'error');
    }
}

// ===== STARTUP =====
init();
