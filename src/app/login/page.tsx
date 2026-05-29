import { LoginClient } from "@/app/login/login-client";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string | string[] };
}) {
  const nextParam = typeof searchParams?.next === "string" ? searchParams.next : "/dashboard";
  return <LoginClient next={nextParam} />;
}
