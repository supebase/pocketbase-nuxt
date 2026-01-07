export default defineNuxtRouteMiddleware((to) => {
  const { showHeaderBack } = useHeader();

  // 如果页面显式设置了 hideHeaderBack: true (例如 auth.vue)
  // 那么我们强制隐藏。
  if (to.meta.hideHeaderBack === true) {
    showHeaderBack.value = false;
  }
  // 如果没有显式设置 (例如 [id].vue)，我们给它一个初始值
  // 但允许页面组件内部后续修改它
  else {
    showHeaderBack.value = to.path !== '/';
  }
});
