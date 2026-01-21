<template>
  <div
    class="flex items-center justify-center space-x-1.5 group select-none"
    :class="isLoading ? 'cursor-wait' : 'cursor-pointer'"
    @click.stop="handleLike"
  >
    <div class="relative size-5 flex items-center justify-center">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-50"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 scale-50"
        mode="out-in"
      >
        <UIcon v-if="isLoading" name="i-hugeicons:refresh" class="size-5 text-primary animate-spin" key="loading" />
        <UIcon
          v-else
          :name="liked ? 'i-hugeicons:heart-check' : 'i-hugeicons:favourite'"
          :class="[
            'size-5 transition-all duration-300',
            liked ? 'text-primary scale-110' : 'text-dimmed group-hover:text-neutral-500',
            liked && isManualClick ? 'animate-heart-pop' : '',
          ]"
          :key="liked ? 'liked' : 'unliked'"
        />
      </Transition>
    </div>

    <CommonAnimateNumber :value="localLikesCount" class="tabular-nums text-sm text-dimmed font-medium" />
  </div>
</template>

<script setup lang="ts">
import type { ToggleLikeResponse } from '~/types/likes';

const props = defineProps<{
  commentId: string;
  initialLikes?: number;
  isLiked?: boolean;
}>();

const emit = defineEmits(['likeChange']);
const { loggedIn } = useUserSession();

const liked = ref(props.isLiked || false);
const isLoading = ref(false);
const isManualClick = ref(false);

// 核心修复：使用一个 ref 来管理本地显示，但要监听 props 的变化
const localLikesCount = ref(props.initialLikes || 0);

// 监听父组件（useComments 缓存或 API）传来的点赞数变化
watch(
  () => props.initialLikes,
  (newCount) => {
    if (newCount !== undefined) {
      localLikesCount.value = newCount;
    }
  },
  { immediate: true },
);

// 监听父组件传来的点赞状态变化
watch(
  () => props.isLiked,
  (val) => {
    if (val !== undefined) liked.value = val;
  },
);

const handleLike = async () => {
  if (!loggedIn.value) return navigateTo('/auth');
  if (isLoading.value) return;

  isManualClick.value = true;
  isLoading.value = true;

  // 1. 乐观更新：先改本地状态，让用户感觉“秒回”
  const prevLiked = liked.value;
  liked.value = !prevLiked;
  localLikesCount.value += liked.value ? 1 : -1;

  try {
    const res = await $fetch<ToggleLikeResponse>('/api/collections/likes', {
      method: 'POST',
      body: { comment: props.commentId },
    });

    // 2. 写入服务器真实数据
    liked.value = res.data.liked;
    localLikesCount.value = res.data.likes;

    // 3. 通知父组件更新 useComments 里的缓存
    emit('likeChange', res.data.liked, res.data.likes, props.commentId);
  } catch (e) {
    // 4. 失败回滚：打回原型
    liked.value = prevLiked;
    localLikesCount.value = props.initialLikes || 0;
  } finally {
    isLoading.value = false;
    setTimeout(() => {
      isManualClick.value = false;
    }, 1000);
  }
};
</script>
