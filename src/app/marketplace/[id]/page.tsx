import { notFound } from 'next/navigation'
import Image from 'next/image'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'
import { marketplaceSampleProperties } from '@/domains/marketplace/sample-data'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { MessageCircle, ShieldCheck, Map, Video } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUser: MarketplaceUser | null = user
    ? { id: user.id, email: user.email ?? null, name: user.email ?? 'مستخدم', role: null }
    : null

  let property: any = marketplaceSampleProperties.find((item) => item.id === id)
  
  // If not found in samples, try DB
  if (!property) {
    const { data: dbProperty } = await supabase
      .from('marketplace_properties')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      
    if (dbProperty) {
       property = {
         id: dbProperty.id,
         title: dbProperty.title_ar,
         description: dbProperty.metadata?.description || 'لا يوجد وصف',
         price: dbProperty.list_price || 0,
         imageUrl: dbProperty.metadata?.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
         virtualTourUrl: dbProperty.virtual_tour_url,
         videoUrl: dbProperty.video_url,
       }
    }
  }
  
  if (!property) notFound()

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]" dir="rtl">
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
              <p className="text-3xl font-black text-[#17375E]">{Number(property.price).toLocaleString('ar-EG')} ج.م</p>
              <h1 className="mt-3 text-4xl font-black">{property.title}</h1>
              <p className="mt-3 text-base font-semibold leading-8 text-[#64748B] whitespace-pre-wrap">{property.description}</p>
            </div>

            {/* VR & Video Section */}
            {(property.virtualTourUrl || property.videoUrl) && (
               <div className="border-t border-[#DDE6E4] p-5 bg-[#FBFCFA]">
                 <h2 className="mb-4 text-xl font-black flex items-center gap-2">
                   <Video className="size-5 text-[#0F8F83]" />
                   جولة افتراضية و ميديا
                 </h2>
                 <div className="grid gap-4 sm:grid-cols-2">
                   {property.virtualTourUrl && (
                     <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-200 border border-[#DDE6E4] shadow-inner relative">
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">360° VR Tour</div>
                        <iframe src={property.virtualTourUrl} className="h-full w-full border-0" allowFullScreen />
                     </div>
                   )}
                   {property.videoUrl && (
                     <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-200 border border-[#DDE6E4] shadow-inner relative">
                        <div className="absolute top-2 right-2 bg-red-600/80 text-white text-[10px] font-bold px-2 py-1 rounded">Video</div>
                        <iframe src={property.videoUrl} className="h-full w-full border-0" allowFullScreen />
                     </div>
                   )}
                 </div>
               </div>
            )}
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
            
            <div className="rounded-lg border border-[#DDE6E4] bg-[#EEF6F5] p-4 shadow-sm">
              <p className="flex items-center gap-2 font-black text-[#17375E]">
                <Map className="size-4" />
                الموقع على الخريطة
              </p>
              <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-200">
                <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                  خريطة تفاعلية (Interactive Map)
                </div>
              </div>
              <Button variant="outline" className="mt-3 w-full border-[#0F8F83] text-[#0F8F83] hover:bg-[#0F8F83] hover:text-white">
                فتح الموقع الدقيق
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
