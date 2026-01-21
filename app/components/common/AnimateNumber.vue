<template>
  <div class="inline-flex flex-row-reverse items-center tabular-nums overflow-hidden select-none h-[1.25em]">
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
            <div v-for="n in 10" :key="n" class="digit-cell">
              {{ n - 1 }}
            </div>
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
