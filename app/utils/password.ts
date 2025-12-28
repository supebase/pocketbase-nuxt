/**
 * 密码强度要求接口
 */
export interface PasswordRequirement {
  met: boolean;
  text: string;
}

/**
 * 检查密码强度
 * @param str 要检查的密码字符串
 * @returns 密码强度要求数组，包含每个要求是否满足以及相应的文本说明
 */
export function checkPasswordStrength(str: string): PasswordRequirement[] {
  const requirements = [
    { regex: /.{8,}/, text: '建议密码至少 8 个字符' },
    { regex: /\d/, text: '推荐包含至少 1 个数字' },
    { regex: /[a-z]/, text: '推荐包含至少 1 个小写字母' },
    { regex: /[A-Z]/, text: '推荐包含至少 1 个大写字母' },
  ];

  return requirements.map((req) => ({ met: req.regex.test(str), text: req.text }));
}

/**
 * 计算密码强度分数
 * @param requirements 密码强度要求数组
 * @returns 密码强度分数（0-4）
 */
export function calculatePasswordScore(requirements: PasswordRequirement[]): number {
  return requirements.filter((req) => req.met).length;
}

/**
 * 根据密码强度分数获取对应的颜色
 * @param score 密码强度分数（0-4）
 * @returns 对应的颜色字符串
 */
export function getPasswordStrengthColor(
  score: number
): 'error' | 'success' | 'warning' | 'neutral' {
  switch (true) {
    case score === 0:
      return 'neutral';
    case score <= 1:
      return 'error';
    case score <= 3:
      return 'warning';
    default:
      return 'success';
  }
}
