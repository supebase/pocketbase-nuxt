<template>
    <a :href="data.url" target="_blank"
        class="group my-4 flex items-stretch border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden no-underline">

        <div v-if="data.image"
            class="relative w-22 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden">

            <NuxtImg :src="data.image" placeholder preset="preview" :custom="true">
                <template #default="{ src, isLoaded, imgAttrs }">
                    <div class="relative w-full h-full">
                        <img v-bind="imgAttrs" :src="src" :class="[
                            'w-full h-full object-cover transition-all duration-700 ease-in-out',
                            isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
                        ]" alt="preview" />

                        <div v-if="!isLoaded"
                            class="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
                            <UIcon name="i-hugeicons:refresh"
                                class="size-5 text-muted/30 animate-spin" />
                        </div>
                    </div>
                </template>
            </NuxtImg>
        </div>

        <div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
            <h3 class="text-sm font-bold text-primary mb-0.5 line-clamp-1 leading-snug">
                {{ data.title }}
            </h3>

            <p class="text-xs text-muted line-clamp-2 leading-relaxed mb-1">
                {{ data.description }}
            </p>

            <span class="text-[10px] text-dimmed truncate font-mono">
                {{ displayUrl }}
            </span>
        </div>
    </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    data: {
        url: string
        title: string
        description: string
        image: string
        siteName: string
    }
}>()

const displayUrl = computed(() => {
    return props.data.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
})
</script>