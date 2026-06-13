export type DataSource = "supabase" | "setup";
export type WorkspaceMembershipRole = "super_admin" | "admin" | "account_manager" | "client";

export type ClientStatus = "active" | "paused" | "canceled";
export type MeetingStatus = "scheduled" | "completed" | "at_risk";
export type ActionStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high";
export type SignalSeverity = "low" | "medium" | "high";
export type OpportunityStage = "qualified" | "proposal" | "won" | "nurture";
export type TimelineKind = "meeting" | "action" | "signal" | "opportunity" | "note";

export type ClientRecord = {
  id: string;
  slug: string;
  name: string;
  status: ClientStatus;
  industry: string;
  healthScore: number;
  churnRisk: number;
  sentimentSummary: string;
  monthlyValue: number;
  nextMeetingAt: string | null;
  lastTouchAt: string | null;
  executiveSummary: string;
  aiRecommendation: string;
};

export type MeetingRecord = {
  id: string;
  clientId: string;
  title: string;
  meetingAt: string;
  meetingType: string;
  status: MeetingStatus;
  sentiment: "up" | "steady" | "down";
  summary: string;
  nextStep: string;
};

export type ActionItemRecord = {
  id: string;
  clientId: string;
  meetingId: string | null;
  title: string;
  ownerName: string;
  dueAt: string | null;
  status: ActionStatus;
  priority: Priority;
};

export type OpportunityRecord = {
  id: string;
  clientId: string;
  title: string;
  stage: OpportunityStage;
  value: number;
  confidence: number;
  summary: string;
};

export type SignalRecord = {
  id: string;
  clientId: string;
  label: string;
  detail: string;
  severity: SignalSeverity;
  recordedAt: string;
};

export type WikiDocumentRecord = {
  id: string;
  clientId: string | null;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  timestamp: string;
  title: string;
  summary: string;
  badge: string;
  tone: "positive" | "warning" | "neutral";
};

export type ClientOverview = {
  client: ClientRecord | null;
  meetings: MeetingRecord[];
  actions: ActionItemRecord[];
  opportunities: OpportunityRecord[];
  signals: SignalRecord[];
  timeline: TimelineEvent[];
  source: DataSource;
  sourceMessage: string;
};

export type DashboardInsight = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "positive" | "warning" | "neutral";
};

export type AppAlert = DashboardInsight & {
  severity: SignalSeverity;
};

export type WorkspaceMetrics = {
  totalClients: number;
  healthyClients: number;
  attentionClients: number;
  openActions: number;
  overdueActions: number;
  meetingsNext7Days: number;
  pipelineValue: number;
  avgHealthScore: number;
};

export type WorkspaceTenant = {
  id: string | null;
  name: string;
  slug: string;
  membershipRole: WorkspaceMembershipRole;
  platformRole: WorkspaceMembershipRole;
  canManage: boolean;
};

export type WorkspaceSnapshot = {
  source: DataSource;
  sourceMessage: string;
  tenant: WorkspaceTenant;
  clients: ClientRecord[];
  meetings: MeetingRecord[];
  actions: ActionItemRecord[];
  opportunities: OpportunityRecord[];
  signals: SignalRecord[];
  docs: WikiDocumentRecord[];
  metrics: WorkspaceMetrics;
  focusClient: ClientRecord | null;
  alerts: AppAlert[];
  recommendations: DashboardInsight[];
};

export type AppShellData = {
  source: DataSource;
  sourceMessage: string;
  tenant: WorkspaceTenant;
  clients: Array<{
    id: string;
    name: string;
    href: string;
    healthScore: number;
    churnRisk: number;
  }>;
  alerts: AppAlert[];
};

export type WorkspaceMemberRecord = {
  userId: string;
  email: string;
  role: WorkspaceMembershipRole;
  joinedAt: string;
  isDefaultWorkspace: boolean;
};

export type WorkspaceAdminSnapshot = {
  currentUserId: string | null;
  tenant: WorkspaceTenant;
  source: DataSource;
  sourceMessage: string;
  metrics: WorkspaceMetrics;
  members: WorkspaceMemberRecord[];
};

export type MeetingBriefPayload = {
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
