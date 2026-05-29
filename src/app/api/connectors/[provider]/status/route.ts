import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;

  return NextResponse.json({
    provider,
    connected: false,
    message:
      "Connector routes are scaffolded. Configure provider credentials and implement OAuth/API adapters to enable real status checks.",
  });
}

