/**
 * 数値IDを4桁のゼロパディング形式にフォーマットする
 * @param id - 数値ID
 * @returns 4桁の文字列（例: 1 -> "0001", 123 -> "0123"）
 */
export function formatSeesId(id: number): string {
  return id.toString().padStart(4, '0');
}

/**
 * 4桁の文字列IDを数値に変換する
 * @param formattedId - フォーマットされたID文字列（例: "0001"）
 * @returns 数値ID
 */
export function parseSeesId(formattedId: string): number {
  return parseInt(formattedId, 10);
}
