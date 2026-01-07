<template>
  <div class="flex items-center justify-between gap-2 w-full">
    <div class="flex items-center gap-3 tracking-wide">
      <UIcon v-if="props.postMeta.icon" :name="props.postMeta.icon" class="size-7 text-primary" />
      <div v-else class="size-8">
        <CommonGravatar :avatar-id="props.avatarId" :size="64" />
      </div>
      <div class="text-dimmed text-sm flex items-center">
        <ClientOnly>
          {{ props.postMeta.relativeTime }}
          <template #fallback
            ><span>{{ useRelativeTime(props.postMeta.created).value }}</span></template
          >
        </ClientOnly>
        <span class="mx-1.5">&bull;</span>
        {{ useReadingTime(props.postMeta.content) }}
      </div>
    </div>

    <div class="flex items-center gap-1.25 text-dimmed text-sm">
      <ClientOnly><CommonAnimateNumber :value="props.postMeta.views" /> 次拾阅 </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  postMeta: {
    icon: string | null;
    relativeTime: string | ComputedRef<string>;
    created: string;
    content: string;
    views: number;
  };
  avatarId: string | null | undefined;
}

const props = defineProps<Props>();
</script>
