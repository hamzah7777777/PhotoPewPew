"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { makeSlug } from "@/lib/slug";
import { downloadTextFile } from "@/lib/download";
import { THEMES, type ThemeId } from "@/lib/themes";
import { compressImage } from "@/lib/image";
import {
  Brand,
  Button,
  Card,
  ErrorText,
  FieldLabel,
  Input,
} from "@/components/ui";

type EventRow = {
  id: string;
  slug: string;
  name: string;
  background_url: string;
  avatar_url: string;
  created_at: string;
};

const BACKGROUNDS_BUCKET = "event-backgrounds";
const MAX_BACKGROUND_BYTES = 5 * 1024 * 1024;
const ALLOWED_BACKGROUND_TYPES = ["image/png", "image/jpeg"];

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
            <Brand />
            <p className="text-sm text-neutral-500">Sign in to manage events</p>
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
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("id, slug, name, background_url, avatar_url, created_at")
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setEvents(list);
    setLoading(false);

    const entries = await Promise.all(
      list.map(async (event) => {
        const { count } = await supabase
          .from("signups")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        return [event.id, count ?? 0] as const;
      }),
    );
    setCounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <Brand />
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      <CreateEventForm onCreated={loadEvents} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Events</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No events yet — create one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  count={counts[event.id] ?? 0}
                  onDeleted={loadEvents}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

const DEFAULT_SUBTEXT = "Scan to join our mailing list";

// Compress an image and upload it to the backgrounds bucket, returning its
// public URL. Throws on failure so the caller can surface an error.
async function uploadImage(file: File, prefix: string): Promise<string> {
  const upload = await compressImage(file, MAX_BACKGROUND_BYTES);
  const ext = upload.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BACKGROUNDS_BUCKET)
    .upload(path, upload);
  if (error) throw new Error(error.message);
  return supabase.storage.from(BACKGROUNDS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [subtext, setSubtext] = useState(DEFAULT_SUBTEXT);
  const [theme, setTheme] = useState<ThemeId>("classic");
  const [background, setBackground] = useState<File | null>(null);
  const [posterName, setPosterName] = useState("");
  const [location, setLocation] = useState("");
  const [likes, setLikes] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSocial = theme === "social";

  function resetForm() {
    setName("");
    setSubtitle("");
    setSubtext(DEFAULT_SUBTEXT);
    setTheme("classic");
    setBackground(null);
    setPosterName("");
    setLocation("");
    setLikes("");
    setAvatar(null);
    setFileInputKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const slug = makeSlug(name);
    let background_url = "";
    let avatar_url = "";
    try {
      if (background) {
        background_url = await uploadImage(background, `bg-${slug}`);
      }
      if (isSocial && avatar) {
        avatar_url = await uploadImage(avatar, `avatar-${slug}`);
      }
    } catch (err) {
      setError(
        `Could not upload image: ${
          err instanceof Error ? err.message : "please try a different file."
        }`,
      );
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("events").insert({
      slug,
      name,
      subtitle: subtitle.trim(),
      subtext: subtext.trim(),
      theme,
      background_url,
      poster_name: posterName.trim(),
      location: location.trim(),
      likes: Math.max(0, Math.floor(Number(likes) || 0)),
      avatar_url,
    });
    if (error) {
      setError(error.message);
    } else {
      resetForm();
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="font-medium text-neutral-900">New QR code</h2>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Title</FieldLabel>
          <Input
            placeholder="e.g. 9 July 2026 Meeting"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Subtitle (optional)</FieldLabel>
          <Input
            placeholder="e.g. Guest open evening"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Sub text (optional, shown under the QR code)</FieldLabel>
          <Input
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>
            Background image (optional PNG or JPG, shown behind the QR code)
          </FieldLabel>
          <Input
            key={fileInputKey}
            type="file"
            accept="image/png,image/jpeg"
            className="file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neutral-700"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && !ALLOWED_BACKGROUND_TYPES.includes(file.type)) {
                setError("Background image must be a PNG or JPG file.");
                setBackground(null);
                setFileInputKey((k) => k + 1);
                return;
              }
              setError(null);
              setBackground(file);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Theme</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  theme === option.id
                    ? "border-neutral-900 ring-2 ring-neutral-200"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full border border-neutral-300 ${option.swatch}`}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isSocial && (
          <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">Post details</p>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Profile photo (optional PNG or JPG)</FieldLabel>
              <Input
                key={`avatar-${fileInputKey}`}
                type="file"
                accept="image/png,image/jpeg"
                className="file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neutral-700"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && !ALLOWED_BACKGROUND_TYPES.includes(file.type)) {
                    setError("Profile photo must be a PNG or JPG file.");
                    setAvatar(null);
                    setFileInputKey((k) => k + 1);
                    return;
                  }
                  setError(null);
                  setAvatar(file);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Poster&apos;s name</FieldLabel>
              <Input
                placeholder="e.g. hsbc_irl"
                value={posterName}
                onChange={(e) => setPosterName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Location</FieldLabel>
              <Input
                placeholder="e.g. 8 Canada Square, London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Number of likes</FieldLabel>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 142"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? "Creating..." : "Create QR code"}
        </Button>
      </form>
    </Card>
  );
}

function EventCard({
  event,
  count,
  onDeleted,
}: {
  event: EventRow;
  count: number;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleCopyLink() {
    const url = `${window.location.origin}/join/?event=${event.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleExport() {
    setExporting(true);
    const { data, error } = await supabase
      .from("signups")
      .select("email")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setExporting(false);
    if (error || !data) {
      window.alert("Could not export emails, please try again.");
      return;
    }
    downloadTextFile(
      `${event.slug}-emails.txt`,
      data.map((row) => row.email),
    );
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete the event "${event.name}"? This removes its QR link and all ${count} collected email(s) permanently.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      window.alert("Could not delete event, please try again.");
      setDeleting(false);
      return;
    }
    // Best-effort cleanup of any uploaded images (background + avatar).
    const marker = `/${BACKGROUNDS_BUCKET}/`;
    const paths = [event.background_url, event.avatar_url]
      .map((url) => {
        const i = url.indexOf(marker);
        return i === -1 ? null : url.slice(i + marker.length);
      })
      .filter((path): path is string => path !== null);
    if (paths.length > 0) {
      await supabase.storage.from(BACKGROUNDS_BUCKET).remove(paths);
    }
    onDeleted();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">{event.name}</p>
          <p className="text-sm text-neutral-500">
            {count} signup{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/display/?event=${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary">Display QR</Button>
          </a>
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy join link"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export emails (.txt)"}
          </Button>
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
