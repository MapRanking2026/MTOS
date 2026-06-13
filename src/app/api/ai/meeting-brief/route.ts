import { NextResponse } from "next/server";
import { buildFallbackMeetingBrief, buildMeetingBriefContext } from "@/lib/mtos-data";
import type { MeetingBriefPayload } from "@/lib/mtos-types";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clientId =
    typeof body === "object" && body !== null && "clientId" in body
      ? String((body as { clientId: unknown }).clientId ?? "")
      : "";

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const context = await buildMeetingBriefContext(clientId);
  if (!context) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

  if (!apiKey) {
    return NextResponse.json(await buildFallbackMeetingBrief(clientId));
  }

  const prompt = `Generate an MTOS monthly-touch meeting brief for this client context.
Return JSON only with:
- executiveSummary (string)
- wins: exactly 3 items, each {title, narrative}
- challenges: exactly 2 items, each {issue, impact, mitigation, severity: low|medium|high}
- talkingPoints: 5-8 strings
- biQuestion: 1 string
- upsellOpportunities: 2-4 strings
- meetingMode: one of "Growth Review" | "Recovery Call" | "Expansion Strategy" | "Retention Save"
- confidence: number 0-1

Client context:
${JSON.stringify(context, null, 2)}

Rules:
- Ground every statement in the provided context.
- Prefer client-success language over generic marketing language.
- Make mitigation concrete and operational.
- Do not mention missing fields or data gaps.
- Output valid JSON only.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        temperature: 0.3,
        system:
          "You generate meeting briefs for client success teams. Output must be valid JSON and must not include markdown.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(await buildFallbackMeetingBrief(clientId));
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const content = data.content?.find((block) => block.type === "text")?.text;
    if (!content) {
      return NextResponse.json(await buildFallbackMeetingBrief(clientId));
    }

    const parsed = JSON.parse(content) as MeetingBriefPayload;
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(await buildFallbackMeetingBrief(clientId));
  }
}
