import PartySocket from 'partysocket';

interface UsePartyOptions {
  room: string;
  onMessage?: (type: string, content: string) => void;
}

export const useParty = (options: UsePartyOptions) => {
  const {
    public: { partykitHost },
  } = useRuntimeConfig();
  let socket = ref<PartySocket | null>(null);

  const connect = () => {
    if (!import.meta.client || socket.value) return;

    socket.value = new PartySocket({
      host: partykitHost,
      room: options.room,
    });

    socket.value.onmessage = (evt) => {
      const data = evt.data as string;
      const splitIndex = data.indexOf(':');
      if (splitIndex === -1) return;

      const type = data.slice(0, splitIndex);
      const content = data.slice(splitIndex + 1);

      options.onMessage?.(type, content);
    };
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
  };

  const send = (message: string) => {
    socket.value?.send(message);
  };

  onMounted(connect);
  onActivated(() => {
    if (!socket.value) connect();
  });
  onBeforeUnmount(disconnect);

  return {
    socket,
    connect,
    disconnect,
    send,
  };
};
