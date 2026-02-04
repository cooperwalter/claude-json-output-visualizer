import { useState, useCallback } from 'react'

type FilePathHeaderProps = {
  filePath: string
  suffix?: React.ReactNode
}

export function FilePathHeader({ filePath, suffix }: FilePathHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(filePath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [filePath])

  return (
    <button
      onClick={handleCopy}
      className="w-full text-left text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2"
      title="Click to copy file path"
    >
      <span className="truncate min-w-0">{filePath}</span>
      {suffix}
      <span className="ml-auto shrink-0 text-gray-400 dark:text-gray-500">
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  )
}
