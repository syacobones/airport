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
        <input id="registrationNumber" type="text" class="w-full border p-2 rounded" placeholder="Ej: GHR 1860" required>
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
          <input id="arrivalFlight" type="text" class="w-full border p-2 rounded" placeholder="Ej: BGA116H">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Vuelo Salida</label>
          <input id="departureFlight" type="text" class="w-full border p-2 rounded" placeholder="Ej: BGA163H">
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

function adjustTime(op, minutes) {
  const currentTime = currentFlight.operations[op]?.utc;
  if (!currentTime) return;
  
  // Convertir tiempo HH:MM a minutos
  const [hours, mins] = currentTime.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Manejar overflow de 24 horas
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
  
  // Convertir de vuelta a HH:MM
  const newHours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const newMins = (totalMinutes % 60).toString().padStart(2, '0');
  
  currentFlight.operations[op].utc = `${newHours}:${newMins}`;
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

function showHistory() {
  const c = document.getElementById('viewsContainer');
  c.classList.remove('hidden');
  
  if (flights.filter(f => f.completed).length === 0) {
    c.innerHTML = `
      <h2 class="text-xl font-bold mb-4">Historial de Vuelos</h2>
      <p class="text-gray-500 text-center py-8">No hay vuelos completados aún</p>
      <button id="closeHistoryBtn" class="w-full bg-gray-200 py-2 rounded">Cerrar</button>
    `;
  } else {
    const completedFlights = flights.filter(f => f.completed);
    c.innerHTML = `
      <h2 class="text-xl font-bold mb-4">Historial de Vuelos</h2>
      <div class="space-y-3 max-h-60 overflow-y-auto">
        ${completedFlights.map(flight => `
          <div class="bg-gray-50 p-3 rounded border">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold">${flight.registrationNumber}</h3>
                <p class="text-sm text-gray-600">${flight.arrivalFlight || 'N/A'} → ${flight.departureFlight || 'N/A'}</p>
                <p class="text-xs text-gray-500">${flight.date} - ${flight.startTime}</p>
              </div>
              <div class="flex gap-2">
                <button onclick="sendFlightReport('${flight.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">📤 Enviar</button>
                <button onclick="viewFlightDetails('${flight.id}')" class="text-blue-600 text-sm hover:underline">Ver detalles</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button id="closeHistoryBtn" class="w-full bg-gray-200 py-2 rounded mt-4">Cerrar</button>
    `;
  }
  
  document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });
}

function viewFlightDetails(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  
  const c = document.getElementById('viewsContainer');
  c.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Detalles del Vuelo ${flight.registrationNumber}</h2>
    <div class="space-y-2 text-sm">
      <p><strong>Fecha:</strong> ${flight.date}</p>
      <p><strong>Hora inicio:</strong> ${flight.startTime}</p>
      <p><strong>Vuelo llegada:</strong> ${flight.arrivalFlight || 'N/A'}</p>
      <p><strong>Vuelo salida:</strong> ${flight.departureFlight || 'N/A'}</p>
      <p><strong>Aeropuerto llegada:</strong> ${flight.arrivalAirport}</p>
      <p><strong>Aeropuerto salida:</strong> ${flight.departureAirport}</p>
      <p><strong>Coordinador:</strong> ${flight.coordinator}</p>
      <p><strong>Conductor:</strong> ${flight.driver}</p>
      <p><strong>Wingwalker 1:</strong> ${flight.wingwalker1}</p>
      <p><strong>Wingwalker 2:</strong> ${flight.wingwalker2}</p>
    </div>
    <h3 class="font-bold mt-4 mb-2">Operaciones registradas:</h3>
    <div class="space-y-1 max-h-40 overflow-y-auto">
      ${Object.entries(flight.operations).map(([op, data]) => `
        <div class="flex justify-between text-sm bg-gray-50 p-2 rounded">
          <span>${op}</span>
          <span class="font-mono">${data.utc || data.value || ''}</span>
        </div>
      `).join('')}
    </div>
    <div class="flex gap-2 mt-4">
      <button onclick="showHistory()" class="flex-1 bg-blue-600 text-white py-2 rounded">Volver al Historial</button>
      <button id="closeDetailsBtn" class="flex-1 bg-gray-200 py-2 rounded">Cerrar</button>
    </div>
  `;
  
  document.getElementById('closeDetailsBtn').addEventListener('click', () => {
    document.getElementById('viewsContainer').classList.add('hidden');
  });
}

function sendFlightReport(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  
  // Generar reporte elegante
  const report = generateFlightReport(flight);
  
  // Mostrar opciones de envío
  const c = document.getElementById('viewsContainer');
  c.innerHTML = `
    <h2 class="text-xl font-bold mb-4">📤 Enviar Reporte - ${flight.registrationNumber}</h2>
    
    <!-- Vista previa del reporte -->
    <div id="reportPreview" class="bg-gray-50 p-4 rounded mb-4 max-h-60 overflow-y-auto print-content">
      ${report}
    </div>
    
    <div class="space-y-3">
      <h3 class="font-semibold">Selecciona cómo enviar:</h3>
      
      <button onclick="shareViaWhatsApp('${flightId}')" class="w-full bg-green-600 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-green-700">
        📱 Compartir por WhatsApp
      </button>
      
      <button onclick="copyReportText('${flightId}')" class="w-full bg-blue-600 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
        📋 Copiar texto para pegar
      </button>
      
      <button onclick="printReport()" class="w-full bg-gray-700 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-gray-800">
        🖨️ Imprimir / Guardar como PDF
      </button>
      
      <button onclick="shareViaEmail('${flightId}')" class="w-full bg-red-600 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-red-700">
        📧 Enviar por Email
      </button>
    </div>
    
    <div class="flex gap-2 mt-4">
      <button onclick="showHistory()" class="flex-1 bg-gray-200 py-2 rounded">Volver al Historial</button>
    </div>
  `;
}

function generateFlightReport(flight) {
  const operationsText = Object.entries(flight.operations).length > 0 
    ? Object.entries(flight.operations).map(([op, data]) => 
        `<tr><td class="border px-2 py-1 font-medium">${op}</td><td class="border px-2 py-1 font-mono">${data.utc || data.value || '-'}</td></tr>`
      ).join('')
    : '<tr><td colspan="2" class="border px-2 py-1 text-center text-gray-500">No hay operaciones registradas</td></tr>';

  return `
    <div class="text-center mb-4">
      <h1 class="text-2xl font-bold text-blue-800">📋 REPORTE DE VUELO BELUGA</h1>
      <div class="text-lg font-semibold text-gray-700 mt-2">GHR ${flight.registrationNumber}</div>
      <div class="text-sm text-gray-500">${flight.date} • ${flight.startTime}</div>
    </div>
    
    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div class="space-y-1">
        <div><strong>🛬 Llegada:</strong> ${flight.arrivalFlight || 'N/A'}</div>
        <div><strong>🛫 Salida:</strong> ${flight.departureFlight || 'N/A'}</div>
        <div><strong>⏰ STA:</strong> ${flight.sta || 'N/A'}</div>
        <div><strong>⏰ STD:</strong> ${flight.std || 'N/A'}</div>
      </div>
      <div class="space-y-1">
        <div><strong>🏢 Llegada:</strong> ${flight.arrivalAirport}</div>
        <div><strong>🏢 Salida:</strong> ${flight.departureAirport}</div>
        <div><strong>👨‍💼 Coordinador:</strong> ${flight.coordinator}</div>
        <div><strong>🚗 Conductor:</strong> ${flight.driver}</div>
      </div>
    </div>
    
    <div class="mb-4 text-sm">
      <div class="grid grid-cols-2 gap-4">
        <div><strong>🚶‍♂️ Wingwalker 1:</strong> ${flight.wingwalker1}</div>
        <div><strong>🚶‍♂️ Wingwalker 2:</strong> ${flight.wingwalker2}</div>
      </div>
    </div>
    
    <h3 class="font-bold mb-2 text-lg">⚙️ OPERACIONES REGISTRADAS</h3>
    <table class="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr class="bg-blue-100">
          <th class="border px-2 py-1 text-left">Operación</th>
          <th class="border px-2 py-1 text-left">Tiempo/Valor</th>
        </tr>
      </thead>
      <tbody>
        ${operationsText}
      </tbody>
    </table>
    
    <div class="text-center mt-4 text-xs text-gray-500">
      Generado por GHR BELUGA • ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}
    </div>
  `;
}

function shareViaWhatsApp(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  
  const message = `📋 *REPORTE VUELO BELUGA*
🔢 GHR: ${flight.registrationNumber}
📅 ${flight.date} • ${flight.startTime}

✈️ *VUELOS*
🛬 Llegada: ${flight.arrivalFlight || 'N/A'}
🛫 Salida: ${flight.departureFlight || 'N/A'}

🏢 *AEROPUERTOS*
📍 Llegada: ${flight.arrivalAirport}
📍 Salida: ${flight.departureAirport}

👥 *EQUIPO*
👨‍💼 Coordinador: ${flight.coordinator}
🚗 Conductor: ${flight.driver}
🚶‍♂️ Wingwalker 1: ${flight.wingwalker1}
🚶‍♂️ Wingwalker 2: ${flight.wingwalker2}

⚙️ *OPERACIONES*
${Object.entries(flight.operations).map(([op, data]) => 
  `• ${op}: ${data.utc || data.value || '-'}`).join('\n')}

_Generado por GHR BELUGA_`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

function copyReportText(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  
  const textReport = `REPORTE VUELO BELUGA
GHR: ${flight.registrationNumber}
Fecha: ${flight.date} - ${flight.startTime}

VUELOS:
- Llegada: ${flight.arrivalFlight || 'N/A'}
- Salida: ${flight.departureFlight || 'N/A'}

AEROPUERTOS:
- Llegada: ${flight.arrivalAirport}
- Salida: ${flight.departureAirport}

EQUIPO:
- Coordinador: ${flight.coordinator}
- Conductor: ${flight.driver}
- Wingwalker 1: ${flight.wingwalker1}
- Wingwalker 2: ${flight.wingwalker2}

OPERACIONES REGISTRADAS:
${Object.entries(flight.operations).map(([op, data]) => 
  `- ${op}: ${data.utc || data.value || '-'}`).join('\n')}

Generado por GHR BELUGA - ${new Date().toLocaleDateString('es-ES')}`;

  navigator.clipboard.writeText(textReport).then(() => {
    alert('✅ Reporte copiado al portapapeles. Ya puedes pegarlo donde necesites.');
  }).catch(() => {
    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = textReport;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('✅ Reporte copiado al portapapeles.');
  });
}

function printReport() {
  window.print();
}

function shareViaEmail(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  
  const subject = encodeURIComponent(`Reporte Vuelo BELUGA - GHR ${flight.registrationNumber}`);
  const body = encodeURIComponent(`Adjunto el reporte del vuelo BELUGA:

GHR: ${flight.registrationNumber}
Fecha: ${flight.date}
Vuelo Llegada: ${flight.arrivalFlight || 'N/A'}
Vuelo Salida: ${flight.departureFlight || 'N/A'}

Para ver el reporte completo con todas las operaciones, por favor consulta el archivo adjunto.

Saludos,
Equipo GHR BELUGA`);
  
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailtoUrl;
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
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  
  // Hacer funciones accesibles globalmente
  window.viewFlightDetails = viewFlightDetails;
  window.showHistory = showHistory;
  window.sendFlightReport = sendFlightReport;
  window.shareViaWhatsApp = shareViaWhatsApp;
  window.copyReportText = copyReportText;
  window.printReport = printReport;
  window.shareViaEmail = shareViaEmail;
});
