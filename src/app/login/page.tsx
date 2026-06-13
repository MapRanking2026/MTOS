import { LoginClient } from "@/app/login/login-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextParam = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/dashboard";
  const code = typeof resolvedSearchParams?.code === "string" ? resolvedSearchParams.code : null;
  const tokenHash = typeof resolvedSearchParams?.token_hash === "string" ? resolvedSearchParams.token_hash : null;
  const type = typeof resolvedSearchParams?.type === "string" ? resolvedSearchParams.type : null;

  if (code || (tokenHash && type)) {
    const qs = new URLSearchParams();
    if (code) qs.set("code", code);
    if (tokenHash) qs.set("token_hash", tokenHash);
    if (type) qs.set("type", type);
    qs.set("next", nextParam);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  return <LoginClient next={nextParam} />;
}
