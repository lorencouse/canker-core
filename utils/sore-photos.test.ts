import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteAllPhotos,
  deletePhotosFor,
  photoFor,
  photosSupported,
  takePhoto
} from './sore-photos';

const mocks = vi.hoisted(() => ({
  native: true,
  available: new Set(['Camera', 'Filesystem']),
  getPhoto: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  deleteFile: vi.fn(),
  rmdir: vi.fn()
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mocks.native,
    isPluginAvailable: (name: string) => mocks.available.has(name),
    convertFileSrc: (uri: string) => uri.replace('file://', 'capacitor://')
  }
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: mocks.getPhoto },
  CameraResultType: { Base64: 'base64' },
  CameraSource: { Prompt: 'PROMPT' }
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: mocks.writeFile,
    stat: mocks.stat,
    deleteFile: mocks.deleteFile,
    rmdir: mocks.rmdir
  },
  Directory: { Data: 'DATA' }
}));

beforeEach(() => {
  mocks.native = true;
  mocks.available = new Set(['Camera', 'Filesystem']);
  vi.clearAllMocks();
});

describe('photosSupported', () => {
  it('is false on an app version without the camera plugin', () => {
    mocks.available = new Set(['Filesystem']);
    expect(photosSupported()).toBe(false);
  });

  it('is false without the filesystem plugin', () => {
    mocks.available = new Set(['Camera']);
    expect(photosSupported()).toBe(false);
  });

  it('is false on the web, where the plugins register a web fallback', () => {
    mocks.native = false;
    expect(photosSupported()).toBe(false);
  });

  it('is true in an app version with both plugins', () => {
    expect(photosSupported()).toBe(true);
  });
});

describe('takePhoto', () => {
  it('writes the photo to sore-photos/<readingId>.jpg in app data', async () => {
    mocks.getPhoto.mockResolvedValue({ base64String: 'abc', format: 'jpeg' });
    mocks.writeFile.mockResolvedValue({
      uri: 'file:///data/sore-photos/r1.jpg'
    });

    const uri = await takePhoto('r1');

    expect(mocks.writeFile).toHaveBeenCalledWith({
      path: 'sore-photos/r1.jpg',
      data: 'abc',
      directory: 'DATA',
      recursive: true
    });
    expect(uri).toMatch(/^capacitor:\/\/\/data\/sore-photos\/r1\.jpg\?v=\d+$/);
  });

  it('never saves to the gallery', async () => {
    mocks.getPhoto.mockResolvedValue({ base64String: 'abc', format: 'jpeg' });
    mocks.writeFile.mockResolvedValue({ uri: 'file:///x.jpg' });
    await takePhoto('r1');
    expect(mocks.getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ saveToGallery: false })
    );
  });

  it('returns null without throwing when the camera is cancelled', async () => {
    mocks.getPhoto.mockRejectedValue(new Error('User cancelled photos app'));
    await expect(takePhoto('r1')).resolves.toBeNull();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('passes on a real failure so the caller can say so', async () => {
    mocks.getPhoto.mockRejectedValue(new Error('User denied access to camera'));
    await expect(takePhoto('r1')).rejects.toThrow(/denied/);
  });

  it('does nothing where photos are not supported', async () => {
    mocks.native = false;
    await expect(takePhoto('r1')).resolves.toBeNull();
    expect(mocks.getPhoto).not.toHaveBeenCalled();
  });
});

describe('photoFor', () => {
  it('returns a displayable uri when the reading has a photo', async () => {
    mocks.stat.mockResolvedValue({ uri: 'file:///data/sore-photos/r1.jpg' });
    await expect(photoFor('r1')).resolves.toBe(
      'capacitor:///data/sore-photos/r1.jpg'
    );
    expect(mocks.stat).toHaveBeenCalledWith({
      path: 'sore-photos/r1.jpg',
      directory: 'DATA'
    });
  });

  it('returns null when the reading has none', async () => {
    mocks.stat.mockRejectedValue(new Error('File does not exist'));
    await expect(photoFor('r1')).resolves.toBeNull();
  });

  it('returns null where photos are not supported', async () => {
    mocks.native = false;
    await expect(photoFor('r1')).resolves.toBeNull();
    expect(mocks.stat).not.toHaveBeenCalled();
  });
});

describe('deletePhotosFor', () => {
  it('deletes each reading photo and ignores ones that do not exist', async () => {
    mocks.deleteFile
      .mockRejectedValueOnce(new Error('File does not exist'))
      .mockResolvedValueOnce(undefined);

    await expect(deletePhotosFor(['r1', 'r2'])).resolves.toBeUndefined();

    expect(mocks.deleteFile).toHaveBeenCalledWith({
      path: 'sore-photos/r1.jpg',
      directory: 'DATA'
    });
    expect(mocks.deleteFile).toHaveBeenCalledWith({
      path: 'sore-photos/r2.jpg',
      directory: 'DATA'
    });
  });

  it('does nothing where photos are not supported', async () => {
    mocks.native = false;
    await deletePhotosFor(['r1']);
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });
});

describe('deleteAllPhotos', () => {
  it('removes the whole photo folder and ignores a missing one', async () => {
    mocks.rmdir.mockRejectedValue(new Error('Folder does not exist'));
    await expect(deleteAllPhotos()).resolves.toBeUndefined();
    expect(mocks.rmdir).toHaveBeenCalledWith({
      path: 'sore-photos',
      directory: 'DATA',
      recursive: true
    });
  });
});
