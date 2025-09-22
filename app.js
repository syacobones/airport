// app.js - GHR BELUGA (versión corregida y sincronizada con index.html)
/* Cambios principales:
 - Campo 'Matrícula' renombrado a 'GHR Numero'
 - Aeropuertos con etiquetas claras (Aeropuerto de Llegada / Aeropuerto de Salida)
 - Últimas 4 casillas: Coordinador, Conductor, Wingwalker 1, Wingwalker 2
 - Al registrar operación muestra hora local y UTC
 - Añadidos Start/End Towing Departure
 - FUEL y ACU son radios Yes/No (no registros horarios)
*/

// Datos iniciales
let flights = [];
let currentFlight = null;

const coordinatorOptions = ["", "Sergio Iacobone", "Francisco Cartas", "Fernando Perez", "Paco Muñoz"];
const driverOptions = ["", "Fidel Botey", "Juan Gamez", "Paco Jerez", "Gaspar Franco"];
const wingwalkerOptions = ["", ...coordinatorOptions.slice(1), ...driverOptions.slice(1)];
const airportOptions = ["", "Toulouse TLS", "Hamburgo XFW", "Bremen BRE", "Saint-Nazaire SNR"];

// Operaciones (con el orden solicitado; FUEL y ACU se tratarán como yes/no)
const operations = [
  'OPERATIVA', 'PAYLOAD', 'LLEGADA', 'SALIDA', 'ATA', 'PARADA MOTORES',
  'START TOWING', 'END TOWING', 'GPU ON', 'GPU OFF', 'FRONT JACK UP',
  'REAR JACK UP', 'FUEL', 'ACU', 'FRONT JACK DOWN',
  'START TOWING DEPARTURE', 'END TOWING DEPARTURE', 'STARTUP', 'TAXI', 'TAKEOFF'
];

// --- Persistencia ---
function loadData() {
  try {
    const raw = localStorage.getItem('ghrBelugaFlights');
    if (raw) flights = JSON.parse(raw);
  } catch (e) {
    console.warn('Error cargando localStorage', e);
    flights = [];
  }
  updateHistoryCount();
  updateContinueButton();
}

function saveData() {
  try {
    localStorage.setItem('ghrBelugaFlights', JSON.stringify(flights));
  } catch (e) {
    console.warn('Error guardando localStorage', e);
  }
  updateHistoryCount();
  updateContinueButton();
}

function updateHistoryCount() {
  const el = document.getElementById('historyCount');
  if (el) el.textContent = flights.filter(f => f.completed).length;
}

// --- Utilidades de tiempo ---
function nowInfo() {
  const now = new Date();
  return {
    ts: now.getTime(),
    local: now.toLocaleTimeString('es-ES'),
    utc: now.toUTCString().split(' ')[4] // hh:mm:ss
  };
}
function formatOp(opObj) {
  if (!opObj) return '';
  if (opObj.yesno) return opObj.yesno;
  if (opObj.ts) return `${opObj.local} (UTC: ${opObj.utc})`;
  return '';
}

// --- Vistas ---
function showForm() {
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Nuevo Vuelo</h2>
    <form id="flightForm" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-slate-700">GHR Numero</label>
        <input id="registrationNumber" type="text" class="w-full border p-2 rounded" placeholder="Ej: GHR-001" required>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Aeropuerto de Llegada</label>
          <select id="arrivalAirport" class="w-full border p-2 rounded"></select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Aeropuerto de Salida</label>
          <select id="departureAirport" class="w-full border p-2 rounded"></select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Vuelo Llegada</label>
          <input id="arrivalFlight" type="text" class="w-full border p-2 rounded" placeholder="Ej: BGA9212">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Vuelo Salida</label>
          <input id="departureFlight" type="text" class="w-full border p-2 rounded" placeholder="Ej: BGA9213">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">STA</label>
          <input id="sta" type="time" class="w-full border p-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">STD</label>
          <input id="std" type="time" class="w-full border p-2 rounded">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Coordinador</label>
          <select id="coordinator" class="w-full border p-2 rounded"></select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Conductor</label>
          <select id="driver" class="w-full border p-2 rounded"></select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Wingwalker 1</label>
          <select id="wingwalker1" class="w-full border p-2 rounded"></select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Wingwalker 2</label>
          <select id="wingwalker2" class="w-full border p-2 rounded"></select>
        </div>
      </div>

      <div class="flex gap-2 mt-3">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded">Crear Vuelo</button>
        <button id="cancelNewFlight" type="button" class="flex-1 bg-gray-200 py-2 rounded">Cancelar</button>
      </div>
    </form>
  `;

  generateCrewOptions();
  generateAirportOptions();

  const form = document.getElementById('flightForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      registrationNumber: document.getElementById('registrationNumber').value.trim(),
      arrivalFlight: document.getElementById('arrivalFlight').value.trim(),
      departureFlight: document.getElementById('departureFlight').value.trim(),
      arrivalAirport: document.getElementById('arrivalAirport').value.trim() || 'N/A',
      departureAirport: document.getElementById('departureAirport').value.trim() || 'N/A',
      sta: document.getElementById('sta').value.trim(),
      std: document.getElementById('std').value.trim(),
      coordinator: document.getElementById('coordinator').value.trim() || 'N/A',
      driver: document.getElementById('driver').value.trim() || 'N/A',
      wingwalker1: document.getElementById('wingwalker1').value.trim() || 'N/A',
      wingwalker2: document.getElementById('wingwalker2').value.trim() || 'N/A'
    };
    if (!data.registrationNumber) {
      alert('Debes indicar el GHR Numero');
      return;
    }
    if (flights.some(f => !f.completed)) {
      alert('Hay un vuelo en curso sin guardar. Guarda o elimina ese vuelo antes.');
      return;
    }
    createFlight(data);
  });

  document.getElementById('cancelNewFlight').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });

  if (window.lucide) lucide.createIcons();
}

function createFlight(data) {
  currentFlight = {
    id: Date.now(),
    ...data,
    date: new Date().toLocaleDateString('es-ES'),
    startTime: new Date().toLocaleTimeString('es-ES'),
    operations: {}, // will hold { op: { ts, local, utc } } or { op: { yesno: 'YES' } }
    completed: false
  };
  showCurrentFlight();
  updateContinueButton();
}

function showCurrentFlight() {
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `
    <div class="mb-4" id="currentFlightInfo"></div>
    <div id="operationsList" class="space-y-2"></div>
    <div class="mt-4 flex gap-2">
      <button id="saveFlightBtn" class="flex-1 bg-green-600 text-white py-2 rounded">Guardar Vuelo</button>
      <button id="cancelEditBtn" class="flex-1 bg-gray-200 py-2 rounded">Cancelar</button>
    </div>
  `;
  document.getElementById('saveFlightBtn').addEventListener('click', saveFlight);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });
  updateCurrentFlightView();
  if (window.lucide) lucide.createIcons();
}

function recordOperation(op) {
  if (!currentFlight) return;
  const info = nowInfo();
  currentFlight.operations[op] = { ts: info.ts, local: info.local, utc: info.utc };
  updateCurrentFlightView();
}

function recordPayload(value) {
  if (!currentFlight) return;
  const v = String(value||'').trim();
  if (!v) return;
  const info = nowInfo();
  currentFlight.operations['PAYLOAD'] = { ts: info.ts, local: v, utc: '' };
  updateCurrentFlightView();
}

function recordYesNo(op, value) {
  if (!currentFlight) return;
  currentFlight.operations[op] = { yesno: value };
  updateCurrentFlightView();
}

function adjustTime(op, minutes) {
  if (!currentFlight || !currentFlight.operations[op] || !currentFlight.operations[op].ts) return;
  currentFlight.operations[op].ts += minutes * 60000;
  const d = new Date(currentFlight.operations[op].ts);
  currentFlight.operations[op].local = d.toLocaleTimeString('es-ES');
  currentFlight.operations[op].utc = d.toUTCString().split(' ')[4];
  updateCurrentFlightView();
}

function updateCurrentFlightView() {
  if (!currentFlight) return;
  const info = document.getElementById('currentFlightInfo');
  info.innerHTML = `<h3 class="text-lg font-bold">Vuelo ${currentFlight.registrationNumber}</h3>
    <p class="text-sm text-slate-600">${currentFlight.arrivalFlight || ''} → ${currentFlight.departureFlight || ''}</p>
    <p class="text-sm text-slate-600">Aeropuerto Llegada: ${currentFlight.arrivalAirport} · Aeropuerto Salida: ${currentFlight.departureAirport}</p>
    <p class="text-sm text-slate-500">Fecha: ${currentFlight.date} · Inicio: ${currentFlight.startTime}</p>`;

  const list = document.getElementById('operationsList');
  list.innerHTML = '';

  operations.forEach(op => {
    const opData = currentFlight.operations[op];
    const row = document.createElement('div');
    row.className = 'p-3 bg-gray-100 rounded flex items-center justify-between';

    const left = document.createElement('div');
    left.textContent = op;
    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';

    // FUEL and ACU -> yes/no radios
    if (op === 'FUEL' || op === 'ACU') {
      const yes = document.createElement('label');
      yes.className = 'text-sm';
      const yesInput = document.createElement('input');
      yesInput.type = 'radio';
      yesInput.name = 'radio-' + op;
      yesInput.value = 'YES';
      yesInput.checked = opData?.yesno === 'YES';
      yesInput.addEventListener('change', () => recordYesNo(op, 'YES'));
      yes.appendChild(yesInput);
      yes.append(' Yes');

      const no = document.createElement('label');
      no.className = 'ml-3 text-sm';
      const noInput = document.createElement('input');
      noInput.type = 'radio';
      noInput.name = 'radio-' + op;
      noInput.value = 'NO';
      noInput.checked = opData?.yesno === 'NO';
      noInput.addEventListener('change', () => recordYesNo(op, 'NO'));
      no.appendChild(noInput);
      no.append(' No');

      right.appendChild(yes);
      right.appendChild(no);
    }
    else if (op === 'PAYLOAD') {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Ej: 12.5 ton';
      input.value = opData?.local || '';
      input.className = 'border p-1 rounded w-28';
      input.addEventListener('change', () => recordPayload(input.value));
      right.appendChild(input);
    } else {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-green-700 font-mono text-sm';
      timeSpan.textContent = formatOp(opData);
      right.appendChild(timeSpan);

      const btn = document.createElement('button');
      btn.className = 'px-2 py-1 bg-blue-500 text-white rounded text-sm';
      btn.textContent = opData ? 'Actualizar' : 'Registrar';
      btn.addEventListener('click', () => recordOperation(op));
      right.appendChild(btn);

      if (opData && opData.ts) {
        const minus = document.createElement('button');
        minus.className = 'px-2 py-1 bg-red-200 rounded text-sm';
        minus.textContent = '-1m';
        minus.addEventListener('click', () => adjustTime(op, -1));
        const plus = document.createElement('button');
        plus.className = 'px-2 py-1 bg-green-200 rounded text-sm';
        plus.textContent = '+1m';
        plus.addEventListener('click', () => adjustTime(op, 1));
        right.appendChild(minus);
        right.appendChild(plus);
      }
    }

    row.appendChild(right);
    list.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

// --- Save / Edit / Delete ---
function saveFlight() {
  if (!currentFlight) return;
  currentFlight.completed = true;
  // If an existing flight with same id, replace; else push
  const idx = flights.findIndex(f => f.id === currentFlight.id);
  if (idx >= 0) flights[idx] = currentFlight; else flights.push(currentFlight);
  saveData();
  currentFlight = null;
  document.getElementById('viewsContainer').classList.add('hidden');
  alert('Vuelo guardado correctamente');
}

function editFlight(flightId) {
  const f = flights.find(x => x.id === flightId);
  if (!f) return;
  currentFlight = f;
  currentFlight.completed = false;
  showCurrentFlight();
}

function deleteFlight(flightId) {
  if (!confirm('Eliminar vuelo?')) return;
  flights = flights.filter(f => f.id !== flightId);
  saveData();
  alert('Vuelo eliminado');
  document.getElementById('viewsContainer').classList.add('hidden');
}

// --- History view ---
function showHistory() {
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `<h2 class="text-xl font-bold mb-3">Historial</h2><div id="historyList"></div>`;
  updateHistoryView();
}

function updateHistoryView() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const completed = flights.filter(f => f.completed).slice().reverse();
  if (completed.length === 0) {
    list.innerHTML = '<p class="text-slate-500">No hay vuelos completados aún.</p>';
    return;
  }
  list.innerHTML = '';
  completed.forEach(f => {
    const card = document.createElement('div');
    card.className = 'p-4 bg-gray-50 rounded mb-3 shadow';

    const title = document.createElement('div');
    title.className = 'flex justify-between items-center';
    const h = document.createElement('h3');
    h.className = 'font-bold';
    h.textContent = f.registrationNumber;
    const info = document.createElement('span');
    info.className = 'text-sm text-slate-600';
    info.textContent = `${f.date} · ${f.startTime} - ${f.endTime || 'N/A'}`;
    title.appendChild(h);
    title.appendChild(info);

    const meta = document.createElement('p');
    meta.className = 'text-sm text-slate-600';
    meta.textContent = `${f.arrivalAirport} → ${f.departureAirport} · ${Object.keys(f.operations).length} ops`;

    const opsDiv = document.createElement('div');
    opsDiv.className = 'mt-2 space-y-1';
    Object.entries(f.operations || {}).forEach(([op, v]) => {
      const r = document.createElement('div');
      r.className = 'flex justify-between text-sm bg-white p-2 rounded';
      r.innerHTML = `<span>${op}</span><span class="font-mono text-slate-700">${formatOp(v)}</span>`;
      opsDiv.appendChild(r);
    });

    const actions = document.createElement('div');
    actions.className = 'mt-3 flex gap-2';
    const editBtn = document.createElement('button');
    editBtn.className = 'px-2 py-1 bg-blue-200 rounded';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => editFlight(f.id));
    const delBtn = document.createElement('button');
    delBtn.className = 'px-2 py-1 bg-red-200 rounded';
    delBtn.textContent = 'Eliminar';
    delBtn.addEventListener('click', () => { deleteFlight(f.id); updateHistoryView(); });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(opsDiv);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

// --- Select helpers ---
function generateCrewOptions() {
  const fill = (id, arr) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    arr.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || 'Seleccionar...';
      sel.appendChild(opt);
    });
  };
  fill('coordinator', coordinatorOptions);
  fill('driver', driverOptions);
  fill('wingwalker1', wingwalkerOptions);
  fill('wingwalker2', wingwalkerOptions);
}

function generateAirportOptions() {
  ['arrivalAirport', 'departureAirport'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    airportOptions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || 'Seleccionar...';
      sel.appendChild(opt);
    });
  });
}

// --- Continue button management ---
function updateContinueButton() {
  const btn = document.getElementById('continueFlightBtn');
  const uncompleted = flights.find(f => !f.completed);
  if (uncompleted) {
    btn.classList.remove('hidden');
    btn.innerHTML = '<i data-lucide="play"></i> Continuar Vuelo ' + (uncompleted.registrationNumber || '');
    btn.onclick = () => {
      currentFlight = uncompleted;
      showCurrentFlight();
    };
  } else {
    btn.classList.add('hidden');
    btn.onclick = null;
  }
  if (window.lucide) lucide.createIcons();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('newFlightBtn').addEventListener('click', showForm);
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  if (window.lucide) lucide.createIcons();
});
