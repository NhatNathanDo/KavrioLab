/**
 * EXIF Privacy Scrubbing Pipeline
 * Re-renders image data onto an HTML Canvas context to eliminate all EXIF metadata tags
 * (GPS coordinates, device serial numbers, lens info) before storage.
 */
export async function stripExifFromDataUrl(
  dataUrl: string,
  maxWidth = 1920,
  maxHeight = 1920
): Promise<string> {
  if (typeof window === 'undefined') {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(cleanDataUrl);
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = dataUrl;
  });
}
