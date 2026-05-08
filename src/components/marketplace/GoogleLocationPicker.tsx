'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useI18n } from '@/hooks/use-i18n'

const GmpxApiLoader = 'gmpx-api-loader' as any
const GmpMap = 'gmp-map' as any
const GmpxPlacePicker = 'gmpx-place-picker' as any
const GmpAdvancedMarker = 'gmp-advanced-marker' as any

const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357
}

type MapLocation = { lat: number; lng: number } | null

interface GoogleLocationPickerProps {
  value?: MapLocation
  onChange: (location: { lat: number; lng: number }) => void
}

export default function GoogleLocationPicker({ value, onChange }: GoogleLocationPickerProps) {
  const { t } = useI18n()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const placePickerRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)

  const [isLoaded, setIsLoaded] = useState(false)
  const [markerPos, setMarkerPos] = useState<MapLocation>(value || null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (value) setMarkerPos(value)
  }, [value])

  useEffect(() => {
    if (!isLoaded) return;

    let clickListener: any;
    const mapEl = mapRef.current;
    const placePickerEl = placePickerRef.current;

    if (!mapEl || !placePickerEl) return;

    const handlePlaceChange = () => {
      const place = placePickerEl.value;

      if (!place || !place.location) return;

      if (place.viewport && mapEl.innerMap) {
        mapEl.innerMap.fitBounds(place.viewport);
      } else {
        mapEl.center = place.location;
        mapEl.zoom = 17;
      }

      const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
      const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;

      setMarkerPos({ lat, lng });
      onChangeRef.current({ lat, lng });
    };

    const initMap = async () => {
      await customElements.whenDefined('gmp-map');

      if (mapEl.innerMap) {
        mapEl.innerMap.setOptions({ mapTypeControl: false });
        clickListener = mapEl.innerMap.addListener('click', (e: any) => {
          if (e.latLng) {
            const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
            const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
            setMarkerPos({ lat, lng });
            onChangeRef.current({ lat, lng });
          }
        });
      }

      placePickerEl.addEventListener('gmpx-placechange', handlePlaceChange);
    };

    initMap();

    return () => {
      placePickerEl.removeEventListener('gmpx-placechange', handlePlaceChange);
      const google = (window as any).google;
      if (clickListener && google?.maps?.event) {
        google.maps.event.removeListener(clickListener);
      }
    };
  }, [isLoaded]);

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-[var(--fi-line)] shadow-sm">
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
        onReady={() => setIsLoaded(true)}
      />

      <GmpxApiLoader
        ref={(el: HTMLElement | null) => {
          if (el) el.setAttribute('key', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
        }}
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
      />

      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--fi-soft)]">
          <span className="animate-pulse text-sm font-bold text-[var(--fi-muted)]">
            {t('جاري تحميل الخريطة...', 'Loading map...')}
          </span>
        </div>
      )}

      <GmpMap
        ref={mapRef}
        center={`${markerPos?.lat || defaultCenter.lat},${markerPos?.lng || defaultCenter.lng}`}
        zoom={markerPos ? "15" : "12"}
        map-id="DEMO_MAP_ID"
        className="h-full w-full"
      >
        <div slot="control-block-start-inline-start" className="p-3 w-[300px] max-w-[90vw]">
          <GmpxPlacePicker
            ref={placePickerRef}
            placeholder={t('ابحث عن الموقع (مثال: التجمع الخامس)...', 'Search for location (e.g. New Cairo)...')}
          />
        </div>

        {markerPos && (
          <GmpAdvancedMarker
            ref={markerRef}
            position={`${markerPos.lat},${markerPos.lng}`}
          />
        )}
      </GmpMap>
    </div>
  )
}
