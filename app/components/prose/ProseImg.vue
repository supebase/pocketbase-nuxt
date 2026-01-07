<template>
  <div class="my-6">
    <div
      class="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 cursor-zoom-in relative"
      @click="isExpanded = true"
    >
      <img
        :src="refinedSrc"
        @load="isLoaded = true"
        loading="lazy"
        :class="[
          'w-full h-auto block transition-all duration-700 ease-in-out',
          isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
          'hover:scale-105',
        ]"
        v-bind="$attrs"
      />

      <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
        <UIcon name="i-hugeicons:refresh" class="size-5 text-muted animate-spin" />
      </div>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isExpanded"
          class="fixed inset-0 z-9999 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md cursor-zoom-out"
          @click="isExpanded = false"
        >
          <img
            :src="refinedSrc"
            class="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl rounded-sm transition-transform duration-300"
            :class="isExpanded ? 'scale-100' : 'scale-95'"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { withTrailingSlash, withLeadingSlash, joinURL } from 'ufo';
import { useRuntimeConfig, computed, ref, onMounted, onUnmounted } from '#imports';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
});

const isLoaded = ref(false);
const isExpanded = ref(false);

// 处理 ESC 键关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') isExpanded.value = false;
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

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
