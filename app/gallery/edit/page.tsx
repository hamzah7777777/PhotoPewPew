"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cropper, { Area } from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { publicPhotoUrl } from "@/lib/upload";
import { useUnlockedShoot, setCachedUnlock } from "@/lib/useUnlockedShoot";
import { PasscodeForm } from "@/components/PasscodeForm";
import { DEFAULT_EDIT } from "@/lib/types";
import type { Photo, UnlockedShoot } from "@/lib/types";
import { Button } from "@/components/ui";

export default function EditPage() {
  return (
    <Suspense fallback={null}>
      <EditContent />
    </Suspense>
  );
}

function EditContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const photoId = searchParams.get("photo") ?? "";
  const { data, checkedCache, onUnlocked } = useUnlockedShoot(slug);

  if (!slug || !photoId) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-neutral-500">Missing gallery link.</p>
      </main>
    );
  }

  if (!checkedCache) return null;

  if (!data) {
    return <PasscodeForm slug={slug} onUnlocked={onUnlocked} />;
  }

  const photo = data.photos.find((p) => p.id === photoId);
  if (!photo) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-neutral-500">Photo not found.</p>
      </main>
    );
  }

  return <PhotoView data={data} photoId={photoId} />;
}

function PhotoView({ data, photoId }: { data: UnlockedShoot; photoId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "crop">("view");

  const photo = data.photos.find((p) => p.id === photoId)!;
  const index = data.photos.findIndex((p) => p.id === photoId);
  const prevPhoto: Photo | undefined = data.photos[index - 1];
  const nextPhoto: Photo | undefined = data.photos[index + 1];

  function goTo(target: Photo | undefined) {
    if (!target) return;
    setMode("view");
    router.replace(`/gallery/edit/?slug=${data.shoot.slug}&photo=${target.id}`);
  }

  useEffect(() => {
    if (mode !== "view") return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(prevPhoto);
      if (e.key === "ArrowRight") goTo(nextPhoto);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, prevPhoto, nextPhoto]);

  const [isFavorite, setIsFavorite] = useState(photo.edit?.is_favorite ?? false);

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    const edit = { ...(photo.edit ?? DEFAULT_EDIT), is_favorite: next };
    await supabase
      .from("photo_edits")
      .upsert({ photo_id: photo.id, ...edit }, { onConflict: "photo_id" });
    const updatedPhotos = data.photos.map((p) =>
      p.id === photo.id ? { ...p, edit } : p,
    );
    setCachedUnlock(data.shoot.slug, { ...data, photos: updatedPhotos });
  }

  const mailtoHref = `mailto:${encodeURIComponent(
    data.shoot.admin_email,
  )}?subject=${encodeURIComponent(
    `Full-res request: ${data.shoot.client_name}`,
  )}&body=${encodeURIComponent(
    `Hi, could I get the full resolution version of "${photo.original_filename}" from my shoot? (slug: ${data.shoot.slug})`,
  )}`;

  if (mode === "crop") {
    return (
      <CropEditor
        data={data}
        photo={photo}
        isFavorite={isFavorite}
        onFavoriteChange={setIsFavorite}
        onDone={() => setMode("view")}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-neutral-950 p-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/gallery/?slug=${data.shoot.slug}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to gallery
        </Link>
        <button
          onClick={toggleFavorite}
          className="text-2xl text-amber-400 transition hover:scale-110"
          aria-label="Toggle favorite"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
        <img
          src={publicPhotoUrl(photo.storage_path)}
          alt={photo.original_filename}
          className="h-full w-full object-contain"
        />
        {prevPhoto && (
          <button
            onClick={() => goTo(prevPhoto)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-xl text-white transition hover:bg-black/60"
          >
            ‹
          </button>
        )}
        {nextPhoto && (
          <button
            onClick={() => goTo(nextPhoto)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-xl text-white transition hover:bg-black/60"
          >
            ›
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-900 p-3">
        <span className="text-sm text-neutral-400">
          {index + 1} of {data.photos.length}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={mailtoHref}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Request full-res
          </a>
          <Button onClick={() => setMode("crop")}>Edit / Crop</Button>
        </div>
      </div>
    </main>
  );
}

function CropEditor({
  data,
  photo,
  isFavorite,
  onFavoriteChange,
  onDone,
}: {
  data: UnlockedShoot;
  photo: Photo;
  isFavorite: boolean;
  onFavoriteChange: (value: boolean) => void;
  onDone: () => void;
}) {
  const existingEdit = photo.edit ?? DEFAULT_EDIT;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(existingEdit.rotation);
  const [croppedArea, setCroppedArea] = useState<Area>({
    x: existingEdit.crop_x * 100,
    y: existingEdit.crop_y * 100,
    width: existingEdit.crop_w * 100,
    height: existingEdit.crop_h * 100,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const newEdit = {
      crop_x: croppedArea.x / 100,
      crop_y: croppedArea.y / 100,
      crop_w: croppedArea.width / 100,
      crop_h: croppedArea.height / 100,
      rotation,
      is_favorite: isFavorite,
    };
    const { error } = await supabase
      .from("photo_edits")
      .upsert({ photo_id: photo.id, ...newEdit }, { onConflict: "photo_id" });
    setSaving(false);
    if (error) return;
    const updatedPhotos = data.photos.map((p) =>
      p.id === photo.id ? { ...p, edit: newEdit } : p,
    );
    setCachedUnlock(data.shoot.slug, { ...data, photos: updatedPhotos });
    onDone();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-neutral-950 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onDone}
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Cancel
        </button>
        <button
          onClick={() => onFavoriteChange(!isFavorite)}
          className="text-2xl text-amber-400 transition hover:scale-110"
          aria-label="Toggle favorite"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div className="relative h-[60vh] w-full overflow-hidden rounded-xl bg-neutral-900">
        <Cropper
          image={publicPhotoUrl(photo.storage_path)}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_croppedArea, areaPixels) =>
            setCroppedArea(areaPixels)
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-900 p-3">
        <Button
          variant="secondary"
          className="border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          ⟳ Rotate
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </main>
  );
}
