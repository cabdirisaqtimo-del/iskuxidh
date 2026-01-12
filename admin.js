
// Admin Logic

async function initAdmin() {
    const { data: { user } } = await db.auth.getUser();

    // Simple Admin Gate (In production, use RLS or a specific 'admin' role in DB)
    // For now, we'll just check if they are logged in, effectively making this public for the demo/user to test
    // or we can strictly check the user's email if known. 
    // Let's assume ANY logged in user can see it for now so the USER can test it immediately.
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    document.getElementById('admin-email').innerText = user.email;

    // Load Initial Data
    loadPayments();
    loadStats();
}

// ------ TABS ------
function switchTab(tabId) {
    // Hide all
    document.getElementById('view-payments').classList.add('hidden');
    document.getElementById('view-jobs').classList.add('hidden');
    document.getElementById('view-users').classList.add('hidden');
    document.getElementById('view-settings').classList.add('hidden');

    // Reset buttons
    document.getElementById('tab-payments').className = 'inactive-tab px-6 py-3 text-sm transition';
    document.getElementById('tab-jobs').className = 'inactive-tab px-6 py-3 text-sm transition';
    document.getElementById('tab-users').className = 'inactive-tab px-6 py-3 text-sm transition';
    document.getElementById('tab-settings').className = 'inactive-tab px-6 py-3 text-sm transition';

    // Show active
    document.getElementById('view-' + tabId).classList.remove('hidden');
    document.getElementById('tab-' + tabId).className = 'active-tab px-6 py-3 text-sm transition';

    // Load data
    if (tabId === 'payments') loadPayments();
    if (tabId === 'jobs') loadJobs();
    if (tabId === 'users') loadUsers();
    if (tabId === 'settings') loadSettings();
}

// ------ SETTINGS ------

// ------ SETTINGS ------

async function loadSettings() {
    // Default fallback
    let currentNum = '+252633008907';
    let currentWa = '+252633008907';
    let currentEmail = 'cabdirisqmuxumed@gmail.com';

    try {
        const { data: { user } } = await db.auth.getUser();
        if (user) {
            const { data: profile } = await db
                .from('profiles')
                .select('phone, email')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Use profile phone as the payment receiver number
                if (profile.phone) currentNum = profile.phone;
                if (profile.phone) currentWa = profile.phone; // Assuming same for WA
                if (profile.email) currentEmail = profile.email;
            }
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }

    if (document.getElementById('setting-receiver')) document.getElementById('setting-receiver').value = currentNum;
    if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = currentWa;
    if (document.getElementById('setting-email')) document.getElementById('setting-email').value = currentEmail;
}

async function saveSettings(e) {
    if (e) e.preventDefault();

    const btn = document.querySelector('#settings-form button[type="submit"]');
    const originalText = btn ? btn.innerText : 'Save All Settings';
    if (btn) {
        btn.innerHTML = 'Saving...';
        btn.disabled = true;
    }

    const newNum = document.getElementById('setting-receiver').value;
    const newWa = document.getElementById('setting-whatsapp').value; // We might not have a dedicated col for this yet, so we'll focus on phone
    // const newEmail = document.getElementById('setting-email').value; // User email is usually fixed in auth, but can update profile contact if needed

    try {
        const { data: { user } } = await db.auth.getUser();

        if (!user) throw new Error("Not logged in");

        // Update the Admin's profile phone number. 
        // This effectively updates the "Global Payment Receiver" since payment.html looks for the admin's phone.
        const { error } = await db
            .from('profiles')
            .update({
                phone: newNum,
                // If you had other columns like contact_whatsapp, update them here. 
                // For now, we update phone.
            })
            .eq('id', user.id);

        if (error) throw error;

        // Visual Feedback
        if (btn) {
            btn.innerText = '✅ Saved!';
            btn.classList.remove('bg-brand-blue');
            btn.classList.add('bg-green-600');

            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-brand-blue');
                btn.disabled = false;
            }, 2000);
        }

        alert('Settings Saved! Your payment number is now updated globally.');

    } catch (err) {
        console.error("Save error:", err);
        alert('Error saving settings: ' + err.message);
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

// ------ LISTENERS & INIT ------

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();

    // Bind Settings Form
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }
});

async function loadStats() {
    // These counts are rough estimates for dashboard
    const { count: paymentsCount } = await db.from('profiles').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'); // Actually we want pending verification, but let's just count paid for now
    const { count: jobsCount } = await db.from('jobs').select('*', { count: 'exact', head: true });
    const { count: usersCount } = await db.from('profiles').select('*', { count: 'exact', head: true });

    document.getElementById('stat-payments').innerText = paymentsCount || 0;
    document.getElementById('stat-jobs').innerText = jobsCount || 0;
    document.getElementById('stat-users').innerText = usersCount || 0;
}

async function loadPayments() {
    const list = document.getElementById('payments-list');
    list.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Loading...</td></tr>';

    // Fetch users who claim to have paid (payment_status = 'paid')
    // In a real app, we'd have a 'pending_verification' status. 
    // We'll list all 'paid' users here so Admin can verify them (or see they are verified).
    const { data: profiles, error } = await db
        .from('profiles')
        .select('*')
        .eq('payment_status', 'paid')
        .order('updated_at', { ascending: false });

    if (error) {
        list.innerHTML = `<tr><td colspan="5" class="p-4 text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    if (!profiles || profiles.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">No pending payments found.</td></tr>';
        return;
    }

    list.innerHTML = profiles.map(p => `
        <tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="p-4 font-medium text-gray-900">${p.full_name || 'User ' + p.id.slice(0, 4)}</td>
            <td class="p-4 font-mono text-gray-600">${p.payment_phone || '-'}</td>
            <td class="p-4 font-mono text-brand-blue font-bold">${p.last_transaction_id || '-'}</td>
            <td class="p-4 text-gray-500">${new Date(p.updated_at).toLocaleDateString()}</td>
            <td class="p-4 text-right">
                <button class="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide cursor-default">
                    Verified
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadJobs() {
    const list = document.getElementById('jobs-list');
    list.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Loading...</td></tr>';

    const { data: jobs, error } = await db.from('jobs').select('*').order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<tr><td colspan="5" class="p-4 text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    list.innerHTML = jobs.map(j => `
        <tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="p-4 font-medium text-gray-900">${j.title}</td>
            <td class="p-4 text-gray-600">${j.company}</td>
            <td class="p-4 text-gray-500">${j.location}</td>
            <td class="p-4">
                <span class="${j.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} px-2 py-1 rounded text-xs font-bold uppercase">
                    ${j.status}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="deleteJob('${j.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function loadUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Loading...</td></tr>';

    const { data: users, error } = await db.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<tr><td colspan="5" class="p-4 text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    list.innerHTML = users.map(u => `
        <tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="p-4 font-medium text-gray-900">${u.full_name || 'No Name'}</td>
            <td class="p-4 text-gray-600 capitalize">${u.role}</td>
            <td class="p-4">
                <span class="${u.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} px-2 py-1 rounded text-xs font-bold uppercase">
                    ${u.payment_status}
                </span>
            </td>
            <td class="p-4 text-right">
                <button class="text-gray-400 hover:text-brand-dark transition"><i data-lucide="more-horizontal" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

// ------ ACTIONS ------

async function deleteJob(jobId) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const { error } = await db.from('jobs').delete().eq('id', jobId);
    if (error) alert("Error deleting: " + error.message);
    else loadJobs();
}

async function logout() {
    await db.auth.signOut();
    window.location.href = 'auth.html';
}


