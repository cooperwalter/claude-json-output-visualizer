export function formatModelShort(model: string): string {
  let short = model
  if (short.startsWith('claude-')) {
    short = short.slice(7)
  }
  short = short.replace(/-\d{8}$/, '')
  return short
}
