<template>
  <UCard class="w-full max-w-3xl mx-auto">
    <UForm @submit="handleSubmit" class="space-y-4">
      <!-- 标题输入 -->
      <UInput
        v-model="form.title"
        type="text"
        placeholder="请输入文章标题"
        required
        label="标题"
        :disabled="isSubmitting"
      />

      <!-- 内容输入 -->
      <UTextarea
        v-model="form.content"
        placeholder="请输入文章内容"
        :rows="10"
        required
        label="内容"
        :disabled="isSubmitting"
      />

      <!-- 错误信息 -->
      <UAlert
        v-if="displayError"
        color="error"
        variant="soft"
        :title="displayError"
      />

      <!-- 提交按钮 -->
      <div class="flex gap-2">
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
        >
          {{ submitButtonText }}
        </UButton>
        <NuxtLink to="/posts">
          <UButton
            variant="outline"
            :disabled="isSubmitting"
          >
            取消
          </UButton>
        </NuxtLink>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { CreatePostRequest, UpdatePostRequest } from "~/types/post";

// Props
const props = defineProps<{
  initialData?: CreatePostRequest | UpdatePostRequest;
  submitButtonText?: string;
  error?: string | null;
}>();

// Emits
const emit = defineEmits<{
  (_e: "submit", _data: CreatePostRequest | UpdatePostRequest): Promise<void>;
}>();

// State
const form = reactive<CreatePostRequest | UpdatePostRequest>({
  title: props.initialData?.title || "",
  content: props.initialData?.content || ""
});

const isSubmitting = ref(false);
const localError = ref<string | null>(null);

// Computed
const displayError = computed(() => props.error || localError.value);
const submitButtonText = computed(() => props.submitButtonText || "发布文章");

// Methods
const handleSubmit = async () => {
  try {
    isSubmitting.value = true;
    localError.value = null;
    await emit("submit", form);
  } catch (err) {
    localError.value = err instanceof Error ? err.message : "提交失败";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
