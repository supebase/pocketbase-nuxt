<template>
  <div class="py-2 flex flex-col items-center select-none">
    <div class="relative w-full max-w-70 flex flex-col items-center">
      <UProgress
        :ui="{ indicator: 'duration-500 ease-linear', status: 'duration-500 ease-linear' }"
        :model-value="remainingSeconds"
        :max="30"
        size="2xs"
        status
        color="primary"
        :class="isCoolingDown ? 'opacity-100' : 'opacity-0'"
      >
        <template #status>
          <div class="text-xs text-dimmed tabular-nums">{{ Math.ceil(remainingSeconds) }} 秒冷却</div>
        </template>
      </UProgress>
    </div>

    <div class="flex items-center gap-3">
      <UButton
        v-for="emoji in REACTIONS"
        :key="emoji"
        variant="link"
        color="neutral"
        :disabled="isCoolingDown"
        class="flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-700"
        :class="[isCoolingDown ? 'opacity-20 grayscale cursor-not-allowed' : 'group cursor-pointer']"
        @click="sendReaction(emoji)"
      >
        <span
          class="text-xs tabular-nums transition-colors duration-500"
          :class="emojiCounts[emoji] ? '' : 'text-dimmed'"
        >
          {{ emojiCounts[emoji] || 0 }}
        </span>

        <span
          class="text-2xl transition-all duration-500"
          :class="[!isCoolingDown && 'group-hover:scale-90', activeEmoji === emoji && 'animate-heart-pop']"
          @animationend="activeEmoji = ''"
        >
          {{ emoji }}
        </span>
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isValidEmoji } from '~~/shared/utils/emoji';
import { REACTIONS } from '~/constants/index';

const props = defineProps<{ postId: string }>();

const emojiCounts = ref<Record<string, number>>(Object.fromEntries(REACTIONS.map((e) => [e, 0])));
const activeEmoji = ref('');
const remainingSeconds = ref(0);
let timer: NodeJS.Timeout | null = null;

const isCoolingDown = computed(() => remainingSeconds.value > 0);

const { send, disconnect } = useParty({
  room: `post-${props.postId}`,
  onMessage: (type, content) => {
    if (type === 'all-reactions') {
      content.split(',').forEach((pair) => {
        const [emoji, count] = pair.split(':');
        if (emoji && count) emojiCounts.value[emoji] = parseInt(count);
      });
    } else if (type === 'emoji-count') {
      const [emoji, count] = content.split(':');
      if (emoji && count) {
        emojiCounts.value[emoji] = parseInt(count);
        triggerAnimation(emoji);
      }
    }
  },
});

const triggerAnimation = (emoji: string) => {
  activeEmoji.value = emoji;
  nextTick(() => {
    if (activeEmoji.value === '') activeEmoji.value = emoji;
  });
};

const sendReaction = (emoji: string) => {
  if (isCoolingDown.value || !isValidEmoji(emoji)) return;

  triggerAnimation(emoji);
  send(`react:${emoji}`);

  remainingSeconds.value = 30;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 0.1);
    if (remainingSeconds.value <= 0) clearInterval(timer!);
  }, 100);
};

onDeactivated(disconnect);
</script>
