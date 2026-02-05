import { useState, useEffect, useRef, useMemo } from 'react'
import { getHighlighter } from '@/utils/highlighter.ts'

type CodeBlockProps = {
  code: string
  lang?: string
  className?: string
  showLineNumbers?: boolean
  startLine?: number
}

export function CodeBlock({ code, lang, className, showLineNumbers, startLine = 1 }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const prevInputRef = useRef<string>('')

  const inputKey = `${lang ?? ''}:${code}`

  useEffect(() => {
    if (inputKey === prevInputRef.current) return
    prevInputRef.current = inputKey

    let cancelled = false

    getHighlighter()
      .then((h) => {
        if (cancelled) return
        const resolvedLang = lang && h.getLoadedLanguages().includes(lang) ? lang : 'text'
        const darkMode = document.documentElement.classList.contains('dark')
          || window.matchMedia('(prefers-color-scheme: dark)').matches
        const theme = darkMode ? 'github-dark' : 'github-light'
        const result = h.codeToHtml(code, { lang: resolvedLang, theme })
        setHtml(result)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })

    return () => {
      cancelled = true
    }
  }, [inputKey, code, lang])

  const lines = useMemo(() => {
    if (!showLineNumbers) return null
    return code.split('\n')
  }, [code, showLineNumbers])

  if (showLineNumbers && lines) {
    const gutterWidth = String(startLine + lines.length - 1).length
    if (html) {
      return (
        <div className={`text-xs overflow-x-auto max-h-96 rounded ${className ?? ''}`}>
          <div className="flex">
            <div
              className="shrink-0 text-right select-none pr-3 pl-2 py-3 text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 font-mono border-r border-gray-200 dark:border-gray-700"
              aria-hidden="true"
            >
              {lines.map((_, i) => (
                <div key={i} style={{ minWidth: `${gutterWidth}ch` }}>
                  {startLine + i}
                </div>
              ))}
            </div>
            <div
              className="shiki-container flex-1 min-w-0 [&_pre]:!py-3 [&_pre]:!pl-3"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      )
    }

    return (
      <div className={`text-xs overflow-x-auto max-h-96 rounded ${className ?? ''}`}>
        <pre className="font-mono bg-gray-900 text-gray-300 flex">
          <span
            className="shrink-0 text-right select-none pr-3 pl-2 py-3 text-gray-600 border-r border-gray-700"
            aria-hidden="true"
          >
            {lines.map((_, i) => (
              <span key={i} className="block" style={{ minWidth: `${gutterWidth}ch` }}>
                {startLine + i}
              </span>
            ))}
          </span>
          <code className="flex-1 min-w-0 py-3 pl-3">{code}</code>
        </pre>
      </div>
    )
  }

  if (html) {
    return (
      <div
        className={`shiki-container text-xs overflow-x-auto max-h-96 rounded ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <pre className={`text-xs font-mono bg-gray-900 text-gray-300 rounded p-3 overflow-x-auto max-h-96 ${className ?? ''}`}>
      {code}
    </pre>
  )
}
