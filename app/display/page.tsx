"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEvent } from "@/lib/useEvent";
import { getTheme } from "@/lib/themes";

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
