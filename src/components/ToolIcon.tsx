type ToolIconProps = {
  toolName: string
  className?: string
}

export function ToolIcon({ toolName, className = 'w-3.5 h-3.5' }: ToolIconProps) {
  const cls = `${className} shrink-0`
  const stroke = 'currentColor'

  switch (toolName) {
    case 'Read':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
          <path d="M5 5h6M5 8h6M5 11h3" />
        </svg>
      )

    case 'Write':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
          <path d="M6 8l1.5 1.5L10 7" />
        </svg>
      )

    case 'Edit':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11.5 1.5l3 3L5 14H2v-3z" />
          <path d="M9.5 3.5l3 3" />
        </svg>
      )

    case 'Bash':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="2" width="14" height="12" rx="1.5" />
          <path d="M4 6l2.5 2L4 10M8 10h3" />
        </svg>
      )

    case 'Grep':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="7" cy="7" r="4" />
          <path d="M10 10l4 4" />
        </svg>
      )

    case 'Glob':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 2v12h12" />
          <path d="M5 8h2v6M5 5h2M9 5h2v9M9 11h2" />
        </svg>
      )

    case 'Task':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <path d="M6 5.5v5l4-2.5z" />
        </svg>
      )

    case 'TodoWrite':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4l1.5 1.5L7 3M3 8l1.5 1.5L7 7M3 12l1.5 1.5L7 11" />
          <path d="M9 4h4M9 8h4M9 12h4" />
        </svg>
      )

    case 'WebFetch':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2c-2 2.5-2 9.5 0 12M8 2c2 2.5 2 9.5 0 12" />
        </svg>
      )

    default:
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.4 5.2L10.8 3.8a1.5 1.5 0 112.1 2.1L11.5 7.3M6.6 10.8L5.2 12.2a1.5 1.5 0 11-2.1-2.1L4.5 8.7M6 10L10 6" />
        </svg>
      )
  }
}
