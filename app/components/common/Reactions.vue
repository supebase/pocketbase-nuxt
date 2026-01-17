<template>
  <div class="py-8 flex flex-col items-center gap-8 select-none">
    <div class="relative w-full h-px bg-neutral-200 dark:bg-neutral-800">
      <div
        class="absolute inset-0 bg-primary transition-all duration-1000 ease-linear"
        :style="{ width: isCoolingDown ? `${(remainingSeconds / 30) * 100}%` : '0%' }"
      />
      <span
        class="absolute left-1/2 -top-1.75 -translate-x-1/2 px-4 bg-white dark:bg-neutral-900 text-xs tabular-nums uppercase tracking-[0.3em] text-muted font-medium whitespace-nowrap"
      >
        {{ isCoolingDown ? `${remainingSeconds}s` : 'Reactions' }}
      </span>
    </div>

    <div class="flex items-center gap-4">
      <UButton
        v-for="emoji in REACTIONS"
        :key="emoji"
        variant="link"
        color="neutral"
        :disabled="isCoolingDown"
        class="flex-col items-center gap-2 px-4 transition-all duration-500"
        :class="[isCoolingDown ? 'opacity-30 cursor-not-allowed' : 'group cursor-pointer']"
        @click="sendReaction(emoji, $event)"
      >
        <span
          class="text-xs font-bold font-mono tabular-nums transition-colors duration-500"
          :class="isCoolingDown ? 'text-dimmed' : 'text-muted'"
        >
          {{ emojiCounts[emoji] || 0 }}
        </span>

        <span class="text-xl transition-all duration-500" :class="[isCoolingDown ? 'filter grayscale opacity-50' : '']">
          {{ emoji }}
        </span>
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import PartySocket from 'partysocket';
import { isValidEmoji } from '~~/shared/utils/emoji';
import { REACTIONS, COOLDOWN_MS } from '~/constants/index';

const props = defineProps<{
  postId: string;
}>();

const emojiCounts = ref<Record<string, number>>(Object.fromEntries(REACTIONS.map((e) => [e, 0])));

const floatingEmojis = ref<{ id: number; emoji: string; style: any }[]>([]);
let socket: PartySocket | null = null;

const {
  public: { partykitHost },
} = useRuntimeConfig();

// 保持你已经调试好的 Socket 逻辑
onNuxtReady(() => {
  if (!import.meta.client) return;
  socket = new PartySocket({
    host: partykitHost as string,
    room: `post-${props.postId}`,
    party: 'main',
  });

  socket.onmessage = (evt) => {
    const rawData = evt.data as string;
    const firstColonIndex = rawData.indexOf(':');
    if (firstColonIndex === -1) return;

    const type = rawData.slice(0, firstColonIndex);
    const content = rawData.slice(firstColonIndex + 1);

    if (type === 'all-reactions' && content) {
      content.split(',').forEach((pair) => {
        const lastColonIndex = pair.lastIndexOf(':');
        if (lastColonIndex !== -1) {
          const emoji = pair.slice(0, lastColonIndex);
          const count = pair.slice(lastColonIndex + 1);
          emojiCounts.value[emoji] = parseInt(count);
        }
      });
    } else if (type === 'emoji-count') {
      const lastColonIndex = content.lastIndexOf(':');
      const emoji = content.slice(0, lastColonIndex);
      const count = content.slice(lastColonIndex + 1);
      emojiCounts.value[emoji] = parseInt(count);
    } else if (type === 'new-reaction') {
      const emoji = content;
      const now = Date.now();

      // 核心逻辑：如果收到广播的表情和我刚才点的表情一致，且时间差在 500ms 内，就认为这是我自己的回传
      const isMyOwnLoopback = lastSelfClick.value.emoji === emoji && now - lastSelfClick.value.time < 500;

      if (!isMyOwnLoopback) {
        // 只有是别人的点赞时，才触发随机位置的动画
        spawnEmoji(emoji);
      }
    }
  };
});

const lastSelfClick = ref({ emoji: '', time: 0 });
const lastClickTimestamp = ref(0);
const remainingSeconds = ref(0);
let timer: NodeJS.Timeout | null = null;

const isCoolingDown = computed(() => remainingSeconds.value > 0);

const sendReaction = (emoji: string, event: MouseEvent) => {
  const now = Date.now();

  // 检查冷静期
  if (now - lastClickTimestamp.value < COOLDOWN_MS) {
    return;
  }

  if (isValidEmoji(emoji) && socket) {
    // 执行原有逻辑
    lastSelfClick.value = { emoji, time: now };
    lastClickTimestamp.value = now;

    socket.send(`react:${emoji}`);
    spawnEmoji(emoji, event.clientX, event.clientY);

    // 启动倒计时
    startCooldownTimer();
  }
};

const startCooldownTimer = () => {
  remainingSeconds.value = 30;
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      if (timer) clearInterval(timer);
    }
  }, 1000);
};

const spawnEmoji = (emoji: string, x?: number, y?: number) => {
  const id = Date.now() + Math.random();

  // 如果有坐标（自己点），就用坐标；如果没有（别人点），就随机在中间区域
  const left = x ? `${x}px` : `${Math.random() * 60 + 20}%`;
  const top = y ? `${y}px` : 'auto';
  const bottom = y ? 'auto' : '100px';

  const style = {
    left,
    top,
    bottom,
    position: 'fixed',
    transform: `translate(-50%, -50%) rotate(${(Math.random() - 0.5) * 40}deg)`,
  };

  floatingEmojis.value.push({ id, emoji, style });
  setTimeout(() => {
    floatingEmojis.value = floatingEmojis.value.filter((item) => item.id !== id);
  }, 2500);
};

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);

  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }
});
</script>
