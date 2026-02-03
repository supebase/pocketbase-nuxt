import Git from 'simple-git';
import { version } from '../package.json';

export { version };

const git = Git();

export async function getEnv(isDevelopment: boolean) {
  let branch = 'unknown';
  let commit = 'unknown';
  let shortCommit = 'unknown';

  try {
    // 尝试获取本地 Git 信息
    branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    commit = await git.revparse(['HEAD']);
    shortCommit = commit.slice(0, 7);
  } catch (e) {
    console.warn('无法获取 Git 信息，确保已安装 Git 且存在 .git 目录');
  }

  // 环境判定逻辑：
  // 1. 如果是 pnpm run dev，则是 dev
  // 2. 如果是 main 分支，定为 canary (或你喜欢的生产环境名)
  // 3. 其他情况视为 preview 或 release
  const env = isDevelopment ? 'dev' : branch === 'main' ? 'canary' : 'preview';

  return { commit, shortCommit, branch, env } as const;
}
