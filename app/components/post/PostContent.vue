<template>
  <div class="relative mt-6 min-h-120">
    <div :class="['transition-opacity duration-500', !mdcReady ? 'opacity-10 pointer-events-none' : 'opacity-100']">
      <PostToc :toc="toc" />

      <MDCRenderer
        v-if="ast"
        :key="postId"
        :body="ast.body"
        :data="ast.data"
        class="prose prose-neutral prose-base dark:prose-invert max-w-none"
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
