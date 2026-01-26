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

    <ULink v-else :to="`/${item.id}`" class="group block relative overflow-visible">
      <div class="relative mt-4 mb-8 transition-all duration-500">
        <div
          class="relative aspect-video overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-900 transition-all duration-500"
        >
          <img
            :src="item.firstImage"
            @load="isLoaded = true"
            :class="[
              'w-full h-full object-cover transition-all duration-700 ease-in-out',
              isLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-105 group-hover:rotate-1',
            ]"
          />

          <div
            class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"
          ></div>

          <div
            class="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          ></div>
        </div>

        <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[92%] z-10">
          <div
            class="relative p-4 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md group-hover:-translate-y-2 group-hover:bg-white/95 dark:group-hover:bg-neutral-800/95"
          >
            <p
              class="text-[13px] font-bold text-neutral-800 dark:text-neutral-100 line-clamp-2 leading-relaxed text-center tracking-tight"
            >
              {{ item.cleanContent }}
            </p>

            <div class="flex justify-center h-1 mt-0 group-hover:mt-3 transition-all duration-500 overflow-hidden">
              <div
                class="h-full w-0 bg-primary rounded-full transition-all duration-500 ease-out group-hover:w-12 opacity-0 group-hover:opacity-100"
              ></div>
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
