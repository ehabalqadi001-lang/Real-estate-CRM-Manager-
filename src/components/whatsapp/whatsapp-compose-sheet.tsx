'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCheck, Clock, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export interface WhatsAppComposeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phone: string
  clientName: string
  context: 'lead' | 'deal' | 'follow_up'
  leadId?: string | null
  agentId?: string | null
}

interface WhatsAppTemplate {
  id: string
  name: string
  displayName: string
  category: string | null
  language: string
  bodyText: string
  variables: string[]
}

interface WhatsAppMessage {
  id: string
  direction: 'inbound' | 'outbound'
  phone_number: string
  message_type: string
  content: string | null
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string | null
  sent_at: string | null
}

function renderPreview(template: WhatsAppTemplate | null, values: Record<string, string>) {
  if (!template) return ''
  return template.bodyText.replace(/\{\{(\d+)\}\}/g, (_, index: string) => {
    const variable = template.variables[Number(index) - 1]
    return values[variable] || `{{${index}}}`
  })
}

function statusIcon(status: WhatsAppMessage['status']) {
  if (status === 'read') return <CheckCheck className="size-4 text-sky-500" />
  if (status === 'delivered') return <CheckCheck className="size-4 text-[var(--fi-muted)]" />
  if (status === 'failed') return <Clock className="size-4 text-destructive" />
  return <Check className="size-4 text-[var(--fi-muted)]" />
}

export function WhatsAppComposeSheet({
  open,
  onOpenChange,
  phone,
  clientName,
  context,
  leadId,
  agentId,
}: WhatsAppComposeSheetProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({})
  const [customMessage, setCustomMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTemplate = useMemo(
    () => templates.find((template) => template.name === selectedTemplate) ?? null,
    [selectedTemplate, templates],
  )
  const preview = useMemo(() => renderPreview(activeTemplate, templateValues), [activeTemplate, templateValues])

  useEffect(() => {
    if (!open) return
    setError(null)
    void Promise.all([
      fetch('/api/whatsapp/templates').then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? 'تعذر تحميل القوالب')
        setTemplates(payload.templates ?? [])
        if (!selectedTemplate && payload.templates?.[0]?.name) setSelectedTemplate(payload.templates[0].name)
      }),
      fetch(`/api/whatsapp/conversation?phone=${encodeURIComponent(phone)}`).then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? 'تعذر تحميل المحادثة')
        setMessages(payload.messages ?? [])
      }),
    ]).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل بيانات واتساب'))
  }, [open, phone, selectedTemplate])

  useEffect(() => {
    if (!activeTemplate) return
    setTemplateValues((current) => {
      const next = { ...current }
      activeTemplate.variables.forEach((variable) => {
        if (!next[variable]) {
          next[variable] = variable === 'client_name' ? clientName : ''
        }
      })
      return next
    })
  }, [activeTemplate, clientName])

  async function sendPayload(payload: Record<string, unknown>) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, leadId, agentId, ...payload }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'فشل إرسال الرسالة')
      toast.success(scheduledAt ? 'تم حفظ الإرسال المجدول' : 'تم إرسال رسالة واتساب')
      setCustomMessage('')
      onOpenChange(false)
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'فشل إرسال الرسالة'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-2xl" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl font-black">
            <MessageCircle className="size-5 text-[var(--fi-emerald)]" />
            واتساب - {clientName}
          </SheetTitle>
          <SheetDescription dir="ltr">{phone}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Tabs defaultValue={context === 'follow_up' ? 'template' : 'custom'} dir="rtl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">قالب معتمد</TabsTrigger>
              <TabsTrigger value="custom">رسالة مخصصة</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>القالب</Label>
                <select
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 text-sm"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.name}>{template.displayName}</option>
                  ))}
                </select>
              </div>

              {activeTemplate?.variables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label>{variable}</Label>
                  <Input value={templateValues[variable] ?? ''} onChange={(event) => setTemplateValues((current) => ({ ...current, [variable]: event.target.value }))} />
                </div>
              ))}

              <MessagePreview text={preview || 'اختر قالباً لعرض المعاينة.'} />
              <Button disabled={!activeTemplate || isLoading} onClick={() => sendPayload({ templateName: selectedTemplate, templateParams: templateValues })}>
                <Send className="size-4" />
                إرسال القالب
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>نص الرسالة</Label>
                <Textarea value={customMessage} onChange={(event) => setCustomMessage(event.target.value)} placeholder="اكتب رسالتك للعميل..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>إرسال مجدول اختياري</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                <p className="text-xs text-[var(--fi-muted)]">حالياً يتم حفظ الاختيار في الواجهة فقط. يمكن ربطه لاحقاً بجدولة Supabase Cron.</p>
              </div>
              <Button disabled={!customMessage.trim() || isLoading} onClick={() => sendPayload({ message: customMessage, scheduledAt })}>
                <Send className="size-4" />
                إرسال الرسالة
              </Button>
            </TabsContent>
          </Tabs>

          <section className="space-y-3">
            <h3 className="font-black text-[var(--fi-ink)]">سجل المحادثة</h3>
            {messages.length === 0 ? (
              <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm text-[var(--fi-muted)]">
                لا توجد رسائل محفوظة لهذا العميل.
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[85%] rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3 text-sm shadow-sm">
                      <p className="whitespace-pre-wrap text-[var(--fi-ink)]">{message.content}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--fi-muted)]">
                        {message.direction === 'outbound' ? statusIcon(message.status) : null}
                        {new Date(message.sent_at ?? message.created_at ?? Date.now()).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MessagePreview({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm leading-7 text-[var(--fi-ink)]">
      {text}
    </div>
  )
}
