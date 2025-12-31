export const useAuth = (isLoginMode?: Ref<boolean>) => {
  const { fetch: fetchSession } = useUserSession();
  const { locationData, fetchGeo } = useGeoLocation();
  const toast = useToast();
  const route = useRoute();

  // --- 1. 状态管理 ---
  const email = ref('');
  const password = ref('');
  const passwordConfirm = ref('');
  const loading = ref(false); // 用于登录/注册
  const isLoggingOut = ref(false); // 用于登出
  const error = ref('');

  // --- 2. 密码强度计算 ---
  const strength = computed(() => checkPasswordStrength(password.value));
  const score = computed(() => calculatePasswordScore(strength.value));
  const color = computed(() => getPasswordStrengthColor(score.value));

  // --- 3. 登录与注册逻辑 ---
  const handleAuth = async () => {
    if (!isLoginMode) return;

    loading.value = true;
    error.value = '';

    if (!email.value || !password.value) {
      error.value = '请输入电子邮件和登录密码';
      loading.value = false;
      return;
    }

    if (!isLoginMode.value && password.value !== passwordConfirm.value) {
      error.value = '两次输入的密码不一致';
      loading.value = false;
      return;
    }

    const endpoint = isLoginMode.value ? '/api/auth/login' : '/api/auth/register';

    try {
      const body = isLoginMode.value
        ? { email: email.value, password: password.value }
        : {
            email: email.value,
            password: password.value,
            passwordConfirm: passwordConfirm.value,
            location: locationData.value.location,
          };

      await $fetch<any>(endpoint, { method: 'POST', body });
      await fetchSession();

      toast.add({
        title: isLoginMode.value ? '登录成功' : '创建成功',
        description: isLoginMode.value ? `欢迎回来，${email.value}` : '您已成功创建账户并登录',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'success',
      });

      email.value = '';
      password.value = '';
      passwordConfirm.value = '';

      let redirectPath = (route.query.redirect as string) || '/';
      if (!redirectPath.startsWith('/') || redirectPath.includes('//')) {
        redirectPath = '/';
      }
      await navigateTo(redirectPath, { replace: true });
    } catch (err: any) {
      if (err.data?.message) {
        error.value = err.data.message;
      } else if (err.message) {
        error.value = err.message.includes('fetch') ? '无法连接到服务器，请检查网络' : err.message;
      } else {
        error.value = '发生未知错误，请稍后再试';
      }
    } finally {
      loading.value = false;
    }
  };

  // --- 4. 登出逻辑 ---
  const handleLogout = async () => {
    if (isLoggingOut.value) return;

    isLoggingOut.value = true;
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
      await fetchSession();
      await navigateTo('/auth', { replace: true });
    } catch (err: any) {
      toast.add({
        title: '退出失败',
        description: err.data?.message || '服务器连接异常',
        icon: 'i-hugeicons:alert-02',
        color: 'error',
      });
    } finally {
      isLoggingOut.value = false;
    }
  };

  return {
    // 状态
    email,
    password,
    passwordConfirm,
    loading,
    isLoggingOut,
    error,
    strength,
    color,
    // 方法
    handleAuth,
    handleLogout,
    fetchGeo,
  };
};
