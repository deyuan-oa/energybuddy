import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPORT_SYSTEM_PROMPT = `You are an ISO 50001:2018 energy reporting assistant. Generate structured reports for industrial energy management.

## Factory Context
5 monitored zones: HVAC (4,200 kWh/day baseline), Production Line (8,500 kWh/day), Lighting (1,200 kWh/day), Compressed Air (3,100 kWh/day), Refrigeration (2,800 kWh/day).
Total baseline: 19,800 kWh/day. Total target: 18,750 kWh/day.
Tariff: Off-peak €0.08, Shoulder €0.14, Peak €0.22/kWh.
CO₂ factor: 0.42 kg/kWh.

## Rules
- Reference specific KPIs, zones, and numbers
- Use RAG status (Red/Amber/Green) for each KPI
- State confidence level and data completeness
- Always say "estimated" for savings
- Include recommended actions with owners and due dates
- Keep professional, concise, industrial tone

## Output Format
Write in markdown with clear sections. Use tables for KPI summaries. Include:
1. Executive Summary (2-3 sentences)
2. KPI Performance Table
3. Key Findings & Anomalies
4. Corrective Actions Summary
5. Recommendations
6. Data Quality & Confidence Notes`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { report_type, report_date, report_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch corrective actions for context
    const { data: actions } = await supabase
      .from("corrective_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const actionsContext = actions?.map(a => 
      `- [${a.action_code}] ${a.title} | Status: ${a.status} | Priority: ${a.priority} | Due: ${a.due_date || 'N/A'}`
    ).join("\n") || "No actions found.";

    // Build prompt based on report type
    let userPrompt = "";
    const dateStr = report_date || new Date().toISOString().split("T")[0];
    
    switch (report_type) {
      case "daily":
        userPrompt = `Generate a Daily Energy Summary Report for ${dateStr}.
Include: KPI status snapshot with RAG ratings, top anomalies detected, actions created/closed today.
Use realistic values near the baseline/target ranges. Flag any zones exceeding targets.
Current corrective actions:\n${actionsContext}`;
        break;
      case "weekly":
        userPrompt = `Generate a Weekly Operations Review Report for the week ending ${dateStr}.
Include: 7-day trends vs target/baseline, peak demand events, root-cause analysis notes, action progress summary.
Current corrective actions:\n${actionsContext}`;
        break;
      case "monthly":
        userPrompt = `Generate a Monthly Management Review Pack (ISO 50001-aligned) for the month ending ${dateStr}.
Include: EnPI performance summary, SEU performance analysis, objectives/targets progress, significant deviations, corrective action effectiveness, improvement opportunities.
This report will be reviewed by plant management and potentially auditors.
Current corrective actions:\n${actionsContext}`;
        break;
      default:
        userPrompt = `Generate a Daily Energy Summary Report for ${dateStr}.\nCurrent corrective actions:\n${actionsContext}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: REPORT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const aiResult = await response.json();
    const draft = aiResult.choices?.[0]?.message?.content || "";

    // Save draft to report if report_id provided
    if (report_id) {
      await supabase
        .from("reports")
        .update({ ai_draft: draft, status: "draft", updated_at: new Date().toISOString() })
        .eq("id", report_id);
    }

    return new Response(JSON.stringify({ draft, report_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
