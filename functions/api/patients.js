// Helper logic to verify if a user session exists and is valid
async function verifyTenant(env, userId) {
    if (!userId) return false;
    try {
        const user = await env.DB.prepare(
            "SELECT id FROM users WHERE id = ?"
        ).bind(userId).first();
        return !!user;
    } catch (e) {
        return false;
    }
}

// GET: Fetch records belonging ONLY to the logged-in doctor
export async function onRequestGet(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        if (!(await verifyTenant(env, userId))) {
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

// POST: Save a new patient (Fixed: Passing 0 instead of null to satisfy NOT NULL constraint)
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");

        if (!(await verifyTenant(env, userId))) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const { name, phone, treatment, price } = await request.json();

        // We pass 0 for age here. This satisfies the SQLite NOT NULL constraint 
        // without forcing you to modify your frontend UI or rebuild table structures.
        await env.DB.prepare(
            "INSERT INTO patients (name, age, phone, treatment, price, user_id) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(name, 0, phone, treatment, price, userId).run();

        return new Response(JSON.stringify({ success: true }), { 
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: Remove a record safely
export async function onRequestDelete(context) {
    try {
        const { env, request } = context;
        const userId = request.headers.get("X-User-Id");
        
        const url = new URL(request.url);
        const patientId = url.searchParams.get("id");

        if (!(await verifyTenant(env, userId))) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

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
