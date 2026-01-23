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

    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="font-semibold">{{ poll ? '开启投票 PK' : '关闭投票 PK' }}</span>
        <p class="text-muted/70">
          {{ poll ? '用户可以对该内容进行投票' : '用户将会无法对该内容进行投票' }}
        </p>
      </div>
      <USwitch v-model="poll" color="neutral" />
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="font-semibold">{{ reactions ? '开启反应表情' : '关闭反应表情' }}</span>
        <p class="text-muted/70">
          {{ reactions ? '用户可以对该内容发送反应表情' : '用户将会无法对该内容发送反应表情' }}
        </p>
      </div>
      <USwitch v-model="reactions" color="neutral" />
    </div>
  </div>
</template>

<script setup lang="ts">
const published = defineModel<boolean>('published');
const poll = defineModel<boolean>('poll');
const reactions = defineModel<boolean>('reactions');
const allowComment = defineModel<boolean>('allowComment');
</script>
