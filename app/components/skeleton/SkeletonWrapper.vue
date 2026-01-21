<template>
  <div :class="['mask-b-from-10 animate-pulse opacity-50 w-full', containerClass]">
    <SkeletonBase :config="config" />
  </div>
</template>

<script setup lang="ts">
import { SKELETON_COMMENTS, SKELETON_POSTS, SKELETON_ARTICLE } from '~/utils/skeleton/skeleton-generator';
import type { SkeletonType } from '~/types/skeleton-types';

const props = withDefaults(defineProps<SkeletonType>(), {
  count: 1,
  containerClass: '',
});

const config = computed(() => {
  switch (props.type) {
    case 'comments':
      return SKELETON_COMMENTS;
    case 'posts':
      return SKELETON_POSTS(props.count);
    case 'post':
      return SKELETON_ARTICLE(true); // 带作者信息
    case 'mdc':
      return SKELETON_ARTICLE(false); // 纯文档模式
    default:
      return [];
  }
});
</script>
