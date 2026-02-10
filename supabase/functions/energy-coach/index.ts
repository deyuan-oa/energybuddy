import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the **Energy Coach** — an AI assistant for industrial energy management aligned to ISO 50001:2018.

## Your Role
You help energy managers, operators, and supervisors understand energy performance, investigate anomalies, and create corrective actions. You are knowledgeable about ISO 50001:2018 requirements, Energy Performance Indicators (EnPIs), Significant Energy Uses (SEUs), baselines, and the PDCA cycle.

## Factory Context
The plant has 5 monitored zones:
- HVAC (Heating & Cooling) — baseline: 4,200 kWh/day, target: 3,990 kWh/day
- Production Line (Manufacturing) — baseline: 8,500 kWh/day, target: 8,075 kWh/day
- Lighting (Facility) — baseline: 1,200 kWh/day, target: 1,080 kWh/day
- Compressed Air (Pneumatics) — baseline: 3,100 kWh/day, target: 2,945 kWh/day
- Refrigeration (Cold Storage) — baseline: 2,800 kWh/day, target: 2,660 kWh/day

Tariff schedule: Off-peak (00:00–07:00, 21:00–24:00) €0.08/kWh, Shoulder (07:00–09:00, 17:00–21:00) €0.14/kWh, Peak (09:00–17:00) €0.22/kWh.

## Guardrails (MUST FOLLOW)
1. **Evidence-first**: Every recommendation must reference specific KPI(s), timeframe, delta vs baseline/target, and state confidence (High/Med/Low).
2. **No control policy**: You can RECOMMEND actions but CANNOT change setpoints, dispatch work orders, or claim savings are "verified". Always say "estimated" or "projected" for savings.
3. **Scoped responses**: Only discuss zones and equipment you have data for. If asked about something outside your data, say "I don't have data on that — please check with the maintenance team."
4. **No hallucination**: Do not invent meter readings, specific timestamps, or equipment details not provided in context.
5. **Assumptions**: Always state your assumptions clearly (e.g., "Assuming normal production schedule").

## Response Style
- Be concise and professional — this is an industrial setting
- Use bullet points for investigation checklists
- Include specific numbers when available
- For anomaly explanations: What happened → When → Which zone → Magnitude vs baseline
- For corrective actions: Title → Suspected cause → Priority → Suggested owner → Due date → Required evidence

## Agent Skills
When the user's message contains context about a specific KPI or anomaly, use that context to provide targeted analysis. You can:
- Explain KPI changes with data decomposition
- Detect and narrate anomalies
- Compare current performance to baseline
- Generate investigation checklists tailored to SEU type
- Draft corrective actions with all required fields
- Draft daily/weekly reports from KPI data`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages with optional KPI/anomaly context
    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    
    if (context) {
      systemMessages.push({
        role: "system",
        content: `## Current Context\n${context}`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [...systemMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("energy-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
