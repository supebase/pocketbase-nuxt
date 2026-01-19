<template>
  <div class="flex flex-col items-center justify-center gap-3 px-2 select-none">
    <PostMeta :post-meta="post" :avatar-id="post.expand?.user?.avatar" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  post: any;
}>();
</script>
