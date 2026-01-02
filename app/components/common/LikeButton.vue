<template>
  <div
    class="flex items-center justify-center space-x-1.5"
    :class="isLoading ? 'cursor-wait' : 'cursor-pointer'"
    @click.stop="handleLike"
  >
    <UIcon
      v-if="isLoading"
      name="i-hugeicons:refresh"
      class="size-5 text-primary animate-spin"
    />

    <UIcon
      v-else
      :name="liked ? 'i-hugeicons:heart-check' : 'i-hugeicons:favourite'"
      :class="[
        'size-5 transition-all duration-300',
        liked ? 'text-primary scale-110' : 'text-dimmed',
        liked && isManualClick ? 'animate-heart-pop' : '',
      ]"
    />

    <CommonAnimateNumber
      :value="likesCount"
      class="tabular-nums text-dimmed font-medium"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToggleLikeResponse } from '~/types/likes';

const props = defineProps<{
    commentId: string;
    initialLikes?: number;
    isLiked?: boolean;
}>();

const emit = defineEmits<{
    (e: 'likeChange', liked: boolean, likes: number, commentId: string): void;
}>();

const { loggedIn } = useUserSession();

const likesCount = computed(() => props.initialLikes || 0);
const liked = ref(props.isLiked || false);
const isLoading = ref(false);
const isManualClick = ref(false);

const handleLike = async () => {
    if (!loggedIn.value) return navigateTo('/auth', { replace: true });
    if (isLoading.value) return;

    isManualClick.value = true;
    isLoading.value = true;

    const previousLiked = liked.value;

    liked.value = !previousLiked;

    try {
      const response = await $fetch<ToggleLikeResponse>(
        '/api/collections/likes',
        {
          method: 'POST',
          body: { comment: props.commentId },
        },
      );

      liked.value = response.data.liked;

      emit(
        'likeChange',
        response.data.liked,
        response.data.likes,
        props.commentId,
      );
    } catch (error: any) {
      liked.value = previousLiked;
      console.error('操作失败:', error.data?.message || '网络异常');
    } finally {
      isLoading.value = false;

      setTimeout(() => {
        isManualClick.value = false;
      }, 1000);
    }
};

watch(
    () => props.isLiked,
    (newVal) => {
      if (newVal !== undefined) liked.value = newVal;
    },
);
</script>
