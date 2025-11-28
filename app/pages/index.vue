<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <UCard class="w-full max-w-md mb-8">
      <div
        v-if="isAuthenticated"
        class="text-center space-y-4">
        <AvatarManager :user="currentUser" />
        <UAlert
          color="neutral"
          variant="soft"
          :title="currentUser.verified ? '已认证' : '未认证'"
          :description="`欢迎您，${currentUser.email}!`"
          class="mb-4" />
        <UButton
          icon="ri:logout-circle-line"
          @click="logout"
          color="neutral"
          variant="soft">
          安全退出
        </UButton>
      </div>

      <div v-else>
        <p class="mb-4">请登录或注册以继续。</p>

        <h3 class="font-semibold mb-3">快速登录</h3>
        <UForm
          @submit="handleLogin"
          class="space-y-4 mb-8">
          <div class="flex items-center justify-between">
            <UInput
              v-model="loginEmail"
              type="email"
              placeholder="邮箱"
              required
              label="邮箱" />
            <UInput
              v-model="loginPassword"
              type="password"
              placeholder="密码"
              required
              label="密码" />
          </div>

          <UAlert
            v-if="loginError"
            icon="i-heroicons-x-circle"
            color="error"
            variant="soft"
            :title="loginError" />

          <UButton
            type="submit"
            block
            :loading="isLoggingIn">
            登录
          </UButton>
        </UForm>

        <USeparator />

        <h3 class="font-semibold mb-3 pt-4">快速注册</h3>
        <UForm
          @submit="handleRegister"
          class="space-y-4">
          <div class="flex items-center justify-between">
            <UInput
              v-model="registerEmail"
              type="email"
              placeholder="邮箱"
              required
              label="邮箱"
              :color="getFieldError('email') ? 'red' : 'primary'"
              :description="getFieldError('email')" />

            <UInput
              v-model="registerName"
              type="text"
              placeholder="用户名"
              required
              label="用户名"
              :color="getFieldError('name') ? 'red' : 'primary'"
              :description="getFieldError('name')" />
          </div>

          <div class="flex items-center justify-between">
            <UInput
              v-model="registerPassword"
              type="password"
              placeholder="密码"
              required
              label="密码"
              :color="getFieldError('password') ? 'red' : 'primary'"
              :description="getFieldError('password')" />

            <UInput
              v-model="registerPasswordConfirm"
              type="password"
              placeholder="确认密码"
              required
              label="确认密码"
              :color="getFieldError('passwordConfirm') ? 'red' : 'primary'"
              :description="getFieldError('passwordConfirm')" />
          </div>

          <UAlert
            v-if="registerError"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="registerError"
            class="mt-4" />

          <UButton
            type="submit"
            block
            variant="soft"
            :loading="isRegistering"
            color="neutral">
            注册新账号
          </UButton>
        </UForm>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const { isAuthenticated, currentUser, login, logout, register } = useAuth();

// --- 状态管理 ---
const isLoggingIn = ref(false);
const isRegistering = ref(false);

// --- 登录状态 ---
const loginEmail = ref("new@example.com");
const loginPassword = ref("12345678");
const loginError = ref("");

// --- 注册状态 ---
const registerEmail = ref("");
const registerName = ref("");
const registerPassword = ref("");
const registerPasswordConfirm = ref("");
const registerError = ref(""); // 用于顶部通用/汇总错误提示

// 存储 PocketBase 返回的所有字段错误信息
const formErrors = ref({});

/**
 * 辅助函数：根据字段名获取错误信息
 * 🌟 格式：[CODE] MESSAGE
 */
const getFieldError = (fieldName) => {
  const error = formErrors.value[fieldName];

  if (!error) {
    return null;
  }

  // 直接返回 PocketBase 原始的 code 和 message
  return `[${error.code}] ${error.message}`;
};

// --- 核心方法 ---

async function handleLogin() {
  isLoggingIn.value = true;
  loginError.value = "";
  formErrors.value = {}; // 清除字段错误

  try {
    const result = await login(loginEmail.value, loginPassword.value);

    if (result && result.isError) {
      // 登录失败，result 是 AuthError
      loginError.value = result.message;
    }
    // 成功时 result 为 void
  } catch (error) {
    // 捕获非 AuthError 的通用错误 (如网络问题)
    loginError.value = error.message || "登录过程中发生未知错误。";
  } finally {
    isLoggingIn.value = false;
  }
}

async function handleRegister() {
  isRegistering.value = true;
  registerError.value = "";
  formErrors.value = {}; // 重置字段错误

  try {
    const result = await register(
      registerEmail.value,
      registerPassword.value,
      registerPasswordConfirm.value,
      { name: registerName.value }
    );

    if (result && result.isError) {
      // 捕获到 AuthError
      if (result.errors) {
        // 结构化验证错误 (400)
        formErrors.value = result.errors;

        // 🌟 遍历字段错误，在顶部的 registerError 中显示所有错误信息
        let combinedErrorMessage = "注册验证失败。详细错误：\n";

        // 确保错误按注册表单字段顺序显示（可选）
        const fieldOrder = ["email", "name", "password", "passwordConfirm"];

        fieldOrder.forEach((key) => {
          const error = result.errors[key];
          if (error) {
            // 将 [CODE] MESSAGE 格式放入顶部提示
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        });

        // 如果有其他未列出的错误字段
        for (const key in result.errors) {
          if (!fieldOrder.includes(key)) {
            const error = result.errors[key];
            combinedErrorMessage += `- ${key}: [${error.code}] ${error.message}\n`;
          }
        }

        // 移除末尾换行并设置
        registerError.value = combinedErrorMessage.trim();
      } else {
        // 通用注册错误（非 400，如 500）
        registerError.value = result.message;
      }
    }
    // 成功时 result 是 BaseModel，状态已自动更新
  } catch (error) {
    // 捕获非 AuthError 的通用错误 (如网络问题)
    registerError.value = error.message || "注册过程中发生未知错误。";
  } finally {
    isRegistering.value = false;
  }
}
</script>
