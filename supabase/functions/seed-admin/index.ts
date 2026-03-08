import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const adminEmail = "rafaelcastro7@gmail.com";
    const adminPassword = "Clave123.";

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let adminUser = existingUsers?.users?.find((u) => u.email === adminEmail);

    if (!adminUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { display_name: "Admin" },
      });
      if (error) throw error;
      adminUser = data.user;
    }

    if (adminUser) {
      // Ensure admin role
      await supabase.from("user_roles").upsert(
        { user_id: adminUser.id, role: "admin" },
        { onConflict: "user_id,role" }
      );

      // Ensure approved
      await supabase.from("user_approvals").upsert(
        { user_id: adminUser.id, status: "approved" },
        { onConflict: "user_id" }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: adminUser?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
