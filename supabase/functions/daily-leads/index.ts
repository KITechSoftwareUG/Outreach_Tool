import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OUTREACH_SUPABASE_URL = Deno.env.get("OUTREACH_SUPABASE_URL");
    const OUTREACH_SUPABASE_KEY = Deno.env.get("OUTREACH_SUPABASE_KEY");

    if (!OUTREACH_SUPABASE_URL || !OUTREACH_SUPABASE_KEY) {
      throw new Error(
        `Missing secrets: URL=${!!OUTREACH_SUPABASE_URL}, KEY=${!!OUTREACH_SUPABASE_KEY}`
      );
    }

    const dbHeaders = {
      apikey: OUTREACH_SUPABASE_KEY,
      Authorization: `Bearer ${OUTREACH_SUPABASE_KEY}`,
      Accept: "application/json",
    };

    const today = new Date().toISOString().slice(0, 10);

    // Fetch leads enriched today
    const url = `${OUTREACH_SUPABASE_URL}/rest/v1/leads?` +
      `select=lead_id,first_name,last_name,email,company,status,enriched_at,email_sent,email_sent_at` +
      `&enriched_at=not.is.null` +
      `&enriched_at=gte.${today}T00:00:00Z` +
      `&order=enriched_at.desc` +
      `&limit=50`;

    const resp = await fetch(url, {
      headers: { ...dbHeaders, Prefer: "count=exact" },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Outreach DB error:", resp.status, errText);
      throw new Error(`DB ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const leads = await resp.json();
    const contentRange = resp.headers.get("Content-Range") || "*/0";
    const todayCount = parseInt(contentRange.split("/").pop() || "0", 10);

    // Count pending enrichment
    const pendingUrl = `${OUTREACH_SUPABASE_URL}/rest/v1/leads?` +
      `select=lead_id` +
      `&enriched=eq.false` +
      `&apollo_id=not.is.null` +
      `&limit=1`;

    const pendingResp = await fetch(pendingUrl, {
      headers: { ...dbHeaders, Prefer: "count=exact" },
    });

    const pendingRange = pendingResp.headers.get("Content-Range") || "*/0";
    const pendingLeads = parseInt(pendingRange.split("/").pop() || "0", 10);

    return new Response(
      JSON.stringify({
        today,
        todayCount,
        leads,
        stats: { pending: pendingLeads },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("daily-leads error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
