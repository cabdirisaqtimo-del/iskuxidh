const translations = {
    en: {
        "nav.home": "Home",
        "nav.jobs": "Find Jobs",
        "nav.hire": "Hire",
        "nav.login": "Login / Sign Up",
        "hero.h1": "Jobs and Workers,\nOne Place.",
        "hero.p": "Connect with verified employers and skilled professionals in Mogadishu, Hargeisa, and beyond. Easy, fast, and trusted.",
        "hero.btn.find": "Find a Job",
        "hero.btn.post": "Post a Job",
        "jobs.filters": "Filters",
        "jobs.location": "Location",
        "jobs.apply": "Apply Filters",
        "jobs.search.placeholder": "Search jobs (e.g., Driver, Developer)...",
        "jobs.verified": "Verified",
        "jobs.message": "Message",
        "profile.edit": "Edit Profile"
    },
    so: {
        "nav.home": "Hoyga",
        "nav.jobs": "Raadi Shaqo",
        "nav.hire": "Shaqaaleysi",
        "nav.login": "Gal / Is-diiwaangeli",
        "hero.h1": "Shaqo iyo Shaqaale,\nHal Meel.",
        "hero.p": "Hel shaqo-bixiyeyaal la hubiyey iyo xirfadlayaal ka socda Muqdisho, Hargeysa, iyo hareerahooda. Fudud, degdeg ah, oo la aamini karo.",
        "hero.btn.find": "Raadi Shaqo",
        "hero.btn.post": "Shaqo Soo Geli",
        "jobs.filters": "Sifeeyayaal",
        "jobs.location": "Goobta",
        "jobs.apply": "Codso",
        "jobs.search.placeholder": "Raadi shaqooyin (tusaale, Wade, Developer)...",
        "jobs.verified": "La Hubiyey",
        "jobs.message": "Fariin",
        "profile.edit": "Beddel Profile-ka"
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

function toggleLang() {
    currentLang = currentLang === 'en' ? 'so' : 'en';
    localStorage.setItem('lang', currentLang);
    updatePage();
}

function updatePage() {
    // Update Text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    // Update Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });

    // Update Lang Button Text
    const btnText = document.getElementById('lang-text');
    if (btnText) btnText.innerText = currentLang.toUpperCase();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updatePage();
});
