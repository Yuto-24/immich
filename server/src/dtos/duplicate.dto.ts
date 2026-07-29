import { createZodDto } from 'nestjs-zod';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import { AssetProvenanceSchema, CaptureTimeSourceSchema, ProvenanceConfidenceSchema } from 'src/enum';
import z from 'zod';

const DuplicateAssetAssessmentSchema = z
  .object({
    assetId: z.uuidv4().describe('Assessed asset ID'),
    provenance: AssetProvenanceSchema,
    confidence: ProvenanceConfidenceSchema,
    classifierVersion: z.int().min(0).describe('Version of the provenance classifier'),
    captureTimeSource: CaptureTimeSourceSchema,
    evidence: z.array(z.string()).describe('Human-readable provenance evidence'),
    recommendedAction: z.enum(['keep', 'trash', 'review']).describe('Recommended action for this asset'),
  })
  .meta({ id: 'DuplicateAssetAssessmentDto' });

const DuplicateResponseSchema = z
  .object({
    duplicateId: z.uuidv4().describe('Duplicate group ID'),
    assets: z.array(AssetResponseSchema).describe('Duplicate assets'),
    suggestedKeepAssetIds: z
      .array(z.uuidv4())
      .describe('Suggested asset IDs to keep based on provenance and reversibility'),
    autoResolvable: z.boolean().describe('Whether the group can be resolved automatically without manual review'),
    assessments: z.array(DuplicateAssetAssessmentSchema).describe('Provenance assessment for every duplicate asset'),
    groupDate: z.string().meta({ format: 'date-time' }).describe('Stable representative date used to sort groups'),
  })
  .meta({ id: 'DuplicateResponseDto' });

const DuplicateResolveGroupSchema = z
  .object({
    duplicateId: z.uuidv4(),
    keepAssetIds: z.array(z.uuidv4()).describe('Asset IDs to keep'),
    trashAssetIds: z.array(z.uuidv4()).describe('Asset IDs to trash or delete'),
    autoResolve: z
      .boolean()
      .optional()
      .describe('Require the server to verify that this group is safe for automatic resolution'),
  })
  .meta({ id: 'DuplicateResolveGroupDto' });

const DuplicateResolveSchema = z
  .object({
    groups: z.array(DuplicateResolveGroupSchema).min(1).describe('List of duplicate groups to resolve'),
  })
  .meta({ id: 'DuplicateResolveDto' });

export class DuplicateAssetAssessmentDto extends createZodDto(DuplicateAssetAssessmentSchema) {}
export class DuplicateResponseDto extends createZodDto(DuplicateResponseSchema) {}
export class DuplicateResolveGroupDto extends createZodDto(DuplicateResolveGroupSchema) {}
export class DuplicateResolveDto extends createZodDto(DuplicateResolveSchema) {}
