<template>
  <Editor :model-value="form" :max-limit="maxLimit" :disabled="isSubmitting" @submit="handleSubmit">
    <template #actions>
      <UButton type="button" color="warning" variant="soft" @click="useRouter().back()" :ui="{ base: 'px-4' }">
        取消发布
      </UButton>
      <UButton
        type="submit"
        color="neutral"
        :loading="isSubmitting"
        :disabled="isSubmitting || form.content.trim() === '' || form.content.length > maxLimit"
        :ui="{ base: 'px-4' }"
      >
        发布
      </UButton>
    </template>
  </Editor>
</template>

<script setup lang="ts">
import { CONTENT_MAX_LENGTH } from '~/constants';

definePageMeta({
  hideHeaderBack: false,
});

const getInitialForm = () => ({
  content: '',
  allow_comment: true,
  published: true,
  poll: false,
  reactions: false,
  icon: '',
  action: 'dit',
  link: '',
});

const form = reactive(getInitialForm());
const isSubmitting = ref(false);
const maxLimit = CONTENT_MAX_LENGTH;

const handleSubmit = async () => {
  if (form.content.length > maxLimit) {
    return;
  }

  if (form.link) {
    form.link = formatLink(form.link.trim());
  }

  isSubmitting.value = true;
  try {
    await $fetch('/api/collections/posts', {
      method: 'POST',
      body: form,
    });
    await refreshNuxtData('posts-list-data');
    Object.assign(form, getInitialForm());
    await navigateTo('/');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
