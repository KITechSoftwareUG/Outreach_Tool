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
      throw new Error("OUTREACH_SUPABASE_URL or OUTREACH_SUPABASE_KEY not configured");
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch leads enriched today (enriched_at >= today)
    const resp = await fetch(
      `${OUTREACH_SUPABASE_URL}/rest/v1/leads?` +
        new URLSearchParams({
          select: "lead_id,first_name,last_name,email,company,status,enriched_at,email_sent,email_sent_at",
          enriched_at: `gte.${today}T00:00:00`,
          order: "enriched_at.desc",
          limit: "50",
        }),
      {
        headers: {
          apikey: OUTREACH_SUPABASE_KEY,
          Authorization: `Bearer ${OUTREACH_SUPABASE_KEY}`,
          Accept: "application/json",
          Prefer: "count=exact",
        },
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Outreach DB error:", resp.status, errText);
      throw new Error("Datenbankabfrage fehlgeschlagen");
    }

    const leads = await resp.json();
    const contentRange = resp.headers.get("Content-Range") || "*/0";
    const total = parseInt(contentRange.split("/").pop() || "0", 10);

    // Fetch overall stats
    const statsResp = await fetch(
      `${OUTREACH_SUPABASE_URL}/rest/v1/leads?select=lead_id`,
      {
        headers: {
          apikey: OUTREACH_SUPABASE_KEY,
          Authorization: `Bearer ${OUTREACH_SUPABASE_KEY}`,
          Accept: "application/json",
          Prefer: "count=exact",
        },
      }
    );
    const totalRange = statsResp.headers.get("Content-Range") || "*/0";
    const totalLeads = parseInt(totalRange.split("/").pop() || "0", 10);

    // Count pending
    const pendingResp = await fetch(
      `${OUTREACH_SUPABASE_URL}/rest/v1/leads?` +
        new URLSearchParams({
          select: "lead_id",
          enriched: "eq.false",
          apollo_id: "not.is.null",
        }),
      {
        headers: {
          apikey: OUTREACH_SUPABASE_KEY,
          Authorization: `Bearer ${OUTREACH_SUPABASE_KEY}`,
          Accept: "application/json",
          Prefer: "count=exact",
        },
      }
    );
    const pendingRange = pendingResp.headers.get("Content-Range") || "*/0";
    const pendingLeads = parseInt(pendingRange.split("/").pop() || "0", 10);

    return new Response(
      JSON.stringify({
        today: today,
        todayCount: total,
        leads,
        stats: { total: totalLeads, pending: pendingLeads },
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
