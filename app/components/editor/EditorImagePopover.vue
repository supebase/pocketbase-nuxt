<template>
  <UPopover v-model:open="open" arrow :ui="{ content: 'p-0.5' }">
    <UTooltip text="插入图片">
      <UButton
        icon="i-hugeicons:image-03"
        color="neutral"
        :active="editor.isActive('image')"
        :disabled="!editor.isEditable"
        variant="ghost"
        size="sm"
      />
    </UTooltip>
    <template #content>
      <UInput v-model="url" autofocus placeholder="图片链接 ..." class="w-72" @keydown.enter.prevent="setImage">
        <template #trailing>
          <UButton
            icon="i-hugeicons:tick-03"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="!url"
            @click="setImage"
          />
        </template>
      </UInput>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useEditorImage } from '~/utils/editor/editor-logic';

const props = defineProps<{ editor: Editor }>();
const { url, open, setImage } = useEditorImage(toRef(props, 'editor'));
</script>
