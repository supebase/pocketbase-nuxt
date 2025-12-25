<template>
  <div :key="item.id" class="record-item-animate" :style="{ '--delay': `${delay}s` }">
    <ULink :to="`/${item.id}`" class="line-clamp-4 tracking-wide leading-6 hyphens-none"
      tabindex="-1">
      {{ item.cleanContent }}
    </ULink>

    <ULink v-if="item.firstImage" :to="`/${item.id}`" class="group" tabindex="-1">
      <div class="my-3 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <NuxtImg :src="item.firstImage" placeholder preset="preview" :custom="true">
          <template #default="{ src, isLoaded, imgAttrs }">
            <div class="relative overflow-hidden aspect-video">
              <img v-bind="imgAttrs" :src="src" :class="[
                'w-full h-full object-cover transition-all duration-700 ease-in-out',
                isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
                'hover:scale-105',
              ]" />
              <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-hugeicons:refresh" class="size-5 text-muted/30 animate-spin" />
              </div>
            </div>
          </template>
        </NuxtImg>
      </div>
    </ULink>

    <CommonLinkCard v-if="item.link_data" :data="item.link_data" />

    <div class="flex items-center justify-between">
      <CommentsUsers :post-id="item.id" :allow-comment="item.allowComment" />
      <ULink v-if="canViewDrafts" tabindex="-1" :to="`/edit/${item.id}`"
        class="text-sm text-primary">编辑
      </ULink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  item: {
    id: string;
    title: string;
    date: string;
    cleanContent: string;
    action: string;
    allowComment: boolean;
    published: boolean;
    icon: string | null;
    avatarId: string | null;
    firstImage: string | null;
    link_data: any;
  };
  delay: number;
  canViewDrafts: boolean;
}

const props = defineProps<Props>();
</script>