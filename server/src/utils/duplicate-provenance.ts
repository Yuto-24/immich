import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetProvenance, CaptureTimeSource, ProvenanceConfidence } from 'src/enum';
import { AssetProvenanceTable } from 'src/schema/tables/asset-provenance.table';

export type DuplicateRecommendedAction = 'keep' | 'trash' | 'review';

export type DuplicateProvenanceInfo = Pick<
  AssetProvenanceTable,
  | 'assetId'
  | 'provenance'
  | 'confidence'
  | 'classifierVersion'
  | 'captureTimeSource'
  | 'evidence'
  | 'isRaw'
  | 'originalMimeType'
>;

export interface DuplicateAssetInput {
  asset: AssetResponseDto;
  provenanceInfo?: DuplicateProvenanceInfo | null;
}

export interface DuplicateAssetAssessment {
  assetId: string;
  provenance: AssetProvenance;
  confidence: ProvenanceConfidence;
  classifierVersion: number;
  captureTimeSource: CaptureTimeSource;
  evidence: string[];
  recommendedAction: DuplicateRecommendedAction;
}

export interface DuplicateGroupAssessment {
  rankedAssets: AssetResponseDto[];
  suggestedKeepAssetIds: string[];
  autoResolvable: boolean;
  assessments: DuplicateAssetAssessment[];
  groupDate: string;
}

type RankedAsset = {
  asset: AssetResponseDto;
  provenanceInfo: DuplicateProvenanceInfo;
};

const PROVENANCE_RANK: Record<AssetProvenance, number> = {
  [AssetProvenance.CameraOriginal]: 6,
  [AssetProvenance.ScannerOriginal]: 5,
  [AssetProvenance.Unknown]: 4,
  [AssetProvenance.CameraDerived]: 3,
  [AssetProvenance.Screenshot]: 2,
  [AssetProvenance.Generated]: 1,
};

const CONFIDENCE_RANK: Record<ProvenanceConfidence, number> = {
  [ProvenanceConfidence.High]: 3,
  [ProvenanceConfidence.Medium]: 2,
  [ProvenanceConfidence.Low]: 1,
};

const getUnknownProvenance = (asset: AssetResponseDto): DuplicateProvenanceInfo => ({
  assetId: asset.id,
  provenance: AssetProvenance.Unknown,
  confidence: ProvenanceConfidence.Low,
  classifierVersion: 0,
  captureTimeSource: CaptureTimeSource.Unknown,
  evidence: ['Provenance has not been classified; manual review is required'],
  isRaw: false,
  originalMimeType: asset.originalMimeType ?? 'application/octet-stream',
});

const getReversibleFormatRank = ({ asset, provenanceInfo }: RankedAsset): number => {
  if (provenanceInfo.isRaw) {
    return 7;
  }

  const mimeType = provenanceInfo.originalMimeType || asset.originalMimeType || '';
  if (['image/tiff', 'image/png', 'image/bmp'].includes(mimeType)) {
    return 6;
  }
  if (['image/heic', 'image/heif', 'image/dng'].includes(mimeType)) {
    return 5;
  }
  if (mimeType.startsWith('video/')) {
    return 4;
  }
  if (['image/jpeg', 'image/avif', 'image/webp'].includes(mimeType)) {
    return 3;
  }
  if (mimeType === 'image/gif') {
    return 2;
  }
  return 1;
};

const getMetadataCompleteness = ({ asset, provenanceInfo }: RankedAsset): number => {
  const exif = asset.exifInfo;
  const values = [
    exif?.make,
    exif?.model,
    exif?.lensModel,
    exif?.fNumber,
    exif?.focalLength,
    exif?.iso,
    exif?.exposureTime,
    exif?.latitude,
    exif?.longitude,
    exif?.description,
    exif?.orientation,
    provenanceInfo.captureTimeSource === CaptureTimeSource.Filesystem ||
    provenanceInfo.captureTimeSource === CaptureTimeSource.Unknown
      ? null
      : exif?.dateTimeOriginal,
  ];

  return values.filter((value) => value !== null && value !== undefined && value !== '').length;
};

const getResolution = (asset: AssetResponseDto) => {
  const width = asset.width ?? asset.exifInfo?.exifImageWidth ?? 0;
  const height = asset.height ?? asset.exifInfo?.exifImageHeight ?? 0;
  return width * height;
};

const getTimestamp = (value: string | null | undefined) => {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const compareDuplicateAssets = (a: RankedAsset, b: RankedAsset): number => {
  return (
    PROVENANCE_RANK[b.provenanceInfo.provenance] - PROVENANCE_RANK[a.provenanceInfo.provenance] ||
    CONFIDENCE_RANK[b.provenanceInfo.confidence] - CONFIDENCE_RANK[a.provenanceInfo.confidence] ||
    getReversibleFormatRank(b) - getReversibleFormatRank(a) ||
    getMetadataCompleteness(b) - getMetadataCompleteness(a) ||
    getResolution(b.asset) - getResolution(a.asset) ||
    (b.asset.exifInfo?.fileSizeInByte ?? 0) - (a.asset.exifInfo?.fileSizeInByte ?? 0) ||
    getTimestamp(b.asset.exifInfo?.dateTimeOriginal ?? b.asset.fileCreatedAt) -
      getTimestamp(a.asset.exifInfo?.dateTimeOriginal ?? a.asset.fileCreatedAt) ||
    a.asset.id.localeCompare(b.asset.id)
  );
};

const isOriginal = (provenance: AssetProvenance) =>
  provenance === AssetProvenance.CameraOriginal || provenance === AssetProvenance.ScannerOriginal;

const getGroupDate = (ranked: RankedAsset[]): string => {
  const representative = ranked.find(({ provenanceInfo }) => isOriginal(provenanceInfo.provenance)) ?? ranked[0];
  if (!representative) {
    return new Date(0).toISOString();
  }

  const hasEmbeddedCaptureTime =
    representative.provenanceInfo.captureTimeSource === CaptureTimeSource.EmbeddedExif ||
    representative.provenanceInfo.captureTimeSource === CaptureTimeSource.EmbeddedQuickTime;
  return hasEmbeddedCaptureTime && representative.asset.exifInfo?.dateTimeOriginal
    ? representative.asset.exifInfo.dateTimeOriginal
    : representative.asset.fileCreatedAt || representative.asset.localDateTime;
};

export const assessDuplicateGroup = (inputs: DuplicateAssetInput[]): DuplicateGroupAssessment => {
  const ranked: RankedAsset[] = inputs
    .map(({ asset, provenanceInfo }) => ({ asset, provenanceInfo: provenanceInfo ?? getUnknownProvenance(asset) }))
    .toSorted(compareDuplicateAssets);
  const cameraOriginalHigh = ranked.filter(
    ({ provenanceInfo }) =>
      provenanceInfo.provenance === AssetProvenance.CameraOriginal &&
      provenanceInfo.confidence === ProvenanceConfidence.High,
  );
  const autoResolvable =
    cameraOriginalHigh.length === 1 &&
    ranked.every(
      ({ provenanceInfo }) =>
        provenanceInfo.assetId === cameraOriginalHigh[0].provenanceInfo.assetId ||
        (provenanceInfo.confidence === ProvenanceConfidence.High &&
          [AssetProvenance.CameraDerived, AssetProvenance.Screenshot, AssetProvenance.Generated].includes(
            provenanceInfo.provenance,
          )),
    );

  const originalCandidates = ranked.filter(({ provenanceInfo }) => isOriginal(provenanceInfo.provenance));
  const suggested =
    originalCandidates.length > 0
      ? originalCandidates.filter(
          ({ provenanceInfo }) => provenanceInfo.provenance === originalCandidates[0].provenanceInfo.provenance,
        )
      : ranked.filter(({ provenanceInfo }) => provenanceInfo.provenance === ranked[0]?.provenanceInfo.provenance);
  const suggestedKeepAssetIds = suggested.map(({ asset }) => asset.id);
  const suggestedSet = new Set(suggestedKeepAssetIds);

  const assessments = ranked.map(
    ({ asset, provenanceInfo }): DuplicateAssetAssessment => ({
      assetId: asset.id,
      provenance: provenanceInfo.provenance,
      confidence: provenanceInfo.confidence,
      classifierVersion: provenanceInfo.classifierVersion,
      captureTimeSource: provenanceInfo.captureTimeSource,
      evidence: provenanceInfo.evidence,
      recommendedAction: autoResolvable
        ? suggestedSet.has(asset.id)
          ? 'keep'
          : 'trash'
        : suggestedSet.has(asset.id) && isOriginal(provenanceInfo.provenance)
          ? 'keep'
          : 'review',
    }),
  );

  return {
    rankedAssets: ranked.map(({ asset }) => asset),
    suggestedKeepAssetIds,
    autoResolvable,
    assessments,
    groupDate: getGroupDate(ranked),
  };
};
