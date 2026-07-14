// Client-side compression for uploaded background images: files over the
// size limit are re-encoded as JPEG, trying high quality first and only
// stepping quality/resolution down until the file fits.

// Plenty for a projected full-screen background, and the first big lever
// for shrinking phone photos (which are often 4000px+).
const MAX_DIMENSION = 2560;

function encodeJpeg(
  bitmap: ImageBitmap,
  scale: number,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  // JPEG has no alpha — flatten any transparency onto white.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

export async function compressImage(
  file: File,
  maxBytes: number,
): Promise<File> {
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    for (let attempt = 0; attempt < 5; attempt++, scale *= 0.7) {
      for (const quality of [0.9, 0.8, 0.7, 0.6]) {
        const blob = await encodeJpeg(bitmap, scale, quality);
        if (blob && blob.size <= maxBytes) {
          const name = file.name.replace(/\.[^.]*$/, "") + ".jpg";
          return new File([blob], name, { type: "image/jpeg" });
        }
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error("Could not compress the image under the size limit.");
}
