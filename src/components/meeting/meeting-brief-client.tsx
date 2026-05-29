"use client";

import * as React from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Brief = {
  executiveSummary: string;
  wins: { title: string; narrative: string }[];
  challenges: {
    issue: string;
    impact: string;
    mitigation: string;
    severity: "low" | "medium" | "high";
  }[];
  talkingPoints: string[];
  biQuestion: string;
  upsellOpportunities: string[];
  meetingMode: "Growth Review" | "Recovery Call" | "Expansion Strategy" | "Retention Save";
  confidence: number;
};

export function MeetingBriefClient({ clientId }: { clientId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [brief, setBrief] = React.useState<Brief | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/meeting-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const json = (await res.json()) as Brief;
      setBrief(json);
      toast.success("Meeting brief generated.");
    } catch {
      toast.error("Failed to generate meeting brief.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!brief) return;
    const text = JSON.stringify(brief, null, 2);
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-xl bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/25 dark:text-cyan-300">
            AI Meeting Brief
          </Badge>
          <Badge variant="secondary" className="rounded-xl">
            {clientId}
          </Badge>
          {brief ? (
            <Badge className="rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
              Confidence {Math.round(brief.confidence * 100)}%
            </Badge>
          ) : null}
          {brief ? (
            <Badge variant="secondary" className="rounded-xl">
              {brief.meetingMode}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pre-meeting intelligence, ready in seconds.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Generate an executive briefing, emotionally-framed wins, challenges with mitigation,
          and next-best talking points.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="rounded-xl"
          onClick={generate}
          disabled={loading}
        >
          <RefreshCw className="mr-2 size-4" />
          {brief ? "Regenerate" : "Generate Brief"}
        </Button>
        <Button
          variant="secondary"
          className="rounded-xl"
          onClick={copy}
          disabled={!brief}
        >
          <Copy className="mr-2 size-4" />
          Copy JSON
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-10/12" />
            <Skeleton className="mt-2 h-4 w-11/12" />
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-10/12" />
            <Skeleton className="mt-2 h-4 w-11/12" />
          </Card>
        </div>
      ) : brief ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Executive Summary</div>
              <Badge variant="secondary" className="rounded-xl">
                {brief.meetingMode}
              </Badge>
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {brief.executiveSummary}
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="text-sm font-medium">Wins</div>
            <Separator className="my-3 bg-border/60" />
            <div className="flex flex-col gap-3">
              {brief.wins.map((w, idx) => (
                <div key={idx} className="rounded-xl bg-muted/25 p-3 ring-1 ring-border/60">
                  <div className="text-sm font-semibold tracking-tight">{w.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{w.narrative}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">Challenges & Mitigation</div>
              <Badge variant="secondary" className="rounded-xl">
                2 items
              </Badge>
            </div>
            <Separator className="my-3 bg-border/60" />
            <div className="grid gap-3 md:grid-cols-2">
              {brief.challenges.map((c, idx) => (
                <div key={idx} className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold tracking-tight">Issue</div>
                    <Badge
                      className="rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300"
                      data-sev={c.severity}
                    >
                      {c.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.issue}</div>
                  <div className="mt-3 text-sm font-semibold tracking-tight">Impact</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.impact}</div>
                  <div className="mt-3 text-sm font-semibold tracking-tight">Mitigation</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.mitigation}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="text-sm font-medium">Talking Points</div>
            <Separator className="my-3 bg-border/60" />
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              {brief.talkingPoints.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="text-sm font-medium">Business Intelligence Question</div>
            <Separator className="my-3 bg-border/60" />
            <div className="text-sm text-muted-foreground">{brief.biQuestion}</div>
            <Separator className="my-3 bg-border/60" />
            <div className="text-sm font-medium">Upsell Opportunities</div>
            <div className="mt-2 flex flex-col gap-2">
              {brief.upsellOpportunities.map((u, idx) => (
                <div key={idx} className="rounded-xl bg-muted/25 px-3 py-2 ring-1 ring-border/60">
                  <div className="text-sm text-muted-foreground">{u}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="text-sm text-muted-foreground">
            Generate a brief to see executive summary, wins, challenges, and recommendations.
          </div>
        </Card>
      )}
    </div>
  );
}
