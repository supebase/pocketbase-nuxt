import PocketBase from 'pocketbase';

let pbInstance: PocketBase | null = null;

export const getClientPB = () => {
  if (import.meta.server) return null;

  if (!pbInstance) {
    pbInstance = new PocketBase('/_pb');
    pbInstance.autoCancellation(false);
  }

  return pbInstance;
};
