import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiGenerateText } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MODELS = [
  "google/gemini-3-flash-preview", "google/gemini-2.5-pro", "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite", "openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano", "openai/gpt-5.2",
];

async function runAgent(opts: {
  supabase: any;
  userId: string;
  agent: any;
  input: string;
  context?: string;
  parentExecutionId?: string;
  crewId?: string;
}): Promise<{ executionId: string; output: string; tokens: number; latency: number; error?: string }> {
  const { supabase, userId, agent, input, context, parentExecutionId, crewId } = opts;
  const model = ALLOWED_MODELS.includes(agent.model) ? agent.model : "google/gemini-2.5-flash";

  const { data: execution } = await supabase.from("agent_executions").insert({
    user_id: userId, agent_id: agent.id, crew_id: crewId ?? null,
    parent_execution_id: parentExecutionId ?? null,
    status: "running", input, model,
  }).select().single();
  if (!execution) throw new Error("Failed to create execution record");

  await supabase.from("agent_logs").insert({
    execution_id: execution.id, user_id: userId, agent_id: agent.id,
    step_number: 1, log_type: "thought",
    content: `Agent "${agent.name}" (${agent.role}) starting task with model ${model}`,
  });

  const systemMessage = `${agent.system_prompt}

# Your Role
${agent.role}

# Your Goal
${agent.goal}

${agent.backstory ? `# Your Background\n${agent.backstory}\n` : ""}

You produce REAL, professional, ready-to-use, complete output. NEVER use placeholders like "[insert here]", "TBD", "lorem ipsum", or vague filler. Always be specific, detailed, and concrete.`;

  const userMessage = context ? `# Context from previous agents:\n${context}\n\n# Your task:\n${input}` : input;

  const startTime = Date.now();
  let output = "";
  let tokens = 0;
  let errorMsg: string | undefined;

  try {
    const result = await geminiGenerateText({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: Number(agent.temperature) || 0.7,
    });
    output = result.text;
    tokens = result.totalTokens;

    await supabase.from("agent_logs").insert({
      execution_id: execution.id, user_id: userId, agent_id: agent.id,
      step_number: 2, log_type: "action",
      content: `Generated ${output.length} chars`,
      metadata: { tokens, model },
    });
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
    await supabase.from("agent_logs").insert({
      execution_id: execution.id, user_id: userId, agent_id: agent.id,
      step_number: 99, log_type: "error", content: errorMsg,
    });
  }

  const latency = Date.now() - startTime;

  await supabase.from("agent_executions").update({
    status: errorMsg ? "failed" : "completed",
    output: { text: output },
    error: errorMsg,
    tokens_used: tokens,
    latency_ms: latency,
    completed_at: new Date().toISOString(),
  }).eq("id", execution.id);

  await supabase.from("agents").update({
    total_executions: (agent.total_executions || 0) + 1,
    success_count: (agent.success_count || 0) + (errorMsg ? 0 : 1),
    total_tokens: (agent.total_tokens || 0) + tokens,
    avg_latency_ms: Math.round(((agent.avg_latency_ms || 0) * (agent.total_executions || 0) + latency) / ((agent.total_executions || 0) + 1)),
  }).eq("id", agent.id);

  return { executionId: execution.id, output, tokens, latency, error: errorMsg };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { mode, agentId, crewId, input } = await req.json();
    if (!input || typeof input !== "string" || input.length < 3 || input.length > 8000) {
      return new Response(JSON.stringify({ error: "Input must be 3-8000 chars" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Single agent mode
    if (mode === "agent") {
      const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).eq("user_id", user.id).single();
      if (!agent) throw new Error("Agent not found");
      const result = await runAgent({ supabase, userId: user.id, agent, input });
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Crew mode (sequential pipeline orchestrated by orchestrator agent)
    if (mode === "crew") {
      const { data: crew } = await supabase.from("agent_crews").select("*").eq("id", crewId).eq("user_id", user.id).single();
      if (!crew) throw new Error("Crew not found");

      const { data: members } = await supabase.from("crew_members")
        .select("*, agent:agents(*)").eq("crew_id", crewId).order("position", { ascending: true });
      if (!members || members.length === 0) throw new Error("Crew has no members");

      // Master execution record
      const { data: master } = await supabase.from("agent_executions").insert({
        user_id: user.id, crew_id: crewId, status: "running", input,
      }).select().single();

      // Run orchestrator first if exists, to plan the work
      let plan = "";
      if (crew.orchestrator_agent_id) {
        const { data: orch } = await supabase.from("agents").select("*").eq("id", crew.orchestrator_agent_id).single();
        if (orch) {
          const planInput = `Mission: ${crew.mission}\n\nUser input: ${input}\n\nAvailable specialists:\n${members.map((m: any) => `- ${m.agent.name} (${m.agent.role}): ${m.task_description || m.agent.goal}`).join("\n")}\n\nProvide a clear, numbered plan describing what each specialist should focus on. Be specific.`;
          const r = await runAgent({ supabase, userId: user.id, agent: orch, input: planInput, parentExecutionId: master.id, crewId });
          plan = r.output;
        }
      }

      // Run each member sequentially, passing context forward
      const results: any[] = [];
      let context = plan ? `# Orchestrator's Plan:\n${plan}` : "";
      for (const m of members) {
        const taskInput = `Mission: ${crew.mission}\n\nOriginal request: ${input}\n\nYour specific task: ${m.task_description || m.agent.goal}`;
        const r = await runAgent({
          supabase, userId: user.id, agent: m.agent,
          input: taskInput, context,
          parentExecutionId: master.id, crewId,
        });
        results.push({ agentId: m.agent.id, agentName: m.agent.name, role: m.agent.role, output: r.output, error: r.error, tokens: r.tokens, latency: r.latency });
        context += `\n\n# Output from ${m.agent.name} (${m.agent.role}):\n${r.output}`;
      }

      const totalTokens = results.reduce((s, r) => s + (r.tokens || 0), 0);
      const totalLatency = results.reduce((s, r) => s + (r.latency || 0), 0);
      const anyError = results.find((r) => r.error);

      await supabase.from("agent_executions").update({
        status: anyError ? "failed" : "completed",
        output: { plan, results, finalContext: context },
        tokens_used: totalTokens,
        latency_ms: totalLatency,
        error: anyError?.error,
        completed_at: new Date().toISOString(),
      }).eq("id", master.id);

      await supabase.from("agent_crews").update({ total_runs: (crew.total_runs || 0) + 1 }).eq("id", crewId);

      return new Response(JSON.stringify({ executionId: master.id, plan, results, totalTokens, totalLatency }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    console.error("agent-orchestrator error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});