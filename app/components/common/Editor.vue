<template>
  <div>
    <slot name="loader" />

    <template v-if="isDesktop">
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
            v-model="editorContent"
            content-type="markdown"
            :extensions="extensions"
            :disabled="disabled"
            autofocus
            class="w-full"
            :ui="{
              content:
                'w-xl relative left-1/2 right-1/2 -translate-x-1/2 prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none pt-3 pb-16',
            }"
          >
            <UEditorToolbar
              :editor="editor"
              :items="items"
              class="pb-3 border-b border-b-muted/60"
            />
            <UEditorDragHandle :editor="editor" />

            <ClientOnly>
              <div class="absolute bottom-0 left-0 right-0">
                <UProgress
                  :model-value="Math.min(editor.storage.characterCount.characters(), maxLimit)"
                  :max="maxLimit"
                  :color="getContentLengthColor(percentage)"
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

        <div class="flex items-center gap-2.5">
          <UFieldGroup v-if="modelValue.action === 'partager'" class="w-full">
            <UInput
              v-model="modelValue.icon"
              placeholder="图标 - simple-icons:nuxt"
              variant="outline"
              color="neutral"
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
              color="neutral"
              size="lg"
              class="w-full"
            />
          </UFieldGroup>
        </div>

        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <div class="text-sm">
              {{ modelValue.published ? '正式发布' : '保存草稿' }}
              <p class="text-muted/70">
                {{
                  modelValue.published
                    ? '对全体用户可见，完成公开展示'
                    : '内容仅自己可见，随时编辑调整'
                }}
              </p>
            </div>
            <USwitch v-model="modelValue.published" color="neutral" />
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              {{ modelValue.allow_comment ? '允许评论' : '禁止评论' }}
              <p class="text-muted/70">
                {{
                  modelValue.allow_comment
                    ? '用户可以对该内容进行评论互动'
                    : '用户将会无法对该内容发表评论'
                }}
              </p>
            </div>
            <USwitch v-model="modelValue.allow_comment" color="neutral" />
          </div>
        </div>

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
          <p class="text-sm text-dimmed max-w-60 mt-2">
            当前页面包含复杂排版功能，为了您的编辑体验，请在电脑浏览器中打开。
          </p>
          <UButton class="mt-6" block color="neutral" @click="useRouter().back()"> 返回 </UButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { items } from '~/constants/editor';
import { getChineseWordCount } from '~/utils';
import { actionItems } from '~/constants';

const props = defineProps<{
  modelValue: any;
  maxLimit: number;
  disabled?: boolean;
}>();

defineEmits(['submit']);

const extensions = [
  Placeholder.configure({
    placeholder: '从这里开始写作吧 ...',
  }),
  CharacterCount.configure({
    limit: props.maxLimit,
  }),
];

const editorContent = computed({
  get: () => {
    return props.modelValue.content === '' ? null : props.modelValue.content;
  },
  set: (val) => {
    // 如果 val 是 null，则赋空字符串
    let content = val ?? '';

    // 手动截断：防止通过粘贴等方式绕过拦截
    if (content.length > props.maxLimit) {
      content = content.substring(0, props.maxLimit);
    }

    props.modelValue.content = content;
  },
});

const currentLength = computed(() => props.modelValue?.content?.length || 0);

const percentage = computed(() => {
  if (!props.maxLimit) return 0;
  return Math.min(Math.round((currentLength.value / props.maxLimit) * 100), 100);
});

const isDesktop = ref(true);
const checkScreen = () => {
  // 768px 是 Tailwind 'md' 断点的标准
  isDesktop.value = window.innerWidth >= 768;
};

onMounted(() => {
  checkScreen();
  // 监听窗口缩放，实时响应
  window.addEventListener('resize', checkScreen);
});

onUnmounted(() => {
  // 销毁组件时移除监听，防止内存泄露
  window.removeEventListener('resize', checkScreen);
});
</script>
