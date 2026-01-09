<template>
  <CommonEditor
    v-if="!isLoading"
    :model-value="form"
    :max-limit="maxLimit"
    :disabled="isSubmitting"
    @submit="handleSubmit"
  >
    <template #loader>
      <div
        v-if="isLoading"
        class="z-10 absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur rounded-lg"
      >
        <UIcon name="i-hugeicons:loading-02" class="animate-spin size-6.5 text-primary" />
      </div>
    </template>

    <template #actions>
      <UButton type="button" color="warning" variant="soft" @click="$router.back()">
        取消编辑
      </UButton>
      <UButton
        type="submit"
        color="neutral"
        :loading="isSubmitting"
        :disabled="isSubmitting || form.content.trim() === '' || form.content.length > maxLimit"
      >
        更新内容
      </UButton>
    </template>
  </CommonEditor>
</template>

<script setup lang="ts">
import type { SinglePostResponse } from '~/types/posts';
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
  icon: '',
  action: 'dit',
  link: '',
});

const maxLimit = CONTENT_MAX_LENGTH;
const isLoading = ref(false);
const isSubmitting = ref(false);

const loadPostData = async () => {
  if (!id) return;
  isLoading.value = true;
  try {
    const response = await $fetch<SinglePostResponse>(`/api/collections/post/${id}`);
    if (response?.data) {
      form.value = { ...response.data };
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (form.value.content.length > maxLimit) {
    return;
  }

  if (form.value.link) {
    form.value.link = formatLink(form.value.link.trim());
  }

  isSubmitting.value = true;
  try {
    await $fetch(`/api/collections/post/${id}`, {
      method: 'PUT',
      body: form.value,
    });
    await refreshNuxtData('posts-list-data');
    markAsUpdated(id);
    await navigateTo('/');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(loadPostData);
</script>
