<template>
  <div class="relative min-h-100">
    <UEditor
      v-slot="{ editor }"
      v-model="content"
      content-type="markdown"
      :starter-kit="{
        link: false,
      }"
      :extensions="extensions"
      :enable-input-rules="false"
      :enable-paste-rules="false"
      :disabled="disabled"
      autofocus
      class="w-full"
      :ui="{
        content:
          'w-xl relative left-1/2 right-1/2 -translate-x-1/2 prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none pt-3 pb-16',
      }"
    >
      <UEditorToolbar :editor="editor" :items="toolbarItems" class="pb-3 border-b border-b-muted/60" />
      <UEditorDragHandle :editor="editor" />

      <ClientOnly>
        <div class="absolute bottom-0 left-0 right-0">
          <UProgress
            :model-value="Math.min(editor.storage.characterCount.characters(), maxLimit)"
            :max="maxLimit"
            :color="progressColor"
            size="xs"
            status
          />
          <span class="text-xs text-dimmed mt-1.5 block text-right">
            {{ getChineseWordCount(editor) }}
            个字符（{{ editor.storage.characterCount.characters() }} / {{ maxLimit }}）
          </span>
        </div>
      </ClientOnly>
    </UEditor>
  </div>
</template>

<script setup lang="ts">
import { getChineseWordCount } from '~/utils/editor';

const content = defineModel<string | null>();
const props = defineProps<{
  extensions: any[];
  toolbarItems: any[];
  maxLimit: number;
  disabled?: boolean;
}>();

const currentLength = computed(() => content.value?.length || 0);
const percentage = computed(() => Math.min(Math.round((currentLength.value / props.maxLimit) * 100), 100));

const progressColor = computed(() => {
  if (percentage.value >= 100) return 'error';
  if (percentage.value >= 80) return 'warning';
  return 'neutral';
});
</script>
