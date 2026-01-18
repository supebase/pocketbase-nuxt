import type { PartyKitServer } from 'partykit/server';
import { isValidEmoji } from '../shared/utils/emoji';

export default {
  async onMessage(message, ws, party) {
    const data = message as string;
    const splitIndex = data.indexOf(':');

    if (splitIndex === -1) return;

    const type = data.slice(0, splitIndex);
    const emoji = data.slice(splitIndex + 1);

    if (type === 'react' && isValidEmoji(emoji)) {
      const storageKey = `emoji_${emoji}`;
      const nextCount = await party.storage.transaction(async (tx) => {
        const count = (await tx.get<number>(storageKey)) || 0;
        const updated = count + 1;
        await tx.put(storageKey, updated);

        return updated;
      });

      party.broadcast(`new-reaction:${emoji}`);
      party.broadcast(`emoji-count:${emoji}:${nextCount}`);
    }
  },

  async onConnect(ws, party) {
    const connections = [...party.getConnections()].length;
    party.broadcast(`connections:${connections}`);

    const allStorage = await party.storage.list({ prefix: 'emoji_' });
    const initialReactions = Array.from(allStorage)
      .map(([key, value]) => `${key.replace('emoji_', '')}:${value}`)
      .join(',');

    if (initialReactions) ws.send(`all-reactions:${initialReactions}`);

    const status = (await party.storage.get<string>('status')) || 'default';
    ws.send(`status:${status}`);
  },

  async onClose(_ws, party) {
    const connections = [...party.getConnections()].length;
    party.broadcast(`connections:${connections}`);
  },

  async onRequest(request, party) {
    if (request.method === 'POST') {
      const { status } = (await request.json()) as { status: string };
      if (status) {
        await party.storage.put('status', status);
        party.broadcast(`status:${status}`);

        return new Response('OK', { status: 200 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies PartyKitServer;
