import { Column, ForeignKeyColumn, Table } from '@immich/sql-tools';
import { AssetProvenance, CaptureTimeSource, ProvenanceConfidence } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_provenance')
export class AssetProvenanceTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'character varying' })
  provenance!: AssetProvenance;

  @Column({ type: 'character varying' })
  confidence!: ProvenanceConfidence;

  @Column({ type: 'integer' })
  classifierVersion!: number;

  @Column({ type: 'character varying' })
  captureTimeSource!: CaptureTimeSource;

  @Column({ type: 'character varying', nullable: true })
  captureTimeTag!: string | null;

  @Column({ type: 'character varying', array: true })
  evidence!: string[];

  @Column({ type: 'text', nullable: true })
  software!: string | null;

  @Column({ type: 'text', nullable: true })
  processingSoftware!: string | null;

  @Column({ type: 'text', nullable: true })
  creatorTool!: string | null;

  @Column({ type: 'text', nullable: true })
  documentId!: string | null;

  @Column({ type: 'text', nullable: true })
  originalDocumentId!: string | null;

  @Column({ type: 'text', nullable: true })
  instanceId!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  xmpHistory!: string[] | null;

  @Column({ type: 'boolean' })
  isRaw!: boolean;

  @Column({ type: 'character varying' })
  originalMimeType!: string;

  @Column({ type: 'character varying', nullable: true })
  screenshotFilename!: string | null;
}
