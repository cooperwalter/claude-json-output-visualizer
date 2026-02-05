import { createHighlighter, type Highlighter } from 'shiki/bundle/web'

let highlighterPromise: Promise<Highlighter> | null = null

const WEB_BUNDLE_LANGS = [
  'json', 'typescript', 'javascript', 'tsx', 'jsx',
  'python', 'bash', 'shell', 'html', 'css', 'markdown',
  'yaml', 'java', 'c', 'cpp', 'php', 'sql', 'xml',
]

const extraLangImports = [
  () => import('@shikijs/langs/toml'),
  () => import('@shikijs/langs/rust'),
  () => import('@shikijs/langs/go'),
  () => import('@shikijs/langs/ruby'),
  () => import('@shikijs/langs/diff'),
]

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: WEB_BUNDLE_LANGS,
    }).then(async (h) => {
      const extras = await Promise.all(extraLangImports.map((fn) => fn()))
      await h.loadLanguage(...extras.map((m) => m.default).flat())
      return h
    })
  }
  return highlighterPromise
}

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  css: 'css',
  html: 'html',
  htm: 'html',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  xml: 'xml',
  php: 'php',
  diff: 'diff',
}

export function langFromFilePath(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!ext) return undefined
  return EXT_TO_LANG[ext]
}
