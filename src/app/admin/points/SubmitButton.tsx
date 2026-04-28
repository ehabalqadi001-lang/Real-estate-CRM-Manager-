'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'

export function SubmitButton({
  children,
  icon: Icon,
  ...props
}: ComponentProps<typeof Button> & { icon?: React.ElementType }) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending} {...props}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : Icon ? (
        <Icon className="size-4" />
      ) : null}
      {children}
    </Button>
  )
}
