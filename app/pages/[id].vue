<template>
  <div>
    <div v-if="status === 'pending' && !postWithRelativeTime" key="loading" class="flex flex-col gap-6 mt-4">
      <SkeletonPost class="opacity-70 mask-b-from-10" />
    </div>

    <div v-else-if="postWithRelativeTime" key="content">
      <PostHeader :post="postWithRelativeTime" :mdc-ready="mdcReady" />

      <PostContent
        :post-id="postWithRelativeTime.id"
        :mdc-ready="mdcReady"
        :toc="toc"
        :ast="ast"
        :class="[isFirstTimeRender ? 'record-item-animate' : '']"
        :style="{ '--delay': `.15s` }"
      />

      <PostComment
        :post-id="postWithRelativeTime.id"
        :allow-comment="postWithRelativeTime.allow_comment"
        :mdc-ready="mdcReady"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn } = useUserSession();

definePageMeta({
  hideHeaderBack: false,
});

const { postWithRelativeTime, status, error, refresh, mdcReady, ast, toc, updatedMarks, clearUpdateMark } =
  usePostLogic(id);

// 错误处理
watch(
  error,
  (newErr) => {
    if (newErr) throw createError({ ...newErr });
  },
  { immediate: true },
);

// 登录状态切换时刷新数据
watch(loggedIn, () => refresh());

onActivated(async () => {
  const currentId = (route.params as { id: string }).id;
  if (currentId && updatedMarks.value[currentId]) {
    try {
      await refresh();
      clearUpdateMark(currentId);
    } catch (e) {
      console.error('静默刷新失败', e);
    }
  }
});

const isFirstTimeRender = ref(true);

onMounted(() => {
  nextTick(() => {
    // 动画播放完后关闭标记
    setTimeout(() => {
      isFirstTimeRender.value = false;
    }, 1000);
  });
});
</script>
