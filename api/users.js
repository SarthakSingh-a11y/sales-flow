// Admin-only user CRUD backed by the Supabase Auth admin API.
// Runs as a Vercel serverless function so the service_role key stays server-side.
//
//   POST   /api/users            → create { email, password, name, role }
//   PATCH  /api/users?id=<uuid>  → update { email?, password?, name?, role? }
//   DELETE /api/users?id=<uuid>  → delete + null trainees.created_by
//
// Every request must include: Authorization: Bearer <supabase-session-access-token>
// The caller is verified as role='admin' in the profiles table before anything runs.

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL              = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY         = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  // Fail loud at cold-start so misconfig surfaces immediately in Vercel logs
  console.error("api/users: missing SUPABASE_* env vars");
}

// Admin client — bypasses RLS, can manage auth.users
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normaliseRole(r) {
  return r === "admin" ? "admin" : "employee";
}

async function requireAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) throw { status: 401, message: "Missing bearer token" };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw { status: 401, message: "Invalid session" };

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("role, is_banned")
    .eq("id", data.user.id)
    .single();
  if (pErr)               throw { status: 500, message: `Profile lookup failed: ${pErr.message}` };
  if (profile.is_banned)  throw { status: 403, message: "Account banned" };
  if (profile.role !== "admin") throw { status: 403, message: "Admin only" };

  return data.user;
}

module.exports = async function handler(req, res) {
  try {
    const caller = await requireAdmin(req);

    if (req.method === "POST") {
      const { email, password, name, role } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const finalRole = normaliseRole(role);

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip verification email — admin is vouching for them
        user_metadata: name ? { name } : undefined,
      });
      if (cErr)  return res.status(400).json({ error: cErr.message });

      const uid = created.user.id;
      // Upsert profile — a trigger may have already inserted a stub row
      const { error: pErr } = await admin.from("profiles").upsert({
        id: uid,
        email,
        name: name || null,
        role: finalRole,
        is_banned: false,
      }, { onConflict: "id" });
      if (pErr) {
        // Roll back the auth user so we don't leave orphans
        await admin.auth.admin.deleteUser(uid).catch(() => {});
        return res.status(500).json({ error: `Profile write failed: ${pErr.message}` });
      }

      return res.status(201).json({ id: uid, email, name: name || null, role: finalRole });
    }

    if (req.method === "PATCH") {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: "id query param required" });
      const { email, password, name, role } = req.body || {};

      // Auth-side update (email / password)
      const authUpdate = {};
      if (email)    authUpdate.email    = email;
      if (password) {
        if (typeof password !== "string" || password.length < 8) {
          return res.status(400).json({ error: "Password must be at least 8 characters" });
        }
        authUpdate.password = password;
      }
      if (Object.keys(authUpdate).length) {
        const { error } = await admin.auth.admin.updateUserById(id, authUpdate);
        if (error) return res.status(400).json({ error: error.message });
      }

      // Profile-side update
      const profileUpdate = {};
      if (email !== undefined) profileUpdate.email = email;
      if (name  !== undefined) profileUpdate.name  = name;
      if (role  !== undefined) profileUpdate.role  = normaliseRole(role);
      if (Object.keys(profileUpdate).length) {
        const { error } = await admin.from("profiles").update(profileUpdate).eq("id", id);
        if (error) return res.status(500).json({ error: `Profile update failed: ${error.message}` });
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      if (!id)                  return res.status(400).json({ error: "id query param required" });
      if (id === caller.id)     return res.status(400).json({ error: "You cannot delete your own account" });

      // Unassign any trainees this user created (so nothing references a dangling id)
      const { error: unErr } = await admin.from("trainees").update({ created_by: null }).eq("created_by", id);
      if (unErr) return res.status(500).json({ error: `Unassign failed: ${unErr.message}` });

      // Delete profile row (explicit — do not rely on cascade)
      await admin.from("profiles").delete().eq("id", id);

      // Delete auth user
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error("api/users unhandled:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
};
