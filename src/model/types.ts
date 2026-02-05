export type TextContentBlock = {
  type: 'text'
  text: string
}

export type ToolUseContentBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export type ContentBlock = TextContentBlock | ToolUseContentBlock

export type ToolResultBlock = {
  tool_use_id: string
  type: 'tool_result'
  content: string
  is_error?: boolean
}

export type CacheCreation = {
  ephemeral_5m_input_tokens: number
  ephemeral_1h_input_tokens: number
}

export type Usage = {
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  cache_creation?: CacheCreation
  output_tokens: number
  service_tier: string
}

export type Todo = {
  content: string
  status: string
  activeForm?: string
}

export type ToolUseResultFile = {
  filePath: string
  content: string
  numLines: number
  startLine: number
  totalLines: number
}

export type ToolUseResultMeta = {
  type: 'text'
  file?: ToolUseResultFile
  status?: string
  prompt?: string
  agentId?: string
  content?: unknown[]
  totalDurationMs?: number
  totalTokens?: number
  totalToolUseCount?: number
  usage?: Usage
  oldTodos?: Todo[]
  newTodos?: Todo[]
}

export type AssistantMessage = {
  model: string
  id: string
  type: 'message'
  role: 'assistant'
  content: ContentBlock[]
  stop_reason: string | null
  stop_sequence: string | null
  usage: Usage
  context_management: unknown | null
}

export type UserMessage = {
  role: 'user'
  content: ToolResultBlock[]
}

export type AssistantRecord = {
  type: 'assistant'
  message: AssistantMessage
  parent_tool_use_id: string | null
  session_id: string
  uuid: string
}

export type UserRecord = {
  type: 'user'
  message: UserMessage
  parent_tool_use_id: string | null
  session_id: string
  uuid: string
  tool_use_result: ToolUseResultMeta
}

export type RawRecord = AssistantRecord | UserRecord

export type ConversationTurn = {
  messageId: string
  role: 'assistant' | 'user'
  records: RawRecord[]
  contentBlocks: ContentBlock[]
  parentToolUseId: string | null
  sessionId: string
}

export type ToolCallPair = {
  toolUse: {
    id: string
    name: string
    input: Record<string, unknown>
  }
  toolResult: {
    content: string
    isError: boolean
    meta: ToolUseResultMeta
  } | null
}

export type SubAgentNode = {
  parentToolUseId: string
  records: RawRecord[]
  children: SubAgentNode[]
}

export type IndexMaps = {
  byUuid: Map<string, RawRecord>
  byMessageId: Map<string, RawRecord[]>
  byToolUseId: Map<string, ToolCallPair>
  byParentToolUseId: Map<string, RawRecord[]>
}

export type RecentSession = {
  fileName: string
  fileSize: number
  loadedAt: string
  sessionId: string
  recordCount: number
}
