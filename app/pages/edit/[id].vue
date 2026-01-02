<template>
  <div :class="[
    'layout-container mx-auto flex flex-col lg:flex-row items-stretch overflow-visible',
    showPreview && isDesktop
      ? 'lg:w-[95vw] lg:-ml-[calc((95vw-100%)/2)] lg:gap-6'
      : 'w-full gap-0',
  ]">
    <div
      class="editor-panel relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 shrink-0 overflow-hidden"
      :style="{
        flexBasis: showPreview && isDesktop ? 'calc(50% - 12px)' : '100%',
        width: showPreview && isDesktop ? 'calc(50% - 12px)' : '100%',
      }">
      <div v-if="isLoading"
        class="z-10 absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur rounded-lg">
        <UIcon name="i-hugeicons:loading-02" class="animate-spin size-6.5 text-primary" />
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <URadioGroup v-model="form.action" indicator="hidden" orientation="horizontal"
          variant="card" class="select-none w-full" :items="[
            { label: '贴文', description: '记录观点、动态与生活', value: 'dit' },
            { label: '分享', description: '转发并分享优质内容', value: 'partager' },
          ]" />

        <div class="relative">
          <UTextarea v-model="form.content" ref="editorRef" @mouseenter="activeElement = 'editor'"
            id="content" autoresize color="neutral" variant="none"
            :placeholder="form.action === 'partager' ? '分享内容...' : '记录内容...'" size="xl" :rows="8"
            :maxrows="12" :disabled="isSubmitting" class="w-full" />
          <USeparator class="py-6" />
          <div class="absolute -bottom-2 left-0" :class="{ hidden: !isDesktop }">
            <UCheckbox :model-value="showPreview" @update:model-value="togglePreview"
              color="neutral" label="开启实时预览（Markdown）" />
          </div>
          <div class="absolute -bottom-2 right-0 pointer-events-none">
            <span class="text-xs tabular-nums select-none"
              :class="form.content.length >= maxLimit ? 'text-red-600 font-bold' : 'text-dimmed'">
              {{ form.content.length }} / {{ maxLimit }}
            </span>
          </div>
        </div>

        <div v-show="form.action === 'partager'" class="flex items-center gap-2.5">
          <UInput v-model="form.icon" placeholder="图标，例如：i-simple-icons:nuxt" variant="subtle"
            color="neutral" :disabled="isSubmitting" size="lg" class="w-full">
            <template #trailing>
              <UButton to="https://icones.js.org/collection/simple-icons" target="_blank"
                variant="link" color="neutral" icon="i-hugeicons:search-area" />
            </template>
          </UInput>
        </div>

        <div class="flex flex-col gap-6">
          <UInput v-model="form.link" placeholder="卡片链接" variant="subtle" color="neutral"
            :disabled="isSubmitting" size="lg" class="w-full" />
          <USwitch v-model="form.published" :label="form.published ? '立即对外正式发布' : '保存为草稿'"
            color="neutral" />
          <USwitch v-model="form.allow_comment" label="允许用户发表评论" color="neutral" />
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <UButton type="button" color="warning" variant="soft" @click="$router.back()">取消编辑
          </UButton>
          <UButton type="submit" color="neutral" :loading="isSubmitting"
            :disabled="isLoading || form.content.trim() === ''">更新内容</UButton>
        </div>
      </form>
    </div>

    <Transition name="side-slide">
      <div v-if="showPreview && isDesktop" ref="previewContainer"
        @mouseenter="activeElement = 'preview'" @scroll="onPreviewScroll"
        class="lg:w-1/2 w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 overflow-y-auto max-h-[85vh] sticky top-4 scroll-auto">
        <Transition name="fade-content" appear>
          <div v-if="showPreviewContent" class="prose dark:prose-invert max-w-none">
            <MDC :value="debouncedContent || '*等待输入内容 ...*'" />
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { SinglePostResponse } from '~/types/posts';

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
const maxLimit = 10000;
const isLoading = ref(false);
const isSubmitting = ref(false);
const globalError = ref('');

// 使用 Composable
const {
  showPreview,
  showPreviewContent,
  debouncedContent,
  isDesktop,
  activeElement,
  editorRef,
  previewContainer,
  togglePreview,
  onPreviewScroll,
  setupContentWatch,
} = useEditorLogic();

setupContentWatch(() => form.value.content);

const loadPostData = async () => {
  if (!id) return;
  isLoading.value = true;
  try {
    const response = await $fetch<SinglePostResponse>(`/api/collections/post/${id}`);
    if (response?.data) {
      form.value = { ...response.data };
      debouncedContent.value = response.data.content || '';
    }
  } catch (err: any) {
    globalError.value = '加载失败';
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const response = await $fetch<SinglePostResponse>(`/api/collections/post/${id}`, {
      method: 'PUT',
      body: form.value,
    });

    if (response?.data) {
      form.value = { ...response.data };
      debouncedContent.value = response.data.content || '';
    }

    await refreshNuxtData('posts-list-data');
    markAsUpdated(id);
    await navigateTo('/');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(loadPostData);
</script>

<style scoped>
.prose img {
  aspect-ratio: attr(width) / attr(height) !important;
}
</style>
