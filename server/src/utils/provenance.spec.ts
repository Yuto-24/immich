import { AssetProvenance, CaptureTimeSource, ProvenanceConfidence } from 'src/enum';
import { AssetProvenanceClassificationInput, classifyAssetProvenance } from 'src/utils/provenance';
import { describe, expect, it } from 'vitest';

const createInput = (
  overrides: Partial<AssetProvenanceClassificationInput> = {},
): AssetProvenanceClassificationInput => ({
  assetId: 'asset-id',
  originalFileName: 'IMG_0001.jpg',
  originalMimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  make: null,
  model: null,
  iso: null,
  exposureTime: null,
  fNumber: null,
  focalLength: null,
  lensModel: null,
  isRaw: false,
  captureTimeSource: CaptureTimeSource.Filesystem,
  captureTimeTag: null,
  software: null,
  processingSoftware: null,
  creatorTool: null,
  documentId: null,
  originalDocumentId: null,
  instanceId: null,
  xmpHistory: [],
  ...overrides,
});

describe(classifyAssetProvenance.name, () => {
  it('classifies RAW with camera data as a high-confidence camera original', () => {
    const result = classifyAssetProvenance(createInput({ isRaw: true, make: 'Canon', model: 'EOS R5' }));
    expect(result.provenance).toBe(AssetProvenance.CameraOriginal);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
  });

  it('classifies camera data with embedded capture time as a high-confidence camera original', () => {
    const result = classifyAssetProvenance(
      createInput({ make: 'Nikon', captureTimeSource: CaptureTimeSource.EmbeddedExif }),
    );
    expect(result.provenance).toBe(AssetProvenance.CameraOriginal);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
  });

  it('classifies an edited export before inherited camera metadata', () => {
    const result = classifyAssetProvenance(
      createInput({
        make: 'Sony',
        model: 'ILCE-7M4',
        captureTimeSource: CaptureTimeSource.EmbeddedExif,
        software: 'Adobe Photoshop 26.0',
      }),
    );
    expect(result.provenance).toBe(AssetProvenance.CameraDerived);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
    expect(result.evidence).toContain('Camera metadata was preserved in the derived file');
  });

  it('uses XMP document lineage as high-confidence derived evidence', () => {
    const result = classifyAssetProvenance(
      createInput({ documentId: 'xmp.did:current', originalDocumentId: 'xmp.did:original' }),
    );
    expect(result.provenance).toBe(AssetProvenance.CameraDerived);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
  });

  it('requires combined signals before classifying a screenshot', () => {
    const result = classifyAssetProvenance(
      createInput({
        originalFileName: 'Screenshot 2025-01-02.png',
        originalMimeType: 'image/png',
        width: 1170,
        height: 2532,
      }),
    );
    expect(result.provenance).toBe(AssetProvenance.Screenshot);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
  });

  it('leaves a PNG without strong screenshot evidence unknown', () => {
    const result = classifyAssetProvenance(createInput({ originalMimeType: 'image/png' }));
    expect(result.provenance).toBe(AssetProvenance.Unknown);
    expect(result.confidence).toBe(ProvenanceConfidence.Low);
  });

  it('classifies generative tool metadata as generated', () => {
    const result = classifyAssetProvenance(createInput({ creatorTool: 'Stable Diffusion WebUI' }));
    expect(result.provenance).toBe(AssetProvenance.Generated);
    expect(result.confidence).toBe(ProvenanceConfidence.High);
  });
});
