<template>
  <div class="mt-4">
    <UForm
      :state="formState"
      @submit="handleAuth"
      class="flex flex-col gap-4">
      <UInput
        v-model="email"
        placeholder="电子邮件"
        color="neutral"
        :disabled="loading"
        icon="hugeicons:at"
        size="xl"
        class="w-full" />

      <UInput
        v-model="password"
        placeholder="登录密码"
        :color="isLoginMode ? 'neutral' : color"
        :disabled="loading"
        icon="hugeicons:lock-key"
        size="xl"
        class="w-full"
        :type="showPassword ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton
            tabindex="-1"
            color="neutral"
            variant="link"
            :icon="showPassword ? 'hugeicons:view' : 'hugeicons:view-off'"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPassword"
            aria-controls="password"
            @click="togglePasswordVisibility" />
        </template>
      </UInput>

      <div v-if="!isLoginMode">
        <ul class="space-y-2 ml-3.25">
          <li
            v-for="(req, index) in strength"
            :key="index"
            class="flex items-center gap-1"
            :class="req.met ? 'text-primary' : 'text-dimmed'">
            <UIcon
              :name="req.met ? 'hugeicons:checkmark-circle-03' : 'hugeicons:circle'"
              class="size-4 shrink-0" />
            <span class="text-xs text-dimmed tabular-nums">
              {{ req.text }}
            </span>
          </li>
        </ul>
      </div>

      <UInput
        v-if="!isLoginMode"
        v-model="passwordConfirm"
        placeholder="确认密码"
        color="neutral"
        :disabled="loading"
        icon="hugeicons:square-lock-check-01"
        size="xl"
        class="w-full"
        :type="showPasswordConfirm ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton
            tabindex="-1"
            color="neutral"
            variant="link"
            :icon="showPasswordConfirm ? 'hugeicons:view' : 'hugeicons:view-off'"
            :aria-label="showPasswordConfirm ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPasswordConfirm"
            aria-controls="passwordConfirm"
            @click="togglePasswordConfirmVisibility" />
        </template>
      </UInput>

      <UButton
        type="submit"
        :loading="loading"
        :label="buttonLabel"
        color="neutral"
        size="xl"
        block
        class="mt-1 cursor-pointer" />
    </UForm>

    <USeparator
      type="dashed"
      label="或者"
      class="my-5" />

    <UButton
      type="button"
      variant="soft"
      label="返回首页"
      color="neutral"
      size="xl"
      block
      to="/" />

    <UAlert
      v-if="error"
      icon="hugeicons:alert-02"
      color="error"
      variant="soft"
      :description="error"
      class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import {
  checkPasswordStrength,
  calculatePasswordScore,
  getPasswordStrengthColor,
} from "~/utils/password";

const { fetch: fetchSession } = useUserSession();

const props = defineProps<{
  isLoginMode: boolean;
}>();

// 状态
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const loading = ref(false);
const error = ref("");

// 使用密码显示/隐藏组合式函数
const { isVisible: showPassword, toggleVisibility: togglePasswordVisibility } =
  usePasswordVisibility();
const { isVisible: showPasswordConfirm, toggleVisibility: togglePasswordConfirmVisibility } =
  usePasswordVisibility();

// 计算属性
const formState = computed(() => ({
  email: email.value,
  password: password.value,
  passwordConfirm: passwordConfirm.value,
}));

const buttonLabel = computed(() => {
  if (loading.value) {
    return props.isLoginMode ? "正在登录" : "创建成功后将自动登录";
  }
  return props.isLoginMode ? "登录账户" : "创建账户";
});

// 处理表单提交的函数
async function handleAuth() {
  loading.value = true;
  error.value = "";

  // 1. 前端验证
  if (!email.value || !password.value) {
    error.value = "请输入电子邮件和登录密码";
    loading.value = false;
    return;
  }

  if (!props.isLoginMode && password.value !== passwordConfirm.value) {
    error.value = "两次输入的密码不一致";
    loading.value = false;
    return;
  }

  // 2. API 调用
  const endpoint = props.isLoginMode ? "/api/auth/login" : "/api/auth/register";

  try {
    const body = props.isLoginMode
      ? { email: email.value, password: password.value }
      : {
          email: email.value,
          password: password.value,
          passwordConfirm: passwordConfirm.value,
        };

    // 使用 $fetch 发起请求
    await $fetch(endpoint, {
      method: "POST",
      body,
    });

    email.value = "";
    password.value = "";
    passwordConfirm.value = "";

    // 刷新会话并跳转
    await fetchSession();
    // 成功后跳转到首页
    await navigateTo("/");
  } catch (err: any) {
    // 1. 优先读取 err.data.message (这是我们后端 handlePocketBaseError 传回的友好中文)
    if (err.data?.message) {
      error.value = err.data.message;
    }
    // 2. 如果没有 data.message，尝试读取外层的 err.message
    else if (err.message) {
      // 这里的 err.message 可能是 Nuxt 自动生成的，也可能是网络错误
      error.value = err.message.includes("fetch") ? "无法连接到服务器，请检查网络" : err.message;
    }
    // 3. 最后兜底
    else {
      error.value = "发生未知错误，请稍后再试";
    }

    console.error("Auth Error Details:", {
      status: err.statusCode,
      message: err.message,
      data: err.data,
    });
  } finally {
    loading.value = false;
  }
}

// 密码强度相关计算
const strength = computed(() => checkPasswordStrength(password.value));
const score = computed(() => calculatePasswordScore(strength.value));
const color = computed(() => getPasswordStrengthColor(score.value));
</script>
