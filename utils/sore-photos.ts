import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

/**
 * Sore photos, kept on the device and nowhere else.
 *
 * A photo is a file in the app's private data folder named after the reading
 * it belongs to, so nothing about it reaches the server: no upload, no column,
 * no export. That also means a photo exists only on the phone that took it.
 *
 * Every function is a quiet no-op where photos are not supported, so callers
 * only need `photosSupported()` to decide whether to show anything.
 */

const FOLDER = 'sore-photos';

const pathFor = (readingId: string) => `${FOLDER}/${readingId}.jpg`;

/**
 * Both plugins present in the native app. The native check comes first
 * because on the web the plugin packages register a browser fallback, which
 * makes `isPluginAvailable` true there; an app version built before the
 * plugins were added has no native side for them, so it reads false.
 */
export const photosSupported = (): boolean =>
  Capacitor.isNativePlatform() &&
  Capacitor.isPluginAvailable('Camera') &&
  Capacitor.isPluginAvailable('Filesystem');

/** Both platforms reject a dismissed camera or picker with this message. */
const isCancel = (error: unknown) =>
  error instanceof Error && /cancel/i.test(error.message);

/**
 * Takes or picks a photo and saves it as the reading's photo, replacing any
 * earlier one. Null when the person backs out. The returned uri carries a
 * version so the webview does not show a cached copy of a replaced photo.
 */
export async function takePhoto(readingId: string): Promise<string | null> {
  if (!photosSupported()) return null;

  let base64: string | undefined;
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Base64,
      quality: 80,
      width: 1600,
      correctOrientation: true,
      // The camera roll would be a copy outside the app's control.
      saveToGallery: false
    });
    base64 = photo.base64String;
  } catch (error) {
    if (isCancel(error)) return null;
    throw error;
  }
  if (!base64) return null;

  const { uri } = await Filesystem.writeFile({
    path: pathFor(readingId),
    data: base64,
    directory: Directory.Data,
    recursive: true
  });
  return `${Capacitor.convertFileSrc(uri)}?v=${Date.now()}`;
}

/** The reading's photo as a displayable uri, or null when it has none. */
export async function photoFor(readingId: string): Promise<string | null> {
  if (!photosSupported()) return null;
  try {
    const { uri } = await Filesystem.stat({
      path: pathFor(readingId),
      directory: Directory.Data
    });
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
}

/** Deletes these readings' photos. Most readings have none, so a miss is fine. */
export async function deletePhotosFor(readingIds: string[]): Promise<void> {
  if (!photosSupported()) return;
  await Promise.all(
    readingIds.map((id) =>
      Filesystem.deleteFile({
        path: pathFor(id),
        directory: Directory.Data
      }).catch(() => undefined)
    )
  );
}

/** Deletes every sore photo on this device, for a deleted account. */
export async function deleteAllPhotos(): Promise<void> {
  if (!photosSupported()) return;
  await Filesystem.rmdir({
    path: FOLDER,
    directory: Directory.Data,
    recursive: true
  }).catch(() => undefined);
}
