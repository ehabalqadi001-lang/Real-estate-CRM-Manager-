import { notFound } from 'next/navigation'
import Image from 'next/image'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'
import { marketplaceSampleProperties } from '@/domains/marketplace/sample-data'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { MessageCircle, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MarketplaceDetailPage({ params }: PageProps<'/marketplace/[id]'>) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUser: MarketplaceUser | null = user
    ? { id: user.id, email: user.email ?? null, name: user.email ?? 'مستخدم', role: null }
    : null

  const property = marketplaceSampleProperties.find((item) => item.id === id) ?? marketplaceSampleProperties[0]
  if (!property) notFound()

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
            <Image
              src={property.imageUrl}
              alt={property.title}
              width={1100}
              height={550}
              priority
              className="aspect-[16/8] w-full object-cover"
            />
            <div className="p-5">
              <p className="text-3xl font-black text-[#17375E]">{property.price.toLocaleString('ar-EG')} ج.م</p>
              <h1 className="mt-3 text-4xl font-black">{property.title}</h1>
              <p className="mt-3 text-base font-semibold leading-8 text-[#64748B]">{property.description}</p>
            </div>
          </section>
          <aside className="space-y-4">
            <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 font-black">
                <ShieldCheck className="size-4 text-[#0F8F83]" />
                تواصل آمن
              </p>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#64748B]">
                رقم الهاتف مخفي. ابدأ محادثة داخلية لحماية بيانات الطرفين وتوثيق الطلب.
              </p>
              <Button className="mt-4 w-full bg-[#0F8F83] text-white hover:bg-[#0B6F66]">
                <MessageCircle className="ms-1 size-4" />
                بدء محادثة
              </Button>
            </div>
          </aside>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black">عقارات مشابهة</h2>
          <PropertyGrid properties={marketplaceSampleProperties.filter((item) => item.id !== property.id)} user={currentUser} />
        </section>
      </main>
    </div>
  )
}
