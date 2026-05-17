import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function ensureCallerIsAdmin(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  email: string | undefined,
): Promise<boolean> {
  const { data: roleData } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleData) return true;

  const { data: cfg } = await adminClient
    .from("back_office_config")
    .select("admin_email")
    .eq("id", 1)
    .maybeSingle();

  if (!cfg?.admin_email || !email || email.toLowerCase() !== cfg.admin_email.toLowerCase()) {
    return false;
  }

  await adminClient.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );
  await adminClient.from("user_approvals").upsert(
    {
      user_id: userId,
      status: "approved",
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const isAdmin = await ensureCallerIsAdmin(adminClient, caller.id, caller.email);
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { action, user_id } = await req.json();

    if (action === "list") {
      // List all pending users with their profile info
      const { data: approvals, error } = await adminClient
        .from("user_approvals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for all users
      const userIds = approvals?.map((a) => a.user_id) || [];
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("*")
        .in("id", userIds);

      // Get auth users for emails
      const { data: authUsers } = await adminClient.auth.admin.listUsers();

      const enriched = approvals?.map((a) => {
        const profile = profiles?.find((p) => p.id === a.user_id);
        const authUser = authUsers?.users?.find((u) => u.id === a.user_id);
        return {
          ...a,
          email: authUser?.email,
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
        };
      });

      return new Response(JSON.stringify({ data: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve" || action === "reject") {
      const { error } = await adminClient
        .from("user_approvals")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: caller.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : error.message.startsWith("Forbidden") ? 403 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
