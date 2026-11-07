import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

/**
 * Sore photos, kept on the device and nowhere else.
 *
 * A photo is a file in the app's no-backup library folder named after the reading
 * it belongs to, so nothing about it reaches the server: no upload, no column,
 * no export. That also means a photo exists only on the phone that took it.
 *
 * Every function is a quiet no-op where photos are not supported, so callers
 * only need `photosSupported()` to decide whether to show anything.
 */

/**
 * Kept out of every backup, so "never uploaded" holds. On iOS LibraryNoCloud
 * is Library/NoCloud, which the plugin marks excluded from iCloud and device
 * backups. On Android it is the app's files dir like Data, which Auto Backup
 * would copy, so scripts/patch-native.mjs excludes this folder in the
 * backup rules (SORE_PHOTO_FOLDER in utils/native-patches.mts must match).
 */
const FOLDER = 'sore-photos';
const DIRECTORY = Directory.LibraryNoCloud;

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

  // The plugin flags Library/NoCloud as excluded from backup each time it
  // resolves it, which fails silently while the folder does not exist yet.
  // Creating the folder first means the write below resolves it again with
  // it present, so the very first photo is already covered.
  await Filesystem.mkdir({
    path: FOLDER,
    directory: DIRECTORY,
    recursive: true
  }).catch(() => undefined);
  const { uri } = await Filesystem.writeFile({
    path: pathFor(readingId),
    data: base64,
    directory: DIRECTORY,
    recursive: true
  });
  return `${Capacitor.convertFileSrc(uri)}?v=${Date.now()}`;
}

/**
 * The reading's photo as a displayable uri, or null when it has none.
 * Versioned by the file's modified time, so a retake is not shown from cache.
 */
export async function photoFor(readingId: string): Promise<string | null> {
  if (!photosSupported()) return null;
  try {
    const { uri, mtime } = await Filesystem.stat({
      path: pathFor(readingId),
      directory: DIRECTORY
    });
    return `${Capacitor.convertFileSrc(uri)}?v=${mtime}`;
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
        directory: DIRECTORY
      }).catch(() => undefined)
    )
  );
}

/** Deletes every sore photo on this device, for a deleted account. */
export async function deleteAllPhotos(): Promise<void> {
  if (!photosSupported()) return;
  await Filesystem.rmdir({
    path: FOLDER,
    directory: DIRECTORY,
    recursive: true
  }).catch(() => undefined);
}
