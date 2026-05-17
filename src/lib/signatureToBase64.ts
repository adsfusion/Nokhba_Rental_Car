/**
 * Fetches a remote image URL (or passes through an existing data URL) and
 * returns a guaranteed `data:image/png;base64,...` string safe for jsPDF.
 *
 * This function:
 *  1. Validates the HTTP response (throws on 4xx/5xx so callers never receive
 *     an HTML error page silently encoded as base64).
 *  2. Re-encodes the image through an HTMLCanvasElement, converting any
 *     format (WebP, JPEG, BMP) to PNG — eliminating jsPDF "wrong PNG
 *     signature" crashes caused by Supabase preserving the original MIME type.
 *  3. Falls back gracefully: if canvas drawing fails the original blob data URL
 *     is returned so the caller can still attempt the download.
 *
 * Client-side only — must not be imported from Server Components or
 * Server Actions.
 */
export async function signatureUrlToPngBase64(src: string): Promise<string> {
  // Already a data URL — re-encode through canvas to ensure PNG format
  if (src.startsWith('data:')) {
    return reencodeAsPng(src);
  }

  // Fetch remote URL with explicit error checking
  const res = await fetch(src, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch signature image: HTTP ${res.status} ${res.statusText}. ` +
      `URL: ${src.substring(0, 80)}`
    );
  }

  const blob = await res.blob();

  // Convert blob → object URL → data URL, then re-encode via canvas as PNG
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await reencodeAsPng(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Draws any image src into an off-screen canvas and returns the result as
 * a `data:image/png;base64,...` string.
 * Throws if the image cannot be loaded (broken URL, CORS block, etc.).
 */
function reencodeAsPng(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Use a minimum canvas size so blank signatures still produce valid PNG
      const w = Math.max(img.naturalWidth || img.width, 1);
      const h = Math.max(img.naturalHeight || img.height, 1);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // White background so transparent PNG renders cleanly in jsPDF
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const pngDataUrl = canvas.toDataURL('image/png');
      if (!pngDataUrl || pngDataUrl === 'data:,') {
        reject(new Error('Canvas produced an empty PNG — image may be cross-origin blocked'));
        return;
      }

      resolve(pngDataUrl);
    };

    img.onerror = () => {
      reject(new Error(`Image failed to load for PNG re-encoding. src: ${src.substring(0, 80)}`));
    };

    img.src = src;
  });
}
