<template>
  <div>
    <slot name="loader" />

    <ClientOnly>
      <template v-if="isDesktop">
        <form @submit.prevent="$emit('submit')" class="space-y-6 select-none">
          <EditorAction v-model="modelValue.action" :items="actionItems" />

          <EditorCanvas
            v-model="editorContent"
            :extensions="extensions"
            :toolbar-items="items"
            :max-limit="maxLimit"
            :disabled="disabled"
          />

          <EditorMetaForm v-model:icon="modelValue.icon" v-model:link="modelValue.link" :action="modelValue.action" />

          <EditorSettings v-model:published="modelValue.published" v-model:allow-comment="modelValue.allow_comment" />

          <USeparator />

          <div class="flex items-center justify-between">
            <slot name="actions" />
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

const props = defineProps<{
  modelValue: any;
  maxLimit: number;
  disabled?: boolean;
}>();

defineEmits(['submit']);

// Tiptap 配置保持在父组件以确保响应 props 变化
const extensions = [
  Placeholder.configure({ placeholder: '从这里开始写作吧 ...' }),
  CharacterCount.configure({ limit: props.maxLimit }),
  CustomCodeBlock,
  CustomLinkTarget,
];

const editorContent = computed({
  get: () => (props.modelValue.content === '' ? null : props.modelValue.content),
  set: (val) => {
    props.modelValue.content = val ?? '';
  },
});

const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual('md');
</script>
