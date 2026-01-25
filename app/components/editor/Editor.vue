<template>
  <div>
    <slot name="loader" />

    <ClientOnly>
      <template v-if="isDesktop">
        <form @submit.prevent="$emit('submit')" class="space-y-6 select-none">
          <EditorAction v-model="model.action" :items="actionItems" />

          <div class="p-3 space-y-6 bg-neutral-100 dark:bg-neutral-950/70 rounded-lg">
            <EditorCanvas
              v-model="editorContent"
              :extensions="extensions"
              :toolbar-items="items"
              :max-limit="maxLimit"
              :disabled="disabled"
            />

            <USeparator label="其他选项" />

            <EditorMetaForm v-model:icon="model.icon" v-model:link="model.link" :action="model.action" />

            <EditorSettings
              v-model:published="model.published"
              v-model:poll="model.poll"
              v-model:reactions="model.reactions"
              v-model:allow-comment="model.allow_comment"
            />

            <USeparator />

            <div class="flex items-center justify-between">
              <slot name="actions" />
            </div>
          </div>
        </form>
      </template>

      <template v-else>
        <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div class="bg-muted/30 p-6 rounded-lg border border-dashed border-muted">
            <UIcon name="i-hugeicons:phone-lock" class="w-12 h-12 mb-4 text-dimmed/60" />
            <h2 class="text-base font-bold">暂不支持移动端</h2>
            <p class="text-sm text-dimmed max-w-60 mt-2">当前页面包含复杂排版功能，请在电脑端打开。</p>
            <UButton class="mt-6" block color="neutral" size="xl" @click="useRouter().back()">返回</UButton>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { CustomCodeBlock } from '~/extensions/CustomCodeBlock';
import { CustomLinkTarget } from '~/extensions/CustomLinkTarget';
import { items } from '~/constants/editor';
import { actionItems } from '~/constants';
import type { EditorModel } from '~/types';

const props = defineProps<{
  maxLimit: number;
  disabled?: boolean;
}>();

const model = defineModel<EditorModel>({ required: true });

const emit = defineEmits<{
  submit: [];
}>();

// Tiptap 配置保持在父组件以确保响应 props 变化
const extensions = computed(() => [
  Placeholder.configure({ placeholder: '从这里开始写作吧 ...' }),
  CharacterCount.configure({ limit: props.maxLimit }),
  CustomCodeBlock,
  CustomLinkTarget,
]);

const editorContent = computed({
  get: () => (model.value.content === '' ? null : model.value.content),
  set: (val) => {
    model.value.content = val ?? '';
  },
});

const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual('md');
</script>
