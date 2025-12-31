// employer.js
// Logic for Employer Dashboard & Job Posting

// Global state
let currentUser = null;

async function initEmployer() {
    // 1. Auth Guard
    currentUser = await requireAuth();
    if (!currentUser) return; // redirect handled in auth.js matches

    // 2. Fetch Profile to get Company Name
    const { profile } = await getUserProfile();
    if (profile) {
        // Update Welcome Message
        const welcomeEl = document.querySelector('h1.font-heading');
        if (welcomeEl) welcomeEl.innerText = `Welcome back, ${profile.full_name || 'Employer'}`;

        // Pre-fill Company Name in Modal
        const companyInput = document.getElementById('job-company');
        if (companyInput) companyInput.value = profile.full_name || '';
    }
}

// UI Toggles
function openPostJobModal() {
    const modal = document.getElementById('post-job-modal');
    modal.classList.remove('hidden');
}

function closePostJobModal() {
    const modal = document.getElementById('post-job-modal');
    modal.classList.add('hidden');
}

// Handle Form Submission
async function handlePostJob(event) {
    event.preventDefault();

    // UI Feedback
    const btn = event.submitter;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Posting...';

    // Data Gathering
    const jobData = {
        employer_id: currentUser.id,
        title: document.getElementById('job-title').value,
        company: document.getElementById('job-company').value,
        location: document.getElementById('job-location').value,
        type: document.getElementById('job-type').value,
        salary: document.getElementById('job-salary').value,
        description: document.getElementById('job-description').value,
        status: 'active'
    };

    try {
        const { data, error } = await db.from('jobs').insert(jobData);

        if (error) throw error;

        // Success
        alert('Job posted successfully!');
        window.location.href = 'jobs.html';

    } catch (err) {
        console.error(err);
        alert('Error posting job: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initEmployer);
