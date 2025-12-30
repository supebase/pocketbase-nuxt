import fs from 'node:fs';
import path from 'node:path';
import { getImpersonation } from '~~/server/utils/impersonation';

export default defineTask({
  meta: {
    name: 'cleanup:assets',
    description: '清理 public/uploads 和 public/previews 目录下的孤立图片文件',
  },
  async run() {
    console.log('[Cleanup] 正在启动全量资产扫描...');

    try {
      const pb = await getImpersonation();

      // 1. 获取所有文章数据
      const posts = await pb.collection('posts').getFullList({
        fields: 'content,link_data',
      });

      const usedFiles = new Set<string>();

      /**
       * 核心修改 1: 更加稳健的正则
       * 放弃对特定字符的限制，改为匹配直到遇到引号、括号或转义斜杠为止
       * 能够兼容 JSON 里的 \/uploads\/ 和标准的 /uploads/
       */
      const uploadRegex = /uploads\/([^"'\s\)\\]+)/g;
      const previewRegex = /previews\/([^"'\s\)\\]+)/g;

      posts.forEach((post) => {
        // 1. 扫描正文 (正则保持不变，处理较稳健)
        const uploadRegex = /uploads\/([^"'\s\)\\]+)/g;
        let m;
        while ((m = uploadRegex.exec(post.content || '')) !== null) {
          const fileName = m[1].replace(/\\+$/, '');
          usedFiles.add(`uploads/${fileName}`);
        }

        // 2. 扫描预览数据 (增强兼容性)
        if (post.link_data) {
          try {
            // 如果 link_data 已经是对象则直接用，否则尝试 JSON 解析
            const data =
              typeof post.link_data === 'string' ? JSON.parse(post.link_data) : post.link_data;

            // 检查是否有 image 字段，并提取文件名
            const imagePath = data?.image || data?.imageUrl; // 兼容不同可能的 key
            if (imagePath && typeof imagePath === 'string') {
              const fileName = path.basename(imagePath);
              usedFiles.add(`previews/${fileName}`);
            }
          } catch (e) {
            // 最后的兜底：如果解析完全失败，强行正则扫描字符串
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

      console.log('[Cleanup] 当前白名单列表:', Array.from(usedFiles));
      console.log(`[Cleanup] 数据库扫描完成。正在使用的文件总数: ${usedFiles.size}`);

      // 3. 扫描物理目录并执行清理
      const targetSubDirs = ['uploads', 'previews'];
      let deletedCount = 0;
      const now = Date.now();

      /**
       * 核心修改 3: 测试建议
       * 如果你在测试，请将 ONE_DAY_MS 改为 0
       * 否则 24 小时内产生的新文件永远不会被删除
       */
      const ONE_DAY_MS = process.env.NODE_ENV === 'development' ? 0 : 24 * 60 * 60 * 1000;

      for (const subDir of targetSubDirs) {
        const dirPath = path.join(process.cwd(), 'public', subDir);

        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
          if (file === '.gitkeep') return;

          const relativeReference = `${subDir}/${file}`;
          const absolutePath = path.join(dirPath, file);

          // 核心修改 4: 添加详细比对日志（调试用）
          const isUsed = usedFiles.has(relativeReference);

          if (!isUsed) {
            try {
              const stats = fs.statSync(absolutePath);
              if (now - stats.mtimeMs > ONE_DAY_MS) {
                fs.unlinkSync(absolutePath);
                deletedCount++;
                console.log(`[Cleanup] [Action: DELETE] ${relativeReference}`);
              } else {
                console.log(`[Cleanup] [Action: SKIP (Too New)] ${relativeReference}`);
              }
            } catch (err) {
              console.error(`[Cleanup] 处理文件失败: ${absolutePath}`, err);
            }
          }
        });
      }

      pb.authStore.clear();
      console.log(`[Cleanup] 任务完成，共清理 ${deletedCount} 个文件。`);
      return { result: 'success', deleted: deletedCount };
    } catch (err: any) {
      console.error('[Cleanup] 任务运行失败:', err);
      return { result: 'error', message: err.message };
    }
  },
});
