<template>
  <UCard
    as="a"
    :href="data.url"
    target="_blank"
    tabindex="-1"
    :ui="{
      root: 'group my-3.5 flex items-stretch ring-0 rounded-lg overflow-hidden no-underline shadow-none bg-transparent',
      body: 'p-0! flex items-stretch w-full',
    }"
  >
    <div
      class="relative w-21 shrink-0 overflow-hidden border-r border-white dark:border-neutral-900 bg-neutral-200/50 dark:bg-neutral-950/50 backdrop-blur"
    >
      <template v-if="linkImage">
        <div class="relative w-full h-full bg-neutral-100 dark:bg-neutral-900">
          <img
            :src="linkImage"
            @load="isLoaded = true"
            :class="[
              'w-full h-full object-cover transition-all duration-700 ease-in-out',
              isLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-xl scale-110 opacity-0',
            ]"
            alt="preview"
            loading="lazy"
          />
          <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
            <UIcon name="i-hugeicons:refresh" class="size-5 text-neutral-400/30 animate-spin" />
          </div>
        </div>
      </template>

      <div v-else class="absolute inset-0 flex items-center justify-center">
        <UIcon :name="isGitHub ? 'i-hugeicons:github' : 'i-hugeicons:image-02'" class="text-neutral-400/30 size-8" />
      </div>
    </div>

    <div
      class="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-1 bg-neutral-200/30 dark:bg-neutral-950/30 backdrop-blur"
    >
      <div class="text-sm text-neutral-900 dark:text-neutral-100 font-bold line-clamp-1 w-full">
        {{ cleanTitle }}
      </div>

      <div class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 w-full">
        {{ data.description }}
      </div>

      <div class="text-[11px] text-neutral-400/80 truncate font-mono">
        {{ displayUrl }}
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { LinkPreviewData } from '~/types/posts';

const props = defineProps<{
  data: LinkPreviewData;
  linkImage?: string;
}>();

const isLoaded = ref(false);

const isGitHub = computed(() => isGitHubUrl(props.data.url));
const cleanTitle = computed(() => formatLinkTitle(props.data.title || '', props.data.url));
const displayUrl = computed(() => formatDisplayUrl(props.data.url));
</script>
