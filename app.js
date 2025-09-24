// app.js - Versión FINAL con plantilla PDF WFS generada por código
let flights = [];
let currentFlight = null;
let isEditing = false;
let countdownInterval = null;

const coordinatorOptions = ["", "Sergio Iacobone", "Francisco Cartas", "Fernando Perez", "Paco Muñoz"];
const driverOptions = ["", "Fidel Botey", "Juan Gamez", "Paco Jerez", "Gaspar Franco"];
const wingwalkerOptions = ["", ...coordinatorOptions.slice(1), ...driverOptions.slice(1)];
const airportOptions = ["", "Toulouse TLS", "Hamburgo XFW", "Bremen BRE", "Saint-Nazaire SNR", "Chester CEG"];
const externalCrewOptions = ["", "Soledad", "Fernando", "Gustavo", "Germán", "Iñaki", "Jon", "David"];
const aircraftOptions = ["","Airbus Beluga ST - F-GSTA (Avión Nº 1)","Airbus Beluga ST - F-GSTB (Avión Nº 2)","Airbus Beluga ST - F-GSTC (Avión Nº 3)","Airbus Beluga ST - F-GSTD (Avión Nº 4)","Airbus Beluga ST - F-GSTF (Avión Nº 5)","Airbus Beluga XL - F-GXLG (Avión Nº 1)","Airbus Beluga XL - F-GXLH (Avión Nº 2)","Airbus Beluga XL - F-GXLI (Avión Nº 3)","Airbus Beluga XL - F-GXLJ (Avión Nº 4)","Airbus Beluga XL - F-GXLN (Avión Nº 5)","Airbus Beluga XL - F-GXLO (Avión Nº 6)"];

// MODIFICADO: Nuevos items de operaciones
const operations = [
  'EQUIPOS LISTOS', 'PAYLOAD', 'ATA', 'PARADA MOTORES', 'FUEL (STARTING)', 'FUEL (END)', 'ACU ON', 'ACU OFF',
  'START TOWING', 'END TOWING', 'GPU ON', 'GPU OFF', 'FRONT JACK UP',
  'REAR JACK UP', 'REAR JACK DOWN', 'FRONT JACK DOWN', 'START TOWING DEPARTURE',
  'END TOWING DEPARTURE', 'STARTUP', 'TAXI', 'TAKEOFF',
  'FOD CHECK COMPLETED', 'GSE CLEAN & SERVICEABLE', 'ACU NEEDED', 'GPU NEEDED',
  'FUEL NEEDED', 'N/A REQUEST', 'WATER TRUCK SERVICES'
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

function showForm(flightToEdit = null) {
  if (countdownInterval) clearInterval(countdownInterval);
  isEditing = !!flightToEdit;
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  c.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 text-slate-800">${isEditing ? 'Editar Detalles del Vuelo' : 'Nuevo Vuelo'}</h2>
    <form id="flightForm" class="space-y-4">
      <div><label class="block text-sm font-medium text-slate-700">GHR Numero</label><input id="registrationNumber" type="text" class="w-full border p-2 rounded-md" placeholder="Ej: GHR 1860" required value="${flightToEdit?.registrationNumber || ''}"></div>
      <div><label class="block text-sm font-medium text-slate-700">Aircraft</label><select id="aircraft" class="w-full border p-2 rounded-md"></select></div>
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
        <button type="submit" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md">${isEditing ? 'Guardar Cambios' : 'Crear Vuelo'}</button>
        <button id="cancelBtn" type="button" class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">Cancelar</button>
      </div>
    </form>`;

  generateCrewOptions();
  generateAirportOptions();
  generateAircraftOptions();

  if (isEditing) {
    document.getElementById('aircraft').value = flightToEdit.aircraft || '';
    document.getElementById('arrivalAirport').value = flightToEdit.arrivalAirport;
    document.getElementById('departureAirport').value = flightToEdit.departureAirport;
    document.getElementById('coordinator').value = flightToEdit.coordinator;
    document.getElementById('driver').value = flightToEdit.driver;
    document.getElementById('wingwalker1').value = flightToEdit.wingwalker1;
    document.getElementById('wingwalker2').value = flightToEdit.wingwalker2;
    document.getElementById('groundCoordinator').value = flightToEdit.groundCoordinator || '';
    document.getElementById('loadmaster').value = flightToEdit.loadmaster || '';
  }

  document.getElementById('flightForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      registrationNumber: document.getElementById('registrationNumber').value.trim(),
      aircraft: document.getElementById('aircraft').value.trim(),
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
    <div id="stdCountdown" class="absolute top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-2 shadow-lg text-center z-10"></div>
    <div class="flex justify-between items-center mb-4">
        <div id="currentFlightInfo"></div>
        ${isEditing ? `<button id="editDetailsBtn" class="bg-yellow-500 text-white font-semibold py-2 px-3 rounded-md text-sm hover:bg-yellow-600">Editar Detalles</button>` : ''}
    </div>
    <div id="operationsList" class="space-y-2 max-h-[50vh] overflow-y-auto pr-2"></div>
    <div class="mt-4 flex gap-2">
      <button id="saveFlightBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md">Guardar Vuelo</button>
      <button id="cancelEditBtn" class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">${isEditing ? 'Volver al Historial' : 'Cancelar'}</button>
    </div>`;

  if (isEditing) {
    document.getElementById('editDetailsBtn').addEventListener('click', () => showForm(currentFlight));
  }
  document.getElementById('saveFlightBtn').addEventListener('click', saveFlight);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    isEditing = false;
    currentFlight = null;
    if (countdownInterval) clearInterval(countdownInterval);
    if (flights.find(f => !f.completed)) {
        if(confirm("Hay un vuelo sin completar. ¿Quieres descartarlo?")) {
            flights = flights.filter(f => f.completed);
            saveData();
        }
    }
    showHistory();
  });
  updateCurrentFlightView();
  startCountdown();
}

function recordOperation(op) {
  currentFlight.operations[op] = { utc: new Date().toUTCString().split(' ')[4].substring(0,5) };
  updateCurrentFlightView();
}

function adjustTime(op, minutes) {
  const currentTime = currentFlight.operations[op]?.utc;
  if (!currentTime) return;
  const [hours, mins] = currentTime.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  totalMinutes %= (24 * 60);
  const newHours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const newMins = (totalMinutes % 60).toString().padStart(2, '0');
  currentFlight.operations[op].utc = `${newHours}:${newMins}`;
  updateCurrentFlightView();
}

function updateCurrentFlightView() {
  const info = document.getElementById('currentFlightInfo');
  info.innerHTML = `<h3 class="text-xl font-bold">GHR ${currentFlight.registrationNumber}</h3><p class="text-sm text-slate-600">${currentFlight.arrivalFlight || ''} → ${currentFlight.departureFlight || ''}</p>`;
  
  const list = document.getElementById('operationsList');
  list.innerHTML = '';
  
  operations.forEach(op => {
    const opData = currentFlight.operations[op];
    const row = document.createElement('div');
    row.className = 'p-3 bg-gray-50 rounded-lg flex justify-between items-center';
    let content = `<span class="font-medium text-slate-700">${op}</span><div class="flex items-center gap-2">`;
    if (op === 'PAYLOAD') {
      content += `<input type="text" placeholder="Ej: 14300kg" value="${opData?.value || ''}" class="op-input-text border p-1 rounded-md w-28">`;
    } else if (op.includes('CHECK') || op.includes('NEEDED') || op.includes('REQUEST') || op.includes('SERVICES')) {
        // These are YES/NO fields
        content += `<span class="text-green-700 font-mono text-sm min-w-[50px] text-center">${opData?.value || '--'}</span><button class="toggle-yes-no-btn px-2 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700" data-op="${op}">${opData?.value === 'YES' ? 'NO' : (opData?.value === 'NO' ? 'YES' : 'YES')}</button>`;
    } else {
        content += `<span class="text-green-700 font-mono text-sm min-w-[50px] text-center">${opData?.utc || '--:--'}</span><button class="record-btn px-2 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">${opData ? '✓' : '+'}</button>`;
        if (opData?.utc) {
            content += `<button class="adjust-time-btn bg-gray-200 rounded-full w-6 h-6" data-op="${op}" data-amount="-1" title="Restar 1 min">-</button><button class="adjust-time-btn bg-gray-200 rounded-full w-6 h-6" data-op="${op}" data-amount="1" title="Sumar 1 min">+</button>`;
        }
    }
    content += `</div>`;
    row.innerHTML = content;
    list.appendChild(row);

    const textInput = row.querySelector('.op-input-text');
    if (textInput) {
        textInput.addEventListener('change', e => { currentFlight.operations[op] = { value: e.target.value }; saveData(); });
    } else {
        const recordBtn = row.querySelector('.record-btn');
        if (recordBtn) recordBtn.addEventListener('click', () => { recordOperation(op); saveData(); });
        row.querySelectorAll('.adjust-time-btn').forEach(btn => {
            btn.addEventListener('click', () => { adjustTime(btn.dataset.op, parseInt(btn.dataset.amount)); saveData(); });
        });
        const toggleBtn = row.querySelector('.toggle-yes-no-btn');
        if (toggleBtn) toggleBtn.addEventListener('click', e => {
            const currentVal = currentFlight.operations[op]?.value;
            currentFlight.operations[op] = { value: currentVal === 'YES' ? 'NO' : 'YES' };
            saveData();
        });
    }
  });
}


function saveFlight() {
  if (countdownInterval) clearInterval(countdownInterval);
  currentFlight.completed = true;
  const existingIndex = flights.findIndex(f => f.id === currentFlight.id);
  if (existingIndex > -1) {
    flights[existingIndex] = currentFlight;
  } else {
    flights.push(currentFlight);
  }
  saveData();
  isEditing = false;
  currentFlight = null;
  showHistory();
}

function showHistory() {
  if (countdownInterval) clearInterval(countdownInterval);
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  const completedFlights = flights.filter(f => f.completed).sort((a, b) => b.id - a.id);
  
  if (completedFlights.length === 0) {
    c.innerHTML = `<h2 class="text-2xl font-bold mb-4">Historial de Vuelos</h2><p class="text-gray-500 text-center py-8">No hay vuelos completados aún.</p><button onclick="closeViews()" class="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-md mt-4">Cerrar</button>`;
  } else {
    c.innerHTML = `
      <div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-bold text-slate-800">Historial de Vuelos</h2><button onclick="closeViews()" class="text-gray-500 hover:text-gray-800">&times;</button></div>
      <div class="space-y-3 max-h-80 overflow-y-auto">${completedFlights.map(flight => `
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
            <div><h3 class="font-semibold text-blue-800">${flight.registrationNumber}</h3><p class="text-sm text-gray-600">${flight.arrivalFlight || 'N/A'} → ${flight.departureFlight || 'N/A'}</p><p class="text-xs text-gray-500">${flight.date} - ${flight.startTime}</p></div>
            <div class="flex items-center gap-3">
              <button onclick="sendFlightReport('${flight.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Enviar</button>
              <button onclick="editFlight('${flight.id}')" class="text-gray-600 hover:text-green-600" title="Editar Vuelo"><i data-lucide="pencil"></i></button>
              <button onclick="deleteFlight('${flight.id}')" class="text-gray-600 hover:text-red-600" title="Eliminar Vuelo"><i data-lucide="trash-2"></i></button>
            </div>
          </div>`).join('')}</div>`;
    lucide.createIcons();
  }
}

function parseTimeToDate(timeString) {
    if (!timeString || !timeString.includes(':')) return null;
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function calculateDuration(startOp, endOp, operations) {
    const startTime = parseTimeToDate(operations[startOp]?.utc);
    const endTime = parseTimeToDate(operations[endOp]?.utc);
    if (!startTime || !endTime) return 'N/A';
    let diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (diff < 0) {
        diff += 24 * 60;
    }
    return `${Math.round(diff)} min`;
}

function showStatistics() {
    if (countdownInterval) clearInterval(countdownInterval);
    const c = document.getElementById('viewsContainer');
    c.classList.remove('hidden');
    const completedFlights = flights.filter(f => f.completed).sort((a, b) => b.id - a.id);
    if (completedFlights.length === 0) {
        c.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">Estadísticas</h2>
            <p class="text-gray-500 text-center py-8">No hay vuelos completados para mostrar estadísticas.</p>
            <button onclick="closeViews()" class="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-md mt-4">Cerrar</button>`;
        return;
    }
    const statsRows = completedFlights.map(flight => {
        const turnaroundTime = calculateDuration('ATA', 'TAKEOFF', flight.operations);
        const towingTime = calculateDuration('END TOWING', 'END TOWING DEPARTURE', flight.operations);
        return `<tr class="border-b"><td class="py-2 px-4 font-semibold text-blue-800">${flight.registrationNumber}</td><td class="py-2 px-4 text-center">${turnaroundTime}</td><td class="py-2 px-4 text-center">${towingTime}</td></tr>`;
    }).join('');
    c.innerHTML = `
        <div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-bold text-slate-800">Estadísticas de Operaciones</h2><button onclick="closeViews()" class="text-gray-500 hover:text-gray-800">&times;</button></div>
        <div class="max-h-96 overflow-y-auto">
            <table class="w-full text-sm text-left"><thead class="bg-gray-100 sticky top-0"><tr><th class="py-2 px-4">Vuelo</th><th class="py-2 px-4 text-center">Turnaround (ATA → Takeoff)</th><th class="py-2 px-4 text-center">Remolque (Towing → Towing)</th></tr></thead><tbody>${statsRows}</tbody></table>
        </div>`;
}

function editFlight(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    currentFlight = flight;
    isEditing = true;
    showCurrentFlight();
}

function sendFlightReport(flightId) {
  if (countdownInterval) clearInterval(countdownInterval);
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  const c = document.getElementById('viewsContainer');
  c.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📤 Enviar Reporte - ${flight.registrationNumber}</h2>
    <div id="reportPreview" class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200 max-h-72 overflow-y-auto">${generateFlightReportHTML(flight)}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button onclick="shareViaWhatsApp('${flight.id}')" class="w-full bg-green-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"><i data-lucide="send"></i> WhatsApp</button>
        <button onclick="copyReportText('${flight.id}')" class="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"><i data-lucide="clipboard"></i> Copiar Texto</button>
        <button onclick="downloadElegantPDF('${flight.id}')" class="w-full bg-red-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-800"><i data-lucide="file-down"></i> Descargar PDF</button>
        <button onclick="downloadWfsPdf('${flight.id}')" class="w-full bg-gray-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800"><i data-lucide="file-check-2"></i> FORMATO WFS</button>
    </div>
    <button onclick="showHistory()" class="w-full mt-3 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">Volver al Historial</button>`;
  lucide.createIcons();
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  const stdTime = currentFlight?.std;
  const countdownEl = document.getElementById('stdCountdown');
  if (!stdTime) {
    if (countdownEl) countdownEl.innerHTML = `<p class="text-xs text-gray-600">No hay STD definido.</p>`;
    return;
  }
  const [stdHours, stdMinutes] = stdTime.split(':').map(Number);
  const now = new Date();
  let targetDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), stdHours, stdMinutes));
  if (targetDateUTC < now) {
    targetDateUTC.setUTCDate(targetDateUTC.getUTCDate() + 1);
  }
  countdownInterval = setInterval(() => {
    const countdownEl = document.getElementById('stdCountdown');
    if (!countdownEl) {
      clearInterval(countdownInterval);
      return;
    }
    const now = new Date();
    const diff = targetDateUTC - now;
    if (diff <= 0) {
      countdownEl.innerHTML = `<p class="text-sm font-semibold text-red-600">STD Alcanzado</p>`;
      clearInterval(countdownInterval);
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const pad = (num) => String(num).padStart(2, '0');
    countdownEl.innerHTML = `
        <p class="text-xs font-semibold text-blue-800">Tiempo para STD (UTC)</p>
        <p class="text-lg font-bold text-blue-900 tabular-nums">- ${pad(hours)}:${pad(minutes)}:${pad(seconds)}</p>
    `;
  }, 1000);
}

function generateFlightReportHTML(flight) {
    const operationsText = operations.map(op => {
        const data = flight.operations[op];
        return `<tr><td class="border px-3 py-2 font-medium">${op}</td><td class="border px-3 py-2 font-mono">${data ? (data.utc || data.value || '-') : '-'}</td></tr>`;
    }).join('');
    return `<div class="text-center mb-4"><h1 class="text-xl font-bold text-blue-800">REPORTE DE VUELO BELUGA</h1><div class="text-lg font-semibold text-gray-700 mt-1">GHR ${flight.registrationNumber}</div><div class="text-sm text-gray-500">${flight.date} • ${flight.startTime}</div></div><div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm"><div><strong>Llegada:</strong> ${flight.arrivalFlight||'N/A'}</div><div><strong>Salida:</strong> ${flight.departureFlight||'N/A'}</div><div><strong>STA:</strong> ${flight.sta||'N/A'}</div><div><strong>STD:</strong> ${flight.std||'N/A'}</div><div><strong>Apt. Llegada:</strong> ${flight.arrivalAirport}</div><div><strong>Apt. Salida:</strong> ${flight.departureAirport}</div><div><strong>Coordinador:</strong> ${flight.coordinator}</div><div><strong>Conductor:</strong> ${flight.driver}</div><div><strong>Wingwalker 1:</strong> ${flight.wingwalker1}</div><div><strong>Wingwalker 2:</strong> ${flight.wingwalker2}</div><hr class="col-span-2 my-1"><div><strong>Ground Coordinator:</strong> ${flight.groundCoordinator || 'N/A'}</div><div><strong>Loadmaster:</strong> ${flight.loadmaster || 'N/A'}</div></div><h3 class="font-bold mb-2 text-md">OPERACIONES REGISTRADAS</h3><table class="w-full border-collapse border border-gray-300 text-sm"><thead class="bg-gray-100"><tr><th class="border px-3 py-2 text-left">Operación</th><th class="border px-3 py-2 text-left">Tiempo/Valor</th></tr></thead><tbody>${operationsText}</tbody></table><div class="text-center mt-4 text-xs text-gray-400">Generado por GHR BELUGA • ${new Date().toLocaleDateString('es-ES')}</div>`;
}

function downloadElegantPDF(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') { return alert("Error: La librería PDF no se ha podido cargar. Revisa tu conexión a internet."); }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    if (typeof doc.autoTable !== 'function') { return alert("Error: El plugin de tablas para PDF no se ha podido cargar. Revisa tu conexión a internet."); }
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Reporte de Vuelo GHR BELUGA", pageWidth / 2, 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`GHR ${flight.registrationNumber}  •  ${flight.date} - ${flight.startTime}`, pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalles del Vuelo", margin, 45);
    doc.autoTable({ startY: 50, body: [['Vuelo Llegada', flight.arrivalFlight||'N/A'], ['Vuelo Salida', flight.departureFlight||'N/A'], ['Aeropuerto Llegada', flight.arrivalAirport], ['Aeropuerto Salida', flight.departureAirport], ['STA', flight.sta||'N/A'], ['STD', flight.std||'N/A']], theme: 'grid', styles: { fontSize: 10 } });
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Equipo Asignado", margin, finalY);
    doc.autoTable({ startY: finalY + 5, body: [['Coordinador', flight.coordinator], ['Conductor', flight.driver], ['Wingwalker 1', flight.wingwalker1], ['Wingwalker 2', flight.wingwalker2], ['Ground Coordinator', flight.groundCoordinator || 'N/A'], ['Loadmaster', flight.loadmaster || 'N/A']], theme: 'grid', styles: { fontSize: 10 } });
    finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Operaciones Registradas", margin, finalY);
    const operationData = operations.map(op => {
        const data = flight.operations[op];
        return [op, data ? (data.utc || data.value || '-') : '-'];
    });
    doc.autoTable({ startY: finalY + 5, head: [['Operación', 'Tiempo / Valor Registrado']], body: operationData, theme: 'striped', styles: { fontSize: 10 } });
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(150);
    const footerText = `Generado por ${flight.coordinator || 'N/A'}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.save(`Reporte-${flight.registrationNumber}.pdf`);
}

// ==========================================================
// NUEVA FUNCIÓN: Genera el PDF con el formato oficial de WFS
// DIBUJA LA PLANTILLA DESDE CERO
// ==========================================================
async function downloadWfsPdf(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) {
        alert("Vuelo no encontrado.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }); // A4: 595.28 x 841.89 pt

        // --- Configuración básica de fuentes y colores ---
        doc.setFont("helvetica");
        const defaultFontSize = 8;
        doc.setFontSize(defaultFontSize);
        const black = '#000000';
        const gray = '#4a4a4a';
        const lightGray = '#cccccc';
        const blue = '#1f4e79';
        const white = '#ffffff';

        // Helper para dibujar texto centrado en un rango (x, y, width)
        const drawCenteredText = (text, x, y, width) => {
            if (!text) return;
            const textWidth = doc.getTextWidth(text);
            const textX = x + (width - textWidth) / 2;
            doc.text(text, textX, y);
        };
        // Helper para dibujar texto alineado a la derecha en un rango (x, y, width)
        const drawRightAlignedText = (text, x, y, width) => {
            if (!text) return;
            const textX = x + width;
            doc.text(text, textX, y, { align: 'right' });
        };

        // --- Cabecera con logos y título ---
        doc.setFillColor(blue);
        doc.rect(0, 0, 595.28, 40, 'F'); // Banda azul superior
        doc.setFontSize(12);
        doc.setTextColor(white);
        doc.text("GROUND HANDLING REPORT- BELUGA A300-600ST/BELUGA A330 XL", 170, 25);
        
        // Logo WFS - Asume que tienes el logo en './wfs.png' o similar
        // Si no tienes el logo como imagen, tendrías que omitir esta parte
        // o dibujar una forma simple. Para este ejemplo, lo omitiré.
        // Si lo tienes, puedes cargarlo así:
        // const wfsLogo = new Image();
        // wfsLogo.src = './wfs.png'; // Reemplaza con la ruta correcta
        // wfsLogo.onload = () => { doc.addImage(wfsLogo, 'PNG', 20, 10, 30, 20); };
        doc.setFontSize(10);
        doc.setTextColor(black);
        doc.text("Worldwide Flight Services", 20, 55); // Placeholder para el texto WFS
        doc.line(15, 60, 140, 60); // Subrayado
        doc.setFontSize(7);
        doc.text("Numero de registro", 20, 80);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("1650", 20, 90); // Este es un número fijo en la plantilla, ¿o debería ser el GHR del flight?

        // --- Cuadro de información principal ---
        doc.setDrawColor(black);
        doc.setLineWidth(0.5);
        doc.rect(15, 70, 565, 100); // Contorno principal de la sección superior

        // Rectángulos y textos de la parte superior
        doc.setFillColor(lightGray);
        doc.rect(15, 70, 565, 10, 'F'); // Franja gris Operation Data
        doc.setTextColor(black);
        doc.setFontSize(8);
        doc.text("OPERATION DATA", 25, 77);
        doc.text("ACTIVITIES & SERVICES", 25, 182); // Franja gris Activities & Services

        doc.rect(15, 95, 565, 10); // Línea debajo de Operation Data
        doc.rect(15, 120, 565, 10); // Línea debajo de los vuelos
        doc.rect(15, 145, 565, 10); // Línea debajo de Payload/ATA/TOWING

        // Divisiones verticales
        doc.line(70, 70, 70, 170); // vertical DATE
        doc.line(125, 70, 125, 170); // vertical FLIGHT IN / FLIGHT NR
        doc.line(160, 70, 160, 170); // vertical STA
        doc.line(200, 70, 200, 170); // vertical FROM
        doc.line(255, 70, 255, 170); // vertical FLIGHT OUT
        doc.line(295, 70, 295, 170); // vertical STD
        doc.line(335, 70, 335, 170); // vertical TO

        doc.line(390, 70, 390, 170); // vertical REG
        doc.line(440, 70, 440, 170); // vertical PLANE NR
        doc.line(490, 70, 490, 170); // vertical CTOT

        // Textos fijos de la cabecera
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("DATE", 35, 87);
        doc.text("FLIGHT IN", 85, 87);
        doc.text("STA", 170, 87);
        doc.text("FROM", 215, 87);
        doc.text("FLIGHT OUT", 265, 87);
        doc.text("STD", 305, 87);
        doc.text("TO", 350, 87);
        doc.text("REG", 405, 87);
        doc.text("PLANE", 450, 87);
        doc.text("NR", 455, 90);
        doc.text("CTOT", 505, 87);
        doc.text("No Pedido: A 9754571 G", 460, 77); // Texto fijo
        doc.text("PAYLOAD", 30, 152);
        doc.text("ATA", 130, 152);

        // --- Rellenar datos del vuelo ---
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Número de registro GHR
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(flight.registrationNumber || '', 70, 80, { align: 'right' }); // GHR Number
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // DATE
        drawCenteredText(flight.date || '', 15, 107, 55);
        // FLIGHT IN
        drawCenteredText(flight.arrivalFlight || '', 70, 107, 55);
        // STA
        drawCenteredText(flight.sta || '', 125, 107, 35);
        // FROM
        drawCenteredText(flight.arrivalAirport || '', 160, 107, 40);
        // FLIGHT OUT
        drawCenteredText(flight.departureFlight || '', 200, 107, 55);
        // STD
        drawCenteredText(flight.std || '', 255, 107, 35);
        // TO
        drawCenteredText(flight.departureAirport || '', 295, 107, 40);

        // REG (del aircraft)
        const regMatch = flight.aircraft.match(/ - (F-[A-Z0-9]+) /);
        drawCenteredText(regMatch ? regMatch[1] : '', 390, 107, 50);
        // PLANE NR (del aircraft)
        const planeNumMatch = flight.aircraft.match(/\(Avión Nº (\d+)\)/);
        drawCenteredText(planeNumMatch ? planeNumMatch[1] : '', 440, 107, 50);
        
        // CTOT - No hay campo para esto en la app, usar N/A
        drawCenteredText('N/A', 490, 107, 50);


        // PAYLOAD
        drawCenteredText(flight.operations['PAYLOAD']?.value || '', 15, 132, 55);
        // ATA
        drawCenteredText(flight.operations['ATA']?.utc || '', 70, 132, 55);

        // Horas en la segunda fila (19:28 / Hamburgo XFW etc)
        // Fecha actual + hora ATA
        const flightDate = flight.date.split('/').join('');
        const arrivalTime = flight.operations['ATA']?.utc || ' ';
        const departureTime = flight.operations['TAKEOFF']?.utc || ' '; // O 'END TOWING DEPARTURE'
        
        doc.setFontSize(7);
        doc.text(flightDate, 35, 100); // Date
        doc.text(arrivalTime, 100, 100); // Flight In time
        doc.text(flight.sta, 170, 100); // STA
        doc.text(flight.arrivalAirport, 215, 100); // From
        doc.text(flight.departureFlight, 265, 100); // Flight Out
        doc.text(flight.std, 305, 100); // STD
        doc.text(flight.departureAirport, 350, 100); // To

        // --- Sección Activities & Services ---
        doc.setDrawColor(black);
        doc.setFillColor(lightGray);
        doc.rect(15, 175, 565, 10, 'F'); // Franja gris Activities & Services

        // Tabla de operaciones (líneas y texto estático)
        let currentY = 195;
        const rowHeight = 10;
        const col1Width = 100;
        const col2Width = 25;
        const col3Width = 25;
        const col4Width = 60;
        const col5Width = 25;
        const col6Width = 25;
        const col7Width = 60;
        const textIndent = 5;

        const drawOperationRow = (y, label, opKey, isYesNo = false) => {
            doc.text(label, 20, y + 7);
            doc.rect(120, y, col2Width, rowHeight); // YES
            doc.rect(145, y, col3Width, rowHeight); // NO
            doc.text("YES", 124, y + 7);
            doc.text("NO", 149, y + 7);

            const value = flight.operations[opKey]?.value;
            const utc = flight.operations[opKey]?.utc;

            if (isYesNo) {
                if (value === 'YES') { doc.text('X', 130, y + 7); }
                else if (value === 'NO') { doc.text('X', 155, y + 7); }
            } else if (opKey === 'PAYLOAD') {
                 // PAYLOAD ya se maneja arriba
            } else { // Time operations
                doc.text("STARTING", 185, y + 3);
                doc.text("END", 230, y + 3);
                doc.rect(180, y + 4, col4Width, rowHeight - 4); // STARTING TIME BOX
                doc.rect(225, y + 4, col4Width, rowHeight - 4); // END TIME BOX
                doc.text(flight.operations[opKey]?.utc || '', 185, y + 10);
            }
        };

        // Header de la sección de operaciones de la izquierda
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("FOD CHECK COMPLETED", 20, 200);
        doc.text("GSE CLEAN & SERVICEABLE", 20, 210);
        doc.text("ACU NEEDED", 20, 220);
        doc.text("GPU NEEDED", 20, 230);
        doc.text("FUEL NEEDED", 20, 240);
        doc.text("N/A REQUEST", 20, 250);
        doc.text("WATER TRUCK SERVICES", 20, 260);

        doc.text("NO", 120 + 25 + 5, 197); // NO Headers
        doc.text("YES", 120 + 5, 197); // YES Headers
        doc.text("NO", 120 + 25 + 5, 207);
        doc.text("YES", 120 + 5, 207);
        // ... y así para todos los demás YES/NO

        // DIBUJAR CUADROS Y RELLENAR DATOS DE LA IZQUIERDA (YES/NO)
        // Ejemplo para FOD CHECK COMPLETED
        const drawYesNo = (opKey, yPos) => {
            doc.rect(120, yPos, 25, 10); // YES box
            doc.rect(145, yPos, 25, 10); // NO box
            doc.text("YES", 124, yPos + 7);
            doc.text("NO", 149, yPos + 7);
            const val = flight.operations[opKey]?.value;
            if (val === 'YES') { doc.text('X', 130, yPos + 7); }
            else if (val === 'NO') { doc.text('X', 155, yPos + 7); }
        };

        drawYesNo('FOD CHECK COMPLETED', 193);
        drawYesNo('GSE CLEAN & SERVICEABLE', 203);
        drawYesNo('ACU NEEDED', 213);
        drawYesNo('GPU NEEDED', 223);
        drawYesNo('FUEL NEEDED', 233);
        drawYesNo('N/A REQUEST', 243);
        drawYesNo('WATER TRUCK SERVICES', 253);

        // --- Secciones de Tiempos (Activities & Services) ---
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        // Sección 'EQUIPOS LISTOS'
        doc.text("EQUIPOS LISTOS:", 300, 240);
        doc.rect(360, 235, 50, 10); // Caja para el tiempo
        drawCenteredText(flight.operations['EQUIPOS LISTOS']?.utc || '', 360, 242, 50);

        // Sección GPU ON/OFF
        doc.text("GPU ON", 300, 203);
        doc.text("GPU OFF", 300, 213);
        doc.rect(360, 198, 50, 10); // GPU ON BOX
        doc.rect(360, 208, 50, 10); // GPU OFF BOX
        drawCenteredText(flight.operations['GPU ON']?.utc || '', 360, 205, 50);
        drawCenteredText(flight.operations['GPU OFF']?.utc || '', 360, 215, 50);

        // Sección FUEL
        doc.text("FUEL (STARTING)", 300, 223);
        doc.text("FUEL (END)", 300, 233);
        doc.rect(360, 218, 50, 10); // FUEL STARTING BOX
        doc.rect(360, 228, 50, 10); // FUEL END BOX
        drawCenteredText(flight.operations['FUEL (STARTING)']?.utc || '', 360, 225, 50);
        drawCenteredText(flight.operations['FUEL (END)']?.utc || '', 360, 235, 50);

        // Sección ACU
        doc.text("ACU ON", 450, 203);
        doc.text("ACU OFF", 450, 213);
        doc.rect(510, 198, 50, 10); // ACU ON BOX
        doc.rect(510, 208, 50, 10); // ACU OFF BOX
        drawCenteredText(flight.operations['ACU ON']?.utc || '', 510, 205, 50);
        drawCenteredText(flight.operations['ACU OFF']?.utc || '', 510, 215, 50);

        // CONES & DRAW CHOCKS
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("CONES & DRAW CHOCKS POSITIONING AT ILF", 300, 190);
        // Aquí irían las imágenes si las tuvieras
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Conos en el ILF 7 conos.", 300, 255);
        doc.text("Conos en el ILF con vientos mas de 20 nudos: 10 conos (2 mas interior tren principal)", 300, 265);
        doc.text("Calzos durante Night Stop: 12 calzos (todas ruedas calzadas).", 300, 275);


        // --- ILS SETTINGS TIMES ARRIVAL ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("ILS SETTING TIMES ARRIVAL", 20, 280);
        doc.rect(15, 273, 275, 20); // Caja principal
        doc.text("FROM", 20, 287);
        doc.text("TOWING", 120, 287);
        doc.text("STARTING", 60, 283);
        doc.text("END", 90, 283);
        doc.text("STARTING", 160, 283);
        doc.text("END", 190, 283);
        doc.text("STARTING", 220, 283);
        doc.text("END", 250, 283);

        doc.rect(60, 287, 30, 10); // STARTING box
        doc.rect(90, 287, 30, 10); // END box
        doc.rect(160, 287, 30, 10); // STARTING box
        doc.rect(190, 287, 30, 10); // END box
        doc.rect(220, 287, 30, 10); // STARTING box
        doc.rect(250, 287, 30, 10); // END box

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        drawCenteredText(flight.operations['FRONT JACK UP']?.utc || '', 60, 294, 30);
        drawCenteredText(flight.operations['REAR JACK UP']?.utc || '', 90, 294, 30);
        drawCenteredText(flight.operations['FRONT JACK DOWN']?.utc || '', 160, 294, 30);
        drawCenteredText(flight.operations['REAR JACK DOWN']?.utc || '', 190, 294, 30);
        drawCenteredText(flight.operations['START TOWING']?.utc || '', 220, 294, 30);
        drawCenteredText(flight.operations['END TOWING']?.utc || '', 250, 294, 30);


        // --- ILS SETTINGS TIMES DEPARTURE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("ILS SETTING TIMES DEPARTURE", 20, 310);
        doc.rect(15, 303, 275, 20); // Caja principal
        doc.text("FROM", 20, 317);
        doc.text("TOWING", 120, 317);
        doc.text("STARTING", 60, 313);
        doc.text("END", 90, 313);
        doc.text("STARTING", 160, 313);
        doc.text("END", 190, 313);
        doc.text("STARTING", 220, 313);
        doc.text("END", 250, 313);

        doc.rect(60, 317, 30, 10); // STARTING box
        doc.rect(90, 317, 30, 10); // END box
        doc.rect(160, 317, 30, 10); // STARTING box
        doc.rect(190, 317, 30, 10); // END box
        doc.rect(220, 317, 30, 10); // STARTING box
        doc.rect(250, 317, 30, 10); // END box

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        drawCenteredText(flight.operations['START TOWING DEPARTURE']?.utc || '', 60, 324, 30);
        drawCenteredText(flight.operations['END TOWING DEPARTURE']?.utc || '', 90, 324, 30);
        // Aquí irían los otros campos si los tuviera
        drawCenteredText('N/A', 160, 324, 30);
        drawCenteredText('N/A', 190, 324, 30);
        drawCenteredText('N/A', 220, 324, 30);
        drawCenteredText('N/A', 250, 324, 30);


        // --- MANDATORY ARRIVAL WALK AROUND CHECK AND DAMAGE REPORT ---
        doc.setFillColor(lightGray);
        doc.rect(15, 335, 565, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("MANDATORY ARRIVAL WALK AROUND CHECK AND DAMAGE REPORT", 25, 342);
        
        doc.rect(15, 350, 565, 100); // Caja principal
        doc.text("CHECK", 20, 357);
        doc.text("CONFIRM", 100, 357);
        doc.text("BRIEF DAMAGE INFORMATION (TIMING)", 300, 357);

        // Líneas internas
        doc.line(80, 350, 80, 450); // Vertical Check/Confirm
        doc.line(170, 350, 170, 450); // Vertical Confirm/Damage
        doc.line(15, 365, 580, 365); // Horizontal debajo de headers
        doc.line(15, 380, 580, 380); // Horizontal
        doc.line(15, 395, 580, 395); // Horizontal
        doc.line(15, 410, 580, 410); // Horizontal
        doc.line(15, 425, 580, 425); // Horizontal
        doc.line(15, 440, 580, 440); // Horizontal


        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        const yOffsetDamage = 373;
        const xYes = 110;
        const xNo = 140;

        // ACT DAMAGED
        doc.text("ACT DAMAGED", 20, yOffsetDamage);
        doc.rect(xYes, yOffsetDamage - 6, 15, 10);
        doc.text("YES", xYes + 2, yOffsetDamage);
        doc.rect(xNo, yOffsetDamage - 6, 15, 10);
        doc.text("NO", xNo + 2, yOffsetDamage);
        // Asumiendo que no hay un campo específico para esto, dejar en blanco
        // Si hay un campo en flight.operations, se podría rellenar

        // REPORTED IN TECH. LOG
        doc.text("REPORTED IN TECH. LOG", 20, yOffsetDamage + 15);
        doc.rect(xYes, yOffsetDamage + 15 - 6, 15, 10);
        doc.text("YES", xYes + 2, yOffsetDamage + 15);
        doc.rect(xNo, yOffsetDamage + 15 - 6, 15, 10);
        doc.text("NO", xNo + 2, yOffsetDamage + 15
