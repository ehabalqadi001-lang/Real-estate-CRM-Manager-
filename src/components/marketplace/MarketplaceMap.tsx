'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useI18n } from '@/hooks/use-i18n'

interface MarketplacePropertyMapItem {
  id: string
  title_ar: string
  city: string
  district: string | null
  list_price: number
  lat: number | null
  lng: number | null
  property_type: string
}

interface MarketplaceMapProps {
  properties: MarketplacePropertyMapItem[]
  height?: string
}

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function MarketplaceMap({ properties, height = '400px' }: MarketplaceMapProps) {
  const { t, numLocale } = useI18n()

  function formatEgp(value: number) {
    return new Intl.NumberFormat(numLocale, {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(value)
  }

  function labelType(type: string) {
    const labels: Record<string, string> = {
      residential: t('سكني', 'Residential'),
      commercial:  t('تجاري', 'Commercial'),
      administrative: t('إداري', 'Administrative'),
      medical:     t('طبي', 'Medical'),
      mixed:       t('متعدد الاستخدام', 'Mixed Use'),
      land:        t('أرض', 'Land'),
    }
    return labels[type] ?? type
  }

  const mappedProperties = properties.filter((p) => p.lat && p.lng)
  const center: [number, number] = mappedProperties.length
    ? [mappedProperties[0].lat as number, mappedProperties[0].lng as number]
    : [30.0444, 31.2357]

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-white shadow-sm" dir="ltr">
      <MapContainer center={center} zoom={mappedProperties.length ? 12 : 10} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappedProperties.map((property) => (
          <Marker key={property.id} position={[property.lat as number, property.lng as number]} icon={icon}>
            <Popup>
              <div className="min-w-[200px] space-y-2 text-right" dir="rtl">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  {labelType(property.property_type)}
                </p>
                <p className="font-bold line-clamp-2 text-slate-900">{property.title_ar}</p>
                <p className="text-xs font-semibold text-slate-500">{property.city}{property.district ? `، ${property.district}` : ''}</p>
                <p className="font-black text-slate-900">{formatEgp(property.list_price)}</p>
                <Link href={`/marketplace/${property.id}`} className="mt-2 block">
                  <Button size="sm" className="w-full">{t('عرض التفاصيل', 'View Details')}</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
