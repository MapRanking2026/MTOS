import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;

  return NextResponse.json(
    {
      provider,
      error: "Not implemented",
      next:
        "Implement OAuth start flow for this provider (create state/PKCE, redirect to provider auth URL).",
    },
    { status: 501 }
  );
}

