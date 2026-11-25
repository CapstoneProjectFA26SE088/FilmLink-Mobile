import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { openURL } from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { DRAFT_DIRECTORY_NAME } from './draft-storage';

export const NEGATIVE_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_NEGATIVE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export const DRAFT_MEDIA_SUBDIR = 'media';

export type AllowedNegativeMimeType = (typeof ALLOWED_NEGATIVE_MIME_TYPES)[number];

export type PickedNegativeAsset = {
  readonly uri: string;
  readonly name: string;
  readonly mimeType: AllowedNegativeMimeType;
  readonly sizeBytes: number | null;
  readonly blob?: Blob;
};

export type MediaPickOutcome =
  | { readonly kind: 'picked'; readonly asset: PickedNegativeAsset }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'denied'; readonly message: string }
  | { readonly kind: 'invalid'; readonly message: string };

export type MediaSaveOutcome =
  | { readonly kind: 'saved'; readonly uri: string }
  | { readonly kind: 'opened-browser' }
  | { readonly kind: 'denied'; readonly message: string }
  | { readonly kind: 'failed'; readonly message: string };

export type NegativeValidationResult =
  | { readonly ok: true; readonly mimeType: AllowedNegativeMimeType }
  | { readonly ok: false; readonly message: string };

const MAX_MEDIA_FILENAME_LENGTH = 120;

function sanitizeMediaFileName(rawName: string, fallbackExt = 'jpg'): string {
  const withoutQueryOrFragment = rawName.split(/[?#]/)[0] ?? '';
  const baseName = withoutQueryOrFragment.split(/[\\/]/).pop()?.trim() ?? '';
  const cleaned = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  if (cleaned.length === 0 || (baseName.startsWith('.') && !cleaned.includes('.'))) {
    return `negative.${fallbackExt}`;
  }
  if (cleaned.length <= MAX_MEDIA_FILENAME_LENGTH) {
    return cleaned;
  }
  const dotIndex = cleaned.lastIndexOf('.');
  if (dotIndex > 0 && cleaned.length - dotIndex <= 10) {
    const ext = cleaned.slice(dotIndex);
    return `${cleaned.slice(0, MAX_MEDIA_FILENAME_LENGTH - ext.length)}${ext}`;
  }
  return cleaned.slice(0, MAX_MEDIA_FILENAME_LENGTH);
}

function getDraftMediaDirectory(): Directory {
  return new Directory(Paths.document, DRAFT_DIRECTORY_NAME, DRAFT_MEDIA_SUBDIR);
}

function deleteFileQuietly(file: File): void {
  try {
    if (file.exists) {
      file.delete();
    }
  } catch {
    return;
  }
}

export function normalizeNegativeMimeType(
  mimeType?: string | null,
  fileName?: string | null,
): AllowedNegativeMimeType | null {
  const baseMime = mimeType?.trim().toLowerCase().split(';')[0]?.trim() ?? '';
  if (baseMime === 'image/jpeg' || baseMime === 'image/jpg') {
    return 'image/jpeg';
  }
  if (baseMime === 'image/png') {
    return 'image/png';
  }
  if (baseMime.length > 0 && baseMime !== 'application/octet-stream') {
    return null;
  }
  const cleanName = fileName?.split(/[?#]/)[0]?.trim().toLowerCase() ?? '';
  if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (cleanName.endsWith('.png')) {
    return 'image/png';
  }
  return null;
}

export function validateNegativeAsset(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
  fileSizeBytes: number | null | undefined,
): NegativeValidationResult {
  const normalized = normalizeNegativeMimeType(mimeType, fileName);
  if (normalized === null) {
    return { ok: false, message: 'Chỉ hỗ trợ ảnh âm bản định dạng JPEG hoặc PNG.' };
  }
  if (fileSizeBytes !== null && fileSizeBytes !== undefined) {
    if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
      return { ok: false, message: 'Kích thước tệp ảnh âm bản không hợp lệ.' };
    }
    if (fileSizeBytes > NEGATIVE_MAX_FILE_BYTES) {
      return { ok: false, message: 'Ảnh âm bản vượt quá giới hạn tối đa 10 MB.' };
    }
  }
  return { ok: true, mimeType: normalized };
}

export async function persistDraftMediaFile(
  sourceUri: string,
  fileName: string,
  platform: string = Platform.OS,
): Promise<string> {
  if (platform === 'web') {
    return sourceUri;
  }
  const mediaDir = getDraftMediaDirectory();
  if (!mediaDir.exists) {
    mediaDir.create({ intermediates: true, idempotent: true });
  }
  const dest = new File(mediaDir, sanitizeMediaFileName(fileName));
  if (sourceUri === dest.uri) {
    return dest.uri;
  }
  await new File(sourceUri).copy(dest, { overwrite: true });
  return dest.uri;
}

export function removeDraftMediaFile(
  localUri: string | null,
  platform: string = Platform.OS,
): void {
  if (platform === 'web' || !localUri) {
    return;
  }
  const mediaDir = getDraftMediaDirectory();
  const prefix = mediaDir.uri.endsWith('/') ? mediaDir.uri : `${mediaDir.uri}/`;
  if (!localUri.startsWith(prefix) || localUri.length <= prefix.length) {
    return;
  }
  const relativePart = localUri.slice(prefix.length);
  if (relativePart.includes('..') || relativePart.includes('/')) {
    return;
  }
  deleteFileQuietly(new File(localUri));
}

async function processPickedAsset(
  asset: ImagePicker.ImagePickerAsset,
  platform: string,
): Promise<MediaPickOutcome> {
  const fallbackFromUri = asset.uri.split(/[?#]/)[0]?.split(/[\\/]/).pop()?.trim() ?? '';
  const rawName = asset.fileName?.trim() || asset.file?.name?.trim() || fallbackFromUri;
  const rawMime = asset.mimeType ?? asset.file?.type ?? null;
  const rawSize = asset.fileSize ?? asset.file?.size ?? null;
  const validation = validateNegativeAsset(rawMime, rawName, rawSize);
  if (!validation.ok) {
    return { kind: 'invalid', message: validation.message };
  }
  const fallbackExt = validation.mimeType === 'image/png' ? 'png' : 'jpg';
  const safeName = sanitizeMediaFileName(rawName, fallbackExt);
  let persistedUri: string;
  try {
    persistedUri = await persistDraftMediaFile(asset.uri, safeName, platform);
  } catch {
    return { kind: 'invalid', message: 'Không thể lưu bản sao ảnh âm bản tạm thời.' };
  }
  const pickedAsset: PickedNegativeAsset = {
    uri: persistedUri,
    name: safeName,
    mimeType: validation.mimeType,
    sizeBytes: rawSize,
    ...(platform === 'web' && asset.file ? { blob: asset.file } : {}),
  };
  return { kind: 'picked', asset: pickedAsset };
}

export async function captureNegativeFromCamera(
  platform: string = Platform.OS,
): Promise<MediaPickOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { kind: 'denied', message: 'Cần cấp quyền máy ảnh để chụp ảnh âm bản phim.' };
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.92,
      allowsEditing: false,
    });
    const firstAsset = result.assets?.[0];
    if (result.canceled || !firstAsset) {
      return { kind: 'cancelled' };
    }
    return await processPickedAsset(firstAsset, platform);
  } catch {
    return { kind: 'invalid', message: 'Không thể chụp ảnh âm bản từ máy ảnh.' };
  }
}

export async function pickNegativeFromLibrary(
  platform: string = Platform.OS,
): Promise<MediaPickOutcome> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { kind: 'denied', message: 'Cần cấp quyền thư viện ảnh để chọn ảnh âm bản phim.' };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    const firstAsset = result.assets?.[0];
    if (result.canceled || !firstAsset) {
      return { kind: 'cancelled' };
    }
    return await processPickedAsset(firstAsset, platform);
  } catch {
    return { kind: 'invalid', message: 'Không thể chọn ảnh âm bản từ thư viện.' };
  }
}

async function saveNativePositiveToLibrary(
  downloadUrl: string,
  fileName: string,
): Promise<MediaSaveOutcome> {
  let granted = false;
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
    granted = permission.granted;
  } catch {
    return { kind: 'failed', message: 'Không thể kiểm tra quyền thư viện ảnh.' };
  }
  if (!granted) {
    return { kind: 'denied', message: 'Cần cấp quyền thư viện ảnh để lưu ảnh dương bản.' };
  }
  const safeName = sanitizeMediaFileName(fileName, 'jpg');
  const targetFile = new File(Paths.cache, safeName);
  let downloaded: File | null = null;
  try {
    downloaded = await File.downloadFileAsync(downloadUrl, targetFile, { idempotent: true });
    const createdAsset = await MediaLibrary.Asset.create(downloaded.uri);
    const savedUri = await createdAsset.getUri();
    return { kind: 'saved', uri: savedUri };
  } catch {
    return { kind: 'failed', message: 'Không thể tải hoặc lưu ảnh dương bản vào thư viện.' };
  } finally {
    deleteFileQuietly(downloaded ?? targetFile);
  }
}

export async function saveRemotePositiveToLibrary(
  downloadUrl: string,
  fileName: string,
  platform: string = Platform.OS,
): Promise<MediaSaveOutcome> {
  if (!downloadUrl.trim()) {
    return { kind: 'failed', message: 'Liên kết tải ảnh dương bản không hợp lệ.' };
  }
  if (platform === 'web') {
    try {
      await openURL(downloadUrl);
      return { kind: 'opened-browser' };
    } catch {
      return { kind: 'failed', message: 'Không thể mở liên kết tải ảnh trên trình duyệt.' };
    }
  }
  return saveNativePositiveToLibrary(downloadUrl, fileName);
}
