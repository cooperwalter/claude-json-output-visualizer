import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TokenSummaryPanel } from './TokenSummaryPanel.tsx'
import type { RawRecord, ConversationTurn, AssistantRecord, UserRecord, IndexMaps, ToolCallPair } from '@/model/types.ts'

function makeAssistantRecord(overrides: Partial<AssistantRecord> = {}): AssistantRecord {
  return {
    type: 'assistant',
    uuid: 'uuid-1',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      model: 'claude-sonnet-4-20250514',
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: 30,
        cache_creation: {
          ephemeral_5m_input_tokens: 0,
          ephemeral_1h_input_tokens: 0,
        },
        service_tier: 'standard',
      },
      context_management: null,
    },
    ...overrides,
  }
}

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    type: 'user',
    uuid: 'uuid-2',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tu-1', content: 'result' }],
    },
    tool_use_result: { type: 'text' },
    ...overrides,
  }
}

function makeTurn(records: RawRecord[], role: 'assistant' | 'user' = 'assistant'): ConversationTurn {
  return {
    messageId: records[0].uuid,
    role,
    records,
    contentBlocks: role === 'assistant' && records[0].type === 'assistant'
      ? records[0].message.content
      : [],
    parentToolUseId: null,
    sessionId: 'session-1',
  }
}

describe('TokenSummaryPanel', () => {
  it('should display total input and output tokens from all records', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1' }),
      makeUserRecord({ uuid: 'u1' }),
      makeAssistantRecord({
        uuid: 'a2',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-2',
          usage: {
            input_tokens: 200,
            output_tokens: 100,
            cache_creation_input_tokens: 40,
            cache_read_input_tokens: 60,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('300')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('should display message counts for assistant and user turns', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1' }),
      makeUserRecord({ uuid: 'u1' }),
      makeAssistantRecord({ uuid: 'a2', message: { ...makeAssistantRecord().message, id: 'msg-2' } }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('2A / 1U')).toBeInTheDocument()
  })

  it('should count distinct turns by message.id when multiple records share the same message id', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1', message: { ...makeAssistantRecord().message, id: 'msg-1' } }),
      makeAssistantRecord({ uuid: 'a2', message: { ...makeAssistantRecord().message, id: 'msg-1' } }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('1A / 0U')).toBeInTheDocument()
  })

  it('should show filtered totals when isFiltered is true and visibleTurns provided', () => {
    const assistant1 = makeAssistantRecord({ uuid: 'a1' })
    const assistant2 = makeAssistantRecord({
      uuid: 'a2',
      message: {
        ...makeAssistantRecord().message,
        id: 'msg-2',
        usage: {
          input_tokens: 500,
          output_tokens: 250,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: {
            ephemeral_5m_input_tokens: 0,
            ephemeral_1h_input_tokens: 0,
          },
          service_tier: 'standard',
        },
      },
    })

    const allRecords: RawRecord[] = [assistant1, assistant2]
    const visibleTurns: ConversationTurn[] = [makeTurn([assistant1])]

    render(
      <TokenSummaryPanel
        records={allRecords}
        visibleTurns={visibleTurns}
        isFiltered={true}
      />,
    )

    expect(screen.getByText('Filtered')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('should show all records when isFiltered is false', () => {
    const assistant1 = makeAssistantRecord({ uuid: 'a1' })
    const assistant2 = makeAssistantRecord({
      uuid: 'a2',
      message: {
        ...makeAssistantRecord().message,
        id: 'msg-2',
        usage: {
          input_tokens: 500,
          output_tokens: 250,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: {
            ephemeral_5m_input_tokens: 0,
            ephemeral_1h_input_tokens: 0,
          },
          service_tier: 'standard',
        },
      },
    })

    const allRecords: RawRecord[] = [assistant1, assistant2]

    render(<TokenSummaryPanel records={allRecords} isFiltered={false} />)

    expect(screen.queryByText('Filtered')).not.toBeInTheDocument()
    expect(screen.getByText('600')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('should display cache hit rate as a percentage', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({
        uuid: 'a1',
        message: {
          ...makeAssistantRecord().message,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 50,
            cache_read_input_tokens: 50,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('25.0%')).toBeInTheDocument()
  })

  it('should show model names used in the conversation', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1' }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument()
  })

  it('should display non-standard service tier when present', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({
        uuid: 'a1',
        message: {
          ...makeAssistantRecord().message,
          usage: {
            ...makeAssistantRecord().message.usage,
            service_tier: 'scale',
          },
        },
      }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.getByText('scale')).toBeInTheDocument()
  })

  it('should not display service tier when all records use standard tier', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1' }),
    ]

    render(<TokenSummaryPanel records={records} />)

    expect(screen.queryByText('Tier:')).not.toBeInTheDocument()
  })

  it('should show More button and expandable details when sub-agent records exist', () => {
    const records: RawRecord[] = [
      makeAssistantRecord({ uuid: 'a1' }),
      makeAssistantRecord({
        uuid: 'a2',
        parent_tool_use_id: 'tu-parent-1',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-sub',
          usage: {
            input_tokens: 50,
            output_tokens: 25,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      }),
    ]

    render(<TokenSummaryPanel records={records} />)

    const moreButton = screen.getByText('More')
    expect(moreButton).toBeInTheDocument()

    fireEvent.click(moreButton)

    expect(screen.getByText('Main conversation:')).toBeInTheDocument()
    expect(screen.getByText('Sub-agents:')).toBeInTheDocument()
  })

  it('should recursively include nested sub-agent records when filtered', () => {
    const topLevelAssistant = makeAssistantRecord({
      uuid: 'a-top',
      message: {
        ...makeAssistantRecord().message,
        id: 'msg-top',
        content: [{ type: 'tool_use', id: 'task-L1', name: 'Task', input: {} }],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          service_tier: 'standard',
        },
      },
    })

    const subL1Assistant = makeAssistantRecord({
      uuid: 'a-L1',
      parent_tool_use_id: 'task-L1',
      message: {
        ...makeAssistantRecord().message,
        id: 'msg-L1',
        content: [{ type: 'tool_use', id: 'task-L2', name: 'Task', input: {} }],
        usage: {
          input_tokens: 200,
          output_tokens: 100,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          service_tier: 'standard',
        },
      },
    })

    const subL2Assistant = makeAssistantRecord({
      uuid: 'a-L2',
      parent_tool_use_id: 'task-L2',
      message: {
        ...makeAssistantRecord().message,
        id: 'msg-L2',
        usage: {
          input_tokens: 300,
          output_tokens: 150,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          service_tier: 'standard',
        },
      },
    })

    const allRecords: RawRecord[] = [topLevelAssistant, subL1Assistant, subL2Assistant]

    const visibleTurns: ConversationTurn[] = [{
      messageId: 'msg-top',
      role: 'assistant',
      records: [topLevelAssistant],
      contentBlocks: topLevelAssistant.message.content,
      parentToolUseId: null,
      sessionId: 'session-1',
    }]

    const indexes: IndexMaps = {
      byUuid: new Map(allRecords.map((r) => [r.uuid, r])),
      byMessageId: new Map([
        ['msg-top', [topLevelAssistant]],
        ['msg-L1', [subL1Assistant]],
        ['msg-L2', [subL2Assistant]],
      ]),
      byToolUseId: new Map<string, ToolCallPair>(),
      byParentToolUseId: new Map([
        ['task-L1', [subL1Assistant]],
        ['task-L2', [subL2Assistant]],
      ]),
    }

    render(
      <TokenSummaryPanel
        records={allRecords}
        visibleTurns={visibleTurns}
        isFiltered={true}
        indexes={indexes}
      />,
    )

    expect(screen.getByText('Filtered')).toBeInTheDocument()
    expect(screen.getByText('600')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  describe('filtered mode', () => {
    it('should show filtered cache creation and cache read tokens from visible turns only', () => {
      const assistant1 = makeAssistantRecord({
        uuid: 'a1',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-1',
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 30,
            cache_read_input_tokens: 40,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })
      const assistant2 = makeAssistantRecord({
        uuid: 'a2',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-2',
          usage: {
            input_tokens: 200,
            output_tokens: 100,
            cache_creation_input_tokens: 60,
            cache_read_input_tokens: 80,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })

      const allRecords: RawRecord[] = [assistant1, assistant2]
      const visibleTurns: ConversationTurn[] = [makeTurn([assistant1])]

      render(
        <TokenSummaryPanel
          records={allRecords}
          visibleTurns={visibleTurns}
          isFiltered={true}
        />,
      )

      expect(screen.getByText('Filtered')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('40')).toBeInTheDocument()
    })

    it('should show filtered message counts reflecting only visible turns', () => {
      const assistant1 = makeAssistantRecord({
        uuid: 'a1',
        message: { ...makeAssistantRecord().message, id: 'msg-1' },
      })
      const assistant2 = makeAssistantRecord({
        uuid: 'a2',
        message: { ...makeAssistantRecord().message, id: 'msg-2' },
      })
      const user1 = makeUserRecord({ uuid: 'u1' })

      const allRecords: RawRecord[] = [assistant1, user1, assistant2]
      const visibleTurns: ConversationTurn[] = [makeTurn([assistant1])]

      render(
        <TokenSummaryPanel
          records={allRecords}
          visibleTurns={visibleTurns}
          isFiltered={true}
        />,
      )

      expect(screen.getByText('1A / 0U')).toBeInTheDocument()
    })

    it('should show filtered cache hit rate based on visible turns only', () => {
      const assistant1 = makeAssistantRecord({
        uuid: 'a1',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-1',
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 100,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })
      const assistant2 = makeAssistantRecord({
        uuid: 'a2',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-2',
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })

      const allRecords: RawRecord[] = [assistant1, assistant2]
      const visibleTurns: ConversationTurn[] = [makeTurn([assistant1])]

      render(
        <TokenSummaryPanel
          records={allRecords}
          visibleTurns={visibleTurns}
          isFiltered={true}
        />,
      )

      expect(screen.getByText('50.0%')).toBeInTheDocument()
    })

    it('should separate main vs sub-agent tokens in More details when filtered includes sub-agents', () => {
      const topLevel = makeAssistantRecord({
        uuid: 'a-top',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-top',
          content: [{ type: 'tool_use', id: 'task-1', name: 'Task', input: {} }],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })
      const subAgent = makeAssistantRecord({
        uuid: 'a-sub',
        parent_tool_use_id: 'task-1',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg-sub',
          usage: {
            input_tokens: 75,
            output_tokens: 25,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0,
            },
            service_tier: 'standard',
          },
        },
      })

      const allRecords: RawRecord[] = [topLevel, subAgent]
      const visibleTurns: ConversationTurn[] = [makeTurn([topLevel])]
      const indexes: IndexMaps = {
        byUuid: new Map(allRecords.map((r) => [r.uuid, r])),
        byMessageId: new Map([
          ['msg-top', [topLevel]],
          ['msg-sub', [subAgent]],
        ]),
        byToolUseId: new Map<string, ToolCallPair>(),
        byParentToolUseId: new Map([['task-1', [subAgent]]]),
      }

      render(
        <TokenSummaryPanel
          records={allRecords}
          visibleTurns={visibleTurns}
          isFiltered={true}
          indexes={indexes}
        />,
      )

      expect(screen.getByText('Filtered')).toBeInTheDocument()

      fireEvent.click(screen.getByText('More'))

      expect(screen.getByText('Main conversation:')).toBeInTheDocument()
      expect(screen.getByText('Sub-agents:')).toBeInTheDocument()
    })
  })

  describe('ephemeral cache tokens', () => {
    it('should show More button and ephemeral details when ephemeral tokens are present', () => {
      const records: RawRecord[] = [
        makeAssistantRecord({
          uuid: 'a1',
          message: {
            ...makeAssistantRecord().message,
            usage: {
              input_tokens: 100,
              output_tokens: 50,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
              cache_creation: {
                ephemeral_5m_input_tokens: 500,
                ephemeral_1h_input_tokens: 200,
              },
              service_tier: 'standard',
            },
          },
        }),
      ]

      render(<TokenSummaryPanel records={records} />)

      fireEvent.click(screen.getByText('More'))

      expect(screen.getByText('Ephemeral cache:')).toBeInTheDocument()
      expect(screen.getByText('5-min ephemeral:')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
      expect(screen.getByText('1-hour ephemeral:')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
    })

    it('should toggle More/Less button text when clicked', () => {
      const records: RawRecord[] = [
        makeAssistantRecord({
          uuid: 'a1',
          message: {
            ...makeAssistantRecord().message,
            usage: {
              ...makeAssistantRecord().message.usage,
              cache_creation: {
                ephemeral_5m_input_tokens: 100,
                ephemeral_1h_input_tokens: 0,
              },
            },
          },
        }),
      ]

      render(<TokenSummaryPanel records={records} />)

      const moreButton = screen.getByText('More')
      fireEvent.click(moreButton)
      expect(screen.getByText('Less')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Less'))
      expect(screen.getByText('More')).toBeInTheDocument()
    })
  })
})
