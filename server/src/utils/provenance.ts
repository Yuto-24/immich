import { Insertable } from 'kysely';
import { AssetProvenance, CaptureTimeSource, ProvenanceConfidence } from 'src/enum';
import { AssetProvenanceTable } from 'src/schema/tables/asset-provenance.table';

export const PROVENANCE_CLASSIFIER_VERSION = 1;

const EDITOR_PATTERN =
  /\b(photoshop|lightroom|snapseed|image ?magick|gimp|affinity photo|darktable|capture one|pixelmator|luminar|canva|photoscape)\b/i;
const GENERATED_PATTERN =
  /\b(midjourney|stable diffusion|dall[·.\s-]?e|firefly|generative fill|comfyui|automatic1111|invokeai)\b/i;
const SCREEN_CAPTURE_PATTERN =
  /\b(screenshot|screen ?capture|snipping tool|gnome screenshot|spectacle|flameshot|sharex)\b/i;
const SCANNER_PATTERN = /\b(scanner|scanjet|scansnap|epson scan|silverfast|vuescan)\b/i;
const DERIVED_HISTORY_PATTERN = /\b(export|save(?:d)?|convert(?:ed)?|render(?:ed)?|derive(?:d)?)\b/i;
const SCREENSHOT_FILENAME_PATTERN =
  /(?:^|[\s_.-])(screenshot|screen[\s_.-]?shot|screen[\s_.-]?capture|スクリーンショット)(?:[\s_.-]|$)/i;

const SCREEN_DIMENSIONS = new Set([
  '750x1334',
  '828x1792',
  '1080x1920',
  '1080x2340',
  '1080x2400',
  '1125x2436',
  '1170x2532',
  '1200x1920',
  '1242x2688',
  '1284x2778',
  '1440x2960',
  '1440x3040',
  '1536x2048',
  '1600x2560',
  '1920x2560',
  '2048x2732',
  '2560x1600',
  '2560x1920',
]);

export interface AssetProvenanceClassificationInput {
  assetId: string;
  originalFileName: string;
  originalMimeType: string;
  width: number | null;
  height: number | null;
  make: string | null;
  model: string | null;
  iso: number | null;
  exposureTime: string | null;
  fNumber: number | null;
  focalLength: number | null;
  lensModel: string | null;
  isRaw: boolean;
  captureTimeSource: CaptureTimeSource;
  captureTimeTag: string | null;
  software: string | null;
  processingSoftware: string | null;
  creatorTool: string | null;
  documentId: string | null;
  originalDocumentId: string | null;
  instanceId: string | null;
  xmpHistory: string[];
}

const compact = (values: Array<string | null | undefined>) => values.filter((value): value is string => !!value);

const hasScreenDimensions = (width: number | null, height: number | null) => {
  if (!width || !height) {
    return false;
  }

  return SCREEN_DIMENSIONS.has(`${width}x${height}`) || SCREEN_DIMENSIONS.has(`${height}x${width}`);
};

export const classifyAssetProvenance = (
  input: AssetProvenanceClassificationInput,
): Insertable<AssetProvenanceTable> => {
  const tools = compact([input.software, input.processingSoftware, input.creatorTool]);
  const toolText = tools.join(' | ');
  const historyText = input.xmpHistory.join(' | ');
  const hasCamera = !!(input.make || input.model);
  const isEmbeddedCaptureTime =
    input.captureTimeSource === CaptureTimeSource.EmbeddedExif ||
    input.captureTimeSource === CaptureTimeSource.EmbeddedQuickTime;
  const captureSettingCount = [input.iso, input.exposureTime, input.fNumber, input.focalLength, input.lensModel].filter(
    (value) => value !== null && value !== undefined && value !== '',
  ).length;
  const screenshotFilename = SCREENSHOT_FILENAME_PATTERN.test(input.originalFileName) ? input.originalFileName : null;
  const commonScreenshotFormat = ['image/png', 'image/webp', 'image/avif'].includes(input.originalMimeType);
  const screenDimensions = hasScreenDimensions(input.width, input.height);
  const screenCaptureTool = SCREEN_CAPTURE_PATTERN.test(toolText);
  const editorTool = EDITOR_PATTERN.test(toolText);
  const generatedTool = GENERATED_PATTERN.test(toolText);
  const scannerTool = SCANNER_PATTERN.test(compact([input.make, input.model, toolText]).join(' | '));
  const documentLineage =
    !!input.originalDocumentId && !!input.documentId && input.originalDocumentId !== input.documentId;
  const derivedHistory = DERIVED_HISTORY_PATTERN.test(historyText);

  let provenance = AssetProvenance.Unknown;
  let confidence = ProvenanceConfidence.Low;
  const evidence: string[] = [];

  if (generatedTool) {
    provenance = AssetProvenance.Generated;
    confidence = ProvenanceConfidence.High;
    evidence.push(`Generative tool metadata: ${toolText}`);
  } else if (editorTool || documentLineage || derivedHistory) {
    provenance = AssetProvenance.CameraDerived;
    confidence = ProvenanceConfidence.High;
    if (editorTool) {
      evidence.push(`Editing or export software: ${toolText}`);
    }
    if (documentLineage) {
      evidence.push('XMP document lineage identifies a derived file');
    }
    if (derivedHistory) {
      evidence.push('XMP history contains an export, save, convert, render, or derive action');
    }
    if (hasCamera) {
      evidence.push('Camera metadata was preserved in the derived file');
    }
  } else {
    const screenshotEvidence = [
      screenshotFilename ? `Screenshot filename: ${screenshotFilename}` : null,
      hasCamera ? null : 'No camera make or model',
      screenCaptureTool ? `Screen capture software: ${toolText}` : null,
      screenDimensions ? `Screen-shaped dimensions: ${input.width}x${input.height}` : null,
      commonScreenshotFormat ? `Screenshot-compatible format: ${input.originalMimeType}` : null,
    ].filter((value): value is string => !!value);
    const hasStrongScreenshotSignal = !!screenshotFilename || screenCaptureTool;

    if (screenshotEvidence.length >= 2 && hasStrongScreenshotSignal && !hasCamera) {
      provenance = AssetProvenance.Screenshot;
      confidence = screenshotEvidence.length >= 3 ? ProvenanceConfidence.High : ProvenanceConfidence.Medium;
      evidence.push(...screenshotEvidence);
    } else if (scannerTool) {
      provenance = AssetProvenance.ScannerOriginal;
      confidence = ProvenanceConfidence.High;
      evidence.push('Scanner make, model, or acquisition software detected');
    } else if (input.isRaw && hasCamera) {
      provenance = AssetProvenance.CameraOriginal;
      confidence = ProvenanceConfidence.High;
      evidence.push('RAW format with camera make or model');
    } else if (hasCamera && isEmbeddedCaptureTime) {
      provenance = AssetProvenance.CameraOriginal;
      confidence = ProvenanceConfidence.High;
      evidence.push('Camera make or model with embedded capture time');
    } else if (hasCamera && captureSettingCount >= 2) {
      provenance = AssetProvenance.CameraOriginal;
      confidence = ProvenanceConfidence.High;
      evidence.push(`Camera make or model with ${captureSettingCount} capture-specific metadata fields`);
    } else if (hasCamera) {
      provenance = AssetProvenance.CameraOriginal;
      confidence = captureSettingCount === 1 ? ProvenanceConfidence.Medium : ProvenanceConfidence.Low;
      evidence.push('Camera make or model present');
      if (captureSettingCount === 1) {
        evidence.push('One capture-specific metadata field present');
      }
    } else {
      evidence.push(...screenshotEvidence, 'No reliable original or derived provenance evidence');
    }
  }

  return {
    assetId: input.assetId,
    provenance,
    confidence,
    classifierVersion: PROVENANCE_CLASSIFIER_VERSION,
    captureTimeSource: input.captureTimeSource,
    captureTimeTag: input.captureTimeTag,
    evidence: [...new Set(evidence)],
    software: input.software,
    processingSoftware: input.processingSoftware,
    creatorTool: input.creatorTool,
    documentId: input.documentId,
    originalDocumentId: input.originalDocumentId,
    instanceId: input.instanceId,
    xmpHistory: input.xmpHistory.length > 0 ? input.xmpHistory : null,
    isRaw: input.isRaw,
    originalMimeType: input.originalMimeType,
    screenshotFilename,
  };
};
