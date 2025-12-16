<template>
  <div class="mt-4">
    <UForm
      :state="formState"
      @submit="handleAuth"
      class="flex flex-col gap-4">
      <UInput
        v-model="email"
        placeholder="电子邮件"
        variant="outline"
        color="neutral"
        :disabled="loading"
        icon="hugeicons:at"
        size="lg"
        class="w-full" />

      <UInput
        v-model="password"
        placeholder="登录密码"
        variant="outline"
        :color="isLoginMode ? 'neutral' : color"
        :disabled="loading"
        icon="hugeicons:lock-key"
        size="lg"
        class="w-full"
        :type="showPassword ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            :icon="showPassword ? 'hugeicons:view' : 'hugeicons:view-off'"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPassword"
            aria-controls="password"
            @click="showPassword = !showPassword" />
        </template>
      </UInput>

      <div v-if="!isLoginMode">
        <ul class="space-y-2">
          <li
            v-for="(req, index) in strength"
            :key="index"
            class="flex items-center gap-1"
            :class="req.met ? 'text-success' : 'text-muted'">
            <UIcon
              :name="req.met ? 'hugeicons:checkmark-circle-03' : 'hugeicons:circle'"
              class="size-5 shrink-0" />
            <span class="text-sm text-muted">
              {{ req.text }}
            </span>
          </li>
        </ul>
      </div>

      <UInput
        v-if="!isLoginMode"
        v-model="passwordConfirm"
        placeholder="确认密码"
        variant="outline"
        color="neutral"
        :disabled="loading"
        icon="hugeicons:square-lock-check-01"
        size="lg"
        class="w-full"
        :type="showPasswordConfirm ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }">
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            :icon="showPasswordConfirm ? 'hugeicons:view' : 'hugeicons:view-off'"
            :aria-label="showPasswordConfirm ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPasswordConfirm"
            aria-controls="passwordConfirm"
            @click="showPasswordConfirm = !showPasswordConfirm" />
        </template>
      </UInput>

      <UButton
        type="submit"
        :loading="loading"
        :label="buttonLabel"
        color="neutral"
        size="lg"
        block
        class="mt-1" />
    </UForm>

    <UAlert
      v-if="error"
      icon="hugeicons:alert-02"
      color="error"
      variant="soft"
      :title="error"
      class="mt-4" />
  </div>
</template>

<script setup lang="ts">
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

const showPassword = ref(false);
const showPasswordConfirm = ref(false);

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
    const serverErrorData = err?.data;
    let friendlyErrorMessage = "网络错误，请稍后重试";

    if (serverErrorData?.statusMessage) {
      friendlyErrorMessage = serverErrorData.statusMessage;
    } else if (err?.message) {
      friendlyErrorMessage = err.message;
    }

    error.value = friendlyErrorMessage;
  } finally {
    loading.value = false;
  }
}

function checkStrength(str: string) {
  const requirements = [
    { regex: /.{8,}/, text: "密码至少 8 个字符" },
    { regex: /\d/, text: "包含至少 1 个数字" },
    { regex: /[a-z]/, text: "包含至少 1 个小写字母" },
    { regex: /[A-Z]/, text: "包含至少 1 个大写字母" },
  ];

  return requirements.map((req) => ({ met: req.regex.test(str), text: req.text }));
}

const strength = computed(() => checkStrength(password.value));
const score = computed(() => strength.value.filter((req) => req.met).length);

const color = computed(() => {
  if (score.value === 0) return "neutral";
  if (score.value <= 1) return "error";
  if (score.value <= 2) return "warning";
  if (score.value === 3) return "warning";
  return "success";
});
</script>
