import { ConversationContext, type ConversationContextValue } from './conversationContextValue.ts'

export function ConversationProvider({
  state,
  dispatch,
  children,
}: ConversationContextValue & { children: React.ReactNode }) {
  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  )
}
