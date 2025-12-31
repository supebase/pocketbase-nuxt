// server/tasks/cleanup/assets.ts
import fs from 'node:fs';
import path from 'node:path';
import { getSystemClient } from '~~/server/utils/pocketbase';

export default defineTask({
  meta: {
    name: 'cleanup:assets',
    description: '清理 public/uploads 和 public/previews 目录下的孤立图片文件',
  },
  async run() {
    console.log('[Cleanup] 正在启动全量资产扫描...');

    try {
      // 使用整合后的单例管理员客户端
      const pb = await getSystemClient();

      // 1. 获取所有文章数据（仅获取必要字段）
      const posts = await pb.collection('posts').getFullList({
        fields: 'content,link_data',
      });

      const usedFiles = new Set<string>();

      // 2. 扫描并收集所有正在被使用的文件路径
      posts.forEach((post) => {
        // 扫描正文图片
        const uploadRegex = /uploads\/([^"'\s\)\\]+)/g;
        let m;
        while ((m = uploadRegex.exec(post.content || '')) !== null) {
          const fileName = m[1].replace(/\\+$/, '');
          usedFiles.add(`uploads/${fileName}`);
        }

        // 扫描预览图数据
        if (post.link_data) {
          try {
            const data =
              typeof post.link_data === 'string' ? JSON.parse(post.link_data) : post.link_data;

            const imagePath = data?.image || data?.imageUrl;
            if (imagePath && typeof imagePath === 'string') {
              const fileName = path.basename(imagePath);
              usedFiles.add(`previews/${fileName}`);
            }
          } catch (e) {
            // 兜底：JSON 解析失败时强行正则扫描
            const previewRegex = /previews\/([^"'\s\)\\]+)/g;
            let pm;
            const strData =
              typeof post.link_data === 'string' ? post.link_data : JSON.stringify(post.link_data);

            while ((pm = previewRegex.exec(strData)) !== null) {
              const fileName = pm[1].replace(/\\+$/, '');
              usedFiles.add(`previews/${fileName}`);
            }
          }
        }
      });

      console.log(`[Cleanup] 数据库扫描完成。正在使用的文件总数: ${usedFiles.size}`);

      // 3. 扫描物理目录并对比清理
      const targetSubDirs = ['uploads', 'previews'];
      let deletedCount = 0;
      const now = Date.now();

      // 开发环境下立即清理，生产环境下保留 24 小时内的文件以防万一
      const ONE_DAY_MS = process.env.NODE_ENV === 'development' ? 0 : 24 * 60 * 60 * 1000;

      for (const subDir of targetSubDirs) {
        const dirPath = path.join(process.cwd(), 'public', subDir);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
          if (file === '.gitkeep') return;

          const relativeReference = `${subDir}/${file}`;
          const absolutePath = path.join(dirPath, file);

          if (!usedFiles.has(relativeReference)) {
            try {
              const stats = fs.statSync(absolutePath);
              if (now - stats.mtimeMs > ONE_DAY_MS) {
                fs.unlinkSync(absolutePath);
                deletedCount++;
                console.log(`[Cleanup] [已删除] ${relativeReference}`);
              }
            } catch (err) {
              console.error(`[Cleanup] 处理文件失败: ${absolutePath}`, err);
            }
          }
        });
      }

      console.log(`[Cleanup] 任务运行成功。`);
      return { result: 'success', deleted: deletedCount };
    } catch (err: any) {
      console.error('[Cleanup] 任务运行失败:', err);
      return { result: 'error', message: err.message };
    }
  },
});
