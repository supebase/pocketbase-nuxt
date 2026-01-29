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

    <ULink v-else :to="`/${item.id}`" class="group block relative overflow-visible mt-4 mb-6">
      <div
        class="absolute -bottom-2 inset-x-4 h-12 bg-neutral-200/60 dark:bg-neutral-950/40 rounded-xl -z-10 transition-transform group-hover:translate-y-1"
      ></div>
      <div
        class="bg-white dark:bg-neutral-950 rounded-xl overflow-hidden transition-all duration-500 group-hover:-translate-y-2"
      >
        <div class="aspect-video relative overflow-hidden">
          <img
            :src="item.firstImage"
            class="w-full h-full object-cover group-hover:grayscale transition-all duration-700"
          />
          <div class="absolute bottom-0 inset-x-0 p-5 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-md">
            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2">
              {{ item.cleanContent }}
            </p>
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
