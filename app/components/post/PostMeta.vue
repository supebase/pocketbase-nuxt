<template>
  <div class="flex items-center justify-between gap-2 w-full overflow-hidden">
    <Transition appear name="slide-right-fancy">
      <div class="flex items-center gap-3 tracking-wide">
        <UIcon v-if="postMeta.icon" :name="postMeta.icon" class="size-7 text-neutral-800 dark:text-neutral-100" />
        <div v-else class="size-7">
          <CommonAvatar :avatar-id="avatarId" :avatar-github="avatarGithub" :user-id="userId" :size="64" />
        </div>
        <div class="text-dimmed text-sm flex items-center">
          <ClientOnly>
            {{ postMeta.relativeTime }}
            <template #fallback>
              <span>同步中</span>
            </template>
          </ClientOnly>
          <span class="mx-1.5">&bull;</span>
          {{ useReadingTime(postMeta.content) }}
        </div>
      </div>
    </Transition>

    <Transition appear name="slide-left-fancy">
      <div class="flex items-center gap-1.25 text-dimmed text-sm">
        <ClientOnly>
          <CommonAnimateNumber :value="postMeta.views" /> 次围观
          <template #fallback> <CommonAnimateNumber :value="0" /> 次围观 </template>
        </ClientOnly>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useReadingTime } from '~/composables/useReadingTime';

interface Props {
  postMeta: {
    icon: string | null;
    relativeTime: string | ComputedRef<string>;
    created: string;
    content: string;
    views: number;
  };
  avatarId: string | null | undefined;
  avatarGithub: string | null | undefined;
  userId: string | null | undefined;
}

const props = defineProps<Props>();
</script>
