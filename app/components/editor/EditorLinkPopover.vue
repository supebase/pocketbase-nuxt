<template>
  <UPopover arrow v-model:open="open" :ui="{ content: 'p-0.5' }">
    <UTooltip text="插入链接">
      <UButton
        icon="i-hugeicons:link-01"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="active"
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
        placeholder="粘贴链接 ..."
        class="w-72"
        @keydown="handleKeyDown"
      >
        <div class="flex items-center gap-0.5 mr-0.5">
          <UButton
            icon="i-hugeicons:tick-03"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="!url && !active"
            @click="setLink"
          />

          <USeparator orientation="vertical" class="h-4 mx-1" />

          <UButton
            icon="i-hugeicons:link-square-01"
            variant="ghost"
            color="neutral"
            size="sm"
            title="在新窗口打开"
            :disabled="!url && !active"
            @click="openLink"
          />

          <UButton
            icon="i-hugeicons:delete-01"
            variant="ghost"
            color="error"
            size="sm"
            title="移除链接"
            :disabled="!url && !active"
            @click="removeLink"
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
  autoOpen?: boolean;
}>();

const open = ref(false);
const url = ref('');

const active = computed(() => props.editor.isActive('link'));
const disabled = computed(() => !props.editor.isEditable);

watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    if (!editor) return;
    const updateUrl = () => {
      const { href } = editor.getAttributes('link');
      url.value = href || '';
    };
    updateUrl();
    editor.on('selectionUpdate', updateUrl);
    onCleanup(() => editor.off('selectionUpdate', updateUrl));
  },
  { immediate: true },
);

watch(active, (isActive) => {
  if (isActive && props.autoOpen) open.value = true;
});

// 辅助方法：修复类型错误和边界溢出
function getSafeTextAfter(editor: Editor, from: number, length: number) {
  const doc = editor.state.doc;
  const docSize = doc.content.size;
  // 确保 from 和 to 都在有效范围内
  const safeFrom = Math.max(0, Math.min(from, docSize));
  const safeTo = Math.min(safeFrom + length, docSize);

  if (safeFrom === safeTo) return '';

  // 使用标准的 textBetween，它是最可靠的获取文本方式
  return doc.textBetween(safeFrom, safeTo);
}

function setLink() {
  if (!url.value) {
    removeLink();
    return;
  }

  const { editor } = props;
  const suffix = '{target=_blank}';

  // 1. 设置链接
  editor.chain().focus().extendMarkRange('link').setLink({ href: url.value }).run();

  // 2. 关键：设置完链接后，再次扩展选区以获取【更新后】的链接末尾位置
  // 这样能解决“修改时重复插入”的问题，因为 endPos 是实时最新的
  editor.chain().focus().extendMarkRange('link').run();
  const latestEndPos = editor.state.selection.to;

  // 3. 检查后缀
  const textAfter = getSafeTextAfter(editor, latestEndPos, suffix.length);

  if (textAfter !== suffix) {
    editor.chain().focus().insertContentAt(latestEndPos, suffix).run();
    // 移动光标到最后
    editor.commands.setTextSelection(latestEndPos + suffix.length);
  }

  open.value = false;
}

function removeLink() {
  const { editor } = props;
  const suffix = '{target=_blank}';

  // 1. 锁定当前链接
  editor.chain().focus().extendMarkRange('link').run();
  const linkEndPos = editor.state.selection.to;

  // 2. 移除链接
  editor.chain().focus().unsetLink().run();

  // 3. 检查后缀
  const textAfter = getSafeTextAfter(editor, linkEndPos, suffix.length);

  if (textAfter === suffix) {
    editor
      .chain()
      .focus()
      .deleteRange({
        from: linkEndPos,
        to: linkEndPos + suffix.length,
      })
      .run();
  }

  url.value = '';
  open.value = false;
}

function openLink() {
  if (!url.value) return;
  window.open(url.value, '_blank', 'noopener,noreferrer');
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    setLink();
  }
}
</script>
