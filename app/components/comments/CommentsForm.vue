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
        class="w-full py-2"
        :maxlength="maxLimit"
        :disabled="isSubmitting"
        :placeholder="randomPlaceholder"
        @keydown="onKeyDown"
      />

      <div class="flex justify-between items-center px-3 py-1">
        <div class="flex items-center space-x-3" :class="{ 'cursor-not-allowed pointer-events-none': isSubmitting }">
          <CommonEmojiSelector @emoji="onInsertEmoji" />

          <UPopover arrow :content="{ align: 'start', side: 'bottom', sideOffset: 6 }">
            <template #default="{ open }">
              <UIcon
                name="i-hugeicons:at"
                class="size-5.25 text-muted cursor-pointer hover:text-primary transition-colors"
                :class="{ 'text-primary': open }"
              />
            </template>

            <template #content="{ close }">
              <CommentsMention
                :suggestions="filteredSuggestions"
                :loading="isListLoading"
                @select="
                  (name) => {
                    onInsertMention(name);
                    close();
                  }
                "
              />
            </template>
          </UPopover>

          <span v-if="isListLoading" class="text-xs animate-pulse text-muted">正在加载...</span>
          <span v-else-if="filteredSuggestions.length > 0" class="text-sm text-primary">
            可提及 {{ rawSuggestions.length }} 个用户
          </span>
        </div>

        <div class="flex items-center space-x-6">
          <span
            class="text-sm tabular-nums select-none"
            :class="form.comment.length >= maxLimit ? 'text-red-600' : 'text-dimmed'"
          >
            {{ form.comment.length }} / {{ maxLimit }}
          </span>
          <UButton
            type="submit"
            color="neutral"
            size="lg"
            variant="ghost"
            class="hover:bg-transparent! cursor-pointer px-0 text-muted"
            loading-auto
            :icon="submitIcon"
            :disabled="isSubmitDisabled"
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

const props = defineProps({
  postId: { type: String, required: true },
  isListLoading: { type: Boolean, default: false },
  rawSuggestions: { type: Array as PropType<any[]>, default: () => [] },
  maxLimit: { type: Number, default: COMMENT_MAX_LENGTH },
});

const emit = defineEmits<{
  (e: 'comment-created', comment: CommentRecord): void;
}>();

// --- 核心逻辑抽离 ---
const textareaRef = ref<any>(null);
const { insertAtCursor, handleMentionBackspace } = useCommentEditor(textareaRef);

// --- 状态管理 ---
const { user: currentUser } = useUserSession();
const toast = useToast();
const form = reactive({ comment: '', post: props.postId });
const errors = reactive({ comment: '' });
const isSubmitting = ref(false);
const globalError = ref('');
const randomPlaceholder = ref<string>('说点什么 ...');

// --- 计算属性 ---
const filteredSuggestions = computed(() => {
  const currentId = currentUser.value?.id;
  return props.rawSuggestions.filter((user) => user && user.id !== currentId);
});

const isSubmitDisabled = computed(
  () => isSubmitting.value || form.comment.length >= props.maxLimit || form.comment.trim() === '',
);

const submitIcon = computed(() =>
  !isSubmitting.value && form.comment.length < props.maxLimit && form.comment.trim() !== ''
    ? 'i-hugeicons:comment-add-02'
    : 'i-hugeicons:comment-block-02',
);

// --- 事件处理 ---
const onInsertEmoji = (emoji: string) => {
  const { newText, moveCursor } = insertAtCursor(form.comment, emoji);
  form.comment = newText;
  moveCursor();
};

const onInsertMention = (name: string) => {
  const { newText, moveCursor } = insertAtCursor(form.comment, `@${name} `);
  form.comment = newText;
  moveCursor();
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Backspace') {
    form.comment = handleMentionBackspace(form.comment, e);
  }
};

// --- 业务逻辑 ---
const getRandomPlaceholder = () => {
  const index = Math.floor(Math.random() * placeholders.length);
  // 使用 ?? 确保即使数组越界也返回 string
  randomPlaceholder.value = placeholders[index] ?? '说点什么 ...';
};

const handleSubmit = async () => {
  if (form.comment.trim() === '' || isSubmitting.value) return;

  isSubmitting.value = true;
  globalError.value = '';
  errors.comment = '';

  try {
    const response = await $fetch<any>('/api/collections/comments', {
      method: 'POST',
      body: { post: form.post, comment: form.comment.trim() },
    });

    const newComment = response.data?.comment;
    if (newComment) {
      const optimisticComment: CommentRecord = {
        ...newComment,
        expand: { user: { ...currentUser.value } },
      };
      form.comment = '';
      emit('comment-created', optimisticComment);
      toast.add({
        title: '评论发表成功',
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
