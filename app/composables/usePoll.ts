import { useCooldown } from '~/utils/common/animation-utils';

export const usePoll = (room: string) => {
  const redVotes = ref(0);
  const blueVotes = ref(0);
  const lastWinner = ref<'red' | 'blue' | null>(null);

  // 1. 初始化冷却工具，设置 30 秒
  const { remainingSeconds, isCoolingDown, startCooldown } = useCooldown(30);

  const { send } = useParty({
    room,
    onMessage: (type, content) => {
      if (type === 'poll-init') {
        const [red, blue] = content.split(':').map(Number);
        redVotes.value = red || 0;
        blueVotes.value = blue || 0;
      } else if (type === 'vote-update') {
        const [side, count] = content.split(':');
        const countNum = Number(count);

        if (side === 'red') {
          redVotes.value = countNum;
          lastWinner.value = 'red';
        } else {
          blueVotes.value = countNum;
          lastWinner.value = 'blue';
        }
        setTimeout(() => (lastWinner.value = null), 300);
      }
    },
  });

  const redPercent = computed(() => {
    const total = redVotes.value + blueVotes.value;
    if (total === 0) return 50;
    const percent = (redVotes.value / total) * 100;
    return Math.min(Math.max(percent, 20), 80);
  });

  // 2. 修改投票逻辑
  const handleVote = (side: 'red' | 'blue') => {
    // 如果正在冷却中，直接返回
    if (isCoolingDown.value) return;

    // 执行投票发送
    send(`vote:${side}`);

    // 开启 30 秒冷却
    startCooldown();
  };

  return {
    redVotes,
    blueVotes,
    lastWinner,
    redPercent,
    handleVote,
    remainingSeconds,
    isCoolingDown,
  };
};
