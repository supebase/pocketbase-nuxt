<template>
  <div class="flex items-center tabular-nums overflow-hidden select-none">
    <div class="flex flex-row-reverse items-center">
      <div
        v-for="item in processedDigits"
        :key="item.id"
        :class="[item.isComma ? 'comma' : 'number-column']"
        class="relative"
      >
        <template v-if="item.isComma"> , </template>
        <template v-else>
          <div
            class="number-scroll transition-transform duration-500 ease-out"
            :style="{ transform: `translateY(${Number(item.digit) * -10}%)` }"
          >
            <div
              v-for="n in 10"
              :key="n"
              class="number-cell flex justify-center items-center h-[1em]"
            >
              {{ n - 1 }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    value: number;
}>();

const formatter = new Intl.NumberFormat('en-US');

const processedDigits = computed(() => {
    // 强制使用 en-US 确保分隔符一定是逗号
    const str = formatter.format(props.value);
    const chars = str.split('').reverse();

    let digitCount = 0;

    return chars.map((char) => {
      const isDigit = /\d/.test(char);
      
      if (isDigit) {
        // 当前数字位的权重（0=个位, 1=十位...）
        const id = `digit-${digitCount}`;
        const item = { id, digit: char, isComma: false };
        digitCount++; // 只有是数字时才增加权重计数
        return item;
      } else {
        // 逗号的 Key 绑定在它右侧已经出现的数字个数上
        // 例如 1,000 -> 逗号前面有 3 个数字，Key 就是 sep-3
        // 这样即便数字变成 10,000，这个逗号的 Key 依然是 sep-3，DOM 不会重建
        return {
          id: `sep-${digitCount}`, 
          digit: char,
          isComma: true,
        };
      }
    });
});
</script>
