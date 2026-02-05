<template>
  <div class="flex flex-col items-center justify-center gap-3 px-2 select-none">
    <PostMeta
      :post-meta="post"
      :avatar-id="post.expand?.user?.avatar"
      :avatar-github="post.expand?.user?.avatar_github"
      :user-id="post.expand?.user?.id"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  post: any;
}>();
</script>
