// 备用 异步加载函数，用于处理需要等待的异步操作，如网络请求
export const useAsyncLoading = (minTime = 600) => {
  const loading = ref(false);

  const run = async <T>(promise: Promise<T>): Promise<T> => {
    loading.value = true;
    const start = Date.now();
    try {
      const res = await promise;
      const elapsed = Date.now() - start;
      if (elapsed < minTime) await new Promise((r) => setTimeout(r, minTime - elapsed));
      return res;
    } finally {
      loading.value = false;
    }
  };

  return { loading, run };
};

// 示例：使用 useAsyncLoading 处理请求
// const { loading: isSubmitting, run } = useAsyncLoading(600)
// const handleSubmit = async () => {
//   const res = await run($fetch(...))
//   if (res) { /* 处理成功逻辑 */ }
// }
