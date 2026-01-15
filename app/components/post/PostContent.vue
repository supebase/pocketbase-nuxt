<template>
  <div class="relative mt-6 min-h-[60vh]">
    <div :class="['transition-opacity duration-500', !mdcReady ? 'opacity-0 pointer-events-none' : 'opacity-100']">
      <PostToc :toc="toc" />

      <MDCRenderer
        v-if="ast"
        :key="postId"
        :body="ast.body"
        :data="ast.data"
        class="prose prose-neutral overflow-x-hidden px-2 prose-base prose-blockquote:text-muted prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:-ml-2.25 dark:prose-invert leading-7 max-w-none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  postId: string;
  mdcReady: boolean;
  toc: any;
  ast: any;
}>();
</script>
