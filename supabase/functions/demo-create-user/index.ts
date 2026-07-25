import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DemoCreateBody {
  email: string;
  password: string;
  full_name: string;
  role: "school_admin" | "teacher" | "parent";
  school_id: string;
  student_id?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server not configured for demo user creation." }, 500);
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  // Require a valid caller JWT so the function isn't open to the world.
  // We accept either the forwarded caller token or the anon key header.
  const callerToken = token || anonKey || "";
  if (!callerToken) {
    return json({ error: "Unauthorized." }, 401);
  }

  let body: DemoCreateBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { email, password, full_name, role, school_id, student_id } = body;
  if (!email || !password || !full_name || !role || !school_id) {
    return json({ error: "Missing required fields." }, 400);
  }
  if (!["school_admin", "teacher", "parent"].includes(role)) {
    return json({ error: "Invalid role for demo creation." }, 400);
  }

  // Verify caller is authenticated and allowed to create a demo user
  // (school_admin can create teacher/parent within their school; super_admin can create school_admin).
  const callerClient = createClient(supabaseUrl, callerToken, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerData?.user) {
    return json({ error: "Unauthorized." }, 401);
  }
  const callerUserId = callerData.user.id;
  const callerRole = (callerData.user.app_metadata as { role?: string })?.role;

  // Service-role admin client — bypasses RLS for user creation + profile insert.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Caller authorization: super_admin may create school_admin; school_admin may create
  // teacher/parent within their own school.
  if (callerRole !== "super_admin") {
    const { data: callerProfile } = await admin
      .from("app_users")
      .select("school_id, role")
      .eq("user_id", callerUserId)
      .maybeSingle();
    const cp = callerProfile as { school_id: string | null; role: string } | null;
    if (!cp || cp.role !== "school_admin" || cp.school_id !== school_id) {
      return json({ error: "Not allowed to create users for this school." }, 403);
    }
    if (role === "school_admin") {
      return json({ error: "Only the platform owner can create school admins." }, 403);
    }
  }

  // Create the auth user with role metadata so the JWT carries the role claim.
  const { data: signUp, error: signUpErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name },
    app_metadata: { role },
  });
  if (signUpErr) {
    return json({ error: signUpErr.message }, 400);
  }
  const newUserId = signUp.user?.id;
  if (!newUserId) {
    return json({ error: "Failed to create auth user." }, 500);
  }

  // Insert the app_users profile row (service role bypasses the self-only RLS).
  const { error: profileErr } = await admin.from("app_users").insert({
    user_id: newUserId,
    school_id,
    role,
    full_name,
    active: true,
  });
  if (profileErr) {
    // Best-effort cleanup of the orphaned auth user.
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: profileErr.message }, 400);
  }

  // For parents, optionally link to a student.
  if (role === "parent" && student_id) {
    await admin.from("student_parents").insert({
      school_id,
      student_id,
      parent_user_id: newUserId,
      relationship: "guardian",
    });
  }

  return json({ user_id: newUserId, email, role }, 200);

  function json(payload: unknown, status: number) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
