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
const props = defineProps<{ value: number }>();
const formatter = new Intl.NumberFormat('en-US');

const processedDigits = computed(() => {
  const str = formatter.format(props.value);
  const chars = str.split('').reverse();

  let digitIndex = 0;

  return chars.map((char) => {
    const isDigit = /\d/.test(char);

    if (isDigit) {
      return {
        id: `d-${digitIndex++}`,
        digit: char,
        isComma: false,
      };
    } else {
      // 分隔符绑定在当前的 digitIndex 上，确保当 999 变 1,000 时，逗号是平滑“插入”的
      return {
        id: `s-${digitIndex}`,
        digit: char,
        isComma: true,
      };
    }
  });
});
</script>
