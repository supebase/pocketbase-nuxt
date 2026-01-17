<template>
  <div class="fixed bottom-4 right-4 p-1 bg-white dark:bg-neutral-900 rounded-full overflow-hidden z-10 select-none">
    <div
      class="pl-2 pr-2 py-1 rounded-full flex flex-row items-center shadow border text-xs transition-opacity duration-500"
      :class="colorSet.default.badge"
    >
      <span class="rounded-full inline-block h-2 w-2 animate-pulse shadow" :class="colorSet.default.block" />

      <span class="ml-2 tabular-nums font-medium flex flex-row items-center gap-1 tracking-wider">
        {{ count || 1 }}
        <span>人在线</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import PartySocket from 'partysocket';

const colorSet = {
  default: {
    badge: 'border-primary opacity-60 hover:opacity-100 dark:border-primary',
    block: 'bg-primary',
  },
};

const status = ref<'live' | 'default'>('default');
const count = ref<number | null>(null);

if (import.meta.client) {
  let partySocket: PartySocket;

  const {
    public: { partykitHost },
  } = useRuntimeConfig();

  onNuxtReady(() => {
    partySocket = new PartySocket({
      host: partykitHost,
      room: 'site',
    });

    partySocket.onmessage = (evt) => {
      const [type, value] = (evt.data as string).split(':');
      if (!value) return;

      if (type === 'connections') {
        count.value = parseInt(value);
      } else if (type === 'status') {
        if (value === 'live' || value === 'default') {
          status.value = value;
        }
      }
    };
  });

  // 组件卸载时断开连接，释放资源
  onBeforeUnmount(() => partySocket?.close());
}
</script>
