export const MAX_CACHE_SIZE = 500;
export const MIN_SEARCH_LENGTH = 2;
export const REFRESH_THRESHOLD = 30 * 1000; // 首页预览不需要太频繁，改为 30 秒
export const MENTION_REGEX = /(@[^@\s]+)/g;
export const CONTENT_MAX_LENGTH = 10000;
export const COMMENT_MAX_LENGTH = 300;

export const timeMap: Record<string, string> = {
  '1 天': '昨天',
  '2 天': '前天',
  '1 周': '上周',
  '1 个月': '上个月',
  '1 年': '去年',
};

/**
 * 阅读速度配置常量
 * WORDS_PER_MINUTE: 英文单词阅读速度（词/分钟）
 * CHINESE_CHARS_PER_MINUTE: 中文字符阅读速度（字/分钟）
 * IMAGE_TIME: 单张图片预计观看时间（分钟）
 * CODE_BLOCK_BASE_TIME: 代码块基础阅读时间（分钟）
 * CODE_LINE_TIME: 每行代码预计阅读时间（分钟）
 */
export const READ_SPEED_CONFIG = {
  WORDS_PER_MINUTE: 200,
  CHINESE_CHARS_PER_MINUTE: 300,
  IMAGE_TIME: 0.25,
  CAROUSEL_BASE_TIME: 0.25,
  CODE_BLOCK_BASE_TIME: 0.3,
  CODE_LINE_TIME: 0.07,
} as const;

export const TABS = [
  {
    label: '登录我的账户',
    icon: 'i-hugeicons:login-02',
    value: 'login',
    description: '使用电子邮件和密码登录到您的账户。',
  },
  {
    label: '免费创建账户',
    icon: 'i-hugeicons:user-add-01',
    value: 'register',
    description: '创建一个新账户，完成后即可自动登录。',
  },
];

export const placeholders = [
  '聚焦核心话题，留下你的专业分析',
  '理性发声，用观点传递价值',
  '干货满满，说说你的独到见解',
  '专业视角交流，助力经验沉淀',
];

export const actionItems = [
  { label: '贴文', description: '记录观点、动态与生活', value: 'dit' },
  { label: '分享', description: '转发并分享优质内容', value: 'partager' },
];
