'use client'

import dynamic from 'next/dynamic'

const MarketplaceMap = dynamic(() => import('./MarketplaceMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse rounded-lg bg-[var(--fi-soft)]" />
})

export default MarketplaceMap