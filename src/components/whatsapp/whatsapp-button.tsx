'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppComposeSheet } from './whatsapp-compose-sheet'

export interface WhatsAppButtonProps {
  phone: string
  clientName: string
  context: 'lead' | 'deal' | 'follow_up'
  leadId?: string | null
  agentId?: string | null
  variant?: 'default' | 'outline' | 'ghost'
}

export function WhatsAppButton({
  phone,
  clientName,
  context,
  leadId,
  agentId,
  variant = 'default',
}: WhatsAppButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)} disabled={!phone}>
        <MessageCircle className="size-4" />
        واتساب
      </Button>
      <WhatsAppComposeSheet
        open={open}
        onOpenChange={setOpen}
        phone={phone}
        clientName={clientName}
        context={context}
        leadId={leadId}
        agentId={agentId}
      />
    </>
  )
}
