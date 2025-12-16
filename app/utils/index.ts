/**
   * 清理 Markdown 语法，返回纯文本
   * @param text - 包含 Markdown 语法的文本
   * @returns 清理后的纯文本
   */
export function cleanMarkdown(text: string): string {
    // 类型和边界检查：只处理字符串类型
    if (typeof text !== "string" || !text) return "";

    const cleaned = text
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)({target=_blank})?/g, "$1") // 处理带有 target=_blank 的链接
        .replace(/`(.+?)`/g, "$1")
        .replace(/~~(.+?)~~/g, "$1")
        .replace(/>\s(.+)/g, "$1")
        .replace(/\n\s*[-*+]\s/g, "\n")
        .replace(/\n\s*\d+\.\s/g, "\n")
        .replace(/::.*?::/gs, "")
        .replace(/`.*?`/gs, "");

    return cleaned;
};