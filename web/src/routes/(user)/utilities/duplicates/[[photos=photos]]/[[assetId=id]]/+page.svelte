<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcuts } from '$lib/actions/shortcut';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import LinkToDocs from './LinkToDocs.svelte';
  import DuplicatesCompareControl from './DuplicatesCompareControl.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getDuplicateBulkResolutionPlan } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { createStack, deleteDuplicates, resolveDuplicates, updateAssets } from '@immich/sdk';
  import { Button, HStack, IconButton, modalManager, Text, toastManager } from '@immich/ui';
  import {
    mdiCheckOutline,
    mdiChevronLeft,
    mdiChevronRight,
    mdiKeyboard,
    mdiPageFirst,
    mdiPageLast,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  interface Shortcuts {
    general: ExplainedShortcut[];
    actions: ExplainedShortcut[];
  }
  interface ExplainedShortcut {
    key: string[];
    action: string;
    info?: string;
  }

  const duplicateShortcuts: Shortcuts = {
    general: [],
    actions: [
      { key: ['a'], action: $t('select_all_duplicates') },
      { key: ['s'], action: $t('view') },
      { key: ['d'], action: $t('unselect_all_duplicates') },
      { key: ['⇧', 'c'], action: $t('resolve_duplicates') },
      { key: ['⇧', 's'], action: $t('stack_duplicates') },
    ],
  };

  let duplicates = $state(data.duplicates);

  const correctDuplicatesIndex = (index: number) => {
    return Math.max(0, Math.min(index, duplicates.length - 1));
  };

  let duplicatesIndex = $derived(
    (() => {
      const indexParam = page.url.searchParams.get('index') ?? '0';
      const parsedIndex = Number.parseInt(indexParam, 10);
      return correctDuplicatesIndex(Number.isNaN(parsedIndex) ? 0 : parsedIndex);
    })(),
  );

  let hasDuplicates = $derived(duplicates.length > 0);
  const withConfirmation = async (callback: () => Promise<void>, prompt?: string, confirmText?: string) => {
    if (prompt && confirmText) {
      const isConfirmed = await modalManager.showDialog({ prompt, confirmText });
      if (!isConfirmed) {
        return;
      }
    }

    try {
      return await callback();
    } catch (error) {
      handleError(error, $t('errors.unable_to_resolve_duplicate'));
    }
  };

  const deletedNotification = (trashedCount: number) => {
    if (!trashedCount) {
      return;
    }

    toastManager.primary($t('assets_moved_to_trash_count', { values: { count: trashedCount } }));
  };

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    return withConfirmation(async () => {
      const keepAssetIds = duplicateAssetIds.filter((id) => !trashIds.includes(id));

      const response = await resolveDuplicates({
        duplicateResolveDto: {
          groups: [{ duplicateId, keepAssetIds, trashAssetIds: trashIds }],
        },
      });

      const { success, error, errorMessage } = response[0];
      if (!success) {
        throw new Error(errorMessage || error);
      }

      duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
      deletedNotification(trashIds.length);
      await navigateToIndex(duplicatesIndex);
    });
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    const assetIds = assets.map((asset) => asset.id);
    await createStack({ stackCreateDto: { assetIds } });
    await updateAssets({ assetBulkUpdateDto: { ids: assetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
    await navigateToIndex(duplicatesIndex);
  };

  const handleDeduplicateAll = async () => {
    const plan = getDuplicateBulkResolutionPlan(duplicates);
    if (plan.groups.length === 0) {
      toastManager.primary(
        $t('duplicate_bulk_resolution_result', {
          values: { resolved: 0, skipped: plan.skippedGroupCount },
        }),
      );
      return;
    }

    return withConfirmation(
      async () => {
        const response = await resolveDuplicates({
          duplicateResolveDto: { groups: plan.groups },
        });
        const successfulGroupIds = new Set(response.filter(({ success }) => success).map(({ id }) => id));
        const failedCount = response.length - successfulGroupIds.size;
        const trashedCount = plan.groups
          .filter(({ duplicateId }) => successfulGroupIds.has(duplicateId))
          .reduce((count, { trashAssetIds }) => count + trashAssetIds.length, 0);

        duplicates = duplicates.filter(({ duplicateId }) => !successfulGroupIds.has(duplicateId));
        deletedNotification(trashedCount);
        toastManager.primary(
          $t('duplicate_bulk_resolution_result', {
            values: {
              resolved: successfulGroupIds.size,
              skipped: plan.skippedGroupCount + failedCount,
            },
          }),
        );

        if (duplicates.length === 0) {
          page.url.searchParams.delete('index');
          await goto(Route.duplicatesUtility());
        } else {
          await navigateToIndex(duplicatesIndex);
        }
      },
      $t('bulk_trash_duplicates_confirmation', { values: { count: plan.trashAssetIds.length } }),
      $t('confirm'),
    );
  };

  const handleKeepAll = async () => {
    const ids = duplicates.map(({ duplicateId }) => duplicateId);
    return withConfirmation(
      async () => {
        await deleteDuplicates({ bulkIdsDto: { ids } });

        duplicates = [];

        toastManager.primary($t('resolved_all_duplicates'));
        page.url.searchParams.delete('index');
        await goto(Route.duplicatesUtility());
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count: ids.length } }),
      $t('confirm'),
    );
  };

  const handleFirst = () => navigateToIndex(0);
  const handlePrevious = () => navigateToIndex(Math.max(duplicatesIndex - 1, 0));
  const handleNext = async () => navigateToIndex(Math.min(duplicatesIndex + 1, duplicates.length - 1));
  const handleLast = () => navigateToIndex(duplicates.length - 1);

  const navigateToIndex = async (index: number) =>
    goto(Route.duplicatesUtility({ index: correctDuplicatesIndex(index) }));
</script>

<svelte:document
  use:shortcuts={assetViewerManager.isViewing
    ? []
    : [
        { shortcut: { key: 'ArrowLeft' }, onShortcut: handlePrevious },
        { shortcut: { key: 'ArrowRight' }, onShortcut: handleNext },
      ]}
/>

<UserPageLayout title={data.meta.title + ` (${duplicates.length.toLocaleString($locale)})`} scrollbar={true}>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        leadingIcon={mdiTrashCanOutline}
        onclick={() => handleDeduplicateAll()}
        disabled={!hasDuplicates}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('deduplicate_all')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCheckOutline}
        onclick={() => handleKeepAll()}
        disabled={!hasDuplicates}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('keep_all')}</Text>
      </Button>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        icon={mdiKeyboard}
        title={$t('show_keyboard_shortcuts')}
        onclick={() => modalManager.show(ShortcutsModal, { shortcuts: duplicateShortcuts })}
        aria-label={$t('show_keyboard_shortcuts')}
      />
    </HStack>
  {/snippet}

  <div>
    {#if duplicates && duplicates.length > 0}
      <Text size="small" color="muted" class="mb-4">
        <p>{$t('duplicates_description')} <LinkToDocs href="https://docs.immich.app/features/duplicates-utility" /></p>
      </Text>

      {#key duplicates[duplicatesIndex].duplicateId}
        <DuplicatesCompareControl
          assets={duplicates[duplicatesIndex].assets}
          assessments={duplicates[duplicatesIndex].assessments}
          suggestedKeepAssetIds={duplicates[duplicatesIndex].suggestedKeepAssetIds}
          onResolve={(duplicateAssetIds, trashIds) =>
            handleResolve(duplicates[duplicatesIndex].duplicateId, duplicateAssetIds, trashIds)}
          onStack={(assets) => handleStack(duplicates[duplicatesIndex].duplicateId, assets)}
        />
        <div class="mb-16 w-full max-w-none">
          <div class="mb-4 flex w-full place-content-center place-items-center items-center justify-between sm:px-6">
            <div class="flex text-xs text-black">
              <Button
                size="small"
                leadingIcon={mdiPageFirst}
                color="primary"
                class="flex place-items-center gap-2 rounded-s-full px-2 sm:px-4"
                onclick={handleFirst}
                disabled={duplicatesIndex === 0}
              >
                {$t('first')}
              </Button>
              <Button
                size="small"
                leadingIcon={mdiChevronLeft}
                color="primary"
                class="flex place-items-center gap-2 rounded-e-full px-2 sm:px-4"
                onclick={handlePrevious}
                disabled={duplicatesIndex === 0}
              >
                {$t('previous')}
              </Button>
            </div>
            <p class="rounded-lg border px-3 py-1 text-xs md:px-6 md:text-sm dark:bg-subtle">
              {duplicatesIndex + 1} / {duplicates.length.toLocaleString($locale)}
            </p>
            <div class="flex text-xs text-black">
              <Button
                size="small"
                trailingIcon={mdiChevronRight}
                color="primary"
                class="flex place-items-center gap-2 rounded-s-full px-2 sm:px-4"
                onclick={handleNext}
                disabled={duplicatesIndex === duplicates.length - 1}
              >
                {$t('next')}
              </Button>
              <Button
                size="small"
                trailingIcon={mdiPageLast}
                color="primary"
                class="flex place-items-center gap-2 rounded-e-full px-2 sm:px-4"
                onclick={handleLast}
                disabled={duplicatesIndex === duplicates.length - 1}
              >
                {$t('last')}
              </Button>
            </div>
          </div>
        </div>
      {/key}
    {:else}
      <p class="flex place-content-center place-items-center text-center text-lg dark:text-white">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>
