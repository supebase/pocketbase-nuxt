<template>
  <div :class="[
    'layout-container mx-auto flex flex-col lg:flex-row items-stretch overflow-visible',
    (showPreview && isDesktop) ? 'lg:w-[95vw] lg:-ml-[calc((95vw-100%)/2)] lg:gap-6' : 'w-full gap-0'
  ]">

    <div
      class="editor-panel bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 shrink-0 overflow-hidden"
      :style="{
        flexBasis: (showPreview && isDesktop) ? 'calc(50% - 12px)' : '100%',
        width: (showPreview && isDesktop) ? 'calc(50% - 12px)' : '100%'
      }">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <URadioGroup v-model="form.action" indicator="hidden" orientation="horizontal"
          variant="card" class="select-none w-full" :items="[
            { label: '贴文', description: '记录观点、动态与生活。', value: 'dit' },
            { label: '分享', description: '转发并分享优质内容。', value: 'partager' },
          ]" />

        <div class="relative">
          <UTextarea v-model="form.content" id="content" autoresize color="neutral" variant="none"
            :placeholder="form.action === 'partager' ? '...' : '_'" size="xl" :rows="10"
            :maxrows="18" :disabled="isSubmitting" class="w-full" />

          <USeparator class="py-6" />

          <div class="absolute -bottom-2 left-2" :class="{ 'hidden': !isDesktop }">
            <span class="text-xs tabular-nums select-none">
              <UCheckbox :model-value="showPreview" @update:model-value="togglePreview"
                color="neutral" label="开启实时预览（Markdown）" />
            </span>
          </div>

          <div class="absolute -bottom-2 right-2 pointer-events-none">
            <span class="text-xs tabular-nums select-none"
              :class="form.content.length >= maxLimit ? 'text-red-600 font-bold' : 'text-dimmed'">
              {{ form.content.length }} / {{ maxLimit }}
            </span>
          </div>
        </div>

        <div v-show="form.action === 'partager'" class="flex items-center gap-2.5 select-none">
          <UInput :ui="{ trailing: 'pr-0.5' }" v-model="form.icon"
            placeholder="图标，例如：i-simple-icons:nuxt" variant="subtle" color="neutral"
            :disabled="isSubmitting" size="lg" class="w-full">
            <template #trailing>
              <UButton to="https://icones.js.org/collection/simple-icons" target="_blank"
                variant="link" color="neutral" icon="i-hugeicons:search-area" />
            </template>
          </UInput>
        </div>

        <div class="flex flex-col gap-6 select-none">
          <UInput v-model="form.link" placeholder="卡片链接" variant="subtle" color="neutral"
            :disabled="isSubmitting" size="lg" class="w-full" />
          <USwitch v-model="form.published" :disabled="isSubmitting" color="neutral"
            :label="form.published ? '立即对外正式发布' : '保存为草稿'" />
          <USwitch v-model="form.allow_comment" :disabled="isSubmitting" color="neutral"
            label="允许用户发表评论" />
        </div>

        <USeparator />

        <div class="flex items-center justify-between select-none">
          <UButton type="button" color="warning" variant="soft" class="cursor-pointer"
            @click="handleCancel">
            取消发布 </UButton>
          <UButton type="submit" color="neutral" loading-auto
            :disabled="isSubmitting || form.content.length >= maxLimit || form.content.trim() === ''"
            class="cursor-pointer">
            <span v-if="!isSubmitting">{{ form.action === 'partager' ? '分享互联网' : '发表新贴文' }}</span>
            <span v-else>正在发布...</span>
          </UButton>
        </div>
      </form>
    </div>

    <Transition name="side-slide">
      <div v-if="showPreview && isDesktop"
        class="lg:w-1/2 w-full bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 overflow-y-auto max-h-[85vh] sticky top-4">

        <Transition name="fade-content" appear>
          <div v-if="showPreviewContent" class="prose prose-sm dark:prose-invert max-w-none">
            <div class="pb-3 text-primary text-base font-semibold flex items-center justify-center">
              正在实时预览 (发布模式)
            </div>
            <USeparator class="pb-4" />
            <MDC :value="debouncedContent || '*等待输入内容 ...*'" />
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'

const createInitialForm = () => ({
  content: '',
  allow_comment: true,
  published: true,
  icon: '',
  action: 'dit',
  link: '',
});

const form = reactive(createInitialForm());
const maxLimit = 10000;
const isSubmitting = ref(false);
const globalError = ref('');
const errors = reactive({ content: '' });

const showPreview = ref(false);
const showPreviewContent = ref(false);
const debouncedContent = ref(form.content);
const toast = useToast();

const isDesktop = ref(false)
onMounted(() => {
  isDesktop.value = window.matchMedia('(hover: hover)').matches
})

const togglePreview = async (val: boolean | "indeterminate") => {
  const isChecked = val === true;
  if (isChecked) {
    if (!isDesktop.value) {
      toast.add({ title: '提醒', description: '预览功能仅支持电脑端。', color: 'warning' });
      return;
    }
    showPreview.value = true;
    setTimeout(() => { showPreviewContent.value = true; }, 400);
  } else {
    showPreviewContent.value = false;
    setTimeout(() => { showPreview.value = false; }, 300);
  }
};

watchDebounced(() => form.content, (newVal) => { debouncedContent.value = newVal; }, { debounce: 300 });

const resetForm = () => {
  Object.assign(form, createInitialForm());
  errors.content = '';
  globalError.value = '';
  debouncedContent.value = '';
  showPreview.value = false;
  showPreviewContent.value = false;
};

const handleCancel = () => {
  resetForm();
  useRouter().back();
};

const handleSubmit = async () => {
  if (!form.content.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await $fetch('/api/collections/posts', { method: 'POST', body: form });
    resetForm();
    await refreshNuxtData('posts-list-data');
    await navigateTo('/');
  } catch (err: any) {
    globalError.value = err.data?.message || '发布失败';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* 核心修复：
   1. 使用 transition 监听所有可能引起位移的属性。
   2. !important 确保覆盖 Tailwind 的默认瞬时样式。
*/
.layout-container,
.editor-panel {
  will-change: width, flex-basis, margin;
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 预览窗口动画保持不动 */
.side-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.side-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.5, 0, 0.75, 0);
}

.side-slide-enter-from,
.side-slide-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.fade-content-enter-active,
.fade-content-leave-active {
  transition: opacity 0.3s ease;
}

.fade-content-enter-from,
.fade-content-leave-to {
  opacity: 0;
}

:deep(.u-radio-group) {
  white-space: nowrap;
}
</style>