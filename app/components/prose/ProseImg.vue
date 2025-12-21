<template>
  <div class="rounded-xl overflow-clip ring-1 ring-neutral-200 dark:ring-neutral-800">
    <component :is="ImageComponent" :src="refinedSrc" placeholder preset="preview" :custom="true">
      <template #default="{ src, isLoaded, imgAttrs }">
        <div class="relative overflow-clip">
          <img
            v-bind="imgAttrs"
            :src="src"
            :class="[
              'w-full h-full object-cover transition-all duration-700 ease-in-out',
              isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
              'group-hover:scale-105',
            ]"
          />

          <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
            <UIcon name="i-hugeicons:refresh" class="size-5 text-primary/30 animate-spin" />
          </div>
        </div>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
  import { withTrailingSlash, withLeadingSlash, joinURL } from 'ufo';
  import { useRuntimeConfig, computed } from '#imports';

  import ImageComponent from '#build/mdc-image-component.mjs';

  const props = defineProps({
    src: {
      type: String,
      default: '',
    },
  });

  const refinedSrc = computed(() => {
    if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
      const _base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL));
      if (_base !== '/' && !props.src.startsWith(_base)) {
        return joinURL(_base, props.src);
      }
    }
    return props.src;
  });
</script>
