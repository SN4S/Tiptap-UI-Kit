import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerSlashCommandItem,
  registerSlashCommandGroup,
  unregisterSlashCommand,
  clearSlashCommandRegistry,
  registeredGroups,
} from '../slashCommandRegistry'

describe('slashCommandRegistry', () => {
  beforeEach(() => {
    clearSlashCommandRegistry()
  })

  it('registers a single item into a default Custom group', () => {
    registerSlashCommandItem({
      id: 'testItem',
      title: 'Test Item',
      description: 'A test slash item',
      icon: {} as any,
      keywords: ['test'],
      action: () => {},
    })

    expect(registeredGroups.value).toHaveLength(1)
    expect(registeredGroups.value[0]?.title).toBe('Custom')
    expect(registeredGroups.value[0]?.items).toHaveLength(1)
    expect(registeredGroups.value[0]?.items[0]?.id).toBe('testItem')
  })

  it('registers a group and merges with existing group titles', () => {
    registerSlashCommandGroup({
      title: 'My Integrations',
      items: [
        {
          id: 'jira',
          title: 'Jira Issue',
          description: 'Insert Jira ticket',
          icon: {} as any,
          keywords: ['jira', 'issue'],
          action: () => {},
        },
      ],
    })

    registerSlashCommandItem(
      {
        id: 'githubPr',
        title: 'GitHub PR',
        description: 'Embed PR link',
        icon: {} as any,
        keywords: ['github', 'pr'],
        action: () => {},
      },
      'My Integrations'
    )

    expect(registeredGroups.value).toHaveLength(1)
    expect(registeredGroups.value[0]?.title).toBe('My Integrations')
    expect(registeredGroups.value[0]?.items).toHaveLength(2)
  })

  it('unregisters an item by ID', () => {
    registerSlashCommandItem({
      id: 'tempItem',
      title: 'Temp Item',
      description: 'Will be deleted',
      icon: {} as any,
      keywords: ['temp'],
      action: () => {},
    })

    expect(registeredGroups.value).toHaveLength(1)
    unregisterSlashCommand('tempItem')
    expect(registeredGroups.value).toHaveLength(0)
  })
})
