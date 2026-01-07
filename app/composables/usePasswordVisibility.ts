/**
 * 密码显示/隐藏功能的组合式函数
 * @returns 密码显示状态和切换函数
 */
export function usePasswordVisibility() {
  const isVisible = ref(false);

  const toggleVisibility = () => {
    isVisible.value = !isVisible.value;
  };

  return {
    isVisible,
    toggleVisibility,
  };
}
