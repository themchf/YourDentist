// Helper to confirm the clinic is valid and active before running database queries
async function verifyTenant(env, userId) {
    if (!userId) return null;
    const user = await env.DB.prepare("SELECT status FROM users WHERE id = ?").bind(userId).first();
    if (!user || user.status !== 'active') return null;
    return user;
}

// GET: Fetch patients belonging ONLY to this specific user ID
export async function onRequestGet(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        if (!(await verifyTenant(env, userId))) {
            return new Response(JSON.stringify({ error: "Unauthorized or account suspended." }), { status: 403 });
        }

        const { results } = await env.DB.prepare(
            "SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC"
        ).bind(userId).all();
        
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// POST: Save a new patient tied explicitly to this user ID
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        if (!(await verifyTenant(env, userId))) {
            return new Response(JSON.stringify({ error: "Unauthorized or account suspended." }), { status: 403 });
        }

        // Adjust these variables to match whatever you currently capture for a patient
        const { name, phone, details } = await request.json();

        await env.DB.prepare(
            "INSERT INTO patients (name, phone, details, user_id) VALUES (?, ?, ?, ?)"
        ).bind(name, phone, details, userId).run();

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: Ensure they can only delete rows they own
export async function onRequestDelete(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        if (!(await verifyTenant(env, userId))) {
            return new Response(JSON.stringify({ error: "Unauthorized or account suspended." }), { status: 403 });
        }
        
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        await env.DB.prepare(
            "DELETE FROM patients WHERE id = ? AND user_id = ?"
        ).bind(id, userId).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
