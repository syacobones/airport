// app.js - Versión COMPLETA con Fix para PDF e Impresión
let flights = [];
let currentFlight = null;
let isEditing = false;

const coordinatorOptions = ["", "Sergio Iacobone", "Francisco Cartas", "Fernando Perez", "Paco Muñoz"];
const driverOptions = ["", "Fidel Botey", "Juan Gamez", "Paco Jerez", "Gaspar Franco"];
const wingwalkerOptions = ["", ...coordinatorOptions.slice(1), ...driverOptions.slice(1)];
const airportOptions = ["", "Toulouse TLS", "Hamburgo XFW", "Bremen BRE", "Saint-Nazaire SNR", "Chester CEG"];

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

function showForm(flightToEdit = null) {
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
      <div class="flex gap-2 mt-4">
        <button type="submit" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition duration-300">${isEditing ? 'Guardar Cambios' : 'Crear Vuelo'}</button>
        <button id="cancelBtn" type="button" class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">Cancelar</button>
      </div>
    </form>`;

  generateCrewOptions();
  generateAirportOptions();

  if (isEditing) {
    document.getElementById('arrivalAirport').value = flightToEdit.arrivalAirport;
    document.getElementById('departureAirport').value = flightToEdit.departureAirport;
    document.getElementById('coordinator').value = flightToEdit.coordinator;
    document.getElementById('driver').value = flightToEdit.driver;
    document.getElementById('wingwalker1').value = flightToEdit.wingwalker1;
    document.getElementById('wingwalker2').value = flightToEdit.wingwalker2;
  }

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
    if (flights.find(f => !f.completed)) {
        if(confirm("Hay un vuelo sin completar. ¿Quieres descartarlo?")) {
            flights = flights.filter(f => f.completed);
            saveData();
        }
    }
    showHistory();
  });
  updateCurrentFlightView();
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
    if (op === 'EQUIPOS LISTOS') {
      content += `<input type="time" value="${opData?.utc || ''}" class="op-input-time border p-1 rounded-md">`;
    } else if (op === 'PAYLOAD') {
      content += `<input type="text" placeholder="Ej: 14300kg" value="${opData?.value || ''}" class="op-input-text border p-1 rounded-md w-28">`;
    } else if (op === 'FUEL' || op === 'ACU') {
      content += `<label class="ml-2 text-sm"><input type="radio" name="${op}" value="YES" ${opData?.value === 'YES' ? 'checked' : ''}> SÍ</label><label class="ml-2 text-sm"><input type="radio" name="${op}" value="NO" ${opData?.value === 'NO' ? 'checked' : ''}> NO</label>`;
    } else {
      content += `<span class="text-green-700 font-mono text-sm min-w-[50px] text-center">${opData?.utc || '--:--'}</span><button class="record-btn px-2 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">${opData ? '✓' : '+'}</button>`;
      if (opData?.utc) {
        content += `<button class="adjust-time-btn bg-gray-200 rounded-full w-6 h-6" data-op="${op}" data-amount="-1" title="Restar 1 min">-</button><button class="adjust-time-btn bg-gray-200 rounded-full w-6 h-6" data-op="${op}" data-amount="1" title="Sumar 1 min">+</button>`;
      }
    }
    content += `</div>`;
    row.innerHTML = content;
    list.appendChild(row);
    const timeInput = row.querySelector('.op-input-time');
    if (timeInput) timeInput.addEventListener('change', e => { currentFlight.operations[op] = { utc: e.target.value }; saveData(); });
    const textInput = row.querySelector('.op-input-text');
    if (textInput) textInput.addEventListener('change', e => { currentFlight.operations[op] = { value: e.target.value }; saveData(); });
    row.querySelectorAll(`input[name="${op}"]`).forEach(radio => {
      radio.addEventListener('change', e => { currentFlight.operations[op] = { value: e.target.value }; saveData(); });
    });
    const recordBtn = row.querySelector('.record-btn');
    if (recordBtn) recordBtn.addEventListener('click', () => { recordOperation(op); saveData(); });
    row.querySelectorAll('.adjust-time-btn').forEach(btn => {
      btn.addEventListener('click', () => { adjustTime(btn.dataset.op, parseInt(btn.dataset.amount)); saveData(); });
    });
  });
}

function saveFlight() {
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

function editFlight(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    currentFlight = flight;
    isEditing = true;
    showCurrentFlight();
}

function sendFlightReport(flightId) {
  const flight = flights.find(f => f.id == flightId);
  if (!flight) return;
  const c = document.getElementById('viewsContainer');
  c.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📤 Enviar Reporte - ${flight.registrationNumber}</h2>
    <div id="reportPreview" class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200 max-h-72 overflow-y-auto">${generateFlightReportHTML(flight)}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button onclick="shareViaWhatsApp('${flightId}')" class="w-full bg-green-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"><i data-lucide="send"></i> WhatsApp</button>
        <button onclick="copyReportText('${flightId}')" class="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"><i data-lucide="clipboard"></i> Copiar Texto</button>
        <button onclick="downloadElegantPDF('${flightId}')" class="w-full bg-red-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-800"><i data-lucide="file-down"></i> Descargar PDF</button>
        <button onclick="printReport()" class="w-full bg-gray-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800"><i data-lucide="printer"></i> Imprimir</button>
    </div>
    <button onclick="showHistory()" class="w-full mt-3 bg-gray-200 hover:bg-gray-300 py-2 rounded-md">Volver al Historial</button>`;
  lucide.createIcons();
}

function generateFlightReportHTML(flight) {
  const operationsText = Object.entries(flight.operations).length > 0 ? Object.entries(flight.operations).map(([op, data]) => `<tr><td class="border px-3 py-2 font-medium">${op}</td><td class="border px-3 py-2 font-mono">${data.utc || data.value || '-'}</td></tr>`).join('') : '<tr><td colspan="2" class="border px-3 py-2 text-center text-gray-500">No hay operaciones registradas</td></tr>';
  return `<div class="text-center mb-4"><h1 class="text-xl font-bold text-blue-800">REPORTE DE VUELO BELUGA</h1><div class="text-lg font-semibold text-gray-700 mt-1">GHR ${flight.registrationNumber}</div><div class="text-sm text-gray-500">${flight.date} • ${flight.startTime}</div></div><div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm"><div><strong>Llegada:</strong> ${flight.arrivalFlight||'N/A'}</div><div><strong>Salida:</strong> ${flight.departureFlight||'N/A'}</div><div><strong>STA:</strong> ${flight.sta||'N/A'}</div><div><strong>STD:</strong> ${flight.std||'N/A'}</div><div><strong>Apt. Llegada:</strong> ${flight.arrivalAirport}</div><div><strong>Apt. Salida:</strong> ${flight.departureAirport}</div><div><strong>Coordinador:</strong> ${flight.coordinator}</div><div><strong>Conductor:</strong> ${flight.driver}</div><div><strong>Wingwalker 1:</strong> ${flight.wingwalker1}</div><div><strong>Wingwalker 2:</strong> ${flight.wingwalker2}</div></div><h3 class="font-bold mb-2 text-md">OPERACIONES REGISTRADAS</h3><table class="w-full border-collapse border border-gray-300 text-sm"><thead class="bg-gray-100"><tr><th class="border px-3 py-2 text-left">Operación</th><th class="border px-3 py-2 text-left">Tiempo/Valor</th></tr></thead><tbody>${operationsText}</tbody></table><div class="text-center mt-4 text-xs text-gray-400">Generado por GHR BELUGA • ${new Date().toLocaleString('es-ES')}</div>`;
}

// FIX: Añadida verificación de librerías para evitar fallos silenciosos
function downloadElegantPDF(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;

    // --- VERIFICACIÓN DE LIBRERÍAS ---
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("Error: La librería para generar PDF (jsPDF) no se ha podido cargar. Revisa tu conexión a internet.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    if (typeof doc.autoTable !== 'function') {
        alert("Error: El plugin de tablas para PDF (jsPDF-AutoTable) no se ha podido cargar. Revisa tu conexión a internet.");
        return;
    }
    // --- FIN DE VERIFICACIÓN ---

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
    doc.autoTable({
        startY: 50,
        body: [
            ['Vuelo Llegada', flight.arrivalFlight || 'N/A'],
            ['Vuelo Salida', flight.departureFlight || 'N/A'],
            ['Aeropuerto Llegada', flight.arrivalAirport],
            ['Aeropuerto Salida', flight.departureAirport],
            ['STA', flight.sta || 'N/A'],
            ['STD', flight.std || 'N/A']
        ],
        theme: 'grid', styles: { fontSize: 10 }
    });
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Equipo Asignado", margin, finalY);
    doc.autoTable({
        startY: finalY + 5,
        body: [
            ['Coordinador', flight.coordinator],
            ['Conductor', flight.driver],
            ['Wingwalker 1', flight.wingwalker1],
            ['Wingwalker 2', flight.wingwalker2],
        ],
        theme: 'grid', styles: { fontSize: 10 }
    });
    finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Operaciones Registradas", margin, finalY);
    doc.autoTable({
        startY: finalY + 5,
        head: [['Operación', 'Tiempo / Valor Registrado']],
        body: Object.entries(flight.operations).map(([op, data]) => [op, data.utc || data.value || '-']),
        theme: 'striped', styles: { fontSize: 10 }
    });
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(150);
    const footerText = `Generado por ${flight.coordinator || 'N/A'}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.save(`Reporte-${flight.registrationNumber}.pdf`);
}

function shareViaWhatsApp(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    const message = `📋 *REPORTE VUELO BELUGA*\n📢 GHR: ${flight.registrationNumber}\n📅 ${flight.date} • ${flight.startTime}\n\n✈️ *VUELOS*\n🛬 Llegada: ${flight.arrivalFlight || 'N/A'}\n🛫 Salida: ${flight.departureFlight || 'N/A'}\n\n🏢 *AEROPUERTOS*\n📍 Llegada: ${flight.arrivalAirport}\n📍 Salida: ${flight.departureAirport}\n\n👥 *EQUIPO*\n👨‍💼 Coordinador: ${flight.coordinator}\n🚗 Conductor: ${flight.driver}\n🚶‍♂️ Wingwalker 1: ${flight.wingwalker1}\n🚶‍♂️ Wingwalker 2: ${flight.wingwalker2}\n\n⚙️ *OPERACIONES*\n${Object.entries(flight.operations).map(([op, data]) => `• ${op}: ${data.utc || data.value || '-'}`).join('\n')}\n\n_Generado por GHR BELUGA_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function copyReportText(flightId) {
    const flight = flights.find(f => f.id == flightId);
    if (!flight) return;
    const textReport = `REPORTE VUELO BELUGA\nGHR: ${flight.registrationNumber}\nFecha: ${flight.date} - ${flight.startTime}\n\nVUELOS:\n- Llegada: ${flight.arrivalFlight || 'N/A'}\n- Salida: ${flight.departureFlight || 'N/A'}\n\nAEROPUERTOS:\n- Llegada: ${flight.arrivalAirport}\n- Salida: ${flight.departureAirport}\n\nEQUIPO:\n- Coordinador: ${flight.coordinator}\n- Conductor: ${flight.driver}\n- Wingwalker 1: ${flight.wingwalker1}\n- Wingwalker 2: ${flight.wingwalker2}\n\nOPERACIONES REGISTRADAS:\n${Object.entries(flight.operations).map(([op, data]) => `- ${op}: ${data.utc || data.value || '-'}`).join('\n')}\n\nGenerado por GHR BELUGA - ${new Date().toLocaleDateString('es-ES')}`;
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
  fill('coordinator', coordinatorOptions); fill('driver', driverOptions); fill('wingwalker1', wingwalkerOptions); fill('wingwalker2', wingwalkerOptions);
}

function generateAirportOptions() {
  ['arrivalAirport','departureAirport'].forEach(id => {
    const sel = document.getElementById(id); if(!sel) return;
    sel.innerHTML = airportOptions.map(v => `<option value="${v}">${v || 'Seleccionar...'}</option>`).join('');
  });
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
    document.getElementById('viewsContainer').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('newFlightBtn').addEventListener('click', () => showForm());
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  
  window.editFlight = editFlight;
  window.deleteFlight = deleteFlight;
  window.showHistory = showHistory;
  window.sendFlightReport = sendFlightReport;
  window.shareViaWhatsApp = shareViaWhatsApp;
  window.copyReportText = copyReportText;
  window.printReport = printReport;
  window.downloadElegantPDF = downloadElegantPDF;
  window.closeViews = closeViews;
  window.showForm = showForm;
  window.showCurrentFlight = showCurrentFlight;
});