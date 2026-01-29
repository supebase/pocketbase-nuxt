<template>
  <div class="w-full p-8 select-none">
    <div
      class="relative transition-transform duration-500 ease-in-out"
      :class="{ 'shake-red': lastWinner === 'red', 'shake-blue': lastWinner === 'blue' }"
    >
      <div class="flex h-10 rounded-full overflow-hidden relative bg-neutral-900">
        <div
          class="relative flex items-center px-5 transition-[width] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden bg-linear-to-br from-rose-500 to-pink-500"
          :style="{ width: redPercent + '%' }"
          :class="[isCoolingDown ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer']"
          @click="handleVote('red')"
        >
          <div class="flex items-center gap-2 text-white">
            <UIcon
              name="i-hugeicons:favourite"
              class="size-5 drop-shadow-sm transition-transform"
              :class="{ 'animate-favourite': lastWinner === 'red' }"
            />
            <span class="font-black text-lg leading-none italic">
              <CommonAnimateNumber :value="redVotes" />
            </span>
          </div>
          <div class="glare" />
        </div>

        <div
          class="absolute top-0 bottom-0 w-1 bg-white dark:bg-neutral-900 z-10 transition-[left] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          :style="{ left: redPercent + '%' }"
        >
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 tabular-nums bg-white dark:bg-neutral-900 font-black text-[10px] px-1.5 py-0.5 rounded shadow-md italic"
          >
            {{ isCoolingDown ? `${Math.ceil(remainingSeconds)}s` : 'VS' }}
          </div>
        </div>

        <div
          class="relative flex items-center justify-end px-5 transition-[width] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden bg-linear-to-br from-purple-500 to-violet-500"
          :style="{ width: 100 - redPercent + '%' }"
          :class="[isCoolingDown ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer']"
          @click="handleVote('blue')"
        >
          <div class="flex items-center gap-2 text-white text-right">
            <span class="font-black text-lg leading-none italic">
              <CommonAnimateNumber :value="blueVotes" />
            </span>
            <UIcon
              name="i-hugeicons:heartbreak"
              class="size-5 drop-shadow-sm transition-transform"
              :class="{ 'animate-crack': lastWinner === 'blue' }"
            />
          </div>
          <div class="glare" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ room: string }>();

const { redVotes, blueVotes, lastWinner, redPercent, handleVote, remainingSeconds, isCoolingDown } = usePoll(
  props.room,
);
</script>
