<template>
  <div class="layout-container mx-auto w-full max-w-5xl">
    <div
      class="editor-panel relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-4 overflow-hidden"
    >
      <slot name="loader" />

      <form @submit.prevent="$emit('submit')" class="space-y-6">
        <URadioGroup
          v-model="modelValue.action"
          indicator="hidden"
          orientation="horizontal"
          variant="card"
          class="select-none w-full"
          :items="actionItems"
        />

        <div class="relative min-h-100">
          <UEditor
            v-slot="{ editor }"
            v-model="modelValue.content"
            content-type="markdown"
            :placeholder="
              modelValue.action === 'partager'
                ? '转发并分享优质内容 ...'
                : '记录观点、动态与生活 ...'
            "
            :maxlength="maxLimit"
            :disabled="disabled"
            autofocus
            class="w-full"
            :ui="{ content: 'prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none' }"
          >
            <UEditorToolbar :editor="editor" :items="items" />
            <UEditorDragHandle :editor="editor" />
          </UEditor>

          <USeparator class="pt-6">
            <template #default>
              <span
                class="text-xs tabular-nums select-none"
                :class="modelValue.content.length >= maxLimit ? 'text-red-600' : 'text-dimmed'"
              >
                {{ modelValue.content.length }} / {{ maxLimit }}
              </span>
            </template>
          </USeparator>
        </div>

        <div class="flex items-center gap-2.5">
          <UFieldGroup v-if="modelValue.action === 'partager'" class="w-full">
            <UInput
              v-model="modelValue.icon"
              placeholder="图标 - simple-icons:nuxt"
              variant="outline"
              size="lg"
              class="w-full"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-hugeicons:folder-search"
              to="https://icones.js.org/collection/simple-icons"
              target="_blank"
            />
          </UFieldGroup>

          <UFieldGroup class="w-full">
            <UBadge color="neutral" variant="outline" size="lg" label="https://" />
            <UInput
              v-model="modelValue.link"
              placeholder="卡片 - example.com"
              variant="outline"
              size="lg"
              class="w-full"
            />
          </UFieldGroup>
        </div>

        <div class="flex items-center gap-8">
          <USwitch
            v-model="modelValue.published"
            color="neutral"
            :label="modelValue.published ? '正式发布' : '保存草稿'"
          />
          <USwitch
            v-model="modelValue.allow_comment"
            color="neutral"
            :label="modelValue.allow_comment ? '允许评论' : '禁止评论'"
          />
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <slot name="actions" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui';
import { actionItems } from '~/constants';

const props = defineProps<{
  modelValue: any;
  maxLimit: number;
  disabled?: boolean;
}>();

defineEmits(['submit']);

const items: EditorToolbarItem[] = [
  { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold' },
  { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic' },
  { kind: 'heading', level: 1, icon: 'i-lucide-heading-1' },
  { kind: 'heading', level: 2, icon: 'i-lucide-heading-2' },
  { kind: 'textAlign', align: 'left', icon: 'i-lucide-align-left' },
  { kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center' },
  { kind: 'bulletList', icon: 'i-lucide-list' },
  { kind: 'orderedList', icon: 'i-lucide-list-ordered' },
  { kind: 'blockquote', icon: 'i-lucide-quote' },
  { kind: 'link', icon: 'i-lucide-link' },
];
</script>
