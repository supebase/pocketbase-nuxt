<template>
  <div :key="item.id">
    <ULink
      v-if="!item.firstImage"
      :to="`/${item.id}`"
      class="line-clamp-3 text-pretty md:text-justify hyphens-auto wrap-break-word tracking-wide md:tracking-tight leading-relaxed"
      :class="item.published ? 'text-default' : 'text-dimmed'"
      tabindex="-1"
    >
      {{ item.cleanContent }}
    </ULink>

    <ULink v-else :to="`/${item.id}`" class="group block relative overflow-visible mt-4 mb-6">
      <div
        class="absolute -bottom-2 inset-x-4 h-12 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl -z-10 duration-500 transition-transform group-hover:translate-y-1"
      ></div>
      <div class="rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5">
        <div class="aspect-video relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            :src="item.firstImage"
            class="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
            aria-hidden="true"
          />

          <img
            :src="item.firstImage"
            @load="isLoaded = true"
            :loading="isPriority ? 'eager' : 'lazy'"
            :fetchpriority="isPriority ? 'high' : 'auto'"
            class="relative w-full h-full object-cover transition-opacity duration-500"
            :class="[isLoaded ? 'opacity-100' : 'opacity-0', item.published ? '' : 'grayscale']"
          />

          <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <UIcon name="i-hugeicons:refresh" class="size-5 text-white animate-spin" />
          </div>

          <div
            v-if="isLoaded"
            class="absolute bottom-0 inset-x-0 p-5 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-md"
          >
            <p
              class="text-sm font-medium line-clamp-2"
              :class="item.published ? 'text-neutral-800 dark:text-neutral-200' : 'text-dimmed'"
            >
              {{ item.cleanContent }}
            </p>
          </div>
        </div>
      </div>
    </ULink>

    <CommonLinkCard
      v-if="item.link_data"
      :data="item.link_data"
      :is-priority="isPriority"
      :link-image="getLinkImage(item, item.link_image)"
    />
    <CommentsUsers :post-id="item.id" :allow-comment="item.allow_comment" />
  </div>
</template>

<script setup lang="ts">
const { getLinkImage } = useAssets();

interface Props {
  item: {
    id: string;
    published: boolean;
    cleanContent: string;
    allow_comment: boolean;
    firstImage: string | null;
    link_data: any;
    link_image?: string;
  };
  isPriority?: boolean;
  delay: number;
  canViewDrafts?: boolean;
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

if (props.isPriority) {
  const imagesToPreload = [];
  if (props.item.firstImage) imagesToPreload.push(props.item.firstImage);
  if (props.item.link_image) imagesToPreload.push(getLinkImage(props.item, props.item.link_image));

  useHead({
    link: imagesToPreload.map((href) => ({ rel: 'preload', as: 'image', href })),
  });
}
</script>
