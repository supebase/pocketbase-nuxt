<template>
  <UPopover v-model:open="open" arrow :ui="{ content: 'p-0.5' }">
    <UTooltip text="插入链接">
      <UButton
        icon="i-hugeicons:link-01"
        color="neutral"
        :active="active"
        :disabled="!editor.isEditable"
        variant="ghost"
        size="sm"
      />
    </UTooltip>
    <template #content>
      <UInput v-model="url" autofocus placeholder="粘贴链接 ..." class="w-72" @keydown.enter.prevent="setLink">
        <template #trailing>
          <div class="flex items-center gap-0.5">
            <UButton icon="i-hugeicons:tick-03" variant="ghost" color="neutral" size="sm" @click="setLink" />
            <UButton icon="i-hugeicons:delete-01" variant="ghost" color="error" size="sm" @click="removeLink" />
          </div>
        </template>
      </UInput>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useEditorLink } from '~/utils/editor/use-editor-logic';

const props = defineProps<{ editor: Editor; autoOpen?: boolean }>();
const { url, open, active, setLink, removeLink } = useEditorLink(toRef(props, 'editor'), props.autoOpen);
</script>
