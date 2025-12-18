<template>
  <form @submit.prevent="handleSubmit">
    <div
      class="bg-white/80 dark:bg-neutral-950/80 border border-neutral-200/70 dark:border-neutral-800/70 rounded-lg p-1">
      <UTextarea
        ref="textareaRef"
        v-model="form.comment"
        color="neutral"
        variant="none"
        autoresize
        :rows="2"
        :maxrows="6"
        :padded="false"
        size="lg"
        class="text-neutral-300 w-full py-2"
        :maxlength="maxLimit"
        :disabled="isSubmitting"
        placeholder="说点什么 ..." />

      <div
        class="flex justify-between items-center px-3 py-1 border-t border-neutral-100 dark:border-neutral-800">
        <div class="flex items-center space-x-3">
          <CommonEmojiSelector @emoji="insertEmoji" />
          <UPopover
            arrow
            :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 6,
            }">
            <template #default="{ open }">
              <UIcon
                name="hugeicons:at"
                class="size-5.25 text-muted cursor-pointer hover:text-primary transition-colors"
                :class="{ 'text-primary': open }" />
            </template>

            <template #content="{ close }">
              <div class="p-1 w-48 max-h-60 overflow-y-auto">
                <div
                  v-if="rawSuggestions.length === 0"
                  class="p-2 text-xs text-center text-dimmed">
                  暂无可提及的用户
                </div>
                <div v-else>
                  <div
                    v-for="user in rawSuggestions"
                    :key="user.id"
                    @click="
                      insertMention(user.name);
                      close();
                    "
                    class="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors">
                    <UAvatar
                      :src="`https://gravatar.loli.net/avatar/${user.avatar}?s=32&r=G`"
                      size="xs" />
                    <span class="text-sm truncate">{{ user.name }}</span>
                  </div>
                </div>
              </div>
            </template>
          </UPopover>

          <span
            v-if="rawSuggestions.length > 0"
            class="text-xs text-dimmed">
            可提及 {{ rawSuggestions.length }} 个用户
          </span>
        </div>

        <div class="flex items-center space-x-6">
          <span
            class="text-[13px] tabular-nums select-none"
            :class="
              form.comment.length >= maxLimit
                ? 'text-red-600'
                : 'text-neutral-400 dark:text-neutral-600'
            ">
            {{ form.comment.length }} / {{ maxLimit }}
          </span>
          <UButton
            type="submit"
            color="neutral"
            size="lg"
            variant="ghost"
            class="hover:bg-transparent! cursor-pointer px-0 text-neutral-500"
            :loading="isSubmitting"
            :icon="
              !isSubmitting && !(form.comment.length >= maxLimit) && form.comment.trim() !== ''
                ? 'hugeicons:comment-add-02'
                : 'hugeicons:comment-block-02'
            "
            :disabled="
              isSubmitting || form.comment.length >= maxLimit || form.comment.trim() === ''
            "
            :ui="{ leadingIcon: 'size-5' }" />
        </div>
      </div>
    </div>

    <UAlert
      v-if="errors.comment"
      icon="hugeicons:alert-02"
      color="error"
      variant="soft"
      :title="errors.comment"
      class="mt-4" />

    <UAlert
      v-if="globalError"
      icon="hugeicons:alert-02"
      color="error"
      variant="soft"
      :title="globalError"
      class="mt-4" />
  </form>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";

const { user: currentUser } = useUserSession();

const props = defineProps({
  postId: { type: String, required: true },
  rawSuggestions: { type: Array as PropType<any[]>, default: () => [] },
  maxLimit: { type: Number, default: 200 }, // 建议设为 prop 增加灵活性
});

const emit = defineEmits<{ (e: "comment-created", comment: CommentRecord): void }>();

const textareaRef = ref<any>(null);

// --- 状态管理 ---
const form = reactive({
  comment: "",
  post: props.postId,
});
const errors = reactive({ comment: "" });
const isSubmitting = ref(false);
const globalError = ref("");

// --- 核心辅助函数：在光标处插入内容并保持焦点 ---
const insertTextAtCursor = (content: string) => {
  // 获取底层的 textarea 元素
  const textarea = textareaRef.value?.$el.querySelector("textarea") as HTMLTextAreaElement | null;
  if (!textarea) return;

  const { selectionStart, selectionEnd } = textarea;
  const currentText = form.comment;

  // 插入字符
  form.comment =
    currentText.substring(0, selectionStart) + content + currentText.substring(selectionEnd);

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

// --- 表单提交逻辑 ---
const validateForm = () => {
  errors.comment = "";
  globalError.value = "";
  const content = form.comment.trim();
  if (!content) {
    errors.comment = "内容不能为空";
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const response = await $fetch<any>("/api/comments/records", {
      method: "POST",
      body: {
        ...form,
        comment: form.comment.trim(), // 发送前去空格
      },
    });

    // 确保无论返回格式如何，都清空评论框并触发事件
    const newComment = response.data?.comment || response.comments || response;
    if (newComment) {
      await refreshNuxtData(`comments-data-${props.postId}`);

      // 添加当前用户信息到新评论
      const commentWithUser = {
        ...newComment,
        id: newComment.id, // 确保有正确的评论ID
        comment: form.comment.trim(), // 使用提交的评论内容
        created: newComment.created || new Date().toISOString(), // 确保有有效的创建时间
        expand: {
          user: {
            id: currentUser.value?.id,
            name: currentUser.value?.name,
            avatar: currentUser.value?.avatar,
          },
        },
      };

      form.comment = "";
      emit("comment-created", commentWithUser);
    } else {
      // 如果没有返回评论数据，仍需清空评论框
      form.comment = "";
    }
  } catch (error: any) {
    globalError.value = error.data?.message || "网络请求失败，请稍后再试";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
