<template>
  <div :class="[
    'layout-container mx-auto flex flex-col lg:flex-row items-stretch overflow-visible',
    (showPreview && isDesktop) ? 'lg:w-[95vw] lg:-ml-[calc((95vw-100%)/2)] lg:gap-6' : 'w-full gap-0'
  ]">
    <div
      class="editor-panel bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 shrink-0 overflow-hidden"
      :style="{ flexBasis: (showPreview && isDesktop) ? 'calc(50% - 12px)' : '100%', width: (showPreview && isDesktop) ? 'calc(50% - 12px)' : '100%' }">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <URadioGroup v-model="form.action" indicator="hidden" orientation="horizontal"
          variant="card"
          :items="[{ label: '贴文', description: '记录观点、动态与生活', value: 'dit' }, { label: '分享', description: '转发并分享优质内容', value: 'partager' }]" />

        <div class="relative">
          <UTextarea v-model="form.content" ref="editorRef" @mouseenter="activeElement = 'editor'"
            autoresize color="neutral" variant="none"
            :placeholder="form.action === 'partager' ? '分享内容...' : '记录内容...'" size="xl" :rows="8"
            :maxrows="12" class="w-full" />
          <USeparator class="py-6" />
          <div class="absolute -bottom-2 left-2" v-if="isDesktop">
            <UCheckbox :model-value="showPreview" @update:model-value="togglePreview"
              color="neutral" label="开启实时预览（Markdown）" />
          </div>
          <div class="absolute -bottom-2 right-2 pointer-events-none">
            <span class="text-xs tabular-nums"
              :class="form.content.length >= maxLimit ? 'text-red-600 font-bold' : 'text-dimmed'">{{
                form.content.length }} / {{ maxLimit }}</span>
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
          <UInput v-model="form.link" placeholder="卡片链接" variant="subtle" color="neutral" />
          <USwitch v-model="form.published" :label="form.published ? '立即对外正式发布' : '保存为草稿'"
            color="neutral" />
          <USwitch v-model="form.allow_comment" label="允许用户发表评论" color="neutral" />
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <UButton type="button" color="warning" variant="soft" @click="useRouter().back()">取消发布
          </UButton>
          <UButton type="submit" color="neutral" :loading="isSubmitting"
            :disabled="form.content.trim() === ''">发布</UButton>
        </div>
      </form>
    </div>

    <Transition name="side-slide">
      <div v-if="showPreview && isDesktop" ref="previewContainer"
        @mouseenter="activeElement = 'preview'" @scroll="onPreviewScroll"
        class="lg:w-1/2 w-full bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 overflow-y-auto max-h-[85vh] sticky top-4 scroll-auto">
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
const getInitialForm = () => ({
  content: '',
  allow_comment: true,
  published: true,
  icon: '',
  action: 'dit',
  link: ''
});

const form = reactive(getInitialForm());
const isSubmitting = ref(false);
const maxLimit = 10000;

const {
  showPreview, showPreviewContent, debouncedContent, isDesktop,
  activeElement, editorRef, previewContainer,
  togglePreview, onPreviewScroll, setupContentWatch
} = useEditorLogic();

setupContentWatch(() => form.content);

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    await $fetch('/api/collections/posts', { method: 'POST', body: form });
    await refreshNuxtData('posts-list-data');
    Object.assign(form, getInitialForm());
    await navigateTo('/');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.prose img {
  aspect-ratio: attr(width) / attr(height) !important;
}
</style>