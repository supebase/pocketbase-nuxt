<template>
  <div
    :class="[
      'layout-container mx-auto flex flex-col lg:flex-row items-stretch overflow-visible',
      showPreview && isDesktop
        ? 'lg:w-[95vw] lg:-ml-[calc((95vw-100%)/2)] lg:gap-6'
        : 'w-full gap-0',
    ]"
  >
    <div
      class="editor-panel relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 shrink-0 overflow-hidden"
      :style="{
        flexBasis: showPreview && isDesktop ? 'calc(50% - 12px)' : '100%',
        width: showPreview && isDesktop ? 'calc(50% - 12px)' : '100%',
      }"
    >
      <slot name="loader" />

      <form @submit.prevent="$emit('submit')" class="space-y-6">
        <URadioGroup
          v-model="modelValue.action"
          indicator="hidden"
          orientation="horizontal"
          variant="card"
          class="select-none w-full"
          :items="actionItems"
        />

        <div class="relative">
          <UTextarea
            v-model="modelValue.content"
            ref="editorRef"
            @mouseenter="activeElement = 'editor'"
            autoresize
            color="neutral"
            variant="none"
            :placeholder="
              modelValue.action === 'partager'
                ? '转发并分享优质内容 ...'
                : '记录观点、动态与生活 ...'
            "
            size="xl"
            :rows="12"
            :maxrows="16"
            :maxlength="maxLimit"
            :disabled="disabled"
            class="w-full"
          />

          <USeparator class="pt-6">
            <template #default>
              <span
                class="text-xs tabular-nums select-none"
                :class="modelValue.content.length >= maxLimit ? 'text-red-600' : 'text-dimmed'"
              >
                {{ modelValue.content.length }} / {{ maxLimit }}
              </span>
            </template>
          </USeparator>
        </div>

        <div class="flex items-center gap-2.5">
          <UInput
            v-model="modelValue.icon"
            placeholder="图标 i-simple-icons:nuxt"
            variant="subtle"
            color="neutral"
            :disabled="disabled"
            size="lg"
            class="w-full"
            v-if="modelValue.action === 'partager'"
          >
            <template #trailing>
              <UButton
                to="https://icones.js.org/collection/simple-icons"
                target="_blank"
                variant="link"
                color="neutral"
                icon="i-hugeicons:search-area"
              />
            </template>
          </UInput>

          <UInput
            v-model="modelValue.link"
            placeholder="卡片链接 - https://example.com"
            variant="subtle"
            color="neutral"
            :disabled="disabled"
            size="lg"
            class="w-full"
          />
        </div>

        <div class="flex items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <USwitch
              v-model="modelValue.published"
              :label="modelValue.published ? '正式发布' : '保存草稿'"
              color="neutral"
            />
            <USwitch
              v-model="modelValue.allow_comment"
              :label="modelValue.allow_comment ? '允许评论' : '禁止评论'"
              color="neutral"
            />
          </div>

          <div :class="{ hidden: !isDesktop }">
            <UCheckbox
              :model-value="showPreview"
              @update:model-value="togglePreview"
              color="neutral"
              label="开启实时预览"
            />
          </div>
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <slot name="actions" />
        </div>
      </form>
    </div>

    <Transition name="side-slide">
      <div
        v-if="showPreview && isDesktop"
        ref="previewContainer"
        @mouseenter="activeElement = 'preview'"
        @scroll="onPreviewScroll"
        class="lg:w-1/2 w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 overflow-y-auto max-h-[85vh] sticky top-4 scroll-auto"
      >
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
import { actionItems } from '~/constants';

const props = defineProps<{
  modelValue: any;
  maxLimit: number;
  disabled?: boolean;
}>();

defineEmits(['submit']);

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

// 核心逻辑绑定
setupContentWatch(() => props.modelValue.content);
</script>

<style scoped>
:deep(.prose img) {
  aspect-ratio: attr(width) / attr(height) !important;
}
</style>
