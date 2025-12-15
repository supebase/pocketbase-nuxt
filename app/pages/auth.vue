<template>
  <div class="auth-container">
    <h2>{{ isLoginMode ? "用户登录" : "用户注册" }}</h2>

    <div
      v-if="error"
      class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleAuth">
      <div class="form-group">
        <input
          v-model="email"
          placeholder="邮箱"
          :disabled="loading" />
      </div>

      <div class="form-group">
        <input
          v-model="password"
          type="password"
          placeholder="密码"
          :disabled="loading" />
      </div>

      <div
        v-if="!isLoginMode"
        class="form-group">
        <input
          v-model="passwordConfirm"
          type="password"
          placeholder="确认密码"
          :disabled="loading" />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="submit-btn">
        {{ loading ? "处理中..." : isLoginMode ? "登录" : "注册" }}
      </button>
    </form>

    <p class="toggle-mode">
      {{ isLoginMode ? "还没有账号？" : "已有账号？" }}
      <a
        href="#"
        @click.prevent="toggleMode">
        {{ isLoginMode ? "去注册" : "去登录" }}
      </a>
    </p>
  </div>
</template>

<script setup lang="ts">
// 假设 useUserSession 是您的 Nuxt 会话管理工具
const { fetch: fetchSession } = useUserSession();

const isLoginMode = ref(true);
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const loading = ref(false);
const error = ref("");

function toggleMode() {
  isLoginMode.value = !isLoginMode.value;
  error.value = "";
  passwordConfirm.value = "";
}

async function handleAuth() {
  loading.value = true;
  error.value = "";

  // 前端验证 (保持不变)
  if (!email.value || !password.value) {
    error.value = "请输入邮箱和密码";
    loading.value = false;
    return;
  }

  if (!isLoginMode.value && password.value !== passwordConfirm.value) {
    error.value = "两次输入的密码不一致";
    loading.value = false;
    return;
  }

  const endpoint = isLoginMode.value ? "/api/auth/login" : "/api/auth/register";

  try {
    const body = isLoginMode.value
      ? { email: email.value, password: password.value }
      : {
          email: email.value,
          password: password.value,
          passwordConfirm: passwordConfirm.value,
        };

    await $fetch(endpoint, {
      method: "POST",
      body,
    });

    // 刷新会话并跳转
    await fetchSession();
    await navigateTo("/");
  } catch (err: any) {
    /**
     * 简化错误解析逻辑：
     * 依赖服务器端 handlePocketBaseError 抛出的友好信息稳定地位于 err.data.statusMessage。
     */
    const serverErrorData = err?.data;
    let friendlyErrorMessage = "网络错误，请稍后重试";

    // 1. 优先从服务器端设置的 statusMessage 中获取友好的错误信息
    if (serverErrorData?.statusMessage) {
      friendlyErrorMessage = serverErrorData.statusMessage;
    }
    // 2. 其次使用 $fetch 包装的通用 message（例如，当网络完全断开时）
    else if (err?.message) {
      friendlyErrorMessage = err.message;
    }

    error.value = friendlyErrorMessage;
  } finally {
    loading.value = false;
  }
}
</script>
