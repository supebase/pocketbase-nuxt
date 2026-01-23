<template>
  <Editor v-if="!isLoading" :model-value="form" :max-limit="maxLimit" :disabled="isSubmitting" @submit="handleSubmit">
    <template #actions>
      <UButton type="button" color="warning" variant="soft" @click="$router.back()"> 取消编辑 </UButton>
      <UButton
        type="submit"
        color="neutral"
        :loading="isSubmitting"
        :disabled="isSubmitting || form.content.trim() === '' || form.content.length > maxLimit"
      >
        更新内容
      </UButton>
    </template>
  </Editor>

  <div
    v-else
    class="z-10 absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur rounded-lg"
  >
    <UIcon name="i-hugeicons:loading-02" class="animate-spin size-6.5 text-primary" />
  </div>
</template>

<script setup lang="ts">
import type { SinglePostResponse, PostWithUser } from '~/types/posts';
import { CONTENT_MAX_LENGTH } from '~/constants';

definePageMeta({
  hideHeaderBack: false,
});

const { markAsUpdated } = usePostUpdateTracker();
const route = useRoute();
const { id } = route.params as { id: string };

const form = ref({
  content: '',
  allow_comment: true,
  published: true,
  poll: false,
  reactions: false,
  icon: '',
  action: 'dit',
  link: '',
});

const maxLimit = CONTENT_MAX_LENGTH;
const isSubmitting = ref(false);

const { data: response, pending: isLoading } = await useAsyncData(
  `edit-post-${id}`,
  () => $fetch<SinglePostResponse>(`/api/collections/post/${id}`),
  { lazy: true },
);

watch(
  response,
  (newVal) => {
    if (newVal?.data) {
      form.value = { ...newVal.data };
    }
  },
  { immediate: true },
);

const { allPosts, transformPosts } = usePosts();

const handleSubmit = async () => {
  if (form.value.content.length > maxLimit) {
    return;
  }

  if (form.value.link) {
    form.value.link = formatLink(form.value.link.trim());
  }

  isSubmitting.value = true;
  try {
    const response = await $fetch(`/api/collections/post/${id}`, {
      method: 'PUT',
      body: form.value,
    });

    if (response?.data) {
      const index = allPosts.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        const transformedArray = transformPosts([response.data as any]);
        const transformed = transformedArray[0];

        if (transformed) {
          allPosts.value[index] = {
            ...allPosts.value[index],
            ...transformed,
          } as PostWithUser;
        }
      }
    }

    markAsUpdated(id);
    await navigateTo('/');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
