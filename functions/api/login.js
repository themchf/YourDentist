export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const { username, password } = await request.json();

        // Check if the user exists and the password matches
        const user = await env.DB.prepare(
            "SELECT id, status, clinic_name FROM users WHERE username = ? AND password = ?"
        ).bind(username, password).first();

        if (!user) {
            return new Response(JSON.stringify({ error: "Invalid username or password." }), { status: 401 });
        }

        if (user.status !== 'active') {
            return new Response(JSON.stringify({ error: "Account suspended. Please contact support." }), { status: 403 });
        }

        // Return the user ID so the frontend can save it to the session
        return new Response(JSON.stringify({ 
            success: true, 
            userId: user.id, 
            clinicName: user.clinic_name 
        }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
