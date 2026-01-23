import type { PartyKitServer } from 'partykit/server';
import { isValidEmoji } from '../shared/utils/emoji';

const throttleMap = new WeakMap();
const LIMIT_MS = 200;

export default {
  async onMessage(message, ws, party) {
    const data = message as string;
    const splitIndex = data.indexOf(':');

    if (splitIndex === -1) return;

    const type = data.slice(0, splitIndex);
    const payload = data.slice(splitIndex + 1);

    if (type === 'react' && isValidEmoji(payload)) {
      const now = Date.now();
      const lastAction = throttleMap.get(ws) || 0;

      if (now - lastAction < LIMIT_MS) {
        // 频率太快，直接丢弃请求，不通知前端（节省带宽）
        return;
      }
      throttleMap.set(ws, now);

      const storageKey = `post:${party.id}:emoji:${payload}`;
      const nextCount = await party.storage.transaction(async (tx) => {
        const count = (await tx.get<number>(storageKey)) || 0;
        const updated = count + 1;
        await tx.put(storageKey, updated);

        return updated;
      });

      party.broadcast(`new-reaction:${payload}`);
      party.broadcast(`emoji-count:${payload}:${nextCount}`);
    }

    // --- 新增：投票 PK 逻辑 ---
    if (type === 'vote' && (payload === 'red' || payload === 'blue')) {
      const storageKey = `poll:${party.id}:vote:${payload}`;

      const nextCount = await party.storage.transaction(async (tx) => {
        const count = (await tx.get<number>(storageKey)) || 0;
        const updated = count + 1;
        await tx.put(storageKey, updated);
        return updated;
      });

      // 广播：谁投了票，以及该颜色的最新总数
      party.broadcast(`vote-update:${payload}:${nextCount}`);
    }
  },

  async onConnect(ws, party) {
    throttleMap.set(ws, 0);
    const connections = [...party.getConnections()].length;
    party.broadcast(`connections:${connections}`);

    const prefix = `post:${party.id}:emoji:`;
    const allStorage = await party.storage.list({ prefix });
    const initialReactions = Array.from(allStorage)
      .map(([key, value]) => `${key.replace(prefix, '')}:${value}`)
      .join(',');

    if (initialReactions) ws.send(`all-reactions:${initialReactions}`);

    // 新增：投票 PK 数据初始化
    const redCount = (await party.storage.get<number>(`poll:${party.id}:vote:red`)) || 0;
    const blueCount = (await party.storage.get<number>(`poll:${party.id}:vote:blue`)) || 0;
    ws.send(`poll-init:${redCount}:${blueCount}`);

    const status = (await party.storage.get<string>(`status:${party.id}`)) || 'default';
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
        await party.storage.put(`status:${party.id}`, status);
        party.broadcast(`status:${status}`);

        return new Response('OK', { status: 200 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies PartyKitServer;
