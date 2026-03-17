import { useState, useEffect } from "react";
import { RefreshCw, Mail, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  lead_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
  enriched_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
}

interface DailyData {
  today: string;
  todayCount: number;
  leads: Lead[];
  stats: { total: number; pending: number };
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Mail }> = {
  email_sent:              { label: "Gesendet",         variant: "default",     icon: CheckCircle2 },
  enriched:                { label: "Enriched",         variant: "secondary",   icon: Clock },
  no_email:                { label: "Keine Email",      variant: "outline",     icon: XCircle },
  enrich_failed:           { label: "Enrich fehlgeschlagen", variant: "destructive", icon: AlertTriangle },
  db_unique_violation:     { label: "Duplikat",         variant: "outline",     icon: XCircle },
  duplicate_email_sent:    { label: "Email-Duplikat",   variant: "outline",     icon: XCircle },
  duplicate_email_pending: { label: "Email-Duplikat",   variant: "outline",     icon: XCircle },
};

export function DailyLeads() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("daily-leads");
      if (fnError) throw fnError;
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <p>Pipeline-Daten nicht verfügbar</p>
        <p className="text-xs mt-1">{error}</p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={load}>
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const sent = data.leads.filter(l => l.status === "email_sent").length;
  const skipped = data.leads.filter(l => l.status && l.status !== "email_sent" && l.status !== "enriched").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Heutige Pipeline</h3>
          <p className="text-xs text-muted-foreground">
            {data.todayCount} Leads verarbeitet · {sent} gesendet · {skipped} übersprungen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {data.stats.pending} pending
          </span>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {data.leads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Noch keine Leads heute verarbeitet. Cron läuft um 9:00 Uhr.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {data.leads.map((lead) => {
            const cfg = STATUS_CONFIG[lead.status || ""] || { label: lead.status || "?", variant: "outline" as const, icon: Clock };
            const Icon = cfg.icon;
            return (
              <Card key={lead.lead_id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {lead.first_name} {lead.last_name}
                    {lead.company && (
                      <span className="text-muted-foreground font-normal"> · {lead.company}</span>
                    )}
                  </p>
                  {lead.email && (
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  )}
                </div>
                <Badge variant={cfg.variant} className="ml-2 shrink-0 text-[10px] gap-1">
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
