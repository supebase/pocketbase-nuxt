<template>
  <UPopover arrow v-model:open="open" :ui="{ content: 'p-0.5' }">
    <UTooltip text="插入图片">
      <UButton
        icon="i-hugeicons:image-03"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="editor.isActive('image')"
        :disabled="disabled"
      />
    </UTooltip>

    <template #content>
      <UInput
        v-model="url"
        autofocus
        name="url"
        type="url"
        variant="none"
        placeholder="图片链接 ..."
        class="w-72"
        @keydown="handleKeyDown"
      >
        <div class="flex items-center mr-0.5">
          <UButton
            icon="i-hugeicons:tick-03"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="!url"
            title="确定"
            @click="setImage"
          />
        </div>
      </UInput>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

const props = defineProps<{
  editor: Editor;
}>();

const open = ref(false);
const url = ref('');

// 只有当编辑器可编辑时才启用
const disabled = computed(() => !props.editor.isEditable);

// 检查当前选中的内容是否已经是图片，如果是，则提取其 src
watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    if (!editor) return;

    const updateUrl = () => {
      const { src } = editor.getAttributes('image');
      url.value = src || '';
    };

    updateUrl();
    editor.on('selectionUpdate', updateUrl);

    onCleanup(() => {
      editor.off('selectionUpdate', updateUrl);
    });
  },
  { immediate: true },
);

function setImage() {
  if (!url.value) return;

  // Tiptap 插入图片的标准逻辑
  props.editor.chain().focus().setImage({ src: url.value }).run();

  open.value = false;
  // 插入后不建议清空 url，方便下次修改，但如果需要可以清空：url.value = ''
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    setImage();
  }
}
</script>
