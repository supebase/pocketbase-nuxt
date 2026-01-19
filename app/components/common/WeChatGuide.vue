<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isWechat" class="wechat-mask">
        <div class="relative w-full h-full flex flex-col items-center justify-center">
          <div class="absolute top-6 right-6 flex flex-col items-center animate-bounce">
            <div class="w-10 h-10 border-t-4 border-r-4 border-primary-400 -rotate-45 rounded-tr-sm"></div>
            <span class="mt-2 px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full shadow-lg">
              点击这里
            </span>
          </div>

          <div class="w-full max-w-sm bg-neutral-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <h3 class="text-white text-xl font-bold mb-2">微信环境限制</h3>
            <p class="text-sm leading-relaxed mb-6">
              为了确保完整的功能体验，请点击右上角菜单，选择
              <span class="font-semibold px-1">“在浏览器中打开”</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const isWechat = useState<boolean>('isWechat');
</script>

<style scoped>
.wechat-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  /* 毛玻璃效果，非常现代感 */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}
</style>
