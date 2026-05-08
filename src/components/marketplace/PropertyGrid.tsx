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
import { useI18n } from '@/hooks/use-i18n'

export default function PropertyGrid({
  properties,
  user,
}: {
  properties: MarketplaceProperty[]
  user: MarketplaceUser | null
}) {
  const { t } = useI18n()
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
      <div className="rounded-3xl border border-dashed border-market-line bg-white p-10 text-center">
        <p className="text-xl font-black text-market-ink">{t('لا توجد عقارات مطابقة الآن', 'No matching properties found')}</p>
        <p className="mt-2 text-sm font-semibold text-market-slate">
          {t('جرب تغيير الفلاتر أو أضف عقارك ليظهر بعد موافقة الفريق.', 'Try changing filters or add your property to appear after team approval.')}
        </p>
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
  const { t, numLocale } = useI18n()
  const router = useRouter()

  function formatPrice(price: number) {
    const currency = t('ج.م', 'EGP')
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toLocaleString(numLocale, { maximumFractionDigits: 1 })} ${t('مليون', 'M')} ${currency}`
    }
    return `${price.toLocaleString(numLocale)} ${currency}`
  }

  return (
    <Card className={`overflow-hidden rounded-3xl border bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${property.featured ? 'border-market-gold/70' : 'border-market-line'}`}>
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
            <Badge className="bg-market-gold text-white">
              <Sparkles className="ms-1 size-3" />
              {t('مميز', 'Featured')}
            </Badge>
          )}
          <Badge className="bg-white/92 text-market-navy">{property.listingKind === 'primary' ? 'Primary' : 'Resale'}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('حفظ العقار', 'Save property')}
          onClick={onToggleFavorite}
          className="absolute left-3 top-3 rounded-2xl bg-white/88 text-market-navy hover:bg-white"
        >
          <Heart className={`size-4 ${favorite ? 'fill-market-rose text-market-rose' : ''}`} />
        </Button>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black tabular-nums text-market-navy">{formatPrice(property.price)}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-7 text-market-ink">{property.title}</h3>
          </div>
          {property.urgent && <Badge className="bg-market-rose/10 text-market-rose">{t('سريع', 'Urgent')}</Badge>}
        </div>

        <p className="line-clamp-2 text-sm font-semibold leading-6 text-market-slate">{property.description}</p>

        <div className="flex items-center gap-2 text-sm font-bold text-[#4B6175]">
          <MapPin className="size-4 text-market-teal" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <div className="grid grid-cols-3 rounded-2xl border border-market-line bg-market-paper text-center text-sm font-black text-market-ink">
          <Fact icon={<BedDouble className="size-4" />} value={property.bedrooms ? `${property.bedrooms}` : '-'} label={t('غرف', 'Beds')} />
          <Fact icon={<Bath className="size-4" />} value={property.bathrooms ? `${property.bathrooms}` : '-'} label={t('حمام', 'Bath')} />
          <Fact icon={<Square className="size-4" />} value={`${property.areaSqm}`} label="m²" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-market-line pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-9 border border-market-line">
              <AvatarFallback className="bg-market-mist text-sm font-black text-market-teal">
                {property.seller.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-market-ink">{property.seller.name}</p>
              <p className="flex items-center gap-1 text-xs font-bold text-market-slate">
                {property.seller.verified && <ShieldCheck className="size-3 text-market-teal" />}
                {property.seller.verified ? t('موثق', 'Verified') : t('معلن', 'Advertiser')}
                <span>·</span>
                {property.seller.rating.toLocaleString(numLocale)}
              </p>
            </div>
          </div>
          <p className="flex items-center gap-1 text-xs font-bold text-market-slate">
            <Eye className="size-3" />
            {property.viewsCount.toLocaleString(numLocale)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-2xl border-market-line" onClick={() => router.push(`/marketplace/${property.id}`)}>
            <Eye className="ms-1 size-4" />
            {t('التفاصيل', 'Details')}
          </Button>
          <Button
            className="rounded-2xl bg-market-teal text-white hover:bg-[#0B6F66]"
            onClick={() => router.push(user ? `/marketplace/chat?ad=${property.id}` : '/login')}
          >
            {user ? <MessageCircle className="ms-1 size-4" /> : <LockKeyhole className="ms-1 size-4" />}
            {user ? t('محادثة', 'Chat') : t('دخول للتواصل', 'Login to Contact')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Fact({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1 border-l border-market-line px-2 py-3 last:border-l-0">
      <span className="text-market-teal">{icon}</span>
      <span>{value}</span>
      <span className="text-xs text-market-slate">{label}</span>
    </div>
  )
}
