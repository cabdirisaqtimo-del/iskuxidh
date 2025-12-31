// ---------------------------------------------------------
// IMPORTANT: REPLACE WITH YOUR KEYS FROM SUPABASE DASHBOARD
// ---------------------------------------------------------
const SUPABASE_URL = 'https://xzodjzbtycbdmjfzzkxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fBhQ__LSdSjZqxvAgDUGgw_BCN3OT1b';

// Initialize Supabase Client
// We use the CDN script in the HTML files, so 'supabase' global is available.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper Query to get Current User Profile
async function getCurrentUser() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return null;

    const { data: profile } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile };
}

// Global Sign Out
async function logout() {
    const { error } = await db.auth.signOut();
    if (!error) {
        window.location.href = 'auth.html';
    } else {
        console.error('Logout error:', error);
    }
}
