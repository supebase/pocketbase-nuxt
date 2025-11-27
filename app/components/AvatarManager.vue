<template>
  <div class="space-y-4">
    <!-- 头像预览 -->
    <div class="flex justify-center mb-4">
      <div class="relative w-24 h-24 rounded-full overflow-hidden">
        <UAvatar
          :src="avatarUrl"
          icon="ri:image-2-line"
          size="3xl"
          class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- 头像操作 -->
    <div class="flex justify-center items-center space-y-3">
      <!-- 文件上传 -->
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange" />
        <UButton
          icon="ri:image-circle-line"
          @click="fileInput?.click()"
          color="neutral"
          variant="soft"
          :disabled="isUploading">
          选择头像
        </UButton>
        <UButton
          v-if="selectedFile"
          icon="ri:upload-cloud-2-line"
          @click="handleUploadAvatar"
          color="success"
          variant="soft"
          :loading="isUploading">
          上传头像
        </UButton>
        <UButton
          v-if="avatarUrl"
          icon="ri:delete-bin-2-line"
          @click="handleDeleteAvatar"
          color="error"
          variant="soft"
          :loading="isDeleting">
          删除头像
        </UButton>
      </div>

      <!-- 文件名显示 -->
      <div
        v-if="selectedFile"
        class="text-sm text-gray-600 dark:text-gray-400">
        已选择: {{ selectedFile.name }}
      </div>

      <!-- 错误信息 -->
      <UAlert
        v-if="avatarError"
        icon="i-heroicons-x-circle"
        color="error"
        variant="soft"
        :title="avatarError"
        class="mt-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BaseModel } from "pocketbase";

// 定义组件属性
const props = defineProps<{
  user: BaseModel | null;
}>();

// 导入头像管理功能
const { uploadAvatar, deleteAvatar, getAvatarUrl } = useAvatar();

// 状态管理
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const isDeleting = ref(false);
const avatarError = ref("");
const formErrors = ref<Record<string, { code: string; message: string }>>({});
const fileInput = ref<HTMLInputElement | null>(null);

// 计算属性：获取头像URL
const avatarUrl = computed(() => {
  return getAvatarUrl(props.user);
});

/**
 * 处理文件选择
 */
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    avatarError.value = "";
    formErrors.value = {};
  }
};

/**
 * 处理头像上传
 */
const handleUploadAvatar = async () => {
  if (!selectedFile.value) return;

  isUploading.value = true;
  avatarError.value = "";
  formErrors.value = {};

  try {
    const result = await uploadAvatar(selectedFile.value);

    if ("isError" in result && result.isError) {
      if (result.errors) {
        // 结构化验证错误
        formErrors.value = result.errors;
        
        // 遍历字段错误，组合成完整的错误信息
        let combinedErrorMessage = "头像上传验证失败。详细错误：\n";
        const fieldOrder = ["avatar"];
        
        fieldOrder.forEach((key) => {
          const error = result.errors[key];
          if (error) {
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        });
        
        // 处理其他未列出的错误字段
        for (const key in result.errors) {
          if (!fieldOrder.includes(key)) {
            const error = result.errors[key];
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        }
        
        avatarError.value = combinedErrorMessage.trim();
      } else {
        // 通用错误
        avatarError.value = result.message;
      }
    } else {
      // 上传成功，重置选择的文件
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    }
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : "头像上传过程中发生未知错误";
  } finally {
    isUploading.value = false;
  }
};

/**
 * 处理头像删除
 */
const handleDeleteAvatar = async () => {
  isDeleting.value = true;
  avatarError.value = "";
  formErrors.value = {};

  try {
    const result = await deleteAvatar();

    if ("isError" in result && result.isError) {
      if (result.errors) {
        // 结构化验证错误
        formErrors.value = result.errors;
        
        // 遍历字段错误，组合成完整的错误信息
        let combinedErrorMessage = "头像删除验证失败。详细错误：\n";
        const fieldOrder = ["avatar"];
        
        fieldOrder.forEach((key) => {
          const error = result.errors[key];
          if (error) {
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        });
        
        // 处理其他未列出的错误字段
        for (const key in result.errors) {
          if (!fieldOrder.includes(key)) {
            const error = result.errors[key];
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        }
        
        avatarError.value = combinedErrorMessage.trim();
      } else {
        // 通用错误
        avatarError.value = result.message;
      }
    }
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : "头像删除过程中发生未知错误";
  } finally {
    isDeleting.value = false;
  }
};
</script>
