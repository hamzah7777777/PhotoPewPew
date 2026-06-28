type PixelArea = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function getRadianAngle(degree: number) {
  return (degree * Math.PI) / 180;
}

function rotatedBoundingBox(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// react-easy-crop reports its crop area in the coordinate space of the
// rotated image's bounding box, not the original image. Since we only
// rotate in 90deg steps, that box is just width/height swapped.
export function rotatedBoundingBoxSize(
  width: number,
  height: number,
  rotation: number,
) {
  return rotatedBoundingBox(width, height, rotation);
}

export function cropFractionToPixels(
  edit: { crop_x: number; crop_y: number; crop_w: number; crop_h: number },
  width: number,
  height: number,
  rotation: number,
): PixelArea {
  const box = rotatedBoundingBoxSize(width, height, rotation);
  return {
    x: edit.crop_x * box.width,
    y: edit.crop_y * box.height,
    width: edit.crop_w * box.width,
    height: edit.crop_h * box.height,
  };
}

export async function getCroppedImageBlob(
  imageUrl: string,
  cropAreaPixels: PixelArea,
  rotation: number,
): Promise<Blob> {
  const image = await createImage(imageUrl);
  const rotRad = getRadianAngle(rotation);
  const { width: boxWidth, height: boxHeight } = rotatedBoundingBox(
    image.width,
    image.height,
    rotation,
  );

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = boxWidth;
  rotatedCanvas.height = boxHeight;
  const rotatedCtx = rotatedCanvas.getContext("2d")!;
  rotatedCtx.translate(boxWidth / 2, boxHeight / 2);
  rotatedCtx.rotate(rotRad);
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = Math.max(1, Math.round(cropAreaPixels.width));
  finalCanvas.height = Math.max(1, Math.round(cropAreaPixels.height));
  const finalCtx = finalCanvas.getContext("2d")!;
  finalCtx.drawImage(
    rotatedCanvas,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    finalCanvas.width,
    finalCanvas.height,
  );

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadFilename(originalFilename: string) {
  const dot = originalFilename.lastIndexOf(".");
  const base = dot > 0 ? originalFilename.slice(0, dot) : originalFilename;
  return `${base}-edited.jpg`;
}
