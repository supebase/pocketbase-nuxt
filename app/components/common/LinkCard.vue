<template>
    <a :href="data.url" target="_blank" tabindex="-1"
        class="group mt-4 mb-1.5 flex items-stretch border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden no-underline">

        <div v-if="data.image"
            class="relative w-21 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden">

            <div class="relative w-full h-full bg-neutral-100 dark:bg-neutral-900">
                <img :src="data.image" @load="handleLoad" :class="[
                    'w-full h-full object-cover transition-all duration-700 ease-in-out',
                    isLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-xl scale-110 opacity-0',
                ]" alt="preview" loading="lazy" />

                <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center">
                    <UIcon name="i-hugeicons:refresh" class="size-5 text-muted/30 animate-spin" />
                </div>
            </div>
        </div>

        <div v-else
            class="relative w-21 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
            <div class="absolute inset-0 flex items-center justify-center">
                <UIcon :name="isGitHub ? 'i-hugeicons:github' : 'i-hugeicons:image-02'"
                    class="text-dimmed/40 size-8" />
            </div>
        </div>

        <div
            class="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-1 bg-white dark:bg-neutral-900">

            <div class="text-sm font-bold text-primary line-clamp-1 w-full">
                {{ data.title }}
            </div>

            <div class="text-xs text-muted line-clamp-1 w-full">
                {{ data.description }}
            </div>

            <div class="text-[10px] text-dimmed truncate font-mono">
                {{ displayUrl }}
            </div>
        </div>
    </a>
</template>

<script setup lang="ts">
const props = defineProps<{
    data: {
        url: string
        title: string
        description: string
        image: string
        siteName: string
    }
}>()

const isLoaded = ref(false)

const handleLoad = () => {
    isLoaded.value = true
}

// 判断是否为 GitHub 链接
const isGitHub = computed(() => {
    try {
        const host = new URL(props.data.url).hostname
        return host === 'github.com' || host.endsWith('.github.com')
    } catch {
        return false
    }
})

const displayUrl = computed(() => {
    return props.data.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
})
</script>