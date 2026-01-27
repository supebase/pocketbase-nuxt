<template>
  <div class="relative mt-6 min-h-[40vh]">
    <PostToc v-if="toc" :toc="toc" />

    <div class="relative w-full">
      <div
        v-if="!isReady"
        class="absolute inset-0 flex items-center justify-center pt-[10vh] text-muted text-sm tracking-widest uppercase animate-pulse"
      >
        正在努力排版 ...
      </div>

      <div v-if="ast" ref="contentRef" class="post-content-wrapper" :class="{ 'is-visible': isReady }" :key="postId">
        <MDCRenderer :body="ast.body" :data="ast.data" class="prose prose-neutral dark:prose-invert max-w-none px-2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ postId: string; toc: any; ast: any }>();
const emit = defineEmits(['rendered']);

const contentRef = ref<HTMLElement | null>(null);
const isReady = ref(false);

const triggerShow = () => {
  if (isReady.value) return;
  // 给一帧延迟，确保 DOM 已经挂载，CSS transition 能生效
  requestAnimationFrame(() => {
    isReady.value = true;
    emit('rendered');
  });
};

watch(
  () => props.ast,
  (newAst) => {
    if (newAst) {
      nextTick(() => startObserving());
    }
  },
  { immediate: true },
);

function startObserving() {
  const el = contentRef.value;
  if (!el) return;

  // 1. 定义检查函数：只要发现有子元素（无论层级多深）就视为内容已注入
  const checkContent = () => {
    // 检查 el 内部是否有任何非空节点，或者特定的 prose 类
    const content = el.querySelector('.prose');
    return content && content.childNodes.length > 0;
  };

  // 2. 如果已经有内容了（SSR 场景或缓存）
  if (checkContent()) {
    triggerShow();
    return;
  }

  // 3. 核心修正：监听 subtree，因为 .prose 本身也是异步注入的
  const observer = new MutationObserver((mutations, obs) => {
    if (checkContent()) {
      triggerShow();
      obs.disconnect(); // 动画一旦开始，立即断开监听
    }
  });

  // 必须开启 subtree: true，因为我们要监测 el 深层结构的变化
  observer.observe(el, {
    childList: true,
    subtree: true,
  });

  // 兜底：如果 3 秒还是空，可能渲染失败或确实没内容
  setTimeout(() => observer.disconnect(), 3000);
}

onMounted(() => startObserving());
</script>
