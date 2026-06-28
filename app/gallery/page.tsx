"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { publicPhotoUrl } from "@/lib/upload";
import { useUnlockedShoot } from "@/lib/useUnlockedShoot";
import { PasscodeForm } from "@/components/PasscodeForm";
import { Logo } from "@/components/ui";
import type { UnlockedShoot } from "@/lib/types";

export default function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <GalleryContent />
    </Suspense>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const { data, checkedCache, onUnlocked } = useUnlockedShoot(slug);

  if (!slug) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-neutral-500">
          Missing gallery link. Check the link your photographer sent you.
        </p>
      </main>
    );
  }

  if (!checkedCache) return null;

  if (!data) {
    return <PasscodeForm slug={slug} onUnlocked={onUnlocked} />;
  }

  return <PhotoGrid data={data} />;
}

function PhotoGrid({ data }: { data: UnlockedShoot }) {
  const favoriteCount = data.photos.filter((p) => p.edit?.is_favorite).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <div>
          <Logo />
          <p className="mt-1 text-sm text-neutral-500">
            {data.shoot.client_name}
            {favoriteCount > 0 &&
              ` · ${favoriteCount} favorite${favoriteCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {data.photos.map((photo) => (
          <Link
            key={photo.id}
            href={`/gallery/edit/?slug=${data.shoot.slug}&photo=${photo.id}`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
          >
            <img
              src={publicPhotoUrl(photo.storage_path)}
              alt={photo.original_filename}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            {photo.edit?.is_favorite && (
              <span className="absolute right-2 top-2 text-lg text-amber-400 drop-shadow">
                ★
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
