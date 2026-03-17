import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().slice(0, 10);

    // Fetch leads enriched today
    const { data: leads, count: todayCount, error } = await supabase
      .from("leads")
      .select("lead_id,first_name,last_name,email,company,status,enriched_at,email_sent,email_sent_at", { count: "exact" })
      .not("enriched_at", "is", null)
      .gte("enriched_at", `${today}T00:00:00Z`)
      .order("enriched_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Count pending enrichment
    const { count: pendingLeads } = await supabase
      .from("leads")
      .select("lead_id", { count: "exact", head: true })
      .eq("enriched", false)
      .not("apollo_id", "is", null);

    return new Response(
      JSON.stringify({
        today,
        todayCount: todayCount || 0,
        leads: leads || [],
        stats: { pending: pendingLeads || 0 },
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
