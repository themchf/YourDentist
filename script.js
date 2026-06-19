let allPatients = [];

// Dynamic Navigation Tab Engine
function switchTab(tabId) {
    const logsBtn = document.getElementById('btn-logs');
    const aptBtn = document.getElementById('btn-appointments');
    const logsTab = document.getElementById('tab-logs');
    const aptTab = document.getElementById('tab-appointments');

    if (tabId === 'logs') {
        logsTab.classList.remove('hidden');
        aptTab.classList.add('hidden');
        logsBtn.classList.add('active-tab');
        aptBtn.classList.remove('active-tab', 'bg-teal-50');
        aptBtn.classList.add('text-slate-600');
    } else {
        aptTab.classList.remove('hidden');
        logsTab.classList.add('hidden');
        aptBtn.classList.add('active-tab');
        logsBtn.classList.remove('active-tab', 'bg-teal-50');
        logsBtn.classList.add('text-slate-600');
    }
}

// Live Message Template Synthesizer for Appointments
const aptName = document.getElementById('apt-name');
const aptTime = document.getElementById('apt-time');
const msgPreview = document.getElementById('msg-preview');

function updateLivePreview() {
    if (aptName.value || aptTime.value) {
        const dateObj = aptTime.value ? new Date(aptTime.value) : null;
        const formattedDate = dateObj ? dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '[Date & Time]';
        
        msgPreview.innerText = `Hello ${aptName.value || '[Patient Name]'},\n\nThis is an automated appointment confirmation from Your Dentist clinic.\n\n📅 Date/Time: ${formattedDate}\n\nWe look forward to seeing you. Please let us know 24 hours in advance if you need to reschedule. Thank you!`;
    }
}
aptName.addEventListener('input', updateLivePreview);
aptTime.addEventListener('input', updateLivePreview);

// Fetching Patient Records from Serverless API Edge Endpoint
async function fetchPatients() {
    try {
        const response = await fetch('/api/patients');
        if (response.ok) {
            allPatients = await response.json();
            renderTable(allPatients);
            updateDashboardMetrics(allPatients);
        }
    } catch (error) {
        console.error("Database communication failure:", error);
    }
}

// Dynamic Table Renderer
function renderTable(data) {
    const tbody = document.getElementById('patient-table-body');
    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400 font-normal">No corresponding records found inside database.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(patient => `
        <tr class="hover:bg-slate-50/70 transition duration-150">
            <td class="px-6 py-4">
                <div class="font-bold text-slate-900">${patient.name}</div>
                <div class="text-xs text-slate-400">${patient.age} years old</div>
            </td>
            <td class="px-6 py-4 text-slate-600 font-normal">${patient.phone}</td>
            <td class="px-6 py-4 text-slate-500 max-w-xs truncate">${patient.treatment}</td>
            <td class="px-6 py-4 text-right font-bold text-slate-900">$${Number(patient.price).toFixed(2)}</td>
        </tr>
    `).join('');
}

// Analytics Calculations
function updateDashboardMetrics(data) {
    document.getElementById('stat-count').innerText = data.length;
    const grossRevenue = data.reduce((sum, item) => sum + Number(item.price), 0);
    document.getElementById('stat-revenue').innerText = `$${grossRevenue.toFixed(2)}`;
}

// Real-Time Query Filtering (Instantly Searches Across Cached Array State)
function filterPatients() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const matches = allPatients.filter(p => p.name.toLowerCase().includes(query));
    renderTable(matches);
}

// Form Post Handling
async function savePatient(event) {
    event.preventDefault();
    
    const record = {
        name: document.getElementById('log-name').value,
        age: parseInt(document.getElementById('log-age').value),
        phone: document.getElementById('log-phone').value,
        treatment: document.getElementById('log-treatment').value,
        price: parseFloat(document.getElementById('log-price').value)
    };

    try {
        const response = await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        if (response.ok) {
            document.getElementById('patient-form').reset();
            fetchPatients(); // Re-sync local dashboard view with edge storage state
        }
    } catch (err) {
        console.error("Failed persisting patient record payload:", err);
    }
}

// Universal Native WhatsApp Routing Gateway Engine
function sendAppointment(event) {
    event.preventDefault();
    
    // Clean phone variable formatting strip parameters to digits only
    const cleanPhone = document.getElementById('apt-phone').value.replace(/\D/g, '');
    const dateObj = new Date(aptTime.value);
    const formattedDate = dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    const conceptualText = `Hello ${aptName.value},\n\nThis is an automated appointment confirmation from Your Dentist clinic.\n\n📅 Date/Time: ${formattedDate}\n\nWe look forward to seeing you. Please let us know 24 hours in advance if you need to reschedule. Thank you!`;
    
    // Dispatches target endpoint inside a secure secondary desktop thread
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(conceptualText)}`, '_blank');
}

// CSV Structural Exporter Engine for Clinic Backups
function exportCSV() {
    if (!allPatients.length) return;
    
    const headers = ['ID', 'Patient Name', 'Age', 'Phone Number', 'Treatment Details', 'Price Billed ($)', 'Timestamp Registered'];
    const rows = allPatients.map(p => [p.id, `"${p.name}"`, p.age, p.phone, `"${p.treatment}"`, p.price, p.created_at]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const anchorLink = document.createElement('a');
    anchorLink.setAttribute('href', url);
    anchorLink.setAttribute('download', `Your_Dentist_Records_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    anchorLink.click();
}

// Run bootstrapping runtime execution checks on frame instantiation
window.onload = fetchPatients;
