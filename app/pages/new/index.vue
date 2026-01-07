<template>
  <CommonEditor
    v-model="form"
    :max-limit="maxLimit"
    :disabled="isSubmitting"
    @submit="handleSubmit"
  >
    <template #actions>
      <UButton type="button" color="warning" variant="soft" @click="useRouter().back()">
        取消发布
      </UButton>
      <UButton
        type="submit"
        color="neutral"
        :loading="isSubmitting"
        :disabled="form.content.trim() === ''"
      >
        发布
      </UButton>
    </template>
  </CommonEditor>
</template>

<script setup lang="ts">
import { CONTENT_MAX_LENGTH } from '~/constants';

const getInitialForm = () => ({
  content: '',
  allow_comment: true,
  published: true,
  icon: '',
  action: 'dit',
  link: '',
});

const form = reactive(getInitialForm());
const isSubmitting = ref(false);
const maxLimit = CONTENT_MAX_LENGTH;

const handleSubmit = async () => {
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
