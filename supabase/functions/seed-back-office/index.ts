import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-secret",
};

const DEFAULT_EMAIL = "backoffice@logitrainerstudio.app";
const DEFAULT_PASSWORD = "LTS-Mayo2026-7kQ!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const setupSecret = Deno.env.get("BACK_OFFICE_SETUP_SECRET");
    const headerSecret = req.headers.get("x-setup-secret");
    if (!setupSecret || headerSecret !== setupSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let email = DEFAULT_EMAIL;
    let password = DEFAULT_PASSWORD;

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (body?.email && typeof body.email === "string") email = body.email;
    if (body?.password && typeof body.password === "string") password = body.password;

    const { data: cfg } = await supabase.from("back_office_config").select("admin_email").eq("id", 1).maybeSingle();
    if (cfg?.admin_email) email = cfg.admin_email;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let adminUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!adminUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: "Back Office Admin" },
      });
      if (error) throw error;
      adminUser = data.user;
    } else {
      await supabase.auth.admin.updateUserById(adminUser.id, { password });
    }

    if (adminUser) {
      await supabase.from("user_roles").upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });
      await supabase
        .from("user_approvals")
        .upsert({ user_id: adminUser.id, status: "approved", reviewed_at: new Date().toISOString() }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({ success: true, email, user_id: adminUser?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
