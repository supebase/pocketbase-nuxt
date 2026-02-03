import { defineNuxtModule } from 'nuxt/kit';
import { getEnv, version } from '../config/env';
import type { BuildInfo } from '../shared/types/env';

export default defineNuxtModule({
  meta: { name: 'npmx:build-env' },
  async setup(_options, nuxt) {
    // 获取 Git 和环境信息
    const { env, commit, shortCommit, branch } = await getEnv(nuxt.options.dev);

    // 注入到 appConfig
    nuxt.options.appConfig.env = env;
    nuxt.options.appConfig.buildInfo = {
      version,
      time: Date.now(),
      commit,
      shortCommit,
      branch,
      env,
    } satisfies BuildInfo;
  },
});

declare module '@nuxt/schema' {
  interface AppConfig {
    env: BuildInfo['env'];
    buildInfo: BuildInfo;
  }
}
