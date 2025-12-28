<template>
    <div class="text-center mt-40">
        <div class="text-6xl font-black mb-4">404</div>
        <h1 class="text-2xl text-muted font-extrabold mb-3">页面不存在</h1>
        <p class="text-sm text-dimmed mb-8">
            访问的路径 <span class="font-mono">/{{ pathDisplay }}</span> 不存在
        </p>
        <UButton to="/" variant="solid" color="neutral" size="lg">返回首页</UButton>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const event = useRequestEvent()

const pathDisplay = computed(() => {
    const params = route.params as { slug?: string[] }
    return params.slug ? params.slug.join('/') : ''
})

if (import.meta.server && event) {
    setResponseStatus(event, 404)
}

useHead({ title: '404 - 页面未找到' })
</script>