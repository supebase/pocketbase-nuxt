<template>
  <div class="inline-flex flex-row items-center tabular-nums overflow-hidden select-none h-[1.25em] leading-none">
    <transition-group name="digit">
      <div
        v-for="item in processedDigits"
        :key="item.id"
        :class="[item.isComma ? 'comma-column' : 'number-column']"
        class="relative flex flex-col items-center justify-start"
      >
        <template v-if="item.isComma">
          <span class="digit-cell">{{ item.digit }}</span>
        </template>

        <template v-else>
          <div
            class="number-scroll"
            :style="{
              transform: `translateY(${Number(item.digit) * -10}%)`,
              transitionDuration: '600ms',
            }"
          >
            <div class="digit-cell">0</div>
            <div class="digit-cell">1</div>
            <div class="digit-cell">2</div>
            <div class="digit-cell">3</div>
            <div class="digit-cell">4</div>
            <div class="digit-cell">5</div>
            <div class="digit-cell">6</div>
            <div class="digit-cell">7</div>
            <div class="digit-cell">8</div>
            <div class="digit-cell">9</div>
          </div>
        </template>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { processAnimateDigits } from '~/utils/common/ui-utils';

const props = defineProps<{ value: number }>();
const processedDigits = computed(() => processAnimateDigits(props.value));
</script>
