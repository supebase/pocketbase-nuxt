<template>
  <div :key="item.id">
    <ULink
      v-if="!item.firstImage"
      :to="`/${item.id}`"
      class="line-clamp-3 text-default text-pretty md:text-justify hyphens-auto wrap-break-word tracking-wide md:tracking-tight leading-relaxed"
      tabindex="-1"
    >
      {{ item.cleanContent }}
    </ULink>

    <ULink v-else :to="`/${item.id}`" tabindex="-1" class="group/img-card block relative">
      <div
        class="my-3.5 relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden transition-[clip-path] duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] [--fold-size:10%] group-hover/img-card:[--fold-size:16%]"
        :style="{
          'clip-path': 'polygon(0 0, calc(100% - var(--fold-size)) 0, 100% var(--fold-size), 100% 100%, 0 100%)',
        }"
      >
        <div class="relative overflow-hidden aspect-video bg-neutral-200 dark:bg-neutral-900">
          <img
            :src="item.firstImage"
            @load="isLoaded = true"
            loading="lazy"
            :class="[
              'w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)]',
              isLoaded ? 'blur-0 scale-[1.05]' : 'blur-xl scale-110',
              'group-hover/img-card:scale-[1.15] origin-center',
            ]"
          />

          <div
            class="absolute top-0 right-0 z-20 pointer-events-none w-[10%] h-[10%] group-hover/img-card:w-[15.6%] group-hover/img-card:h-[15.6%] transition-all duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)]"
            style="filter: drop-shadow(-3px 3px 6px rgba(0, 0, 0, 1.65))"
          >
            <div
              class="w-full h-full rounded-bl-lg bg-linear-to-tr from-white/30 to-white/50 backdrop-blur-xl"
              style="clip-path: polygon(0 0, 100% 100%, 0 100%)"
            ></div>
          </div>

          <div
            v-if="!isLoaded"
            class="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800"
          >
            <UIcon name="i-hugeicons:refresh" class="size-6 text-dimmed animate-spin" />
          </div>

          <div
            class="absolute bottom-2 left-2 right-2 p-3 overflow-hidden bg-white/75 dark:bg-black/60 backdrop-blur-xl rounded-lg shadow-lg transition-all duration-500"
          >
            <div class="relative z-10">
              <div class="line-clamp-3 text-sm font-medium text-neutral-900 dark:text-white/95 leading-snug">
                {{ item.cleanContent }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ULink>

    <CommonLinkCard v-if="item.link_data" :data="item.link_data" :link-image="getLinkImage(item, item.link_image)" />
    <CommentsUsers :post-id="item.id" :allow-comment="item.allow_comment" />
  </div>
</template>

<script setup lang="ts">
const { getLinkImage } = useAssets();

interface Props {
  item: {
    id: string;
    cleanContent: string;
    allow_comment: boolean;
    firstImage: string | null;
    link_data: any;
    link_image?: string;
  };
  delay: number;
  canViewDrafts: boolean;
  triggerAnimation?: number;
}

const props = defineProps<Props>();
const isLoaded = ref(false);
const isFirstTimeRender = ref(true);

watch(
  () => props.triggerAnimation,
  (newVal) => {
    // 💡 只有当信号真正发生变化（大于0）时才重置动画
    if (newVal && newVal > 0) {
      isFirstTimeRender.value = true;
      setTimeout(() => {
        isFirstTimeRender.value = false;
      }, 1000);
    }
  },
);

onMounted(() => {
  nextTick(() => {
    // 动画播放完后关闭标记
    setTimeout(() => {
      isFirstTimeRender.value = false;
    }, 1000);
  });
});
</script>
