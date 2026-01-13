<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="font-semibold">{{ published ? '正式发布' : '保存草稿' }}</span>
        <p class="text-muted/70">
          {{ published ? '对全体用户可见，完成公开展示' : '内容仅自己可见，随时编辑调整' }}
        </p>
      </div>
      <USwitch v-model="published" color="neutral" />
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="font-semibold">{{ allowComment ? '允许评论' : '禁止评论' }}</span>
        <p class="text-muted/70">
          {{ allowComment ? '用户可以对该内容进行评论互动' : '用户将会无法对该内容发表评论' }}
        </p>
      </div>
      <USwitch v-model="allowComment" color="neutral" />
    </div>
  </div>
</template>

<script setup lang="ts">
const published = defineModel<boolean>('published');
const allowComment = defineModel<boolean>('allowComment');
</script>
