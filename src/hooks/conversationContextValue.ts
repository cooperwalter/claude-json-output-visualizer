import { createContext, type Dispatch } from 'react'
import type { AppState, AppAction } from './useAppState.ts'

export type ConversationContextValue = {
  state: AppState
  dispatch: Dispatch<AppAction>
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
