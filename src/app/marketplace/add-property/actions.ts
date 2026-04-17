'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createRawClient } from '@/lib/supabase/server'

const optionalPositiveNumber = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.number().positive().optional()
)

const optionalNonNegativeInt = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.number().int().min(0).optional()
)

const propertySubmissionSchema = z.object({
  title: z.string().trim().min(8),
  property_type: z.string().trim().min(2),
  price: z.coerce.number().positive(),
  area_sqm: optionalPositiveNumber,
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  bedrooms: optionalNonNegativeInt,
  bathrooms: optionalNonNegativeInt,
  description: z.string().trim().min(20),
})

export async function submitPropertyAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = propertySubmissionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const message = encodeURIComponent('بيانات الإعلان غير مكتملة')
    redirect(`/marketplace/add-property?error=${message}`)
  }

  const values = parsed.data
  const location = `${values.district}، ${values.city}`

  const { error } = await supabase
    .from('ads')
    .insert({
      user_id: user.id,
      title: values.title,
      description: values.description,
      property_type: values.property_type,
      price: values.price,
      currency: 'EGP',
      location,
      area_sqm: values.area_sqm ?? null,
      bedrooms: values.bedrooms ?? null,
      bathrooms: values.bathrooms ?? null,
      images: [],
      documents: [],
      is_featured: false,
      is_urgent: false,
      status: 'pending',
    })

  if (error) {
    const message = encodeURIComponent(error.message)
    redirect(`/marketplace/add-property?error=${message}`)
  }

  redirect('/marketplace/add-property?submitted=1')
}
