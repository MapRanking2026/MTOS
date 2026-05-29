import { MeetingBriefClient } from "@/components/meeting/meeting-brief-client";

export default async function MeetingBriefPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return <MeetingBriefClient clientId={clientId} />;
}
