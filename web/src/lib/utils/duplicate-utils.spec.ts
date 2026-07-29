import type { AssetResponseDto, DuplicateResponseDto } from '@immich/sdk';
import type { MessageFormatter } from 'svelte-i18n';
import {
  getAllMetadataItems,
  getDuplicateBulkResolutionPlan,
  getStringComparisonSegments,
} from '$lib/utils/duplicate-utils';

const translate = ((key: string) => key) as MessageFormatter;

describe('getStringComparisonSegments', () => {
  it('returns no comparisons for no values', () => {
    expect(getStringComparisonSegments([])).toEqual([]);
  });

  it('marks a single value as common', () => {
    expect(getStringComparisonSegments(['photo.jpg'])).toEqual([[{ text: 'photo.jpg', isDifferent: false }]]);
  });

  it('marks identical values as common', () => {
    expect(getStringComparisonSegments(['photo.jpg', 'photo.jpg'])).toEqual([
      [{ text: 'photo.jpg', isDifferent: false }],
      [{ text: 'photo.jpg', isDifferent: false }],
    ]);
  });

  it('compares stable prefixes and suffixes across more than two values', () => {
    expect(getStringComparisonSegments(['IMG_001.jpg', 'IMG_002.jpg', 'IMG_backup.jpg'])).toEqual([
      [
        { text: 'IMG_', isDifferent: false },
        { text: '001', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: 'IMG_', isDifferent: false },
        { text: '002', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: 'IMG_', isDifferent: false },
        { text: 'backup', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
    ]);
  });

  it('supports a common prefix without a common suffix', () => {
    expect(getStringComparisonSegments(['/library/one', '/library/two'])).toEqual([
      [
        { text: '/library/', isDifferent: false },
        { text: 'one', isDifferent: true },
      ],
      [
        { text: '/library/', isDifferent: false },
        { text: 'two', isDifferent: true },
      ],
    ]);
  });

  it('supports a common suffix without a common prefix', () => {
    expect(getStringComparisonSegments(['one/photo.jpg', 'two/photo.jpg'])).toEqual([
      [
        { text: 'one', isDifferent: true },
        { text: '/photo.jpg', isDifferent: false },
      ],
      [
        { text: 'two', isDifferent: true },
        { text: '/photo.jpg', isDifferent: false },
      ],
    ]);
  });

  it('marks completely different values as different', () => {
    expect(getStringComparisonSegments(['alpha', 'bravo'])).toEqual([
      [{ text: 'alpha', isDifferent: true }],
      [{ text: 'bravo', isDifferent: true }],
    ]);
  });

  it('handles empty strings without emitting empty segments', () => {
    expect(getStringComparisonSegments(['', 'photo.jpg'])).toEqual([[], [{ text: 'photo.jpg', isDifferent: true }]]);
    expect(getStringComparisonSegments(['', ''])).toEqual([[], []]);
  });

  it('does not split Unicode grapheme clusters', () => {
    expect(getStringComparisonSegments(['旅行📷1.jpg', '旅行📷2.jpg'])).toEqual([
      [
        { text: '旅行📷', isDifferent: false },
        { text: '1', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: '旅行📷', isDifferent: false },
        { text: '2', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
    ]);

    expect(getStringComparisonSegments(['cafe\u0301.jpg', 'cafe\u0300.jpg'])).toEqual([
      [
        { text: 'caf', isDifferent: false },
        { text: 'e\u0301', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: 'caf', isDifferent: false },
        { text: 'e\u0300', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
    ]);

    expect(getStringComparisonSegments(['☕\uFE0F.jpg', '☕\uFE0E.jpg'])).toEqual([
      [
        { text: '☕\uFE0F', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: '☕\uFE0E', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
    ]);

    expect(getStringComparisonSegments(['family-👨‍👩.jpg', 'family-👨‍👧.jpg'])).toEqual([
      [
        { text: 'family-', isDifferent: false },
        { text: '👨‍👩', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
      [
        { text: 'family-', isDifferent: false },
        { text: '👨‍👧', isDifferent: true },
        { text: '.jpg', isDifferent: false },
      ],
    ]);
  });
});

describe('getAllMetadataItems', () => {
  it('keeps the full path for comparison while preserving the truncated rendered path', () => {
    const originalPath = `/library/${'nested-directory/'.repeat(5)}photo.jpg`;
    const asset = {
      originalFileName: 'photo.jpg',
      originalPath,
      fileCreatedAt: '2025-01-01T00:00:00.000Z',
      fileModifiedAt: '2025-01-01T00:00:00.000Z',
      localDateTime: '2025-01-01T00:00:00.000Z',
    } as AssetResponseDto;

    const items = getAllMetadataItems(asset, translate, 'en');
    const pathItem = items.find(({ keys }) => keys[0] === 'originalPath');

    for (const item of items.filter(({ keys }) => keys[0] !== 'originalPath')) {
      expect(item.comparisonValue).toBe(item.render);
    }
    expect(pathItem?.render).not.toBe(originalPath);
    expect(pathItem?.comparisonValue).toBe(originalPath);
  });
});

describe('getDuplicateBulkResolutionPlan', () => {
  it('skips ambiguous groups and marks only safe groups for server-verified automatic resolution', () => {
    const makeGroup = (duplicateId: string, autoResolvable: boolean): DuplicateResponseDto => ({
      duplicateId,
      autoResolvable,
      groupDate: '2025-01-01T00:00:00.000Z',
      assessments: [],
      suggestedKeepAssetIds: [`${duplicateId}-keep`],
      assets: [{ id: `${duplicateId}-keep` } as AssetResponseDto, { id: `${duplicateId}-trash` } as AssetResponseDto],
    });

    const result = getDuplicateBulkResolutionPlan([makeGroup('safe', true), makeGroup('review', false)]);

    expect(result).toEqual({
      groups: [
        {
          duplicateId: 'safe',
          keepAssetIds: ['safe-keep'],
          trashAssetIds: ['safe-trash'],
          autoResolve: true,
        },
      ],
      trashAssetIds: ['safe-trash'],
      skippedGroupCount: 1,
    });
  });
});
