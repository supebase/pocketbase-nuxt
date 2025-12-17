import type { RouterConfig } from "@nuxt/schema";

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // 优先使用浏览器的历史记录中存储的滚动位置
    if (savedPosition) {
      return savedPosition;
    }

    // 如果目标路由带有哈希（#锚点），滚动到该元素
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    }

    // 对于所有非回退/前进的导航（如从列表到详情页），滚动到顶部
    // 但是，由于您使用了 KeepAlive，当从详情页返回时，
    // savedPosition 会被优先使用，达到您想要的效果。
    return { top: 0, left: 0 };
  },
};
