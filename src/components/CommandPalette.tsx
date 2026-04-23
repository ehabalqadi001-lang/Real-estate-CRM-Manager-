'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Building2,
  Calendar,
  Home,
  MessageCircle,
  Plus,
  Search,
  Send,
  Target,
  Users,
} from 'lucide-react'

type CommandGroup = 'Open Pages' | 'Quick Actions' | 'Search'

type AppCommand = {
  id: string
  label: string
  description: string
  href: string
  group: CommandGroup
  icon: ComponentType<{ className?: string }>
  keywords: string[]
}

const COMMANDS: AppCommand[] = [
  {
    id: 'open-dashboard',
    label: 'Open Dashboard',
    description: 'KPIs, alerts, and activity feed',
    href: '/dashboard',
    group: 'Open Pages',
    icon: BarChart3,
    keywords: ['dashboard', 'kpi', 'home'],
  },
  {
    id: 'open-pipeline',
    label: 'Open Sales Pipeline',
    description: 'Deal stages and Kanban flow',
    href: '/dashboard/pipeline',
    group: 'Open Pages',
    icon: Target,
    keywords: ['pipeline', 'deals', 'sales'],
  },
  {
    id: 'open-clients',
    label: 'Open Clients',
    description: 'Clients, leads, and follow-ups',
    href: '/dashboard/clients',
    group: 'Open Pages',
    icon: Users,
    keywords: ['clients', 'leads', 'buyers'],
  },
  {
    id: 'open-inventory',
    label: 'Open Inventory',
    description: 'Units, projects, and developers',
    href: '/dashboard/inventory',
    group: 'Open Pages',
    icon: Building2,
    keywords: ['inventory', 'units', 'properties'],
  },
  {
    id: 'open-tasks',
    label: 'Open Activities',
    description: 'Today agenda and follow-up queue',
    href: '/dashboard/activities',
    group: 'Open Pages',
    icon: Calendar,
    keywords: ['tasks', 'activities', 'agenda'],
  },
  {
    id: 'add-client',
    label: 'Add Lead',
    description: 'Create a new lead record',
    href: '/dashboard/leads/new',
    group: 'Quick Actions',
    icon: Plus,
    keywords: ['new client', 'lead', 'add lead'],
  },
  {
    id: 'search-unit',
    label: 'Search Units',
    description: 'Open inventory unit search',
    href: '/dashboard/inventory/units',
    group: 'Search',
    icon: Search,
    keywords: ['search unit', 'property search', 'unit finder'],
  },
  {
    id: 'send-message',
    label: 'Send Message',
    description: 'Open WhatsApp messaging center',
    href: '/dashboard/whatsapp',
    group: 'Quick Actions',
    icon: Send,
    keywords: ['whatsapp', 'message', 'send'],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Center',
    description: 'Conversations, templates, and communication logs',
    href: '/dashboard/whatsapp',
    group: 'Open Pages',
    icon: MessageCircle,
    keywords: ['whatsapp', 'conversation', 'templates'],
  },
]

const GROUPS: CommandGroup[] = ['Open Pages', 'Quick Actions', 'Search']

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    function onCustomOpen() {
      setOpen(true)
    }

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('fi:open-command-palette', onCustomOpen)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('fi:open-command-palette', onCustomOpen)
    }
  }, [])

  const groupedCommands = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: COMMANDS.filter((command) => command.group === group),
    })).filter((group) => group.items.length > 0)
  }, [])

  function run(command: AppCommand) {
    setOpen(false)
    setQuery('')
    router.push(command.href)
  }

  return (
    <AnimatePresence>
      {open ? (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label="Command Palette"
          dir="ltr"
          shouldFilter
          value={query}
          onValueChange={setQuery}
          className="fixed inset-0 z-[100]"
        >
          <motion.div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-x-3 top-[10vh] mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="ds-command-panel overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
                <Search className="size-5 text-[var(--color-brand-emerald)]" aria-hidden="true" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or page name..."
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-black text-[var(--color-text-muted)]">
                  Ctrl K
                </kbd>
              </div>

              <Command.List className="max-h-[420px] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">
                  No matching commands found.
                </Command.Empty>

                {groupedCommands.map(({ group, items }) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="px-2 py-1 text-xs font-black text-[var(--color-text-muted)]"
                  >
                    {items.map((command) => {
                      const Icon = command.icon
                      return (
                        <Command.Item
                          key={command.id}
                          value={`${command.label} ${command.description} ${command.keywords.join(' ')}`}
                          onSelect={() => run(command)}
                          className="group mt-1 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left outline-none data-[selected=true]:bg-[var(--color-surface-muted)]"
                        >
                          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-brand-emerald)] group-data-[selected=true]:bg-[var(--color-brand-emerald)] group-data-[selected=true]:text-white">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black text-[var(--color-text)]">{command.label}</span>
                            <span className="mt-0.5 block truncate text-xs font-semibold text-[var(--color-text-muted)]">{command.description}</span>
                          </span>
                        </Command.Item>
                      )
                    })}
                  </Command.Group>
                ))}

                <div className="mt-2 border-t border-[var(--color-border)] px-4 py-3 text-xs font-bold text-[var(--color-text-muted)]">
                  <Home className="mr-1 inline size-3" aria-hidden="true" />
                  Use arrow keys to navigate and press Enter to run.
                </div>
              </Command.List>
            </motion.div>
          </div>
        </Command.Dialog>
      ) : null}
    </AnimatePresence>
  )
}
