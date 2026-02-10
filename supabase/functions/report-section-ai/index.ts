import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an ISO 50001:2018 energy reporting assistant embedded in a report builder. You help energy managers write professional report sections.

## Factory Context
5 monitored zones: HVAC (4,200 kWh/day baseline, 3,990 target), Production Line (8,500/8,075), Lighting (1,200/1,080), Compressed Air (3,100/2,945), Refrigeration (2,800/2,660).
Total baseline: 19,800 kWh/day. Total target: 18,750 kWh/day.
Tariff: Off-peak €0.08, Shoulder €0.14, Peak €0.22/kWh. CO₂ factor: 0.42 kg/kWh.

## Rules
- Be concise and professional — industrial tone
- Reference specific KPIs, zones, and numbers
- Use RAG status (Red/Amber/Green) where appropriate
- State confidence level
- Always say "estimated" for savings
- Output clean markdown suitable for pasting into a report section`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, section_id, section_label, existing_content, report_type, report_date } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userPrompt = "";

    if (action === "generate_summary") {
      userPrompt = `Generate a concise "${section_label}" section for a ${report_type || 'daily'} energy report dated ${report_date || 'today'}.

Use realistic values near the baseline/target ranges. Write 2-4 paragraphs with specific numbers, RAG statuses, and actionable insights. Use markdown formatting (headers, bold, bullet points where appropriate).

${existing_content ? `Here is the existing report content for context:\n---\n${existing_content}\n---\nGenerate ONLY the "${section_label}" section content. Do not repeat content already covered.` : `This is a fresh report. Generate a complete "${section_label}" section.`}`;
    } else if (action === "explain_deviation") {
      userPrompt = `Analyze and explain the key deviations in the "${section_label}" section of this energy report.

For each deviation found:
1. **What deviated**: Which KPI/zone and by how much
2. **Likely cause**: Root cause analysis (state confidence: High/Med/Low)
3. **Impact**: Energy, cost, and CO₂ impact
4. **Recommended action**: Specific corrective action with suggested owner

${existing_content ? `Here is the current report content:\n---\n${existing_content}\n---\nFocus your analysis on deviations relevant to the "${section_label}" section.` : `No existing content yet. Provide a general deviation analysis for a typical ${report_type || 'daily'} report, highlighting the most common deviations seen in industrial energy management for this section type.`}

Output clean markdown. Be specific with numbers and percentages.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action. Use 'generate_summary' or 'explain_deviation'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("report-section-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
