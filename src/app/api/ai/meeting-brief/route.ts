import { NextResponse } from "next/server";

type MeetingBriefResponse = {
  executiveSummary: string;
  wins: { title: string; narrative: string }[];
  challenges: { issue: string; impact: string; mitigation: string; severity: "low" | "medium" | "high" }[];
  talkingPoints: string[];
  biQuestion: string;
  upsellOpportunities: string[];
  meetingMode: "Growth Review" | "Recovery Call" | "Expansion Strategy" | "Retention Save";
  confidence: number;
};

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

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

  const prompt = `Generate an AI meeting brief for clientId="${clientId}".
Return JSON only with:
- executiveSummary (string)
- wins: exactly 3 items, each {title, narrative} (emotionally framed, business-oriented)
- challenges: exactly 2 items, each {issue, impact, mitigation, severity: low|medium|high}
- talkingPoints: 5-8 strings
- biQuestion: 1 string
- upsellOpportunities: 2-4 strings
- meetingMode: one of "Growth Review" | "Recovery Call" | "Expansion Strategy" | "Retention Save"
- confidence: number 0-1
Keep it concise, specific, and non-generic.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate meeting briefs for client success teams. Output must be valid JSON and must not include markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "OpenAI request failed.", status: res.status, details: text },
      { status: 500 }
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "OpenAI response missing content." },
      { status: 500 }
    );
  }

  let parsed: MeetingBriefResponse;
  try {
    parsed = JSON.parse(content) as MeetingBriefResponse;
  } catch {
    return NextResponse.json(
      { error: "OpenAI returned non-JSON content." },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed);
}

