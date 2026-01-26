<template>
  <div ref="target" class="flex mt-2.5 h-6">
    <div v-if="status === 'pending' && totalCount === 0" class="flex items-center">
      <UIcon name="i-hugeicons:refresh" class="size-4.5 text-dimmed animate-spin" />
    </div>

    <Transition name="slide-right-fancy" mode="out-in">
      <div v-if="totalCount > 0" :key="1">
        <div class="flex items-center">
          <div class="flex -space-x-1 overflow-hidden">
            <div
              v-for="(avatar, index) in avatarList"
              :key="avatar"
              class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
              :style="{ zIndex: 10 - (index as number) }"
            >
              <CommonGravatar :avatar-id="avatar" :size="32" />
            </div>
          </div>
          <UBadge
            v-if="totalCount > 1"
            variant="soft"
            size="sm"
            color="neutral"
            class="rounded-xl text-muted text-xs ml-1.5"
            >+{{ totalCount }}</UBadge
          >
          <span class="text-sm font-medium text-dimmed ml-2 truncate max-w-40">
            {{ !allowComment ? '评论已关闭' : totalCount === 1 ? `${lastUserName} 发表了评论` : '参与了评论' }}
          </span>
        </div>
      </div>

      <div v-else-if="status !== 'pending'" :key="2" class="flex items-center gap-2 text-sm text-dimmed">
        <UIcon :name="!allowComment ? 'i-hugeicons:comment-block-02' : 'i-hugeicons:comment-02'" class="size-4.5" />
        <span class="text-sm">{{ !allowComment ? '评论已关闭' : '暂无评论' }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  allowComment: {
    type: Boolean,
    default: true,
  },
});

const { target, isRendered, status, avatarList, totalCount, lastUserName } = useCommentStats(props.postId);

const { stop } = useIntersectionObserver(target, ([entry]) => {
  if (entry?.isIntersecting) {
    isRendered.value = true;
    stop();
  }
});
</script>
