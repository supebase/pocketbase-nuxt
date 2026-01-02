<template>
  <div
    class="rounded-lg overflow-clip border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
  >
    <div class="relative overflow-clip">
      <img
        :src="refinedSrc"
        @load="isLoaded = true"
        loading="lazy"
        :class="[
          'w-full h-full object-cover transition-all duration-700 ease-in-out',
          isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
          'hover:scale-105',
        ]"
        alt="image"
      />

      <div
        v-if="!isLoaded"
        class="absolute inset-0 flex items-center justify-center"
      >
        <UIcon
          name="i-hugeicons:refresh"
          class="size-5 text-muted animate-spin"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { withTrailingSlash, withLeadingSlash, joinURL } from 'ufo';
  import { useRuntimeConfig, computed, ref } from '#imports';

  const props = defineProps({
    src: {
      type: String,
      default: '',
    },
  });

  // 手动管理加载状态
  const isLoaded = ref(false);

  // 保持原有的路径处理逻辑不变
  const refinedSrc = computed(() => {
    if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
      const _base = withLeadingSlash(
        withTrailingSlash(useRuntimeConfig().app.baseURL),
      );
	  
      if (_base !== '/' && !props.src.startsWith(_base)) {
        return joinURL(_base, props.src);
      }
    }

    return props.src;
  });
</script>
