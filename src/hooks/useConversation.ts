import { useContext } from 'react'
import { ConversationContext, type ConversationContextValue } from './conversationContextValue.ts'

export function useConversation(): ConversationContextValue {
  const ctx = useContext(ConversationContext)
  if (!ctx) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return ctx
}
