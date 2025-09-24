// app.js - Versión FINAL con formato WFS, nuevos campos y todas las funcionalidades
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

const operations = [
  'EQUIPOS LISTOS', 'PAYLOAD', 'ATA', 'PARADA MOTORES', 'FUEL (STARTING)', 'FUEL (END)', 'ACU ON', 'ACU OFF',
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
        c.innerHTML = `<h2 class="text-2xl font-bold mb-4">Estadísticas</h2><p class="text-gray-500 text-center py-8">No hay vuelos completados para mostrar estadísticas.</p><button onclick="closeViews()" class="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-md mt-4">Cerrar</button>`;
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
    return `<div class="text-center mb-4"><h1 class="text-xl font-bold text-blue-800">REPORTE DE VUELO BELUGA</h1><div class="text-lg font-semibold text-gray-700 mt-1">GHR ${flight.registrationNumber}</div><div class="text-sm text-gray-500">${flight.date} • ${flight.startTime}</div></div><div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm"><div><strong>Llegada:</strong> ${flight.arrivalFlight||'N/A'}</div><div><strong>Salida:</strong> ${flight.departureFlight||'N/A'}</div><div><strong>STA:</strong> ${flight.sta||'N/A'}</div><div><strong>STD:</strong> ${flight.std||'N/A'}</div><div><strong>Apt. Llegada:</strong> ${flight.arrivalAirport}</div><div><strong>Apt. Salida:</strong> ${flight.departureAirport}</div><div><strong>Coordinador:</strong> ${flight.coordinator}</div><div><strong>Conductor:</strong> ${flight.driver}</div><div><strong>Wingwalker 1:</strong> ${flight.wingwalker1}</div><div><strong>Wingwalker 2:</strong> ${flight.wingwalker2}</div><hr class="col-span-2 my-1"><div><strong>Ground Coordinator:</strong> ${flight.groundCoordinator || 'N/A'}</div><div><strong>Loadmaster:</strong> ${flight.loadmaster || 'N/A'}</div></div><h3 class="font-bold mb-2 text-md">OPERACIONES REGISTRADAS</h3><table class="w-full border-collapse border border-gray-300 text-sm"><thead class="bg-gray-100"><tr><th class="border px-3 py-2 text-left">Operación</th><th class="border px-3 py-2 text-left">Tiempo/Valor</th></tr></thead><tbody>${operationsText}</tbody></table><div class="text-center mt-4 text-xs text-gray-400">Generado por GHR BELUGA • ${new Date().toLocaleString('es-ES')}</div>`;
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

async function downloadWfsPdf(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

        const addText = (text, x, y, options = {}) => {
            const { size = 8, align = 'left' } = options;
            doc.setFontSize(size);
            doc.text(text || '', x, y, { align: align });
        };
        
        const img = new Image();
        img.src = './ghr-wfs-template.png';
        img.onload = () => {
            doc.addImage(img, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());

            const planeNumberMatch = flight.aircraft.match(/\(Avión Nº (\d+)\)/);
            const planeNumber = planeNumberMatch ? planeNumberMatch[1] : '';

            // Fila 1: GHR, Aircraft, Plane Number
            addText(flight.registrationNumber, 126, 104);
            addText(flight.aircraft.split(' - ')[1].split(' (')[0], 367, 120);
            addText(planeNumber, 429, 118);
            
            // Fila 2: Date, Flight In, STA, From, Flight Out, STD, To
            addText(flight.date, 76, 144);
            addText(flight.arrivalFlight, 134, 144);
            addText(flight.sta, 165, 144);
            addText((flight.arrivalAirport || '').slice(-3), 210, 144); // FROM (Last 3 letters)
            addText(flight.departureFlight, 269, 144);
            addText(flight.std, 309, 144);
            addText((flight.departureAirport || '').slice(-3), 347, 144); // TO (Last 3 letters)
            
            // Fila 3: Payload, ATA/End Towing, End Towing Dep/Takeoff
            addText(flight.operations['PAYLOAD']?.value, 114, 154);
            addText(`${flight.operations['ATA']?.utc || '--:--'} / ${flight.operations['END TOWING']?.utc || '--:--'}`, 245, 154, { align: 'center' });
            addText(`${flight.operations['END TOWING DEPARTURE']?.utc || '--:--'} / ${flight.operations['TAKEOFF']?.utc || '--:--'}`, 398, 154, { align: 'center' });
            
            // Operaciones
            addText(flight.operations['EQUIPOS LISTOS']?.utc, 235, 241);
            addText(flight.operations['GPU ON']?.utc, 190, 205);
            addText(flight.operations['GPU OFF']?.utc, 217, 205);
            addText(flight.operations['FUEL (STARTING)']?.utc, 190, 214);
            addText(flight.operations['FUEL (END)']?.utc, 217, 214);
            addText(flight.operations['ACU ON']?.utc, 190, 223);
            addText(flight.operations['ACU OFF']?.utc, 217, 223);
            addText(flight.operations['START TOWING']?.utc, 71, 304);
            addText(flight.operations['END TOWING']?.utc, 115, 304);
            addText(flight.operations['START TOWING DEPARTURE']?.utc, 155, 304);
            addText(flight.operations['END TOWING DEPARTURE']?.utc, 200, 304);
            addText(flight.operations['FRONT JACK UP']?.utc, 74, 278);
            addText(flight.operations['REAR JACK UP']?.utc, 116, 278);
            addText(flight.operations['FRONT JACK DOWN']?.utc, 156, 278);
            addText(flight.operations['REAR JACK DOWN']?.utc, 201, 278);
            addText(flight.operations['PARADA MOTORES']?.utc, 113, 508);
            addText(flight.operations['STARTUP']?.utc, 202, 508);
            addText(flight.operations['TAXI']?.utc, 259, 508);

            // Crew Info (sin roles)
            const crewLine = [flight.coordinator, flight.driver, flight.wingwalker1, flight.wingwalker2].filter(Boolean).join(', ');
            addText(crewLine, 75, 520, { size: 8 });

            doc.save(`GHR-WFS-${flight.registrationNumber}.pdf`);
        };
        img.onerror = () => { alert("No se pudo cargar la plantilla 'ghr-wfs-template.png'. Asegúrate de que el archivo existe y tiene el nombre correcto."); };
    } catch (e) { console.error(e); alert("Ocurrió un error al generar el PDF WFS."); }
}

function shareViaWhatsApp(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    const operationsText = operations.map(op => {
        const data = flight.operations[op];
        const value = data ? (data.utc || data.value || '-') : '-';
        return `• ${op}: ${value}`;
    }).join('\n');
    const message = `📋 *REPORTE VUELO BELUGA*\n📢 GHR: ${flight.registrationNumber}\n📅 ${flight.date} • ${flight.startTime}\n\n✈️ *VUELOS*\n🛬 Llegada: ${flight.arrivalFlight || 'N/A'}\n🛫 Salida: ${flight.departureFlight || 'N/A'}\n\n🏢 *AEROPUERTOS*\n📍 Llegada: ${flight.arrivalAirport}\n📍 Salida: ${flight.departureAirport}\n\n👥 *EQUIPO*\n👨‍💼 Coordinador: ${flight.coordinator}\n🚗 Conductor: ${flight.driver}\n🚶‍♂️ Wingwalker 1: ${flight.wingwalker1}\n🚶‍♂️ Wingwalker 2: ${flight.wingwalker2}\n\n-- Otra Empresa --\n👤 Ground Coordinator: ${flight.groundCoordinator || 'N/A'}\n👤 Loadmaster: ${flight.loadmaster || 'N/A'}\n\n⚙️ *OPERACIONES*\n${operationsText}\n\n_Generado por GHR BELUGA_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function copyReportText(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    const operationsText = operations.map(op => {
        const data = flight.operations[op];
        const value = data ? (data.utc || data.value || '-') : '-';
        return `- ${op}: ${value}`;
    }).join('\n');
    const textReport = `REPORTE VUELO BELUGA\nGHR: ${flight.registrationNumber}\nFecha: ${flight.date} - ${flight.startTime}\n\nVUELOS:\n- Llegada: ${flight.arrivalFlight || 'N/A'}\n- Salida: ${flight.departureFlight || 'N/A'}\n\nAEROPUERTOS:\n- Llegada: ${flight.arrivalAirport}\n- Salida: ${flight.departureAirport}\n\nEQUIPO:\n- Coordinador: ${flight.coordinator}\n- Conductor: ${flight.driver}\n- Wingwalker 1: ${flight.wingwalker1}\n- Wingwalker 2: ${flight.wingwalker2}\n\n-- Otra Empresa --\n- Ground Coordinator: ${flight.groundCoordinator || 'N/A'}\n- Loadmaster: ${flight.loadmaster || 'N/A'}\n\nOPERACIONES REGISTRADAS:\n${operationsText}\n\nGenerado por GHR BELUGA - ${new Date().toLocaleDateString('es-ES')}`;
    navigator.clipboard.writeText(textReport).then(() => { alert('✅ Reporte copiado al portapapeles.'); }).catch(() => alert('❌ No se pudo copiar el reporte.'));
}

function printReport() {
    window.print();
}

function generateCrewOptions() {
  const fill = (id, arr) => {
    const sel = document.getElementById(id); if(!sel) return;
    sel.innerHTML = arr.map(v => `<option value="${v}">${v || 'Seleccionar...'}</option>`).join('');
  };
  fill('coordinator', coordinatorOptions);
  fill('driver', driverOptions);
  fill('wingwalker1', wingwalkerOptions);
  fill('wingwalker2', wingwalkerOptions);
  fill('groundCoordinator', externalCrewOptions);
  fill('loadmaster', externalCrewOptions);
}

function generateAirportOptions() {
  ['arrivalAirport','departureAirport'].forEach(id => {
    const sel = document.getElementById(id); if(!sel) return;
    sel.innerHTML = airportOptions.map(v => `<option value="${v}">${v || 'Seleccionar...'}</option>`).join('');
  });
}

function generateAircraftOptions() {
    const sel = document.getElementById('aircraft');
    if (!sel) return;
    sel.innerHTML = aircraftOptions.map(v => `<option value="${v}">${v || 'Seleccionar...'}</option>`).join('');
}

function updateContinueButton() {
  const btn = document.getElementById('continueFlightBtn');
  const uncompleted = flights.find(f => !f.completed);
  if (uncompleted) {
    btn.classList.remove('hidden');
    btn.innerHTML = `<i data-lucide="play-circle"></i> Continuar ${uncompleted.registrationNumber || ''}`;
    btn.onclick = () => { currentFlight = uncompleted; showCurrentFlight(); };
  } else {
    btn.classList.add('hidden');
  }
  lucide.createIcons();
}

function closeViews() {
    if (countdownInterval) clearInterval(countdownInterval);
    document.getElementById('viewsContainer').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('newFlightBtn').addEventListener('click', () => showForm());
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('statsBtn').addEventListener('click', showStatistics);
  
  window.editFlight = editFlight;
  window.deleteFlight = deleteFlight;
  window.showHistory = showHistory;
  window.showStatistics = showStatistics;
  window.sendFlightReport = sendFlightReport;
  window.shareViaWhatsApp = shareViaWhatsApp;
  window.copyReportText = copyReportText;
  window.printReport = printReport;
  window.downloadElegantPDF = downloadElegantPDF;
  window.downloadWfsPdf = downloadWfsPdf;
  window.closeViews = closeViews;
  window.showForm = showForm;
  window.showCurrentFlight = showCurrentFlight;
});








