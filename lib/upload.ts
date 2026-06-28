import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

export async function compressAndUploadPhoto(
  shootId: string,
  sortOrder: number,
  file: File,
) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.25,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  const dimensions = await getDimensions(compressed);
  const id = crypto.randomUUID();
  const storagePath = `${shootId}/${id}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("shoot-photos")
    .upload(storagePath, compressed, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("photos").insert({
    id,
    shoot_id: shootId,
    storage_path: storagePath,
    width: dimensions.width,
    height: dimensions.height,
    sort_order: sortOrder,
    original_filename: file.name,
  });
  if (insertError) throw insertError;
}

function getDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function publicPhotoUrl(storagePath: string): string {
  return supabase.storage.from("shoot-photos").getPublicUrl(storagePath).data
    .publicUrl;
}
