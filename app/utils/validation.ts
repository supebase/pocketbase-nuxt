/**
 * 验证工具函数集合
 */

/**
 * 验证电子邮件格式
 * @param email 要验证的电子邮件地址
 * @returns 是否为有效的电子邮件格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码是否至少包含指定长度
 * @param password 要验证的密码
 * @param minLength 最小长度，默认为8
 * @returns 是否满足最小长度要求
 */
export function isValidPasswordLength(password: string, minLength: number = 8): boolean {
  return password.length >= minLength;
}

/**
 * 验证密码是否包含至少一个数字
 * @param password 要验证的密码
 * @returns 是否包含至少一个数字
 */
export function hasPasswordNumber(password: string): boolean {
  const numberRegex = /\d/;
  return numberRegex.test(password);
}

/**
 * 验证密码是否包含至少一个小写字母
 * @param password 要验证的密码
 * @returns 是否包含至少一个小写字母
 */
export function hasPasswordLowerCase(password: string): boolean {
  const lowerCaseRegex = /[a-z]/;
  return lowerCaseRegex.test(password);
}

/**
 * 验证密码是否包含至少一个大写字母
 * @param password 要验证的密码
 * @returns 是否包含至少一个大写字母
 */
export function hasPasswordUpperCase(password: string): boolean {
  const upperCaseRegex = /[A-Z]/;
  return upperCaseRegex.test(password);
}

/**
 * 验证两个密码是否匹配
 * @param password 第一个密码
 * @param confirmPassword 第二个密码
 * @returns 两个密码是否匹配
 */
export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * 验证字符串是否为空或只包含空格
 * @param str 要验证的字符串
 * @returns 是否为空或只包含空格
 */
export function isEmptyString(str: string): boolean {
  return str.trim() === '';
}
