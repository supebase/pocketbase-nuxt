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

const processedDigits = computed(() => {
    // 将数字转为字符串并反转，例如 1,234 -> ["4", "3", "2", ",", "1"]
    const str = new Intl.NumberFormat().format(props.value);
    const chars = str.split('').reverse();

    return chars.map((char, index) => {
      // 关键点：Key 必须基于它的位数（个位、十位...）而不是内容或索引
      // 我们通过当前位置是第几个数字（不计逗号）来生成 ID
      const isComma = char === ',';
	  
      return {
        id: `pos-${index}`, // 固定的位置标识
        digit: isComma ? ',' : char,
        isComma,
      };
    });
});
</script>
