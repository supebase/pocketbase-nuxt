<template>
  <URadioGroup
    v-model="model"
    indicator="hidden"
    orientation="horizontal"
    variant="card"
    class="select-none w-full"
    :items="items"
    :ui="{
      item: 'items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group relative animate-rainbow cursor-pointer border-0 [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] inline-flex \
      bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#f5f5f5_50%,rgba(248,250,252,0.6)_80%,rgba(248,250,252,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] \
      bg-[length:200%] text-slate-900 \
      dark:bg-[linear-gradient(#171717,#171717),linear-gradient(#202020_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] \
      dark:text-white \
      has-data-[state=checked]:shadow-lg has-data-[state=checked]:shadow-primary/20',
    }"
  />
</template>

<script setup lang="ts">
const model = defineModel<string>();
defineProps<{ items: any[] }>();
</script>
