<template>
  <div class="relative mt-6 min-h-[40vh]">
    <PostToc v-if="toc" :toc="toc" />

    <div class="relative w-full">
      <div
        v-if="!animationFinished"
        class="post-skeleton-wrapper"
        :class="{ 'opacity-0 transition-opacity duration-300': animationStarted }"
      >
        <SkeletonWrapper type="mdc" />
      </div>

      <div v-if="ast" ref="contentRef" class="post-content-wrapper ready-to-animate" :key="postId">
        <MDCRenderer
          :body="ast.body"
          :data="ast.data"
          class="prose prose-neutral overflow-x-hidden px-2 prose-base prose-blockquote:text-muted prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:-ml-2.25 dark:prose-invert leading-7 max-w-none"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ postId: string; toc: any; ast: any }>();

const emit = defineEmits<{
  rendered: [];
}>();

const contentRef = ref<HTMLElement | null>(null);
const animationStarted = ref(false);
const animationFinished = ref(false);

const animateEntrance = (el: HTMLElement) => {
  if (animationStarted.value) return;
  animationStarted.value = true;

  el.animate(
    [
      { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
    ],
    {
      duration: 500, // 稍微拉长，让过渡更丝滑
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  ).finished.then(() => {
    animationFinished.value = true; // 此时才彻底移除骨架屏 DOM
    emit('rendered');
  });
};

// 监听内容注入的核心逻辑
watch(
  () => props.ast,
  (newAst) => {
    if (newAst) {
      nextTick(() => {
        startObserving();
      });
    }
  },
  { immediate: true },
);

function startObserving() {
  const el = contentRef.value;
  if (!el) return;

  // 如果已经有内容了（SSR 场景）
  if (el.children.length > 0) {
    animateEntrance(el);
    return;
  }

  // 慢速网络场景：监听 MDCRenderer 往里面塞东西的那一刻
  const observer = new MutationObserver((mutations, obs) => {
    if (el.children.length > 0) {
      animateEntrance(el);
      obs.disconnect(); // 动画一旦开始，停止监听
    }
  });

  observer.observe(el, { childList: true, subtree: true });
  // 如果 3 秒后还没渲染出来，强制停止监听并显示，防止内容死锁
  setTimeout(() => observer.disconnect(), 3000);
}

onMounted(() => startObserving());
</script>
