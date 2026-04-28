'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Search, ArrowUpDown, Sparkles, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PointTransaction {
  id: string
  agent_id: string
  source_table: string
  transaction_type: string
  points_value: number
  description: string | null
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
}

interface GamificationDashboardProps {
  users: UserProfile[]
}

export function GamificationDashboard({ users }: GamificationDashboardProps) {
  const [ledgerData, setLedgerData] = useState<PointTransaction[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [latestPointEvent, setLatestPointEvent] = useState<PointTransaction | null>(null)
  
  const supabase = createBrowserClient()
  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.full_name || u.email || 'Unknown Agent'])), [users])

  // 1. Fetch Initial Data & Listen to Realtime
  useEffect(() => {
    const fetchPoints = async () => {
      const { data } = await supabase
        .from('points_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (data) setLedgerData(data)
    }
    fetchPoints()

    const channel = supabase
      .channel('points-ledger-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'points_ledger' },
        (payload: any) => {
          const newRecord = payload.new as PointTransaction
          setLedgerData((prev) => [newRecord, ...prev])
          
          // Gamification pop-up trigger
          if (newRecord.transaction_type === 'earned') {
            setLatestPointEvent(newRecord)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Clear gamification pop-up safely to prevent race conditions
  useEffect(() => {
    if (latestPointEvent) {
      const timer = setTimeout(() => setLatestPointEvent(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [latestPointEvent])

  // 2. Prepare Leaderboard Data for Recharts
  const leaderboardData = useMemo(() => {
    const aggregated: Record<string, number> = {}
    ledgerData.forEach((tx) => {
      if (tx.transaction_type === 'earned' || tx.transaction_type === 'adjusted') {
        aggregated[tx.agent_id] = (aggregated[tx.agent_id] || 0) + tx.points_value
      }
    })

    return Object.entries(aggregated)
      .map(([agentId, points]) => ({
        name: usersMap.get(agentId) ?? 'Unknown',
        points,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10) // Top 10 agents
  }, [ledgerData, usersMap])

  // 3. Setup TanStack Table Columns
  const columns = useMemo<ColumnDef<PointTransaction>[]>(() => [
    {
      accessorKey: 'agent_id',
      header: 'Agent',
      cell: (info) => <span className="font-bold">{usersMap.get(info.getValue() as string)}</span>,
    },
    {
      accessorKey: 'transaction_type',
      header: 'Type',
      cell: (info) => {
        const val = info.getValue() as string
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            val === 'earned' ? 'bg-[#EEF6F5] text-[#27AE60]' : 
            val === 'redeemed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {val}
          </span>
        )
      }
    },
    {
      accessorKey: 'points_value',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-black">
          Points <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (info) => <span className="font-black text-lg">{info.getValue() as number > 0 ? '+' : ''}{info.getValue() as number}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Action',
      cell: (info) => <span className="text-[#64748B] font-semibold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: (info) => <span className="text-xs font-semibold text-[#64748B]">{new Date(info.getValue() as string).toLocaleString('en-EG')}</span>,
    },
  ], [usersMap])

  const table = useReactTable({
    data: ledgerData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-6 relative mt-10">
      
      {/* Gamification Floating Notification (Framer Motion) */}
      <AnimatePresence>
        {latestPointEvent && (
          <motion.div
            key={latestPointEvent.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-50 bg-[#0B1120] border border-[#27AE60] text-white p-4 rounded-xl shadow-2xl flex items-center gap-4"
          >
            <div className="bg-[#27AE60] p-2 rounded-full">
              <Sparkles className="size-6 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#64748B]">
                {usersMap.get(latestPointEvent.agent_id)} scored!
              </p>
              <p className="text-xl font-black text-[#27AE60]">
                +{latestPointEvent.points_value} Points
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Chart Section */}
      <section className="rounded-lg border border-[#DDE6E4] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-[#C9964A]" />
            <div>
              <h2 className="text-xl font-black text-[#0B1120]">Sales Team Leaderboard</h2>
              <p className="text-sm font-semibold text-[#64748B]">Realtime point accumulation supporting the 110M EGP Target.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#F6FAF7] px-4 py-2 rounded-full border border-[#DDE6E4]">
             <Target className="size-4 text-[#27AE60]" />
             <span className="text-sm font-black text-[#0B1120]">Company Target: 110M EGP</span>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaderboardData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontWeight: 700, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontWeight: 700, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#F1F5F9' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
              />
              <Bar dataKey="points" fill="#27AE60" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Ledger History Data Table */}
      <section className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <div className="border-b border-[#DDE6E4] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-black flex items-center gap-2 text-[#0B1120]">
            <Star className="size-5 text-[#27AE60]" />
            Points Ledger History
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
            <Input 
              placeholder="Search agent, action..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-[#F6FAF7] border-[#DDE6E4]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#F6FAF7] border-b border-[#DDE6E4]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#DDE6E4]">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="transition hover:bg-[#F6FAF7]">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-sm font-semibold text-[#64748B]">
                    No points history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}