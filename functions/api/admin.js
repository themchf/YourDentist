// Middleware to verify you are the true system admin
function verifyAdmin(request) {
    const adminSecret = request.headers.get("X-Admin-Secret");
    // Change 'MY_SUPER_SECRET_ADMIN_KEY_123' to a highly secure master password
    return adminSecret === "Adminsecuritydentist123";
}

// GET: List all registered clinics/users
export async function onRequestGet(context) {
    const { env, request } = context;
    if (!verifyAdmin(request)) return new Response("Unauthorized", { status: 401 });

    try {
        const { results } = await env.DB.prepare(
            "SELECT id, username, clinic_name, status FROM users ORDER BY id DESC"
        ).all();
        return new Response(JSON.stringify(results), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// POST: Provision/Create a brand new clinic account
export async function onRequestPost(context) {
    const { env, request } = context;
    if (!verifyAdmin(request)) return new Response("Unauthorized", { status: 401 });

    try {
        const { username, password, clinic_name } = await request.json();
        
        await env.DB.prepare(
            "INSERT INTO users (username, password, clinic_name, status) VALUES (?, ?, ?, 'active')"
        ).bind(username, password, clinic_name).run();

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Username might already exist or database error." }), { status: 500 });
    }
}

// PUT: Update a client's status (active/suspended) OR reset their password
export async function onRequestPut(context) {
    const { env, request } = context;
    if (!verifyAdmin(request)) return new Response("Unauthorized", { status: 401 });

    try {
        const { id, status, password } = await request.json();

        if (password) {
            // Force change password
            await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(password, id).run();
        } else if (status) {
            // Toggle suspension state
            await env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(status, id).run();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
