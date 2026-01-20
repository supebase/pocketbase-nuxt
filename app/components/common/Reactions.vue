<template>
  <div class="py-2 flex flex-col items-center select-none">
    <div class="h-8 w-full max-w-xs flex items-center justify-center">
      <UProgress
        v-if="isCoolingDown"
        :model-value="remainingSeconds"
        :max="30"
        size="2xs"
        color="primary"
        status
        :ui="{
          indicator: 'transition-all duration-100 ease-linear',
          status: 'text-xs text-dimmed tabular-nums',
        }"
      >
        <template #status>
          <span>{{ Math.ceil(remainingSeconds) }} 秒冷却</span>
        </template>
      </UProgress>
    </div>

    <div class="flex items-center gap-2">
      <UButton
        v-for="emoji in REACTIONS"
        :key="emoji"
        variant="link"
        color="neutral"
        :disabled="isCoolingDown"
        class="flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 min-w-16"
        :class="[
          isCoolingDown
            ? 'opacity-20 grayscale cursor-not-allowed'
            : 'group cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800',
        ]"
        @click="sendReaction(emoji)"
      >
        <span class="text-[13px] tabular-nums" :class="emojiCounts[emoji] ? 'text-primary font-medium' : 'text-dimmed'">
          {{ emojiCounts[emoji] || 0 }}
        </span>

        <span
          class="text-2xl transform-gpu transition-transform duration-300"
          :class="[!isCoolingDown && 'group-hover:scale-125', activeEmoji === emoji && 'animate-heart-pop']"
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
import { parseReactionMessage } from '~/modules/common/ui-utils';
import { useCooldown } from '~/modules/common/animation-utils';

const props = defineProps<{ postId: string }>();

const emojiCounts = ref<Record<string, number>>(Object.fromEntries(REACTIONS.map((e) => [e, 0])));
const activeEmoji = ref('');
const isLocalAction = ref(false);

const { remainingSeconds, isCoolingDown, startCooldown } = useCooldown(30);

const { send, disconnect } = useParty({
  room: `post-${props.postId}`,
  onMessage: (type, content) => {
    if (type === 'all-reactions') {
      Object.assign(emojiCounts.value, parseReactionMessage(content));
    } else if (type === 'emoji-count') {
      const parsed = parseReactionMessage(content);

      Object.entries(parsed).forEach(([emoji, count]) => {
        emojiCounts.value[emoji] = count;

        // 只有当不是本地主动触发时，才响应服务器回传的动画
        if (!isLocalAction.value) {
          triggerAnimation(emoji);
        }
      });

      // 消息处理完，重置本地标记
      isLocalAction.value = false;
    }
  },
});

const triggerAnimation = (emoji: string) => {
  activeEmoji.value = '';
  nextTick(() => {
    activeEmoji.value = emoji;
  });
};

const sendReaction = (emoji: string) => {
  if (isCoolingDown.value || !isValidEmoji(emoji)) return;

  isLocalAction.value = true;
  triggerAnimation(emoji);
  send(`react:${emoji}`);
  startCooldown();
};

onDeactivated(disconnect);
</script>
