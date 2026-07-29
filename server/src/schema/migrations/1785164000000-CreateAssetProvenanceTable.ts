import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_provenance" (
  "assetId" uuid NOT NULL,
  "provenance" character varying NOT NULL,
  "confidence" character varying NOT NULL,
  "classifierVersion" integer NOT NULL,
  "captureTimeSource" character varying NOT NULL,
  "captureTimeTag" character varying,
  "evidence" character varying[] NOT NULL,
  "software" text,
  "processingSoftware" text,
  "creatorTool" text,
  "documentId" text,
  "originalDocumentId" text,
  "instanceId" text,
  "xmpHistory" text[],
  "isRaw" boolean NOT NULL,
  "originalMimeType" character varying NOT NULL,
  "screenshotFilename" character varying,
  CONSTRAINT "asset_provenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "asset_provenance_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_provenance";`.execute(db);
}
