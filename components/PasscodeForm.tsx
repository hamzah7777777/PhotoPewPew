"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UnlockedShoot } from "@/lib/types";
import { Button, Card, ErrorText, FieldLabel, Input, Logo } from "@/components/ui";

export function PasscodeForm({
  slug,
  onUnlocked,
}: {
  slug: string;
  onUnlocked: (data: UnlockedShoot) => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.rpc("unlock_shoot", {
      p_slug: slug,
      p_passcode: passcode,
    });
    setSubmitting(false);
    if (error || !data) {
      setError("Incorrect passcode. Please try again.");
      return;
    }
    onUnlocked(data as UnlockedShoot);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-1 flex flex-col items-center gap-2 text-center">
            <Logo />
            <p className="text-sm text-neutral-500">
              Enter the passcode your photographer sent you
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Passcode</FieldLabel>
            <Input
              required
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Checking..." : "View gallery"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
