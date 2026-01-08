<template>
  <a
    :href="data.url"
    target="_blank"
    tabindex="-1"
    class="group my-3.5 flex items-stretch border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden no-underline"
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
      class="relative w-21 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white/60 dark:bg-neutral-900/60 backdrop-blur"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <UIcon
          :name="isGitHub ? 'i-hugeicons:github' : 'i-hugeicons:image-02'"
          class="text-dimmed/40 size-8"
        />
      </div>
    </div>

    <div
      class="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-1 bg-white dark:bg-neutral-900"
    >
      <div class="text-sm font-bold line-clamp-1 w-full">
        {{ data.title }}
      </div>

      <div class="text-xs text-dimmed line-clamp-1 w-full">
        {{ data.description }}
      </div>

      <div class="text-[11px] text-dimmed/70 truncate font-mono">
        {{ displayUrl }}
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    url: string;
    title: string;
    description: string;
    siteName: string;
  };
  linkImage?: string;
}>();

const isLoaded = ref(false);

const handleLoad = () => {
  isLoaded.value = true;
};

// 判断是否为 GitHub 链接
const isGitHub = computed(() => {
  try {
    const host = new URL(props.data.url).hostname;
    return host === 'github.com' || host.endsWith('.github.com');
  } catch {
    return false;
  }
});

const displayUrl = computed(() => {
  try {
    const urlObj = new URL(props.data.url);
    const host = urlObj.hostname;

    // 如果是 github.com，只保留域名 (例如: github.com)
    if (host === 'github.com') {
      return host;
    }

    // 其他情况：移除协议和末尾斜杠 (例如: domain.com/path/to/resource)
    return props.data.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  } catch {
    // 降级处理：如果 URL 格式非法，执行简单的字符串替换
    return props.data.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
});
</script>
