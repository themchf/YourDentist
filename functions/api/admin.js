// Middleware to verify you are the true system admin
function verifyAdmin(request) {
    const adminSecret = request.headers.get("X-Admin-Secret");
    // Change 'MY_SUPER_SECRET_ADMIN_KEY_123' to a highly secure master password
    return adminSecret === "MY_SUPER_SECRET_ADMIN_KEY_123";
}

// GET: Fetch all active SaaS clients
export async function onRequestGet(context) {
    try {
        const { env, request } = context;
        
        // Security check
        if (request.headers.get("X-Admin-Secret") !== env.ADMIN_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const { results } = await env.DB.prepare(
            "SELECT id, clinic_name, username, status FROM users ORDER BY id DESC"
        ).all();

        return new Response(JSON.stringify(results), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// POST: Provision a new clinic
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        
        if (request.headers.get("X-Admin-Secret") !== env.ADMIN_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const { clinic_name, username, password } = await request.json();

        await env.DB.prepare(
            "INSERT INTO users (clinic_name, username, password, status) VALUES (?, ?, ?, 'active')"
        ).bind(clinic_name, username, password).run();

        return new Response(JSON.stringify({ success: true }), { 
            status: 201, 
            headers: { "Content-Type": "application/json" } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PUT: Toggle status or update password
export async function onRequestPut(context) {
    try {
        const { env, request } = context;
        
        if (request.headers.get("X-Admin-Secret") !== env.ADMIN_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const data = await request.json();

        if (data.status) {
            await env.DB.prepare(
                "UPDATE users SET status = ? WHERE id = ?"
            ).bind(data.status, data.id).run();
        } else if (data.password) {
            await env.DB.prepare(
                "UPDATE users SET password = ? WHERE id = ?"
            ).bind(data.password, data.id).run();
        }

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: Permanently remove a clinic and their patients
export async function onRequestDelete(context) {
    try {
        const { env, request } = context;
        
        if (request.headers.get("X-Admin-Secret") !== env.ADMIN_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        }

        const url = new URL(request.url);
        const clientId = url.searchParams.get("id");

        if (!clientId) {
            return new Response(JSON.stringify({ error: "Missing client ID" }), { status: 400 });
        }

        // 1. Delete patient records first (Prevent orphaned data)
        await env.DB.prepare(
            "DELETE FROM patients WHERE user_id = ?"
        ).bind(clientId).run();

        // 2. Delete the actual clinic account
        await env.DB.prepare(
            "DELETE FROM users WHERE id = ?"
        ).bind(clientId).run();

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
