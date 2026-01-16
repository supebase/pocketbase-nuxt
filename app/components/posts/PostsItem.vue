<template>
  <div :key="item.id" :class="[isFirstTimeRender ? 'record-item-animate' : '']" :style="{ '--delay': `${delay}s` }">
    <ULink
      :to="`/${item.id}`"
      class="line-clamp-3 text-default text-pretty md:text-justify hyphens-auto wrap-break-word tracking-wide md:tracking-tight leading-relaxed"
      tabindex="-1"
    >
      {{ item.cleanContent }}
    </ULink>

    <ULink v-if="item.firstImage" :to="`/${item.id}`" tabindex="-1">
      <div class="my-3.5 rounded-lg overflow-hidden">
        <div class="relative overflow-hidden aspect-video">
          <img
            :src="item.firstImage"
            @load="isLoaded = true"
            loading="lazy"
            :class="[
              'w-full h-full object-cover transition-all duration-700 ease-in-out',
              isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
              'hover:scale-105',
            ]"
          />

          <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
            <UIcon name="i-hugeicons:refresh" class="size-6 text-dimmed animate-spin" />
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
