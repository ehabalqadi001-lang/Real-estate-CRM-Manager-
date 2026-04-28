import Link from 'next/link'
import { ArrowLeft, BadgeDollarSign, Building2, ShieldCheck } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requirePermission } from '@/shared/rbac/require-permission'
import { AdminAdCreateForm } from './AdminAdCreateForm'

export const dynamic = 'force-dynamic'

export default async function AdminCreateAdPage() {
  await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const [ownersResult, projectsResult, developersResult, costsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })
      .limit(300),
    supabase.from('projects').select('id, name').order('name', { ascending: true }),
    supabase.from('developers').select('id, name').order('name', { ascending: true }),
    supabase
      .from('ad_cost_config')
      .select('regular_points_cost, premium_points_cost')
      .eq('id', true)
      .maybeSingle(),
  ])

  const owners = (ownersResult.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name?.trim() || profile.email || profile.id,
    email: profile.email || '',
    role: profile.role || 'USER',
  }))

  const regularPoints = Number(costsResult.data?.regular_points_cost ?? 10)
  const premiumPoints = Number(costsResult.data?.premium_points_cost ?? 50)

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6" dir="ltr">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#17375E] via-[#1D4E89] to-[#0F8F83] p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-bold text-white/70">Marketplace Admin</p>
              <h1 className="text-3xl font-black">Create a new ad</h1>
              <p className="max-w-3xl text-sm font-semibold leading-6 text-white/80">
                This screen creates a real marketplace ad on behalf of a selected owner using the same live upload,
                storage, points, and review flow already used by the public listing system.
              </p>
            </div>

            <Link
              href="/admin/marketplace/ads"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#17375E] transition hover:bg-[#EEF6F5]"
            >
              <ArrowLeft className="size-4" />
              Back to ads
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <BadgeDollarSign className="size-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Regular listing</p>
                <p className="text-2xl font-black text-emerald-800">{regularPoints.toLocaleString('en-US')} pts</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-amber-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Premium listing</p>
                <p className="text-2xl font-black text-amber-800">{premiumPoints.toLocaleString('en-US')} pts</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-slate-700" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Flow behavior</p>
                <p className="text-sm font-bold text-slate-800">
                  New ads are still created as <span className="text-amber-600">pending</span> and follow the existing review process.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AdminAdCreateForm
          owners={owners}
          projects={projectsResult.data ?? []}
          developers={developersResult.data ?? []}
          regularPoints={regularPoints}
          premiumPoints={premiumPoints}
        />
      </div>
    </div>
  )
}
