import { NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

function toCsvRow(values: (string | number | null | undefined)[]) {
  return values
    .map((v) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    })
    .join(',')
}

export async function GET(request: Request) {
  await requirePermission('inventory.read')

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'units'

  const supabase = await createRawClient()

  if (type === 'developers') {
    const { data } = await supabase
      .from('developers')
      .select('name, phone, address, description')
      .order('name')

    const rows = data ?? []
    const headers = ['name', 'phone', 'address', 'description']
    const csv = [
      toCsvRow(headers),
      ...rows.map((r) => toCsvRow([r.name, r.phone, r.address, r.description])),
    ].join('\n')

    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="developers.csv"',
      },
    })
  }

  if (type === 'projects') {
    const { data } = await supabase
      .from('projects')
      .select('name, location, total_units, status, description')
      .order('name')

    const rows = data ?? []
    const headers = ['name', 'location', 'total_units', 'status', 'description']
    const csv = [
      toCsvRow(headers),
      ...rows.map((r) => toCsvRow([r.name, r.location, r.total_units, r.status, r.description])),
    ].join('\n')

    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="projects.csv"',
      },
    })
  }

  // Default: units
  const { data } = await supabase
    .from('units')
    .select('unit_number, floor, area_sqm, price, status, bedrooms, bathrooms')
    .order('unit_number')

  const rows = data ?? []
  const headers = ['unit_number', 'floor', 'area_sqm', 'price', 'status', 'bedrooms', 'bathrooms']
  const csv = [
    toCsvRow(headers),
    ...rows.map((r) => toCsvRow([r.unit_number, r.floor, r.area_sqm, r.price, r.status, r.bedrooms, r.bathrooms])),
  ].join('\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inventory.csv"',
    },
  })
}
