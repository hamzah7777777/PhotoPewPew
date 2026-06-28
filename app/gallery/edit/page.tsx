"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Cropper, { Area } from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { publicPhotoUrl } from "@/lib/upload";
import { useUnlockedShoot, setCachedUnlock } from "@/lib/useUnlockedShoot";
import { PasscodeForm } from "@/components/PasscodeForm";
import { DEFAULT_EDIT } from "@/lib/types";
import type { UnlockedShoot } from "@/lib/types";
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

  return <Editor data={data} photoId={photoId} />;
}

function Editor({
  data,
  photoId,
}: {
  data: UnlockedShoot;
  photoId: string;
}) {
  const photo = data.photos.find((p) => p.id === photoId)!;
  const existingEdit = photo.edit ?? DEFAULT_EDIT;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(existingEdit.rotation);
  const [isFavorite, setIsFavorite] = useState(existingEdit.is_favorite);
  const [croppedArea, setCroppedArea] = useState<Area>({
    x: existingEdit.crop_x * 100,
    y: existingEdit.crop_y * 100,
    width: existingEdit.crop_w * 100,
    height: existingEdit.crop_h * 100,
  });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);
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
      .upsert({ photo_id: photoId, ...newEdit }, { onConflict: "photo_id" });
    setSaving(false);
    if (error) {
      setSavedMessage("Could not save, please try again.");
      return;
    }
    setSavedMessage("Saved");
    const updatedPhotos = data.photos.map((p) =>
      p.id === photoId ? { ...p, edit: newEdit } : p,
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
          onClick={() => setIsFavorite((f) => !f)}
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
        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-sm text-neutral-400">{savedMessage}</span>
          )}
          <a
            href={mailtoHref}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Request full-res
          </a>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </main>
  );
}
