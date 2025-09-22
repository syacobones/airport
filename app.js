// app.js - versión corregida según nuevas especificaciones
let flights = [];
let currentFlight = null;

const coordinatorOptions = ["", "Sergio Iacobone", "Francisco Cartas", "Fernando Perez", "Paco Muñoz"];
const driverOptions = ["", "Fidel Botey", "Juan Gamez", "Paco Jerez", "Gaspar Franco"];
const wingwalkerOptions = ["", ...coordinatorOptions.slice(1), ...driverOptions.slice(1)];
const airportOptions = ["", "Toulouse TLS", "Hamburgo XFW", "Bremen BRE", "Saint-Nazaire SNR"];

// Orden actualizado: Fuel y ACU van debajo de Parada Motores
const operations = [
  'EQUIPOS LISTOS', 'PAYLOAD', 'LLEGADA', 'SALIDA', 'ATA', 'PARADA MOTORES',
  'FUEL', 'ACU',
  'START TOWING', 'END TOWING', 'GPU ON', 'GPU OFF', 'FRONT JACK UP',
  'REAR JACK UP', 'FRONT JACK DOWN',
  'START TOWING DEPARTURE', 'END TOWING DEPARTURE', 'STARTUP', 'TAXI', 'TAKEOFF'
];

function loadData() {
  const raw = localStorage.getItem('ghrBelugaFlights');
  if (raw) flights = JSON.parse(raw);
  updateHistoryCount();
  updateContinueButton();
}
function saveData() {
  localStorage.setItem('ghrBelugaFlights', JSON.stringify(flights));
  updateHistoryCount();
  updateContinueButton();
}

function updateHistoryCount() {
  const el = document.getElementById('historyCount');
  if (el) el.textContent = flights.filter(f => f.completed).length;
}

// ---- Formulario ----
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
    </form>`;

  generateCrewOptions();
  generateAirportOptions();
  document.getElementById('flightForm').addEventListener('submit', e => {
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
    if (!data.registrationNumber) return alert('Debes indicar el GHR Numero');
    createFlight(data);
  });
  document.getElementById('cancelNewFlight').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });
}

function createFlight(data) {
  currentFlight = {
    id: Date.now(),
    ...data,
    date: new Date().toLocaleDateString('es-ES'),
    startTime: new Date().toLocaleTimeString('es-ES'),
    operations: {},
    completed: false
  };
  showCurrentFlight();
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
    </div>`;
  document.getElementById('saveFlightBtn').addEventListener('click', saveFlight);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });
  updateCurrentFlightView();
}

function recordOperation(op) {
  currentFlight.operations[op] = { utc: new Date().toUTCString().split(' ')[4] };
  updateCurrentFlightView();
}

function updateCurrentFlightView() {
  const info = document.getElementById('currentFlightInfo');
  info.innerHTML = `<h3 class="text-lg font-bold">Vuelo ${currentFlight.registrationNumber}</h3>
    <p class="text-sm text-slate-600">${currentFlight.arrivalFlight || ''} → ${currentFlight.departureFlight || ''}</p>
    <p class="text-sm text-slate-500">Aeropuerto Llegada: ${currentFlight.arrivalAirport} · Aeropuerto Salida: ${currentFlight.departureAirport}</p>`;
  const list = document.getElementById('operationsList');
  list.innerHTML = '';
  operations.forEach(op => {
    const opData = currentFlight.operations[op];
    const row = document.createElement('div');
    row.className = 'p-3 bg-gray-100 rounded flex justify-between items-center';

    const left = document.createElement('div');
    left.textContent = op;
    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';

    if (op === 'EQUIPOS LISTOS') {
      const input = document.createElement('input');
      input.type = 'time';
      input.value = opData?.utc || '';
      input.className = 'border p-1 rounded';
      input.addEventListener('change', e => {
        currentFlight.operations[op] = { utc: e.target.value };
      });
      right.appendChild(input);
    } else if (op === 'PAYLOAD') {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Ej: 14300kg';
      input.value = opData?.value || '';
      input.className = 'border p-1 rounded w-28';
      input.addEventListener('change', e => {
        currentFlight.operations[op] = { value: e.target.value };
      });
      right.appendChild(input);
    } else if (op === 'FUEL' || op === 'ACU') {
      ['YES','NO'].forEach(opt => {
        const label = document.createElement('label');
        label.className = 'ml-1 text-sm';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = op;
        radio.value = opt;
        radio.checked = opData?.value === opt;
        radio.addEventListener('change', () => {
          currentFlight.operations[op] = { value: opt };
        });
        label.appendChild(radio);
        label.append(' '+opt);
        right.appendChild(label);
      });
    } else {
      const span = document.createElement('span');
      span.className = 'text-green-700 font-mono text-sm';
      span.textContent = opData?.utc || '';
      right.appendChild(span);
      const btn = document.createElement('button');
      btn.className = 'px-2 py-1 bg-blue-500 text-white rounded text-sm';
      btn.textContent = opData ? 'Actualizar' : 'Registrar';
      btn.addEventListener('click', () => recordOperation(op));
      right.appendChild(btn);
    }
    row.appendChild(right);
    list.appendChild(row);
  });
}

function saveFlight() {
  currentFlight.completed = true;
  flights.push(currentFlight);
  saveData();
  currentFlight = null;
  document.getElementById('viewsContainer').classList.add('hidden');
}

// Helpers
function generateCrewOptions() {
  const fill = (id, arr) => {
    const sel = document.getElementById(id);
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
  ['arrivalAirport','departureAirport'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    airportOptions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || 'Seleccionar...';
      sel.appendChild(opt);
    });
  });
}

function updateContinueButton() {
  const btn = document.getElementById('continueFlightBtn');
  const uncompleted = flights.find(f => !f.completed);
  if (uncompleted) {
    btn.classList.remove('hidden');
    btn.innerHTML = '<i data-lucide="play"></i> Continuar Vuelo ' + (uncompleted.registrationNumber || '');
    btn.onclick = () => { currentFlight = uncompleted; showCurrentFlight(); };
  } else {
    btn.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('newFlightBtn').addEventListener('click', showForm);
  document.getElementById('historyBtn').addEventListener('click', () => alert('Historial pronto'));
});
