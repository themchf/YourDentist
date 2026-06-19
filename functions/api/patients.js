// GET /api/patients -> Retrieves all historical records down from the database
export async function onRequestGet(context) {
    try {
        const { env } = context;
        // Interface directly with linked Cloudflare Serverless D1 SQL Database Instance
        const { results } = await env.DB.prepare(
            "SELECT * FROM patients ORDER BY created_at DESC"
        ).all();
        
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// POST /api/patients -> Performs payload serialization and saves entries to storage
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const body = await request.json();
        const { name, age, phone, treatment, price } = body;

        if (!name || !age || !phone || !treatment || !price) {
            return new Response(JSON.stringify({ error: "Missing required properties" }), { status: 400 });
        }

        // Executing standard injection-safe prepared SQL transaction statement
        await env.DB.prepare(
            "INSERT INTO patients (name, age, phone, treatment, price) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, age, phone, treatment, price).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
// DELETE /api/patients?id=[ID] -> Removes a specific record from the D1 database
export async function onRequestDelete(context) {
    try {
        const { env, request } = context;
        
        // Extract the ID from the URL string
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing patient ID" }), { status: 400 });
        }

        // Execute the deletion query
        await env.DB.prepare(
            "DELETE FROM patients WHERE id = ?"
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
