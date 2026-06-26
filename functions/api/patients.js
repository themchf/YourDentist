// Helper logic to verify if a user session exists and fetch their account status
async function verifyTenant(env, userId) {
    if (!userId) return null;
    try {
        const user = await env.DB.prepare(
            "SELECT id, status FROM users WHERE id = ?"
        ).bind(userId).first();
        return user; // Returns the user object { id, status } so we can check it
    } catch (e) {
        return null;
    }
}

// GET: Fetch records (Allowed for both Active AND Suspended users so they can read data)
export async function onRequestGet(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        const user = await verifyTenant(env, userId);
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const { results } = await env.DB.prepare(
            "SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC"
        ).bind(userId).all();

        return new Response(JSON.stringify(results), { 
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// POST: Save a new patient (BLOCKED if the account is suspended)
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        const user = await verifyTenant(env, userId);
        
        // Check 1: Does the user exist?
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }
        
        // Check 2: Is the user suspended? (Read-Only Mode Enforcement)
        if (user.status === 'suspended') {
            return new Response(JSON.stringify({ error: "Account suspended. Read-only mode active." }), { status: 403 });
        }

        const { name, age, phone, treatment, price } = await request.json();
        const safeAge = age ? Number(age) : 0;

        await env.DB.prepare(
            "INSERT INTO patients (name, age, phone, treatment, price, user_id) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(name, safeAge, phone, treatment, price, userId).run();

        return new Response(JSON.stringify({ success: true }), { 
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: Remove a record safely (BLOCKED if the account is suspended)
export async function onRequestDelete(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");
        
        const user = await verifyTenant(env, userId);
        
        // Check 1: Does the user exist?
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }
        
        // Check 2: Is the user suspended? (Read-Only Mode Enforcement)
        if (user.status === 'suspended') {
            return new Response(JSON.stringify({ error: "Account suspended. Read-only mode active." }), { status: 403 });
        }

        const url = new URL(request.url);
        const patientId = url.searchParams.get("id");

        await env.DB.prepare(
            "DELETE FROM patients WHERE id = ? AND user_id = ?"
        ).bind(patientId, userId).run();

        return new Response(JSON.stringify({ success: true }), { 
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
