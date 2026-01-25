<template>
  <template v-for="(item, index) in config" :key="index">
    <template v-for="i in item.count || 1" :key="i">
      <div v-if="item.type === 'divider'" :class="['bg-neutral-200 dark:bg-neutral-800', item.class]" />

      <div v-else-if="item.type === 'group'" :class="[item.class, 'relative']">
        <SkeletonBase v-if="item.items" :config="item.items" />

        <div
          v-if="item.hasLine"
          class="absolute top-10 bottom-2 w-0.5 bg-neutral-100 dark:bg-neutral-800 left-1/2 -translate-x-1/2 -z-10"
        />
      </div>

      <USkeleton
        v-else
        :class="[item.type === 'circle' ? 'rounded-full' : 'rounded', item.class]"
        :ui="{
          background: 'bg-neutral-200/80 dark:bg-neutral-800/80',
          animate: 'animate-none',
        }"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import type { SkeletonItem } from '~/types';
defineProps<{ config: SkeletonItem[] }>();
</script>
