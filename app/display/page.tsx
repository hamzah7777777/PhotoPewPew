"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEvent } from "@/lib/useEvent";
import { getTheme } from "@/lib/themes";
import { SITE_NAME } from "@/lib/site";
import type { Event } from "@/lib/types";

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayContent />
    </Suspense>
  );
}

function DisplayContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("event") ?? "";
  const event = useEvent(slug);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/?event=${slug}`);
  }, [slug]);

  if (event === undefined) return null;

  if (event === null) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-950 p-8">
        <p className="text-sm text-neutral-400">Event not found.</p>
      </main>
    );
  }

  const theme = getTheme(event.theme);
  const hasBackground = Boolean(event.background_url);

  if (theme.id === "social") {
    return <SocialPost event={event} joinUrl={joinUrl} />;
  }

  return (
    <main
      className={`flex flex-1 flex-col items-center justify-center gap-10 p-10 text-center ${
        hasBackground ? "bg-neutral-950" : theme.page
      }`}
      style={
        hasBackground
          ? {
              backgroundImage: `url(${event.background_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div>
        <p
          className={`text-4xl font-semibold tracking-tight ${
            hasBackground
              ? "text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.8)]"
              : theme.title
          }`}
        >
          {event.name}
        </p>
        {event.subtitle && (
          <p
            className={`mt-2 text-xl ${
              hasBackground
                ? "text-white/90 [text-shadow:0_1px_10px_rgb(0_0_0/0.8)]"
                : theme.subtitle
            }`}
          >
            {event.subtitle}
          </p>
        )}
      </div>

      {joinUrl && (
        <div
          className={`rounded-2xl p-6 ${
            hasBackground ? "bg-white shadow-2xl" : theme.qrCard
          }`}
        >
          <QRCodeSVG
            value={joinUrl}
            size={360}
            fgColor={theme.qrFg}
            bgColor={theme.qrBg}
          />
        </div>
      )}

      {event.subtext && (
        <p
          className={`text-2xl font-medium ${
            hasBackground
              ? "text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.8)]"
              : theme.subtext
          }`}
        >
          {event.subtext}
        </p>
      )}
    </main>
  );
}

// The display page styled as a social-media post: the QR code is the
// "photo", with a handle header, action row, and caption around it.
function SocialPost({ event, joinUrl }: { event: Event; joinUrl: string }) {
  // Poster's name falls back to a handle derived from the site name.
  const handle =
    event.poster_name.trim() ||
    SITE_NAME.toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const initials = (event.poster_name.trim() || SITE_NAME)
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const location = event.location.trim() || event.subtitle;
  const likesLine =
    event.likes > 0
      ? `${event.likes.toLocaleString()} ${event.likes === 1 ? "like" : "likes"}`
      : "Liked by attendees and others";

  return (
    <main className="flex flex-1 items-center justify-center bg-[#fafafa] p-6">
      <div className="w-full max-w-[430px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-[2px]">
            <div className="rounded-full bg-white p-[2px]">
              {event.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {handle}
            </p>
            {location && (
              <p className="truncate text-xs text-neutral-500">{location}</p>
            )}
          </div>
          <Icon label="More options">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
          </Icon>
        </div>

        <div className="flex aspect-square items-center justify-center border-y border-neutral-100 bg-white">
          {joinUrl && (
            <QRCodeSVG value={joinUrl} size={300} fgColor="#171717" bgColor="#ffffff" />
          )}
        </div>

        <div className="flex items-center gap-4 px-4 pt-3 text-neutral-900">
          <Icon label="Like">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </Icon>
          <Icon label="Comment">
            <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z" />
          </Icon>
          <Icon label="Share">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7z" />
          </Icon>
          <span className="flex-1" />
          <Icon label="Save">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Icon>
        </div>

        <div className="flex flex-col gap-1 px-4 pb-4 pt-2 text-sm">
          <p className="font-semibold text-neutral-900">{likesLine}</p>
          <p className="text-neutral-900">
            <span className="font-semibold">{handle}</span>{" "}
            <span className="font-semibold">{event.name}</span>
          </p>
          {event.subtext && <p className="text-neutral-700">{event.subtext}</p>}
          <p className="pt-1 text-[10px] uppercase tracking-wide text-neutral-400">
            Just now
          </p>
        </div>
      </div>
    </main>
  );
}

function Icon({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
