<template>
  <UCard
    variant="soft"
    class="max-w-md mx-auto">
    <form
      @submit.prevent="handleSubmit"
      class="space-y-4">
      <UTextarea
        v-model="form.comment"
        autoresize
        color="neutral"
        placeholder="请输入评论内容"
        size="lg"
        :rows="10"
        :disabled="isSubmitting"
        class="w-full" />
      <div
        v-if="errors.comment"
        class="error-message">
        {{ errors.comment }}
      </div>

      <div>
        <UButton
          type="submit"
          color="neutral"
          :loading="isSubmitting"
          :disabled="isSubmitting">
          <span v-if="!isSubmitting">发表评论</span>
          <span v-else>发布中...</span>
        </UButton>
      </div>

      <div
        v-if="globalError"
        class="global-error">
        {{ globalError }}
      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
});

// 定义事件
const emit = defineEmits<{
  // 评论创建成功事件
  (e: 'comment-created', comment: any): void;
}>();

// 表单数据
const form = reactive({
  comment: "",
  post: props.postId,
});

// 表单验证错误
const errors = reactive({
  comment: "",
});

// 状态管理
const isSubmitting = ref(false);
const globalError = ref("");

// 表单验证
const validateForm = () => {
  let isValid = true;

  // 重置错误
  errors.comment = "";
  globalError.value = "";

  // 验证内容
  if (!form.comment.trim()) {
    errors.comment = "内容不能为空";
    isValid = false;
  } else if (form.comment.length > 300) {
    errors.comment = "内容长度不能超过300字符";
    isValid = false;
  }

  return isValid;
};

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!validateForm()) {
    return;
  }

  // 设置提交状态
  isSubmitting.value = true;
  globalError.value = "";
  errors.comment = "";

  try {
    // 调用后端API
    const response = await $fetch("/api/comments/records", {
      method: "POST",
      body: form,
    });

    // 清空表单
    form.comment = "";
    
    // 触发评论创建成功事件，传递新评论数据
    if (response.comments) {
      emit('comment-created', response.comments);
    }
  } catch (error: any) {
    // 检查是否存在详细字段错误 (由 handlePocketBaseError 转发)
    if (error.data && Object.keys(error.data).length > 0) {
      // 尝试分配给 comment 字段
      if (error.data.comment) {
        errors.comment = error.data.comment.message;
      }

      // 如果存在通用错误或未分配的字段错误，则显示在 globalError
      const hasUnassignedError = Object.keys(error.data).some((field) => field !== "comment");

      if (error.statusMessage && (hasUnassignedError || errors.comment === "")) {
        globalError.value = error.statusMessage + "。请检查字段错误。";
      }
    } else {
      // 捕获通用错误 (未登录 401, 或服务端抛出的 400/500)
      globalError.value = error.statusMessage || "发布失败，请稍后重试";
    }

    console.error("Post Error:", error);
  } finally {
    // 恢复提交状态
    isSubmitting.value = false;
  }
};
</script>
