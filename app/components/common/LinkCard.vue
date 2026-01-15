<template>
  <a
    :href="data.url"
    target="_blank"
    tabindex="-1"
    class="group my-3.5 flex items-stretch border border-neutral-200/80 dark:border-neutral-700/70 rounded-lg overflow-hidden no-underline"
  >
    <div
      v-if="linkImage"
      class="relative w-21 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden"
    >
      <div class="relative w-full h-full bg-neutral-100 dark:bg-neutral-900">
        <img
          :src="linkImage"
          @load="handleLoad"
          :class="[
            'w-full h-full object-cover transition-all duration-700 ease-in-out',
            isLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-xl scale-110 opacity-0',
          ]"
          alt="preview"
          loading="lazy"
        />

        <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
          <UIcon name="i-hugeicons:refresh" class="size-5 text-muted/30 animate-spin" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="relative w-21 shrink-0 border-r border-neutral-200/80 dark:border-neutral-700/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-800/50 backdrop-blur"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <UIcon :name="isGitHub ? 'i-hugeicons:github' : 'i-hugeicons:image-02'" class="text-dimmed/30 size-8" />
      </div>
    </div>

    <div class="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-1 bg-white dark:bg-neutral-900">
      <div class="text-sm text-default font-bold line-clamp-1 w-full">
        {{ cleanTitle }}
      </div>

      <div class="text-xs text-muted line-clamp-1 w-full">
        {{ data.description }}
      </div>

      <div class="text-[11px] text-dimmed/80 truncate font-mono">
        {{ displayUrl }}
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import type { LinkPreviewData } from '~/types/posts';

const props = defineProps<{
  data: LinkPreviewData;
  linkImage?: string;
}>();

const isLoaded = ref(false);

const handleLoad = () => {
  isLoaded.value = true;
};

const isGitHub = computed(() => isGitHubUrl(props.data.url));
const cleanTitle = computed(() => formatLinkTitle(props.data.title || '', props.data.url));
const displayUrl = computed(() => formatDisplayUrl(props.data.url));
</script>
