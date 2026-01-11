export const usePostUpdateTracker = () => {
  // 改用 Record<string, boolean> 确保 SSR 序列化安全
  const updatedMarks = useState<Record<string, boolean>>('updated-posts-map', () => ({}));

  const markAsUpdated = (id: string) => {
    updatedMarks.value = {
      ...updatedMarks.value,
      [id]: true,
    };
  };

  const clearUpdateMark = (id: string) => {
    if (updatedMarks.value[id]) {
      const newMarks = { ...updatedMarks.value };
      delete newMarks[id];
      updatedMarks.value = newMarks;
    }
  };

  // 为了保持你详情页逻辑的兼容性，提供一个 computed 集合
  const updatedPostIds = computed(() => new Set(Object.keys(updatedMarks.value)));

  return {
    updatedPostIds,
    updatedMarks,
    markAsUpdated,
    clearUpdateMark,
  };
};
