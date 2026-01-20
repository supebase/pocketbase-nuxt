<template>
  <UCommandPalette
    v-model:search-term="searchQuery"
    :loading="isLoading"
    :groups="groups"
    icon="i-hugeicons:search-01"
    :placeholder="`输入关键词后开始搜索 ...`"
    class="h-[50vh] select-none"
    @update:model-value="onSelect"
    @compositionstart="isComposing = true"
    @compositionend="onCompositionEnd"
    :ui="SEARCH_PALETTE_UI"
  >
    <template #item="{ item }">
      <div class="flex items-center justify-between w-full group px-2 py-1.5">
        <div
          v-if="item.id === 'load-more-trigger'"
          class="flex items-center justify-center w-full py-2 text-sm font-medium text-dimmed"
          @click.stop.prevent="handleLoadMore"
        >
          <UIcon v-if="isLoadingMore" name="i-hugeicons:loading-02" class="animate-spin size-4 mr-2" />
          <span>{{ item.label }}</span>
        </div>

        <div v-else class="flex items-center gap-4 flex-1 min-w-0">
          <div class="shrink-0 flex items-center justify-center">
            <UIcon name="i-hugeicons:file-02" class="size-5 text-dimmed group-hover:text-primary transition-colors" />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="text-sm font-medium text-muted line-clamp-1">
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <div class="flex flex-col items-center justify-center py-12">
        <p v-if="!searchQuery.trim()" class="text-dimmed"></p>

        <p v-else-if="searchQuery.trim().length < MIN_SEARCH_LENGTH" class="text-dimmed">
          请输入至少 {{ MIN_SEARCH_LENGTH }} 个字符后开始搜索
        </p>

        <div v-else-if="isLoading || isComposing" class="flex items-center text-dimmed animate-pulse">
          正在翻箱倒柜找内容
        </div>

        <p v-else-if="!allItems.length" class="text-dimmed">未找到与 "{{ searchQuery }}" 相关的数据</p>
      </div>
    </template>

    <template #close>
      <UButton
        color="neutral"
        variant="link"
        icon="i-hugeicons:cancel-01"
        class="-mr-1 cursor-pointer"
        @click="$emit('close')"
      />
    </template>
  </UCommandPalette>
</template>

<script setup lang="ts">
import { MIN_SEARCH_LENGTH } from '~/constants';

const emit = defineEmits(['close']);

// 1. UI 样式配置完整还原 (保留原有 UI 结构)
const SEARCH_PALETTE_UI = {
  input: '[&>input]:h-14 ps-2',
  group: 'p-2',
  label: 'px-4 py-2 text-sm text-dimmed/80 font-bold tracking-wider',
  // 增加 active 态样式，防止选中时视觉丢失
  item: { active: 'bg-neutral-100 dark:bg-neutral-800' },
} as any;

// 2. 逻辑接入
const {
  searchQuery,
  isLoading,
  isComposing,
  allItems,
  totalItems,
  hasMore,
  isLoadingMore,
  resetPagination,
  loadMore,
  performSearch,
  fetchMoreData,
} = useSearchLogic();

// 3. 结果映射逻辑修正
const groups = computed(() => {
  const trimmed = searchQuery.value.trim();

  // 还原判断逻辑：字符长度不足、正在输入中文、初始搜索中、无结果时，不显示组
  if (
    trimmed.length < MIN_SEARCH_LENGTH ||
    isComposing.value ||
    (isLoading.value && allItems.value.length === 0) ||
    allItems.value.length === 0
  ) {
    return [];
  }

  // 映射搜索结果，并保留 Markdown 清理 (这里假设 utils 里有 cleanMarkdown)
  const items = allItems.value.map((post) => ({
    id: post.id,
    label: cleanMarkdown(post.content),
    to: `/${post.id}`,
  }));

  // 推入加载更多触发器
  if (hasMore.value) {
    items.push({
      id: 'load-more-trigger',
      label: isLoadingMore.value ? '正在加载...' : '显示更多结果',
      to: '',
    });
  }

  return [
    {
      id: 'posts',
      label: `匹配到 ${totalItems.value} 条内容`,
      items: items,
      ignoreFilter: true, // 关键：后端已过滤，防止 NuxtUI 进行二次前端过滤
    },
  ];
});

// 4. 事件处理逻辑还原
const onCompositionEnd = () => {
  isComposing.value = false;
  performSearch(searchQuery.value);
};

const handleLoadMore = () => {
  if (!isLoadingMore.value) {
    loadMore(fetchMoreData);
  }
};

function onSelect(item: any) {
  if (!item) return;

  // 修正：分页点击判断
  if (item.id === 'load-more-trigger') {
    handleLoadMore();
    return;
  }

  // 修正：跳转逻辑
  if (item.to) {
    emit('close');
    searchQuery.value = '';
    resetPagination([], 0);
    navigateTo(item.to);
  }
}

// 统一清理
onUnmounted(() => {
  resetPagination([], 0);
});
</script>
