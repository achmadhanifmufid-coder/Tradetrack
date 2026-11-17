const MAX_CHARS = 400_000; // Firestore docs are capped at 1 MB; leaves room for the other fields
const MAX_SIDE = 1600;

export async function compressImage(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  for (let q = 0.8; q >= 0.3; q -= 0.1) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('imageTooBig'); // i18n key, translated by the caller
}
