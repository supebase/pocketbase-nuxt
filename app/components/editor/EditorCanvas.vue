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
      @beforeCreate="onEditorBeforeCreate"
    >
      <template v-if="editor">
        <UEditorToolbar :editor="editor" :items="toolbarItems" class="pb-3 border-b border-b-muted/60" />
        <UEditorDragHandle :editor="editor" />

        <ClientOnly>
          <div class="absolute bottom-0 left-0 right-0 pointer-events-none">
            <UProgress
              :model-value="editor.storage.characterCount.characters()"
              :max="maxLimit"
              :color="getContentLengthColor(editor.storage.characterCount.characters(), maxLimit)"
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
import type { Editor } from '@tiptap/vue-3';
import { getChineseWordCount } from '~/utils/editor';
import { createCustomCodeBlockHandlers } from '~/utils/editorHandlers';

const content = defineModel<string | null>();
const props = defineProps<{
  extensions: any[];
  toolbarItems: any[];
  maxLimit: number;
  disabled?: boolean;
}>();

const isCodeBlockModalOpen = ref(false);
const editorRef = shallowRef<Editor | null>(null);

const onEditorBeforeCreate = (props: { editor: any }) => {
  editorRef.value = props.editor;
};

const handleCodeBlockConfirm = (data: { language: string; filename: string }) => {
  if (!editorRef.value) return;

  const language = data.language || '';
  const filename = data.filename || '';
  const info = filename ? `${language} [${filename}]` : language;

  setTimeout(() => {
    editorRef.value
      ?.chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: {
          language: info,
          // filename: data.filename,
        },
      })
      .run();
  }, 300);
};

const customHandlers = computed(() =>
  createCustomCodeBlockHandlers(() => {
    isCodeBlockModalOpen.value = true;
  }),
);
</script>
