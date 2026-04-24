'use client'

import { MapContainer, ImageOverlay, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MasterplanNode = {
  id: string
  label: string
  node_type: 'zone' | 'building' | 'floor' | 'unit'
  polygon: [number, number][] // إحداثيات المضلع بنسق [y, x]
  status: 'active' | 'hidden' | 'archived'
  metadata?: { available_units?: number; price_range?: string; default_color?: string }
}

interface MasterplanMapProps {
  imageUrl: string
  width?: number
  height?: number
  nodes: MasterplanNode[]
  onNodeClick?: (node: MasterplanNode) => void
}

export default function MasterplanMap({
  imageUrl,
  width = 1000,
  height = 1000,
  nodes,
  onNodeClick
}: MasterplanMapProps) {
  // نظام CRS.Simple يعتمد على الإحداثيات الديكارتية المباشرة (y, x)
  const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]]

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxZoom={3}
      minZoom={-1}
      scrollWheelZoom={true}
      className="h-full w-full bg-slate-50 z-0 outline-none"
    >
      <ImageOverlay url={imageUrl} bounds={bounds} />

      {nodes.filter((n) => n.status === 'active' && n.polygon?.length > 0).map((node) => (
        <Polygon
          key={node.id}
          positions={node.polygon}
          pathOptions={{
            color: node.metadata?.default_color || '#10b981', // لون افتراضي أخضر
            fillColor: node.metadata?.default_color || '#10b981',
            fillOpacity: 0.3,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onNodeClick?.(node)
          }}
        >
          <Tooltip sticky className="font-bold text-sm border-0 shadow-lg rounded-xl" direction="top">
            <div className="text-right" dir="rtl">
              <p className="text-slate-900 font-black">{node.label}</p>
              {node.metadata?.available_units !== undefined && (
                <p className="text-xs text-slate-500 mt-1 font-bold">المتاح: {node.metadata.available_units} وحدة</p>
              )}
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </MapContainer>
  )
}