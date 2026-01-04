<template>
  <form @submit.prevent="handleSubmit">
    <div
      class="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/90 dark:border-neutral-800/70 rounded-lg p-1"
    >
      <UTextarea
        ref="textareaRef"
        v-model="form.comment"
        id="comment"
        color="neutral"
        variant="none"
        autoresize
        :rows="2"
        :maxrows="6"
        :padded="false"
        size="xl"
        class="text-neutral-300 w-full py-2"
        :maxlength="maxLimit"
        :disabled="isSubmitting"
        :placeholder="randomPlaceholder"
        @keydown="handleKeyDown"
      />

      <div class="flex justify-between items-center px-3 py-1">
        <div
          class="flex items-center space-x-3"
          :class="{ 'cursor-not-allowed pointer-events-none': isSubmitting }"
        >
          <CommonEmojiSelector @emoji="insertEmoji" />
          <UPopover
            arrow
            :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 6,
            }"
          >
            <template #default="{ open }">
              <UIcon
                name="i-hugeicons:at"
                class="size-5.25 text-muted cursor-pointer hover:text-primary transition-colors"
                :class="{ 'text-primary': open }"
              />
            </template>

            <template #content="{ close }">
              <div class="p-1 w-48 max-h-60 overflow-y-auto">
                <div v-if="isListLoading" class="p-2 text-center">
                  <UIcon
                    name="i-hugeicons:refresh"
                    class="animate-spin size-4"
                  />
                </div>
                <div
                  v-else-if="filteredSuggestions.length === 0"
                  class="p-2 text-sm text-center text-dimmed"
                >
                  暂无可提及的用户
                </div>
                <div v-else>
                  <div
                    v-for="user in filteredSuggestions"
                    :key="user.id"
                    @click="
                      insertMention(user.name);
                      close();
                    "
                    class="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                  >
                    <div class="size-5 rounded-full overflow-hidden shrink-0">
                      <CommonGravatar :avatar-id="user.avatar" :size="32" />
                    </div>
                    <span class="text-sm truncate">{{ user.name }}</span>
                  </div>
                </div>
              </div>
            </template>
          </UPopover>

          <span
            v-if="filteredSuggestions.length > 0"
            class="text-sm text-primary"
          >
            可提及 {{ rawSuggestions.length }} 个用户
          </span>
        </div>

        <div class="flex items-center space-x-6">
          <span
            class="text-sm tabular-nums select-none"
            :class="
              form.comment.length >= maxLimit
                ? 'text-red-600'
                : 'text-neutral-400 dark:text-neutral-600'
            "
          >
            {{ form.comment.length }} / {{ maxLimit }}
          </span>
          <UButton
            type="submit"
            color="neutral"
            size="lg"
            variant="ghost"
            class="hover:bg-transparent! cursor-pointer px-0 text-neutral-500"
            loading-auto
            :icon="
              !isSubmitting &&
              !(form.comment.length >= maxLimit) &&
              form.comment.trim() !== ''
                ? 'i-hugeicons:comment-add-02'
                : 'i-hugeicons:comment-block-02'
            "
            :disabled="
              isSubmitting ||
              form.comment.length >= maxLimit ||
              form.comment.trim() === ''
            "
            :ui="{ leadingIcon: 'size-5' }"
          />
        </div>
      </div>
    </div>

    <UAlert
      v-if="errors.comment"
      icon="i-hugeicons:alert-02"
      color="error"
      variant="soft"
      :title="errors.comment"
      class="mt-4"
    />

    <UAlert
      v-if="globalError"
      icon="i-hugeicons:alert-02"
      color="error"
      variant="soft"
      :title="globalError"
      class="mt-4"
    />
  </form>
</template>

<script setup lang="ts">
import type { CommentRecord } from '~/types/comments';
import { placeholders, COMMENT_MAX_LENGTH } from '~/constants';

const { user: currentUser } = useUserSession();
const toast = useToast();

const props = defineProps({
    postId: { type: String, required: true },
    isListLoading: { type: Boolean, default: false },
    rawSuggestions: { type: Array as PropType<any[]>, default: () => [] },
    maxLimit: { type: Number, default: COMMENT_MAX_LENGTH }, // 建议设为 prop 增加灵活性
});

const emit = defineEmits<{
    (e: 'comment-created', comment: CommentRecord): void;
}>();

const textareaRef = ref<any>(null);
const randomPlaceholder = ref();

// 随机获取 placeholder
const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    randomPlaceholder.value = placeholders[randomIndex];
};

// --- 状态管理 ---
const form = reactive({
    comment: '',
    post: props.postId,
});

const errors = reactive({ comment: '' });
const isSubmitting = ref(false);
const globalError = ref('');

// --- 核心辅助函数：在光标处插入内容并保持焦点 ---
const insertTextAtCursor = (content: string) => {
    // 获取底层的 textarea 元素
    const textarea = textareaRef.value?.$el.querySelector(
      'textarea',
    ) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const currentText = form.comment;

    // 插入字符
    form.comment =
      currentText.substring(0, selectionStart) +
      content +
      currentText.substring(selectionEnd);

    // Vue 更新 DOM 后的光标定位逻辑
    nextTick(() => {
      const newCursorPos = selectionStart + content.length;

      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
};

// --- 功能封装 ---
const insertMention = (userName: string) => {
    insertTextAtCursor(`@${userName} `);
};

const insertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
};

const getTextareaDom = () => {
    return textareaRef.value?.$el.querySelector(
      'textarea',
    ) as HTMLTextAreaElement | null;
};

// 2. 监听 Backspace 按键
const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const textarea = getTextareaDom();

      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;

      // 只有在非选择状态（即只是普通闪烁光标）下才执行逻辑
      if (selectionStart === selectionEnd) {
        const text = form.comment;
        const textBeforeCursor = text.substring(0, selectionStart);

        // 正则匹配：以 @ 开头，中间是字符，最后以空格结尾，且紧贴光标
        // 这里的 regex 匹配的是： @ + 任意非空格字符 + 空格
        const mentionMatch = textBeforeCursor.match(/@\S*$/);

        if (mentionMatch) {
          const matchString = mentionMatch[0];
          const matchStart = selectionStart - matchString.length;

          // 阻止默认删除（默认只删一个空格）
          e.preventDefault();

          // 手动删除整个匹配到的字符串
          form.comment =
            text.substring(0, matchStart) + text.substring(selectionEnd);

          // 重新定位光标
          nextTick(() => {
            textarea.setSelectionRange(matchStart, matchStart);
            textarea.focus();
          });
        }
      }
    }
};

// --- 表单提交逻辑 ---
const validateForm = () => {
    errors.comment = '';
    globalError.value = '';

    const content = form.comment.trim();

    if (!content) {
      errors.comment = '内容不能为空';
      return false;
    }

    return true;
};

const filteredSuggestions = computed(() => {
    const currentId = currentUser.value?.id;
    return props.rawSuggestions.filter((user) => user && user.id !== currentId);
});

const handleSubmit = async () => {
    if (!validateForm() || isSubmitting.value) return;

    isSubmitting.value = true;
    globalError.value = '';

    try {
      // 1. 发送请求，不再需要等待 refreshNuxtData
      const response = await $fetch<any>('/api/collections/comments', {
        method: 'POST',
        body: {
          post: form.post,
          comment: form.comment.trim(),
        },
      });

      const newComment = response.data?.comment;

      if (newComment) {
        // 2. 构造乐观更新数据 (让用户立刻看到自己的评论，不等实时推送)
        const optimisticComment: CommentRecord = {
          ...newComment,
          expand: { user: { ...currentUser.value } },
        };

        // 3. 立即重置输入框
        form.comment = '';

        // 4. 通知列表进行乐观展示 (CommentList 的去重逻辑会处理后续到来的实时推送)
        emit('comment-created', optimisticComment);

        toast.add({
          title: '评论发表成功',
          description: '评论通常实时展示；若未显示，刷新页面。',
          icon: 'i-hugeicons:checkmark-circle-03',
          color: 'success',
        });
      }
    } catch (error: any) {
      globalError.value = error.data?.message || '发送失败，请稍后再试';
    } finally {
      isSubmitting.value = false;
    }
};

if (import.meta.client) {
    onMounted(getRandomPlaceholder);
    onActivated(getRandomPlaceholder);
}
</script>
