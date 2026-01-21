<template>
  <div class="relative min-h-100">
    <UEditor
      v-slot="{ editor }"
      v-model="content"
      content-type="markdown"
      :starter-kit="EDITOR_STARTER_KIT"
      :extensions="extensions"
      :enable-input-rules="true"
      :enable-paste-rules="false"
      :disabled="disabled"
      autofocus
      class="w-full custom-editor-canvas"
      :ui="EDITOR_UI_CONFIG"
      :handlers="customHandlers"
      @beforeCreate="(p) => (editorRef = p.editor)"
    >
      <template v-if="editor">
        <UEditorToolbar
          :editor="editor"
          :items="toolbarItems"
          class="pb-3 border-b border-b-neutral-200 dark:border-b-neutral-800/80"
        >
          <template #image>
            <EditorImagePopover :editor="editor" />
          </template>
          <template #link>
            <EditorLinkPopover :editor="editor" auto-open />
          </template>
        </UEditorToolbar>

        <UEditorDragHandle :editor="editor" />

        <ClientOnly>
          <div
            class="absolute bottom-0 left-0 right-0 pointer-events-none flex items-center justify-between text-xs text-dimmed/70"
          >
            <span>{{ getChineseWordCount(editor) }} 个字符</span>
            <span>{{ editor.storage.characterCount.characters() }} / {{ maxLimit }}</span>
          </div>
        </ClientOnly>
      </template>
    </UEditor>

    <ModalCodeBlock v-model:open="isCodeBlockModalOpen" @confirm="handleCodeBlockConfirm" />
  </div>
</template>

<script setup lang="ts">
import { EDITOR_STARTER_KIT, EDITOR_UI_CONFIG } from '~/utils/editor/editor-config';
import { getChineseWordCount, createCustomCodeBlockHandlers } from '~/utils/editor/editor-utils';

const content = defineModel<string | null>();
const props = defineProps<{
  extensions: any[];
  toolbarItems: any[];
  maxLimit: number;
  disabled?: boolean;
}>();

const editorRef = shallowRef<any>(null);
const isCodeBlockModalOpen = ref(false);

const customHandlers = computed(() => createCustomCodeBlockHandlers(() => (isCodeBlockModalOpen.value = true)));

const handleCodeBlockConfirm = (data: { language: string; filename: string }) => {
  if (!editorRef.value) return;

  const info = data.filename ? `${data.language} [${data.filename}]` : data.language;

  setTimeout(() => {
    editorRef.value
      .chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: { language: info },
      })
      .run();
  }, 100);
};
</script>
