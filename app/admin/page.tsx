"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { makeSlug } from "@/lib/slug";
import { compressAndUploadPhoto } from "@/lib/upload";
import { Button, Card, ErrorText, FieldLabel, Input, Logo } from "@/components/ui";

const ADMIN_EMAIL = "hamzah77@outlook.com";

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

type ShootRow = {
  id: string;
  slug: string;
  client_name: string;
  passcode: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) return null;
  return session ? <AdminDashboard /> : <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setSubmitting(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-1 flex flex-col items-center gap-2 text-center">
            <Logo />
            <p className="text-sm text-neutral-500">Sign in to manage shoots</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

function AdminDashboard() {
  const [shoots, setShoots] = useState<ShootRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null);

  async function loadShoots() {
    const { data } = await supabase
      .from("shoots")
      .select("id, slug, client_name, passcode")
      .order("created_at", { ascending: false });
    setShoots(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadShoots();
  }, []);

  const selectedShoot = shoots.find((s) => s.id === selectedShootId) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      <CreateShootForm onCreated={loadShoots} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">
          Shoots
        </h2>
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : shoots.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No shoots yet — create one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shoots.map((s) => (
              <li key={s.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {s.client_name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        Passcode: <span className="font-mono">{s.passcode}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyLinkButton slug={s.slug} />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setSelectedShootId(
                            selectedShootId === s.id ? null : s.id,
                          )
                        }
                      >
                        {selectedShootId === s.id ? "Close" : "Upload photos"}
                      </Button>
                    </div>
                  </div>
                  {selectedShoot?.id === s.id && (
                    <UploadPanel shootId={s.id} />
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/gallery/?slug=${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

function CreateShootForm({ onCreated }: { onCreated: () => void }) {
  const [clientName, setClientName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("shoots").insert({
      slug: makeSlug(clientName),
      client_name: clientName,
      passcode,
      admin_email: ADMIN_EMAIL,
    });
    if (error) {
      setError(error.message);
    } else {
      setClientName("");
      setPasscode("");
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="font-medium text-neutral-900">New shoot</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Client name</FieldLabel>
            <Input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Passcode for client</FieldLabel>
            <div className="flex gap-2">
              <Input
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasscode(generatePin())}
              >
                Generate PIN
              </Button>
            </div>
          </div>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? "Creating..." : "Create shoot"}
        </Button>
      </form>
    </Card>
  );
}

function UploadPanel({ shootId }: { shootId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      await compressAndUploadPhoto(shootId, i, files[i]);
    }
    setStatus(`Uploaded ${files.length} photo(s).`);
    e.target.value = "";
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 transition hover:bg-neutral-100">
        <span>Click to choose photos to upload</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </label>
      {status && <p className="mt-2 text-sm text-neutral-500">{status}</p>}
    </div>
  );
}
