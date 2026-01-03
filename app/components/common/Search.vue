<template>
  <UCommandPalette
    v-model:search-term="searchQuery"
    :loading="isLoading"
    :groups="groups"
    icon="i-hugeicons:search-01"
    placeholder="输入关键词后开始搜索 ..."
    class="h-[50vh] select-none"
    @update:model-value="onSelect"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    :ui="{
      input: '[&>input]:h-14',
      group: 'p-2',
      label: 'px-4 py-2 text-sm text-dimmed/80 font-bold tracking-wider',
    }"
  >
    <template #item="{ item }">
      <div class="flex items-center justify-between w-full group px-2 py-1.5">
        <div
          v-if="item.id === 'load-more-trigger'"
          class="flex items-center justify-center w-full py-2 text-sm font-medium text-dimmed"
          @click.stop.prevent="onSelect(item)"
        >
          <UIcon
            v-if="isLoadingMore"
            name="i-hugeicons:loading-02"
            class="animate-spin size-4 mr-2"
          />
          <span>{{ item.label }}</span>
        </div>

        <div v-else class="flex items-center gap-4 flex-1 min-w-0">
          <div class="shrink-0 flex items-center justify-center">
            <UIcon name="i-hugeicons:file-02" class="size-5 text-dimmed" />
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
        <p v-if="!searchQuery" class="text-sm text-dimmed">
          请输入至少 {{ MIN_SEARCH_LENGTH }} 个字符
        </p>

        <p
          v-else-if="searchQuery.length < MIN_SEARCH_LENGTH"
          class="text-sm text-dimmed animate-pulse"
        >
          请继续输入 ...
        </p>

        <div
          v-else-if="isLoading"
          class="flex items-center text-sm text-dimmed"
        >
          正在搜索中 ...
        </div>

        <p v-else-if="!allItems.length" class="text-sm text-dimmed">
          未找到与 "{{ searchQuery }}" 相关的数据
        </p>
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
import type { PostRecord, PostsListResponse } from '~/types/posts';
import { useDebounceFn } from '@vueuse/core';

const emit = defineEmits(['close']);

// --- 搜索核心逻辑 ---
const MIN_SEARCH_LENGTH = 2;
const searchQuery = ref('');
const isLoading = ref(false);
const isComposing = ref(false);

// 1. 分页状态扩展
const {
    allItems,
    totalItems,
    resetPagination,
    hasMore,
    isLoadingMore,
    loadMore,
} = usePagination<PostRecord>();

// 执行 API (初始搜索)
const performSearch = async (query: string) => {
    isLoading.value = true;

    try {
      const response = await $fetch<PostsListResponse>(
        '/api/collections/posts',
        {
          query: { q: query, page: 1 },
        },
      );

      if (searchQuery.value === query) {
        resetPagination(response.data.posts || [], response.data.totalItems);
      }
    } catch (err) {
      resetPagination([], 0);
    } finally {
      isLoading.value = false;
    }
};

// 执行 API (加载更多)
const fetchMoreData = async (page: number) => {
    const response = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { q: searchQuery.value, page },
    });

    return {
      items: response.data.posts || [],
      total: response.data.totalItems,
    };
};

const debouncedSearch = useDebounceFn((val: string) => {
    if (val.trim().length >= MIN_SEARCH_LENGTH) performSearch(val.trim());
}, 400);

watch(searchQuery, (newVal) => {
    if (isComposing.value) return;

    const trimmed = newVal.trim();

    if (!trimmed || trimmed.length < MIN_SEARCH_LENGTH) {
      resetPagination([], 0);
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    debouncedSearch(trimmed);
});

// 处理输入法
const handleCompositionStart = () => {
    isComposing.value = true;
};

const handleCompositionEnd = () => {
    isComposing.value = false;

    if (searchQuery.value.trim().length >= MIN_SEARCH_LENGTH) {
      performSearch(searchQuery.value.trim());
    }
};

// 映射结果
const groups = computed(() => {
    if (!searchQuery.value.trim() || allItems.value.length === 0) return [];

    // 生成基础文章列表
    const items = allItems.value.map((post) => ({
      id: post.id,
      label: cleanMarkdown(post.content),
      to: `/${post.id}`,
    }));

    // 如果还有更多，推入一个虚拟的加载按钮项
    if (hasMore.value) {
      items.push({
        id: 'load-more-trigger',
        label: isLoadingMore.value ? '正在加载...' : '显示更多结果',
        to: '', // 不跳转
      });
    }

    return [
      {
        id: 'posts',
        label: `匹配到 ${totalItems.value} 条内容`,
        items: items,
        ignoreFilter: true,
      },
    ];
});

function onSelect(item: any) {
    if (!item) return;

    // 1. 处理加载更多
    if (item.id === 'load-more-trigger') {
      if (!isLoadingMore.value) {
        loadMore(fetchMoreData);
      }
      return; // 直接返回，不再向下执行 navigateTo
    }

    // 2. 处理正常跳转 (item.to 存在的情况)
    if (item.to) {
      emit('close');
      searchQuery.value = '';
      resetPagination([], 0);
      navigateTo(item.to);
    }
}

// 组件卸载清理
onUnmounted(() => {
    resetPagination([], 0);
});
</script>
