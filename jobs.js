async function loadJobs() {
    const container = document.getElementById("jobs");
    const searchInput = document.getElementById("search-input");
    const locationFilter = document.getElementById("filter-location");
    "Driver"
    const queryText = searchInput ? searchInput.value : '';
    const locationVal = locationFilter ? locationFilter.value : '';

    // Show loading state
    container.innerHTML = '<div class="text-center py-10 text-gray-500">Loading jobs...</div>';

    // Start Query
    let query = db.from("jobs").select("*").eq('status', 'active').order('created_at', { ascending: false });

    // Apply Filters
    if (queryText) {
        // Simple case-insensitive search on title
        query = query.ilike('title', `%${queryText}%`);
    }

    if (locationVal && locationVal !== 'All Somalia') {
        query = query.eq('location', locationVal);
    }

    const { data: jobs, error } = await query;

    if (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<div class="text-center py-10 text-red-500">Error loading jobs: ' + error.message + '</div>';
        return;
    }

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-xl border border-gray-100">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="briefcase" class="text-gray-400 w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-900">No jobs found</h3>
                <p class="text-gray-500">Try adjusting your search or filters.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = jobs.map(job => {
        // dynamic avatar letter
        const initial = job.company ? job.company.charAt(0).toUpperCase() : '?';
        const colors = ['bg-blue-50 text-brand-blue border-blue-100', 'bg-orange-50 text-orange-600 border-orange-100', 'bg-purple-50 text-purple-600 border-purple-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // Time ago helper
        const date = new Date(job.created_at);
        const timeAgo = date.toLocaleDateString();

        return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group relative">
            <div class="absolute top-6 right-6 flex gap-2">
                <div class="text-gray-400 hover:text-brand-yellow cursor-pointer">
                    <i data-lucide="bookmark"></i>
                </div>
            </div>
            <div class="flex gap-4">
                <div class="w-14 h-14 ${randomColor} rounded-lg flex items-center justify-center font-bold text-xl border">
                    ${initial}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-lg group-hover:text-brand-blue transition">${job.title}</h3>
                        ${job.is_verified ? `<span class="bg-blue-100 text-brand-blue p-0.5 rounded-full" title="Verified Employer"><i data-lucide="check-circle" class="w-4 h-4"></i></span>` : ''}
                    </div>
                    <p class="text-gray-500 text-sm mb-2">${job.company} • ${job.location}</p>
                    <div class="flex gap-2 mb-4">
                        <span class="bg-blue-50 text-brand-blue text-xs px-2 py-1 rounded-md font-medium">${job.type}</span>
                        ${job.salary ? `<span class="bg-green-50 text-brand-green text-xs px-2 py-1 rounded-md font-medium">${job.salary}</span>` : ''}
                    </div>
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div class="text-sm text-gray-500 flex items-center gap-1">
                            <i data-lucide="clock" class="w-3 h-3"></i> Posted ${timeAgo}
                        </div>
                        <button onclick="messageEmployer('${job.employer_id}', '${job.company}')" class="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1">
                            <i data-lucide="message-square" class="w-4 h-4"></i> <span data-i18n="jobs.message">Message</span>
                        </button>
                    </div>
                     ${job.description ? `<p class="mt-3 text-sm text-gray-600 line-clamp-2">${job.description}</p>` : ''}
                </div>
            </div>
        </div>
        `;
    }).join("");

    // Re-initialize icons for new content
    lucide.createIcons();
    if (typeof updatePage === 'function') updatePage();
}

async function messageEmployer(employerId, companyName) {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // Check if a conversation already exists or just send a nudge
    // For now, we'll just redirect to chat.html with the partnerId in the URL
    window.location.href = `chat.html?partner=${employerId}&name=${encodeURIComponent(companyName)}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadJobs();

    // Attach Listeners
    const searchInput = document.getElementById("search-input");
    const filterBtn = document.getElementById("btn-apply-filters");

    // Search on Enter
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loadJobs();
        });
    }

    // Filter Button
    if (filterBtn) {
        filterBtn.addEventListener('click', loadJobs);
    }
});
