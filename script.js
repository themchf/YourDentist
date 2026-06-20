// ==========================================
// 1. SESSION MANAGEMENT & AUTHENTICATION
// ==========================================
let currentUserId = localStorage.getItem('dentist_user_id') || null;

window.addEventListener('DOMContentLoaded', () => {
    // If they already have an active session, skip the login screen
    if (currentUserId) {
        document.getElementById('login-gate').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        fetchPatients();
    }
});

async function handleCustomerLogin(event) {
    event.preventDefault();
    const username = document.getElementById('cust-username').value;
    const password = document.getElementById('cust-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
            // Save session
            currentUserId = data.userId;
            localStorage.setItem('dentist_user_id', currentUserId);
            
            // Unmask the dashboard
            document.getElementById('login-gate').classList.add('hidden');
            document.getElementById('main-dashboard').classList.remove('hidden');
            
            // Clear passwords from memory
            document.getElementById('cust-password').value = '';
            
            // Load their specific patients
            fetchPatients(); 
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Cannot connect to server.");
    }
}

function handleLogout() {
    localStorage.removeItem('dentist_user_id');
    currentUserId = null;
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-gate').classList.remove('hidden');
}


// ==========================================
// 2. CLINICAL DATA MANAGEMENT (CRUD)
// ==========================================

async function fetchPatients() {
    try {
        const response = await fetch('/api/patients?t=' + new Date().getTime(), {
            headers: { 
                'X-User-Id': currentUserId,
                'Cache-Control': 'no-cache'
            }
        });
        
        // Security trigger: Kick them out if admin suspended them
        if (response.status === 403) return handleLogout();

        const patients = await response.json();
        const tbody = document.getElementById('patients-table-body');
        
        if (patients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400">No patients logged yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = patients.map(p => `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-4">
                    <div class="font-bold text-slate-800">${p.name}</div>
                    <div class="text-xs text-slate-500">${p.phone}</div>
                </td>
                <td class="py-4 text-slate-600">${p.treatment}</td>
                <td class="py-4 font-semibold text-slate-800">$${p.price}</td>
                <td class="py-4 text-right">
                    <button onclick="deletePatient(${p.id})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs font-bold transition">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Failed to load patients", err);
    }
}

async function addPatient(event) {
    event.preventDefault();
    
    const patientData = {
        name: document.getElementById('patient-name').value,
        phone: document.getElementById('patient-phone').value,
        treatment: document.getElementById('patient-treatment').value,
        price: document.getElementById('patient-price').value
    };

    try {
        const response = await fetch('/api/patients', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-Id': currentUserId
            },
            body: JSON.stringify(patientData)
        });

        if (response.status === 403) return handleLogout();

        if (response.ok) {
            // Clear the form
            event.target.reset();
            // Refresh the table
            fetchPatients();
        }
    } catch (err) {
        alert("Failed to save record.");
    }
}

async function deletePatient(id) {
    if (!confirm("Are you sure you want to delete this patient record?")) return;

    try {
        const response = await fetch(`/api/patients?id=${id}`, {
            method: 'DELETE',
            headers: { 'X-User-Id': currentUserId }
        });

        if (response.status === 403) return handleLogout();

        if (response.ok) {
            fetchPatients();
        }
    } catch (err) {
        alert("Failed to delete record.");
    }
}
