import type { PartyKitServer, Party, PartyWorker } from 'partykit/server';
import { isValidEmoji } from '../shared/utils/emoji';

export default {
  async onMessage(message, ws, party) {
    // 假设前端发送的消息格式是 "react:🔥"
    const [type, emoji] = (message as string).split(':');

    if (type === 'react' && isValidEmoji(emoji)) {
      // 1. 获取当前该表情的点赞总数
      const storageKey = `emoji_${emoji}`;

      await party.storage.transaction(async (tx) => {
        const count = (await tx.get<number>(storageKey)) || 0;
        const nextCount = count + 1;

        await tx.put(storageKey, nextCount);

        party.broadcast(`new-reaction:${emoji}`);
        party.broadcast(`emoji-count:${emoji}:${nextCount}`);
      });
    }
  },
  // 当有新连接（新访客）时触发
  async onConnect(ws, party) {
    // 1. 获取当前房间的总连接数
    const count = [...party.getConnections()].length;

    // 2. 向房间内的所有人广播最新的在线人数
    // 格式如 "connections:12"
    party.broadcast(`connections:${count}`);

    // 3. 发送当前的直播状态给刚进来的这一个人
    const status = (await party.storage.get<string>('status')) || 'default';
    ws.send(`status:${status}`);

    const initialReactions: string[] = [];
    const allStorage = await party.storage.list();

    for (const [key, value] of allStorage) {
      if (key.startsWith('emoji_')) {
        initialReactions.push(`${key.replace('emoji_', '')}:${value}`);
      }
    }
    if (initialReactions.length > 0) {
      ws.send(`all-reactions:${initialReactions.join(',')}`);
    }
  },

  // 当连接断开（访客关闭网页）时触发
  async onClose(ws, party) {
    // 重新广播人数（减去刚刚离开的那个人）
    const count = [...party.getConnections()].length;
    party.broadcast(`connections:${count}`);
  },

  // 可选：通过 API 修改状态（例如你想把状态改成 live）
  async onRequest(request, party) {
    if (request.method === 'POST') {
      const { status } = (await request.json()) as { status: string };
      if (status) {
        await party.storage.put('status', status);
        party.broadcast(`status:${status}`);
        return new Response('Status updated', { status: 200 });
      }
    }
    return new Response('Not Found', { status: 404 });
  },
} satisfies PartyKitServer;
