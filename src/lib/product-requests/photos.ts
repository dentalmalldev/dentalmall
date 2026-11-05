/** Storage path for a customer's photos. Keeping them per user lets us check ownership. */
export function productRequestPhotoPrefix(userId: string): string {
  return `product-requests/${userId}/`;
}

/** Only photos this user uploaded through our route can be attached to their request. */
export function isOwnProductRequestPhoto(url: string, userId: string): boolean {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return url.startsWith(`https://storage.googleapis.com/${bucket}/${productRequestPhotoPrefix(userId)}`);
}
