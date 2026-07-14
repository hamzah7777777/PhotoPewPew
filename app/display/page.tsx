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

  return (
    <main
      className={`flex flex-1 flex-col items-center justify-center gap-10 p-10 text-center ${theme.page}`}
    >
      <div>
        <p
          className={`text-4xl font-semibold tracking-tight ${theme.title}`}
        >
          {event.name}
        </p>
        {event.subtitle && (
          <p className={`mt-2 text-xl ${theme.subtitle}`}>{event.subtitle}</p>
        )}
      </div>

      {joinUrl && (
        <div className={`rounded-2xl p-6 ${theme.qrCard}`}>
          <QRCodeSVG
            value={joinUrl}
            size={360}
            fgColor={theme.qrFg}
            bgColor={theme.qrBg}
          />
        </div>
      )}

      {event.subtext && (
        <p className={`text-2xl font-medium ${theme.subtext}`}>
          {event.subtext}
        </p>
      )}
    </main>
  );
}
