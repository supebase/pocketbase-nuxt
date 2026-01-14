<template>
  <div class="relative min-h-100">
    <UEditor
      v-slot="{ editor, handlers }"
      v-model="content"
      content-type="markdown"
      :starter-kit="{
        codeBlock: false,
        link: false,
      }"
      :extensions="extensions"
      :enable-input-rules="true"
      :enable-paste-rules="false"
      :disabled="disabled"
      autofocus
      class="w-full custom-editor-canvas"
      :ui="{
        content:
          'w-xl relative left-1/2 right-1/2 -translate-x-1/2 prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none pt-3 pb-16',
      }"
      :handlers="customHandlers"
    >
      <template v-if="editor">
        {{ setEditorInstance(editor) }}
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
      </template>
    </UEditor>

    <ModalCodeBlock v-model:open="isCodeBlockModalOpen" @confirm="handleCodeBlockConfirm" />
  </div>
</template>

<script setup lang="ts">
import { getChineseWordCount } from '~/utils/editor';
import { createCustomCodeBlockHandlers } from '~/utils/editorHandlers';

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

const isCodeBlockModalOpen = ref(false);
const editorInstance = shallowRef<any>(null);

const handleCodeBlockConfirm = (data: { language: string; filename: string }) => {
  if (!editorInstance.value) {
    console.error('编辑器实例不存在');
    return;
  }

  const language = data.language || '';
  const filename = data.filename || '';
  const info = filename ? `${language} [${filename}]` : language;

  editorInstance.value
    .chain()
    .insertContent({
      type: 'codeBlock',
      attrs: {
        language: info,
      },
    })
    .focus()
    .run();
};

const customHandlers = computed(() =>
  createCustomCodeBlockHandlers(() => {
    isCodeBlockModalOpen.value = true;
  }),
);

const setEditorInstance = (editor: any) => {
  if (editor && !editorInstance.value) {
    editorInstance.value = editor;
  }
  return '';
};
</script>
