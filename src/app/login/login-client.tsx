"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginClient({ next }: { next: string }) {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function signInGoogle() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch {
      toast.error("Google sign-in failed.");
      setLoading(false);
    }
  }

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      toast.success("Magic link sent. Check your inbox.");
    } catch (e) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message ?? "")
          : "";
      toast.error(msg ? `Email sign-in failed: ${msg}` : "Email sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-3">
      <Card className="w-full max-w-md rounded-3xl border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center gap-2 pb-3 text-center">
          <div className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Monthly Touch O.S.
          </div>
          <div className="flex items-center justify-center gap-2 text-xs tracking-wide text-muted-foreground">
            <span>powered by</span>
            <span className="origin-left scale-[1.35]">
              <BrandMark />
            </span>
          </div>
        </div>
        <div className="text-lg font-semibold tracking-tight">Sign in</div>
        <div className="mt-1 text-sm text-muted-foreground">Use Google or a magic link to access Monthly Touch OS.</div>

        <div className="mt-5 grid gap-2">
          <Button className="rounded-xl" onClick={signInGoogle} disabled={loading}>
            Continue with Google
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={signOut} disabled={loading}>
            Sign out
          </Button>
        </div>

        <Separator className="my-5 bg-border/60" />

        <form onSubmit={signInEmail} className="grid gap-2">
          <div className="text-sm font-medium">Email</div>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="h-10 rounded-xl bg-muted/30 ring-1 ring-border/60"
            type="email"
            autoComplete="email"
          />
          <Button type="submit" className="rounded-xl" disabled={loading || !email}>
            Send magic link
          </Button>
        </form>
      </Card>
    </div>
  );
}

