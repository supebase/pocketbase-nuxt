<template>
  <div class="flex items-center tabular-nums overflow-hidden select-none">
    <transition-group
      name="digit"
      tag="div"
      class="flex flex-row-reverse items-center"
    >
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
              class="number-cell flex justify-center items-center"
            >
              {{ n - 1 }}
            </div>
          </div>
        </template>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	value: number;
}>();

const formatter = new Intl.NumberFormat('en-US');

const processedDigits = computed(() => {
	const str = formatter.format(props.value);
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
</script>
