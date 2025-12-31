// -------------------------------------------------------------------------
// Auth Logic for IskuXidh
// Dependencies: config.js (db client)
// -------------------------------------------------------------------------

// 1. Sign Up
async function handleSignUp(email, password, role, additionalData = {}) {
    // 1. Sign up auth user with Metadata
    const { data: authData, error: authError } = await db.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: role,
                ...additionalData
            }
        }
    });

    if (authError) {
        alert("Sign Up Error: " + authError.message);
        return { error: authError };
    }

    // User created successfully. The Trigger in Database will handle Profile creation.
    return { data: authData.user };
}

// 2. Login
async function handleSignIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });

    if (error) return { error };
    return { data: data.user };
}

// 3. Logout
async function handleSignOut() {
    const { error } = await db.auth.signOut();
    if (!error) {
        window.location.href = 'auth.html';
    } else {
        console.error('Logout failed:', error);
    }
}

// 4. Get Current Profile (with Role)
async function getUserProfile() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { user: null, profile: null };

    const { data: profile, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile: profile || null };
}

// 5. Auth Guard (Protect Pages)
async function requireAuth() {
    const { user, profile } = await getUserProfile();

    if (!user) {
        window.location.href = 'auth.html';
        return null;
    }

    // Payment Guard - Skip check on payment page itself
    if (!window.location.pathname.includes('payment.html')) {
        if (profile && profile.payment_status === 'pending') {
            window.location.href = 'payment.html';
            return null;
        }
    }

    return user;
}

// 6. Redirect if Logged In (For auth.html)
async function redirectIfLoggedIn() {
    const { user, profile } = await getUserProfile();
    if (user) {
        // Payment check
        if (profile && profile.payment_status === 'pending') {
            window.location.href = 'payment.html';
            return;
        }

        if (profile && profile.role === 'employer') window.location.href = 'employer.html';
        else window.location.href = 'profile.html';
    }
}
