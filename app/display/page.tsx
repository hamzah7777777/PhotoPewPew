"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEvent } from "@/lib/useEvent";
import { CLUB } from "@/lib/club";

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

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-white p-10 text-center">
      <div>
        <p className="text-lg font-semibold tracking-tight text-blue-900">
          {CLUB.name}
        </p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">
          {event.name}
        </p>
      </div>

      {joinUrl && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
          <QRCodeSVG value={joinUrl} size={360} />
        </div>
      )}

      <p className="text-2xl font-medium text-neutral-700">
        Scan to join our mailing list
      </p>
    </main>
  );
}
