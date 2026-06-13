import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppAlert,
  AppShellData,
  ClientOverview,
  ClientRecord,
  DashboardInsight,
  MeetingBriefPayload,
  WorkspaceSnapshot,
  ActionItemRecord,
  MeetingRecord,
  OpportunityRecord,
  SignalRecord,
  TimelineEvent,
  WikiDocumentRecord,
  WorkspaceAdminSnapshot,
  WorkspaceTenant,
} from "@/lib/mtos-types";
import { getCurrentWorkspaceContext, getSetupWorkspaceContext } from "@/lib/workspace";

const DAY_MS = 24 * 60 * 60 * 1000;

function isoOffset(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * DAY_MS).toISOString();
}

type RawWorkspace = {
  tenant: WorkspaceTenant;
  clients: ClientRecord[];
  meetings: MeetingRecord[];
  actions: ActionItemRecord[];
  opportunities: OpportunityRecord[];
  signals: SignalRecord[];
  docs: WikiDocumentRecord[];
};

function buildSetupWorkspace(
  sourceMessage = "Finish workspace setup to view live MTOS data.",
  tenant: WorkspaceTenant = getSetupWorkspaceContext().tenant
): WorkspaceSnapshot {
  return finalizeWorkspace(
    {
      tenant,
      clients: [],
      meetings: [],
      actions: [],
      opportunities: [],
      signals: [],
      docs: [],
    },
    "setup",
    sourceMessage
  );
}

function byNewest<T extends { timestamp?: string; meetingAt?: string; recordedAt?: string; updatedAt?: string }>(
  items: T[],
  getDate: (item: T) => string
) {
  return [...items].sort(
    (left, right) => new Date(getDate(right)).getTime() - new Date(getDate(left)).getTime()
  );
}

function buildTimeline(
  clientId: string,
  meetings: MeetingRecord[],
  actions: ActionItemRecord[],
  opportunities: OpportunityRecord[],
  signals: SignalRecord[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...meetings
      .filter((meeting) => meeting.clientId === clientId)
      .map((meeting) => ({
        id: meeting.id,
        kind: "meeting" as const,
        timestamp: meeting.meetingAt,
        title: meeting.title,
        summary: `${meeting.summary} Next step: ${meeting.nextStep}`,
        badge: meeting.status === "completed" ? "Meeting complete" : meeting.meetingType,
        tone:
          meeting.sentiment === "up"
            ? ("positive" as const)
            : meeting.sentiment === "down"
              ? ("warning" as const)
              : ("neutral" as const),
      })),
    ...actions
      .filter((action) => action.clientId === clientId)
      .map((action) => ({
        id: action.id,
        kind: "action" as const,
        timestamp: action.dueAt ?? new Date().toISOString(),
        title: action.title,
        summary: `${action.ownerName} owns this item. Status: ${action.status.replaceAll("_", " ")}.`,
        badge: `${action.priority} priority`,
        tone:
          action.priority === "high" || action.status === "blocked"
            ? ("warning" as const)
            : ("neutral" as const),
      })),
    ...opportunities
      .filter((opportunity) => opportunity.clientId === clientId)
      .map((opportunity) => ({
        id: opportunity.id,
        kind: "opportunity" as const,
        timestamp: isoOffset(-4),
        title: opportunity.title,
        summary: opportunity.summary,
        badge: `${Math.round(opportunity.confidence * 100)}% confidence`,
        tone: "positive" as const,
      })),
    ...signals
      .filter((signal) => signal.clientId === clientId)
      .map((signal) => ({
        id: signal.id,
        kind: "signal" as const,
        timestamp: signal.recordedAt,
        title: signal.label,
        summary: signal.detail,
        badge: `${signal.severity} signal`,
        tone:
          signal.severity === "high"
            ? ("warning" as const)
            : signal.severity === "medium"
              ? ("neutral" as const)
              : ("positive" as const),
      })),
  ];

  return byNewest(events, (event) => event.timestamp);
}

function finalizeWorkspace(raw: RawWorkspace, source: "supabase" | "setup", sourceMessage: string): WorkspaceSnapshot {
  const now = Date.now();
  const openActions = raw.actions.filter((action) => action.status !== "done");
  const overdueActions = openActions.filter(
    (action) => action.dueAt && new Date(action.dueAt).getTime() < now
  );
  const meetingsNext7Days = raw.meetings.filter((meeting) => {
    const time = new Date(meeting.meetingAt).getTime();
    return time >= now && time <= now + DAY_MS * 7;
  });
  const clientOrder = [...raw.clients].sort((left, right) => left.churnRisk - right.churnRisk);
  const focusClient =
    [...raw.clients].sort((left, right) => right.monthlyValue * right.churnRisk - left.monthlyValue * left.churnRisk)[0] ??
    raw.clients[0] ??
    null;

  const alerts: AppAlert[] = raw.signals
    .filter((signal) => signal.severity !== "low")
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())
    .map((signal) => {
      const client = raw.clients.find((entry) => entry.id === signal.clientId);
      return {
        id: signal.id,
        title: signal.label,
        detail: `${client?.name ?? "Client"}: ${signal.detail}`,
        href: client ? `/clients/${client.slug}/overview` : "/clients",
        tone: signal.severity === "high" ? ("warning" as const) : ("neutral" as const),
        severity: signal.severity,
      };
    })
    .slice(0, 5);

  const recommendations: DashboardInsight[] = [
    ...(focusClient
      ? [
          {
            id: "focus-client",
            title: `Prepare ${focusClient.name} next`,
            detail: focusClient.aiRecommendation,
            href: `/clients/${focusClient.slug}/meeting-brief`,
            tone: focusClient.churnRisk >= 50 ? ("warning" as const) : ("positive" as const),
          },
        ]
      : []),
    ...raw.opportunities.slice(0, 2).map((opportunity) => {
      const client = raw.clients.find((entry) => entry.id === opportunity.clientId);
      return {
        id: opportunity.id,
        title: opportunity.title,
        detail: `${client?.name ?? "Client"} potential value $${opportunity.value.toLocaleString()}. ${opportunity.summary}`,
        href: client ? `/clients/${client.slug}/overview` : "/clients",
        tone: "positive" as const,
      };
    }),
  ];

  return {
    source,
    sourceMessage,
    tenant: raw.tenant,
    clients: clientOrder,
    meetings: [...raw.meetings].sort(
      (left, right) => new Date(right.meetingAt).getTime() - new Date(left.meetingAt).getTime()
    ),
    actions: [...raw.actions].sort(
      (left, right) =>
        new Date(right.dueAt ?? new Date(0).toISOString()).getTime() -
        new Date(left.dueAt ?? new Date(0).toISOString()).getTime()
    ),
    opportunities: [...raw.opportunities].sort((left, right) => right.value - left.value),
    signals: [...raw.signals].sort(
      (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime()
    ),
    docs: [...raw.docs].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    ),
    metrics: {
      totalClients: raw.clients.length,
      healthyClients: raw.clients.filter((client) => client.healthScore >= 75).length,
      attentionClients: raw.clients.filter((client) => client.churnRisk >= 45).length,
      openActions: openActions.length,
      overdueActions: overdueActions.length,
      meetingsNext7Days: meetingsNext7Days.length,
      pipelineValue: raw.opportunities.reduce((sum, item) => sum + item.value, 0),
      avgHealthScore: Math.round(
        raw.clients.reduce((sum, client) => sum + client.healthScore, 0) / Math.max(raw.clients.length, 1)
      ),
    },
    focusClient,
    alerts,
    recommendations,
  };
}

async function querySupabaseWorkspace(): Promise<WorkspaceSnapshot> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? null;

    if (!userId) {
      return buildSetupWorkspace("Sign in to load your live MTOS workspace.");
    }

    const workspaceContext = await getCurrentWorkspaceContext();
    if (!workspaceContext?.tenant.id) {
      return buildSetupWorkspace(
        "No live workspace membership was found for this account yet. Re-authenticate after running the tenant migration.",
        workspaceContext?.tenant
      );
    }

    const tenantId = workspaceContext.tenant.id;

    const clientQuery = supabase
      .from("clients")
      .select(
        "id,name,status,slug,industry,health_score,churn_risk,sentiment_summary,monthly_value,next_meeting_at,last_touch_at,executive_summary,ai_recommendation,updated_at"
      )
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(24);

    const [clientResult, meetingResult, actionResult, opportunityResult, signalResult, docResult] =
      await Promise.all([
        clientQuery,
        supabase
          .from("meetings")
          .select("id,client_id,tenant_id,title,meeting_at,meeting_type,status,sentiment,summary,next_step")
          .eq("tenant_id", tenantId)
          .order("meeting_at", { ascending: false })
          .limit(50),
        supabase
          .from("action_items")
          .select("id,client_id,meeting_id,tenant_id,title,owner_name,due_at,status,priority")
          .eq("tenant_id", tenantId)
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(80),
        supabase
          .from("client_opportunities")
          .select("id,client_id,tenant_id,title,stage,value,confidence,summary")
          .eq("tenant_id", tenantId)
          .order("value", { ascending: false })
          .limit(40),
        supabase
          .from("client_signals")
          .select("id,client_id,tenant_id,label,detail,severity,recorded_at")
          .eq("tenant_id", tenantId)
          .order("recorded_at", { ascending: false })
          .limit(50),
        supabase
          .from("wiki_documents")
          .select("id,client_id,tenant_id,title,category,summary,updated_at")
          .eq("tenant_id", tenantId)
          .order("updated_at", { ascending: false })
          .limit(20),
      ]);

    if (
      clientResult.error ||
      meetingResult.error ||
      actionResult.error ||
      opportunityResult.error ||
      signalResult.error ||
      docResult.error
    ) {
      return buildSetupWorkspace(
        "The live workspace could not be loaded yet. Apply the latest Supabase migrations and refresh.",
        workspaceContext.tenant
      );
    }

    const clients =
      clientResult.data?.map((client) => ({
        id: client.id,
        slug: client.slug ?? client.id,
        name: client.name,
        status: client.status,
        industry: client.industry ?? "Client Success",
        healthScore: client.health_score ?? 70,
        churnRisk: client.churn_risk ?? 25,
        sentimentSummary: client.sentiment_summary ?? "No sentiment summary available yet.",
        monthlyValue: client.monthly_value ?? 0,
        nextMeetingAt: client.next_meeting_at,
        lastTouchAt: client.last_touch_at,
        executiveSummary: client.executive_summary ?? "No strategic summary has been written yet.",
        aiRecommendation:
          client.ai_recommendation ?? "Use the next touchpoint to review KPIs, risks, and client asks.",
      })) ?? [];

    const visibleClientIds = new Set(clients.map((client) => client.id));
    const meetings =
      meetingResult.data
        ?.filter((meeting) => visibleClientIds.has(meeting.client_id))
        .map((meeting) => ({
          id: meeting.id,
          clientId: meeting.client_id,
          title: meeting.title,
          meetingAt: meeting.meeting_at,
          meetingType: meeting.meeting_type,
          status: meeting.status,
          sentiment: meeting.sentiment,
          summary: meeting.summary,
          nextStep: meeting.next_step,
        })) ?? [];
    const actions =
      actionResult.data
        ?.filter((action) => visibleClientIds.has(action.client_id))
        .map((action) => ({
          id: action.id,
          clientId: action.client_id,
          meetingId: action.meeting_id,
          title: action.title,
          ownerName: action.owner_name,
          dueAt: action.due_at,
          status: action.status,
          priority: action.priority,
        })) ?? [];
    const opportunities =
      opportunityResult.data
        ?.filter((opportunity) => visibleClientIds.has(opportunity.client_id))
        .map((opportunity) => ({
          id: opportunity.id,
          clientId: opportunity.client_id,
          title: opportunity.title,
          stage: opportunity.stage,
          value: opportunity.value,
          confidence: opportunity.confidence,
          summary: opportunity.summary,
        })) ?? [];
    const signals =
      signalResult.data
        ?.filter((signal) => visibleClientIds.has(signal.client_id))
        .map((signal) => ({
          id: signal.id,
          clientId: signal.client_id,
          label: signal.label,
          detail: signal.detail,
          severity: signal.severity,
          recordedAt: signal.recorded_at,
        })) ?? [];
    const docs = docResult.data ?? [];

    return finalizeWorkspace(
      {
        tenant: workspaceContext.tenant,
        clients,
        meetings,
        actions,
        opportunities,
        signals,
        docs: docs.map((doc) => ({
          id: doc.id,
          clientId: doc.client_id,
          title: doc.title,
          category: doc.category,
          summary: doc.summary,
          updatedAt: doc.updated_at,
        })),
      },
      "supabase",
      `Live Supabase workspace: ${workspaceContext.tenant.name}`
    );
  } catch {
    return buildSetupWorkspace("Supabase is not configured correctly yet. Update your environment and apply the latest migrations.");
  }
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  return querySupabaseWorkspace();
}

export async function getAppShellData(): Promise<AppShellData> {
  const workspace = await getWorkspaceSnapshot();

  return {
    source: workspace.source,
    sourceMessage: workspace.sourceMessage,
    tenant: workspace.tenant,
    clients: workspace.clients.slice(0, 6).map((client) => ({
      id: client.id,
      name: client.name,
      href: `/clients/${client.slug}/overview`,
      healthScore: client.healthScore,
      churnRisk: client.churnRisk,
    })),
    alerts: workspace.alerts,
  };
}

export async function getClientOverview(clientId: string): Promise<ClientOverview> {
  const workspace = await getWorkspaceSnapshot();
  const client = workspace.clients.find((entry) => entry.id === clientId || entry.slug === clientId) ?? null;

  if (!client) {
    return {
      client: null,
      meetings: [],
      actions: [],
      opportunities: [],
      signals: [],
      timeline: [],
      source: workspace.source,
      sourceMessage: workspace.sourceMessage,
    };
  }

  const meetings = workspace.meetings.filter((meeting) => meeting.clientId === client.id);
  const actions = workspace.actions.filter((action) => action.clientId === client.id);
  const opportunities = workspace.opportunities.filter((opportunity) => opportunity.clientId === client.id);
  const signals = workspace.signals.filter((signal) => signal.clientId === client.id);

  return {
    client,
    meetings,
    actions,
    opportunities,
    signals,
    timeline: buildTimeline(client.id, workspace.meetings, workspace.actions, workspace.opportunities, workspace.signals),
    source: workspace.source,
    sourceMessage: workspace.sourceMessage,
  };
}

export async function getWorkspaceAdminSnapshot(): Promise<WorkspaceAdminSnapshot> {
  const workspace = await getWorkspaceSnapshot();
  const context = await getCurrentWorkspaceContext();

  if (workspace.source === "setup" || !workspace.tenant.id) {
    return {
      currentUserId: context?.userId ?? null,
      tenant: workspace.tenant,
      source: workspace.source,
      sourceMessage: workspace.sourceMessage,
      metrics: workspace.metrics,
      members: [],
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: memberships, error } = await admin
    .from("tenant_memberships")
    .select("user_id, role, created_at")
    .eq("tenant_id", workspace.tenant.id)
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    return {
      currentUserId: context?.userId ?? null,
      tenant: workspace.tenant,
      source: workspace.source,
      sourceMessage: workspace.sourceMessage,
      metrics: workspace.metrics,
      members: [],
    };
  }

  const userIds = memberships.map((membership) => membership.user_id);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, default_tenant_id")
    .in("id", userIds);

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      { email: profile.email, defaultTenantId: profile.default_tenant_id },
    ])
  );

  return {
    currentUserId: context?.userId ?? null,
    tenant: workspace.tenant,
    source: workspace.source,
    sourceMessage: workspace.sourceMessage,
    metrics: workspace.metrics,
    members: memberships.map((membership) => {
      const profile = profilesById.get(membership.user_id);
      return {
        userId: membership.user_id,
        email: profile?.email ?? "Unknown user",
        role: membership.role,
        joinedAt: membership.created_at,
        isDefaultWorkspace: profile?.defaultTenantId === workspace.tenant.id,
      };
    }),
  };
}

export async function buildMeetingBriefContext(clientId: string) {
  const detail = await getClientOverview(clientId);
  if (!detail.client) {
    return null;
  }
  const upcomingMeeting = getUpcomingMeetings(detail.meetings)[0];
  const overdueActions = detail.actions.filter((action) => isActionOverdue(action));

  return {
    client: detail.client,
    upcomingMeeting,
    overdueActions,
    opportunities: detail.opportunities.slice(0, 3),
    signals: detail.signals.slice(0, 4),
    recentMeetings: detail.meetings.slice(0, 3),
  };
}

export async function buildFallbackMeetingBrief(clientId: string): Promise<MeetingBriefPayload> {
  const context = await buildMeetingBriefContext(clientId);
  if (!context) {
    throw new Error("Client not found for meeting brief generation.");
  }
  const highRisk = context.client.churnRisk >= 50 || context.signals.some((signal) => signal.severity === "high");

  return {
    executiveSummary: `${context.client.name} is in ${highRisk ? "an intervention" : "a growth"} mode. ${context.client.executiveSummary}`,
    wins: [
      {
        title: "Strategic clarity improved",
        narrative: `The team now has a clearer view of what matters most for ${context.client.name}, which makes the next meeting easier to anchor around outcomes instead of updates.`,
      },
      {
        title: "Signals are visible",
        narrative: "Recent account signals are consolidated in one place, making it easier to turn client emotion into concrete next steps.",
      },
      {
        title: "Opportunity remains open",
        narrative:
          context.opportunities[0]?.summary ??
          "There is still credible expansion potential once the current operating loop is executed consistently.",
      },
    ],
    challenges: [
      {
        issue: context.signals[0]?.detail ?? "No recent challenge has been explicitly logged.",
        impact: `Current churn risk is ${context.client.churnRisk}%, which puts retention pressure on the account team.`,
        mitigation:
          context.client.aiRecommendation ??
          "Use the next touchpoint to align on one clear owner, one KPI delta, and one follow-up deadline.",
        severity: highRisk ? "high" : "medium",
      },
      {
        issue:
          context.overdueActions[0]?.title ??
          "The follow-up loop is not yet fully closed across recent commitments and next steps.",
        impact:
          context.overdueActions.length > 0
            ? `${context.overdueActions.length} overdue action item(s) are reducing confidence in execution.`
            : "Without a clear recap, positive meeting momentum can decay between calls.",
        mitigation:
          context.upcomingMeeting?.nextStep ??
          "Send a recap immediately after the meeting and confirm owners before the call ends.",
        severity: context.overdueActions.length > 0 ? "high" : "medium",
      },
    ],
    talkingPoints: [
      `Open with the current health score of ${context.client.healthScore} and what moved it.`,
      `Review the top client concern: ${context.signals[0]?.label ?? "account stability"}.`,
      `Confirm who owns the next critical action before the meeting ends.`,
      `Tie recent KPI or sentiment movement back to business outcomes, not channel metrics alone.`,
      `Discuss the best expansion path: ${context.opportunities[0]?.title ?? "deeper retention work"}.`,
    ],
    biQuestion: `What is the single operational change that would make ${context.client.name} feel dramatically more confident in the next 30 days?`,
    upsellOpportunities: context.opportunities.length
      ? context.opportunities.map(
          (opportunity) =>
            `${opportunity.title} - potential value $${opportunity.value.toLocaleString()} with ${Math.round(opportunity.confidence * 100)}% confidence.`
        )
      : [
          "Package a follow-up workflow optimization sprint once the current client confidence gap is closed.",
          "Offer KPI storytelling or executive recap automation to improve perceived strategic value.",
        ],
    meetingMode: highRisk ? "Recovery Call" : context.client.churnRisk <= 25 ? "Expansion Strategy" : "Growth Review",
    confidence: highRisk ? 0.78 : 0.83,
  };
}

export function isActionOverdue(action: ActionItemRecord) {
  return Boolean(
    action.dueAt && action.status !== "done" && new Date(action.dueAt).getTime() < Date.now()
  );
}

export function countOverdueActions(actions: ActionItemRecord[]) {
  return actions.filter((action) => isActionOverdue(action)).length;
}

export function getUpcomingMeetings(meetings: MeetingRecord[]) {
  const now = Date.now();
  return meetings
    .filter((meeting) => new Date(meeting.meetingAt).getTime() >= now && meeting.status !== "completed")
    .sort((left, right) => new Date(left.meetingAt).getTime() - new Date(right.meetingAt).getTime());
}

export function getNextMeetingForClient(meetings: MeetingRecord[], clientId: string) {
  return getUpcomingMeetings(meetings).find((meeting) => meeting.clientId === clientId) ?? null;
}
