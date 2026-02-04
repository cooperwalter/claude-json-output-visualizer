import { useState, useEffect, useRef } from 'react'
import { getHighlighter } from '@/utils/highlighter.ts'

type CodeBlockProps = {
  code: string
  lang?: string
  className?: string
}

export function CodeBlock({ code, lang, className }: CodeBlockProps) {
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
