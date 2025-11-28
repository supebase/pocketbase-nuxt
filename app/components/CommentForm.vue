<template>
  <UCard class="w-full mt-6">
    <template #header>
      <h3 class="text-lg font-semibold">发表评论</h3>
    </template>
    <UForm @submit="handleSubmit" class="space-y-4">
      <!-- 评论内容输入 -->
      <UTextarea
        v-model="form.comment"
        placeholder="请输入您的评论"
        :rows="4"
        required
        :disabled="isSubmitting"
      />

      <!-- 错误信息 -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        :title="error"
      />

      <!-- 提交按钮 -->
      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
        >
          发表评论
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { CreateCommentRequest } from "~/types/comment";

// Props
const props = defineProps<{
  postId: string;
}>();

// Emits
const emit = defineEmits<{
  (_e: "submit", _data: CreateCommentRequest): void;
}>();

// State
const form = reactive<CreateCommentRequest>({
  comment: "",
  post: props.postId
});

const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Methods
const handleSubmit = async () => {
  try {
    isSubmitting.value = true;
    error.value = null;
    emit("submit", form);
    // 重置表单
    form.comment = "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "提交失败";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
