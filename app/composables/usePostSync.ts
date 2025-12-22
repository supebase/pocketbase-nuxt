export const usePostUpdateTracker = () => {
  // 记录需要更新的文章 ID 集合
  const updatedPostIds = useState<Set<string>>('updated-posts', () => new Set());

  const markAsUpdated = (id: string) => {
    updatedPostIds.value.add(id);
  };

  const clearUpdateMark = (id: string) => {
    updatedPostIds.value.delete(id);
  };

  return { updatedPostIds, markAsUpdated, clearUpdateMark };
};
