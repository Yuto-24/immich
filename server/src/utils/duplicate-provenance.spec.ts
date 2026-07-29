import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ExifResponseSchema } from 'src/dtos/exif.dto';
import { AssetProvenance, AssetType, AssetVisibility, CaptureTimeSource, ProvenanceConfidence } from 'src/enum';
import { DuplicateProvenanceInfo, assessDuplicateGroup } from 'src/utils/duplicate-provenance';
import { describe, expect, it } from 'vitest';

const createAsset = (
  id: string,
  options: {
    width?: number;
    height?: number;
    fileSizeInByte?: number;
    mimeType?: string;
    dateTimeOriginal?: string;
    fileCreatedAt?: string;
  } = {},
): AssetResponseDto => {
  const date = options.dateTimeOriginal ?? '2025-01-01T00:00:00.000Z';
  return {
    id,
    type: AssetType.Image,
    thumbhash: null,
    originalMimeType: options.mimeType ?? 'image/jpeg',
    localDateTime: date,
    duration: 0,
    hasMetadata: true,
    width: options.width ?? 1920,
    height: options.height ?? 1080,
    createdAt: date,
    ownerId: 'owner-1',
    originalPath: `/path/${id}`,
    originalFileName: `${id}.jpg`,
    fileCreatedAt: options.fileCreatedAt ?? date,
    fileModifiedAt: date,
    updatedAt: date,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    isEdited: false,
    visibility: AssetVisibility.Timeline,
    checksum: 'checksum',
    exifInfo: ExifResponseSchema.parse({
      fileSizeInByte: options.fileSizeInByte ?? 1000,
      dateTimeOriginal: date,
    }),
  };
};

const provenance = (
  assetId: string,
  provenanceValue: AssetProvenance,
  options: {
    confidence?: ProvenanceConfidence;
    captureTimeSource?: CaptureTimeSource;
    isRaw?: boolean;
    mimeType?: string;
  } = {},
): DuplicateProvenanceInfo => ({
  assetId,
  provenance: provenanceValue,
  confidence: options.confidence ?? ProvenanceConfidence.High,
  classifierVersion: 1,
  captureTimeSource: options.captureTimeSource ?? CaptureTimeSource.EmbeddedExif,
  evidence: [`${provenanceValue} evidence`],
  isRaw: options.isRaw ?? false,
  originalMimeType: options.mimeType ?? 'image/jpeg',
});

const input = (asset: AssetResponseDto, provenanceInfo?: DuplicateProvenanceInfo | null) => ({
  asset,
  provenanceInfo,
});

describe(assessDuplicateGroup.name, () => {
  it('keeps a smaller lower-resolution camera original over a larger screenshot', () => {
    const original = createAsset('camera', { width: 1280, height: 960, fileSizeInByte: 500_000 });
    const screenshot = createAsset('screenshot', { width: 2560, height: 1920, fileSizeInByte: 3_000_000 });

    const result = assessDuplicateGroup([
      input(screenshot, provenance(screenshot.id, AssetProvenance.Screenshot)),
      input(original, provenance(original.id, AssetProvenance.CameraOriginal)),
    ]);

    expect(result.rankedAssets.map(({ id }) => id)).toEqual(['camera', 'screenshot']);
    expect(result.suggestedKeepAssetIds).toEqual(['camera']);
    expect(result.autoResolvable).toBe(true);
    expect(result.assessments.map(({ recommendedAction }) => recommendedAction)).toEqual(['keep', 'trash']);
  });

  it('keeps the camera original over a Photoshop export that retained camera EXIF', () => {
    const original = createAsset('original', { fileSizeInByte: 500_000 });
    const photoshop = createAsset('photoshop', { fileSizeInByte: 5_000_000 });

    const result = assessDuplicateGroup([
      input(photoshop, provenance(photoshop.id, AssetProvenance.CameraDerived)),
      input(original, provenance(original.id, AssetProvenance.CameraOriginal)),
    ]);

    expect(result.rankedAssets[0].id).toBe(original.id);
    expect(result.autoResolvable).toBe(true);
  });

  it('does not auto-resolve an all-unknown group', () => {
    const first = createAsset('a');
    const second = createAsset('b', { fileSizeInByte: 5000 });
    const result = assessDuplicateGroup([input(first), input(second)]);

    expect(result.autoResolvable).toBe(false);
    expect(result.suggestedKeepAssetIds).toEqual(['b', 'a']);
    expect(result.assessments.every(({ recommendedAction }) => recommendedAction === 'review')).toBe(true);
  });

  it('does not auto-resolve multiple camera originals', () => {
    const first = createAsset('a');
    const second = createAsset('b');
    const result = assessDuplicateGroup([
      input(first, provenance(first.id, AssetProvenance.CameraOriginal)),
      input(second, provenance(second.id, AssetProvenance.CameraOriginal)),
    ]);

    expect(result.autoResolvable).toBe(false);
    expect(result.suggestedKeepAssetIds).toEqual(['a', 'b']);
  });

  it('keeps both RAW and JPEG camera originals for manual review', () => {
    const raw = createAsset('raw', { mimeType: 'image/x-canon-cr3' });
    const jpeg = createAsset('jpeg');
    const result = assessDuplicateGroup([
      input(jpeg, provenance(jpeg.id, AssetProvenance.CameraOriginal)),
      input(
        raw,
        provenance(raw.id, AssetProvenance.CameraOriginal, {
          isRaw: true,
          mimeType: 'image/x-canon-cr3',
        }),
      ),
    ]);

    expect(result.rankedAssets.map(({ id }) => id)).toEqual(['raw', 'jpeg']);
    expect(result.suggestedKeepAssetIds).toEqual(['raw', 'jpeg']);
    expect(result.autoResolvable).toBe(false);
  });

  it('does not count a filesystem fallback date as embedded metadata', () => {
    const filesystem = createAsset('filesystem', { fileSizeInByte: 5000 });
    const embedded = createAsset('embedded', { fileSizeInByte: 1000 });
    const result = assessDuplicateGroup([
      input(
        filesystem,
        provenance(filesystem.id, AssetProvenance.Unknown, {
          confidence: ProvenanceConfidence.Low,
          captureTimeSource: CaptureTimeSource.Filesystem,
        }),
      ),
      input(
        embedded,
        provenance(embedded.id, AssetProvenance.Unknown, {
          confidence: ProvenanceConfidence.Low,
          captureTimeSource: CaptureTimeSource.EmbeddedExif,
        }),
      ),
    ]);

    expect(result.rankedAssets[0].id).toBe('embedded');
  });

  it('applies the complete provenance priority before all secondary criteria', () => {
    const orderedProvenance = [
      AssetProvenance.CameraOriginal,
      AssetProvenance.ScannerOriginal,
      AssetProvenance.Unknown,
      AssetProvenance.CameraDerived,
      AssetProvenance.Screenshot,
      AssetProvenance.Generated,
    ];
    const inputs = orderedProvenance
      .map((provenanceValue) => {
        const asset = createAsset(provenanceValue);
        return input(asset, provenance(asset.id, provenanceValue));
      })
      .toReversed();

    const result = assessDuplicateGroup(inputs);

    expect(result.rankedAssets.map(({ id }) => id)).toEqual(orderedProvenance);
  });

  it('uses stable IDs after all ranking criteria tie', () => {
    const first = createAsset('a');
    const second = createAsset('b');
    const firstResult = assessDuplicateGroup([input(second), input(first)]);
    const secondResult = assessDuplicateGroup([input(first), input(second)]);

    expect(firstResult.rankedAssets.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(secondResult.rankedAssets.map(({ id }) => id)).toEqual(['a', 'b']);
  });

  it('uses the top original embedded capture date as the group date', () => {
    const original = createAsset('original', { dateTimeOriginal: '2024-04-05T06:07:08.000Z' });
    const screenshot = createAsset('screenshot', { dateTimeOriginal: '2025-01-01T00:00:00.000Z' });
    const result = assessDuplicateGroup([
      input(screenshot, provenance(screenshot.id, AssetProvenance.Screenshot)),
      input(original, provenance(original.id, AssetProvenance.CameraOriginal)),
    ]);

    expect(result.groupDate).toBe('2024-04-05T06:07:08.000Z');
  });
});
