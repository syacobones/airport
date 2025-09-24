// app.js - Versión con Ground Coordinator y Loadmaster
let flights = [];
let currentFlight = null;
let isEditing = false;
let countdownInterval = null;

const coordinatorOptions = ["", "Sergio Iacobone", "Francisco Cartas", "Fernando Perez", "Paco Muñoz"];
const driverOptions = ["", "Fidel Botey", "Juan Gamez", "Paco Jerez", "Gaspar Franco"];
const wingwalkerOptions = ["", ...coordinatorOptions.slice(1), ...driverOptions.slice(1)];
const airportOptions = ["", "Toulouse TLS", "Hamburgo XFW", "Bremen BRE", "Saint-Nazaire SNR", "Chester CEG"];

// NUEVO: Lista de personal externo
const externalCrewOptions = ["", "Soledad", "Fernando", "Gustavo", "Germán", "Iñaki", "Jon", "David"];

const operations = [
  'EQUIPOS LISTOS', 'PAYLOAD', 'ATA', 'PARADA MOTORES', 'FUEL', 'ACU',
  'START TOWING', 'END TOWING', 'GPU ON', 'GPU OFF', 'FRONT JACK UP',
  'REAR JACK UP', 'REAR JACK DOWN', 'FRONT JACK DOWN', 'START TOWING DEPARTURE',
  'END TOWING DEPARTURE', 'STARTUP', 'TAXI', 'TAKEOFF'
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

// MODIFICADO: Añadidos los nuevos campos al formulario HTML
function showForm(flightToEdit = null) {
  if (countdownInterval) clearInterval(countdownInterval);
  isEditing = !!flightToEdit;
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 text-slate-800">${isEditing ? 'Editar Detalles del Vuelo' : 'Nuevo Vuelo'}</h2>
    <form id="flightForm" class="space-y-4">
      <div><label class="block text-sm font-medium text-slate-700">GHR Numero</label><input id="registrationNumber" type="text" class="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Ej: GHR 1860" required value="${flightToEdit?.registrationNumber || ''}"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">Aeropuerto de Llegada</label><select id="arrivalAirport" class="w-full border p-2 rounded-md"></select></div>
        <div><label class="block text-sm font-medium text-slate-700">Aeropuerto de Salida</label><select id="departureAirport" class="w-full border p-2 rounded-md"></select></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">Vuelo Llegada</label><input id="arrivalFlight" type="text" class="w-full border p-2 rounded-md" placeholder="Ej: BGA116H" value="${flightToEdit?.arrivalFlight || ''}"></div>
        <div><label class="block text-sm font-medium text-slate-700">Vuelo Salida</label><input id="departureFlight" type="text" class="w-full border p-2 rounded-md" placeholder="Ej: BGA163H" value="${flightToEdit?.departureFlight || ''}"></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">STA</label><input id="sta" type="time" class="w-full border p-2 rounded-md" value="${flightToEdit?.sta || ''}"></div>
        <div><label class="block text-sm font-medium text-slate-700">STD</label><input id="std" type="time" class="w-full border p-2 rounded-md" value="${flightToEdit?.std || ''}"></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">Coordinador</label><select id="coordinator" class="w-full border p-2 rounded-md"></select></div>
        <div><label class="block text-sm font-medium text-slate-700">Conductor</label><select id="driver" class="w-full border p-2 rounded-md"></select></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">Wingwalker 1</label><select id="wingwalker1" class="w-full border p-2 rounded-md"></select></div>
        <div><label class="block text-sm font-medium text-slate-700">Wingwalker 2</label><select id="wingwalker2" class="w-full border p-2 rounded-md"></select></div>
      </div>
      
      <hr class="my-4 border-slate-300">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium text-slate-700">Ground Coordinator</label><select id="groundCoordinator" class="w-full border p-2 rounded-md"></select></div>
        <div><label class="block text-sm font-medium text-slate-700">Loadmaster</label><select id="loadmaster" class="w-full border p-2 rounded-md"></select></div>
      </div>
      
      <div class="flex gap-2 mt-4">
        <button type="submit" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition duration-300">${isEditing ? 'Guardar Cambios' : 'Crear Vuelo'}</button>
        <button id="cancelBtn" type="button" class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">Cancelar</button>
      </div>
    </form>`;

  generateCrewOptions();
  generateAirportOptions();

  // MODIFICADO: Rellenar los valores de los nuevos campos al editar
  if (isEditing) {
    document.getElementById('arrivalAirport').value = flightToEdit.arrivalAirport;
    document.getElementById('departureAirport').value = flightToEdit.departureAirport;
    document.getElementById('coordinator').value = flightToEdit.coordinator;
    document.getElementById('driver').value = flightToEdit.driver;
    document.getElementById('wingwalker1').value = flightToEdit.wingwalker1;
    document.getElementById('wingwalker2').value = flightToEdit.wingwalker2;
    document.getElementById('groundCoordinator').value = flightToEdit.groundCoordinator || '';
    document.getElementById('loadmaster').value = flightToEdit.loadmaster || '';
  }

  // MODIFICADO: Añadir los nuevos campos al objeto de datos
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
      wingwalker2: document.getElementById('wingwalker2').value.trim() || 'N/A',
      groundCoordinator: document.getElementById('groundCoordinator').value.trim() || 'N/A',
      loadmaster: document.getElementById('loadmaster').value.trim() || 'N/A'
    };
    if (!data.registrationNumber) return alert('Debes indicar el GHR Numero');
    if (isEditing) {
      updateFlight(flightToEdit.id, data);
    } else {
      createFlight(data);
    }
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    if (isEditing) {
      showCurrentFlight();
    } else {
      closeViews();
    }
  });
}

function createFlight(data) {
  currentFlight = { id: Date.now(), ...data, date: new Date().toLocaleDateString('es-ES'), startTime: new Date().toLocaleTimeString('es-ES'), operations: {}, completed: false };
  showCurrentFlight();
}

function updateFlight(flightId, data) {
    const flightIndex = flights.findIndex(f => f.id == flightId);
    if (flightIndex === -1) return;
    const originalFlight = flights[flightIndex];
    flights[flightIndex] = { ...originalFlight, ...data };
    currentFlight = flights[flightIndex];
    saveData();
    alert('Detalles del vuelo actualizados');
    showCurrentFlight();
}

function deleteFlight(flightId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este vuelo? Esta acción no se puede deshacer.')) return;
    flights = flights.filter(f => f.id != flightId);
    saveData();
    showHistory();
}

function showCurrentFlight() {
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `
    <div
