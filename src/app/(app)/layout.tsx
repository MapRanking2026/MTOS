import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getAppShellData } from "@/lib/mtos-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const shellData = await getAppShellData();

  return <AppShell data={shellData}>{children}</AppShell>;
}
