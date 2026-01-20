/**
 * 在线人数统计逻辑
 */
export function useOnlineStats() {
  const count = ref<number | null>(null);

  // 封装 PartyKit 逻辑
  useParty({
    room: 'site',
    onMessage: (type, value) => {
      if (type === 'connections') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) count.value = parsed;
      }
    },
  });

  return { count };
}

/**
 * 刷新冷却逻辑
 */
export function useStatsRefresh(islandRef: Ref<any>) {
  const cooldown = ref(0);
  const isRefreshing = ref(false);
  const isCoolingDown = computed(() => cooldown.value > 0);

  const handleUpdate = async () => {
    if (isCoolingDown.value || isRefreshing.value) return;

    isRefreshing.value = true;
    try {
      if (islandRef.value?.refresh) {
        await islandRef.value.refresh();
      }
      startCooldown();
    } finally {
      isRefreshing.value = false;
    }
  };

  const startCooldown = (seconds = 10) => {
    cooldown.value = seconds;
    const timer = setInterval(() => {
      cooldown.value--;
      if (cooldown.value <= 0) clearInterval(timer);
    }, 1000);
  };

  return { cooldown, isRefreshing, isCoolingDown, handleUpdate };
}
