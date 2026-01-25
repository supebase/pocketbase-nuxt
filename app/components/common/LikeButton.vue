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
import type { ToggleLikeResponse } from '~/types';

const props = defineProps<{
  commentId: string;
  initialLikes?: number;
  isLiked?: boolean;
}>();

const emit = defineEmits<{
  likeChange: [isLiked: boolean, count: number, commentId: string];
}>();

const { loggedIn } = useUserSession();

const isLoading = ref(false);
const isManualClick = ref(false);

const liked = ref(props.isLiked ?? false);
const localLikesCount = ref(props.initialLikes ?? 0);

// 当父组件的数据发生变动（比如从数据库重新加载了数据）时，同步更新本地状态
watch([() => props.isLiked, () => props.initialLikes], ([newLiked, newCount]) => {
  liked.value = newLiked ?? false;
  localLikesCount.value = newCount ?? 0;
});

const handleLike = async () => {
  if (!loggedIn.value) return navigateTo('/auth');
  if (isLoading.value) return;

  // 这里的类型现在是安全的 number
  const previousState = {
    liked: liked.value,
    count: localLikesCount.value,
  };

  isManualClick.value = true;

  // 1. 乐观更新
  isLoading.value = true;
  liked.value = !previousState.liked;
  localLikesCount.value += liked.value ? 1 : -1;

  try {
    const res = await $fetch<ToggleLikeResponse>('/api/collections/likes', {
      method: 'POST',
      body: { comment: props.commentId },
    });

    // 2. 更新为服务器真实数据
    liked.value = res.data.liked;
    localLikesCount.value = res.data.likes;

    emit('likeChange', res.data.liked, res.data.likes, props.commentId);
  } catch (e) {
    // 3. 失败回滚
    liked.value = previousState.liked;
    localLikesCount.value = previousState.count;
  } finally {
    isLoading.value = false;
    setTimeout(() => {
      isManualClick.value = false;
    }, 1000);
  }
};
</script>
