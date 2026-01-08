<template>
  <div class="flex items-center tabular-nums overflow-hidden select-none">
    <transition-group name="digit" tag="div" class="flex flex-row-reverse items-center">
      <div
        v-for="item in processedDigits"
        :key="item.id"
        :class="[item.isComma ? 'comma' : 'number-column']"
        class="relative"
      >
        <template v-if="item.isComma"> , </template>
        <template v-else>
          <div
            class="number-scroll transition-all"
            :style="{
              transform: `translateY(${Number(item.digit) * -10}%)`,
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }"
          >
            <div v-for="n in 10" :key="n" class="number-cell flex justify-center items-center">
              {{ n - 1 }}
            </div>
          </div>
        </template>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number;
}>();

const internalValue = ref(0);

const formatter = new Intl.NumberFormat('en-US');

const processedDigits = computed(() => {
  if (internalValue.value === undefined) return [];
  const str = formatter.format(internalValue.value);
  const chars = str.split('').reverse();

  let digitCount = 0;
  return chars.map((char) => {
    const isDigit = /\d/.test(char);
    if (isDigit) {
      const id = `digit-${digitCount}`;
      const item = { id, digit: char, isComma: false };
      digitCount++;
      return item;
    } else {
      // 逗号绑定在它右侧的数字数量上，保持 key 稳定
      return {
        id: `sep-${digitCount}`,
        digit: char,
        isComma: true,
      };
    }
  });
});

onMounted(() => {
  // 使用 nextTick 或直接赋值，确保 DOM 先以 0 渲染完成
  requestAnimationFrame(() => {
    internalValue.value = props.value;
  });
});

watch(
  () => props.value,
  (newVal) => {
    internalValue.value = newVal;
  },
);
</script>
