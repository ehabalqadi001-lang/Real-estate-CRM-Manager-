'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { MarketplaceProperty, MarketplaceUser } from '@/domains/marketplace/types'
import { Bath, BedDouble, Eye, Heart, LockKeyhole, MapPin, MessageCircle, ShieldCheck, Sparkles, Square } from 'lucide-react'

export default function PropertyGrid({
  properties,
  user,
}: {
  properties: MarketplaceProperty[]
  user: MarketplaceUser | null
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => Number(b.featured) - Number(a.featured)),
    [properties]
  )

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!sortedProperties.length) {
    return (
      <div className="rounded-lg border border-dashed border-[#DDE6E4] bg-white p-10 text-center">
        <p className="text-xl font-black text-[#102033]">لا توجد عقارات مطابقة الآن</p>
        <p className="mt-2 text-sm font-semibold text-[#64748B]">جرّب تغيير الفلاتر أو أضف عقارك ليظهر بعد موافقة الفريق.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sortedProperties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          user={user}
          favorite={favorites.has(property.id)}
          onToggleFavorite={() => toggleFavorite(property.id)}
        />
      ))}
    </div>
  )
}

function PropertyCard({
  property,
  user,
  favorite,
  onToggleFavorite,
}: {
  property: MarketplaceProperty
  user: MarketplaceUser | null
  favorite: boolean
  onToggleFavorite: () => void
}) {
  const router = useRouter()

  return (
    <Card className={`rounded-lg border bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${property.featured ? 'border-[#C9964A]/70' : 'border-[#DDE6E4]'}`}>
      <div className="relative">
        <Image
          src={property.imageUrl}
          alt={property.title}
          width={900}
          height={563}
          className="aspect-[16/10] w-full object-cover"
        />
        <div className="absolute right-3 top-3 flex flex-wrap gap-2">
          {property.featured && (
            <Badge className="bg-[#C9964A] text-white">
              <Sparkles className="ms-1 size-3" />
              مميز
            </Badge>
          )}
          <Badge className="bg-white/92 text-[#17375E]">{property.listingKind === 'primary' ? 'Primary' : 'Resale'}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="حفظ العقار"
          onClick={onToggleFavorite}
          className="absolute left-3 top-3 bg-white/88 text-[#17375E] hover:bg-white"
        >
          <Heart className={`size-4 ${favorite ? 'fill-[#B54747] text-[#B54747]' : ''}`} />
        </Button>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black tabular-nums text-[#17375E]">{formatPrice(property.price)}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-7 text-[#102033]">{property.title}</h3>
          </div>
          {property.urgent && <Badge className="bg-[#B54747]/10 text-[#B54747]">سريع</Badge>}
        </div>

        <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#64748B]">{property.description}</p>

        <div className="flex items-center gap-2 text-sm font-bold text-[#4B6175]">
          <MapPin className="size-4 text-[#0F8F83]" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <div className="grid grid-cols-3 rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] text-center text-sm font-black text-[#102033]">
          <Fact icon={<BedDouble className="size-4" />} value={property.bedrooms ? `${property.bedrooms}` : '-'} label="غرف" />
          <Fact icon={<Bath className="size-4" />} value={property.bathrooms ? `${property.bathrooms}` : '-'} label="حمام" />
          <Fact icon={<Square className="size-4" />} value={`${property.areaSqm}`} label="م²" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#DDE6E4] pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-9 border border-[#DDE6E4]">
              <AvatarFallback className="bg-[#EEF6F5] text-sm font-black text-[#0F8F83]">
                {property.seller.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#102033]">{property.seller.name}</p>
              <p className="flex items-center gap-1 text-xs font-bold text-[#64748B]">
                {property.seller.verified && <ShieldCheck className="size-3 text-[#0F8F83]" />}
                {property.seller.verified ? 'موثق' : 'معلن'}
                <span>·</span>
                {property.seller.rating.toLocaleString('ar-EG')}
              </p>
            </div>
          </div>
          <p className="flex items-center gap-1 text-xs font-bold text-[#64748B]">
            <Eye className="size-3" />
            {property.viewsCount.toLocaleString('ar-EG')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-[#DDE6E4]" onClick={() => router.push(`/marketplace/${property.id}`)}>
            <Eye className="ms-1 size-4" />
            التفاصيل
          </Button>
          <Button
            className="bg-[#0F8F83] text-white hover:bg-[#0B6F66]"
            onClick={() => router.push(user ? `/marketplace/chat?ad=${property.id}` : '/login')}
          >
            {user ? <MessageCircle className="ms-1 size-4" /> : <LockKeyhole className="ms-1 size-4" />}
            {user ? 'محادثة' : 'دخول للتواصل'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Fact({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1 border-l border-[#DDE6E4] px-2 py-3 last:border-l-0">
      <span className="text-[#0F8F83]">{icon}</span>
      <span>{value}</span>
      <span className="text-xs text-[#64748B]">{label}</span>
    </div>
  )
}

function formatPrice(price: number) {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 1 })} مليون ج.م`
  }
  return `${price.toLocaleString('ar-EG')} ج.م`
}
