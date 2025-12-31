// profile.js

async function initProfile() {
    // 1. Auth Guard
    const user = await requireAuth();
    if (!user) return;

    // 2. Load Data
    await loadProfileData();
}

async function loadProfileData() {
    const { user, profile } = await getUserProfile();

    if (!user) return;

    // Update Basic Auth Info
    setText('user-email', user.email);
    setText('contact-email', user.email);

    if (profile) {
        // Update Profile Info
        setText('profile-name', profile.full_name || 'No Name Set');
        setText('profile-bio', profile.bio || 'Tell us about yourself...');
        setText('contact-phone', profile.phone || '+252 -- --- ----');
        setText('contact-location', profile.city || 'Location Not Set');

        // Verified Badge
        const badge = document.getElementById('verified-badge');
        if (badge) {
            badge.style.display = profile.is_verified ? 'inline-block' : 'none';
        }

        // Skills
        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer && profile.skills) {
            skillsContainer.innerHTML = profile.skills.map(skill =>
                `<span class="px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-medium">${skill}</span>`
            ).join('');
        }

        // CV Status
        const cvName = document.getElementById('cv-filename');
        if (cvName) {
            cvName.innerText = profile.cv_url ? "CV Uploaded" : "No CV Uploaded";
        }

        // Pre-fill Edit Modal
        fillInput('edit-name', profile.full_name);
        fillInput('edit-phone', profile.phone);
        fillInput('edit-city', profile.city);
        fillInput('edit-bio', profile.bio);
        fillInput('edit-skills', profile.skills ? profile.skills.join(', ') : '');
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text || '';
}

function fillInput(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

async function handleUpdateProfile(event) {
    event.preventDefault();

    const btn = event.submitter;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Updating...';

    const { data: { user } } = await db.auth.getUser();

    const updatedData = {
        full_name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        city: document.getElementById('edit-city').value,
        bio: document.getElementById('edit-bio').value,
        skills: document.getElementById('edit-skills').value.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    try {
        const { error } = await db
            .from('profiles')
            .update(updatedData)
            .eq('id', user.id);

        if (error) throw error;

        alert('Profile updated successfully!');
        closeEditModal();
        await loadProfileData();
    } catch (err) {
        alert('Error updating profile: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Modal Toggles
function openEditModal() {
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initProfile);
