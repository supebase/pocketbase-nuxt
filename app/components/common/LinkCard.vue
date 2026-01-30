<template>
  <UCard
    as="a"
    :href="data.url"
    target="_blank"
    tabindex="-1"
    :ui="{
      root: 'group my-3.5 flex items-stretch ring-0 rounded-xl overflow-hidden no-underline shadow-none bg-transparent',
      body: 'p-0! flex items-stretch w-full',
    }"
  >
    <div
      class="relative w-22.25 shrink-0 overflow-hidden border-r border-white dark:border-neutral-900 bg-neutral-200/50 dark:bg-neutral-800/80 backdrop-blur"
    >
      <template v-if="linkImage">
        <div class="relative w-full h-full">
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
            <UIcon name="i-hugeicons:refresh" class="size-5 text-dimmed animate-spin" />
          </div>
        </div>
      </template>

      <div v-else class="absolute inset-0 flex items-center justify-center">
        <UIcon :name="isGitHub ? 'i-hugeicons:github' : 'i-hugeicons:image-02'" class="text-muted/20 size-8" />
      </div>
    </div>

    <div
      class="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-1 bg-neutral-200/30 dark:bg-neutral-800/50 backdrop-blur"
    >
      <div class="text-[15px] text-default font-bold line-clamp-1 w-full">
        {{ cleanTitle }}
      </div>

      <div class="text-[13px] text-muted/70 font-medium tracking-wide line-clamp-1 w-full">
        {{ data.description }}
      </div>

      <div class="text-[10px] text-dimmed/70 truncate uppercase font-mono">
        {{ displayUrl }}
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { LinkPreviewData } from '~/types';

const props = defineProps<{
  data: LinkPreviewData;
  linkImage?: string;
}>();

const isLoaded = ref(false);

const isGitHub = computed(() => isGitHubUrl(props.data.url));
const cleanTitle = computed(() => formatLinkTitle(props.data.title || '', props.data.url));
const displayUrl = computed(() => formatDisplayUrl(props.data.url));
</script>
