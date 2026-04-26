import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export type ActionState<T> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * A High-Order Function to wrap Next.js Server Actions.
 * Enforces schema validation (Zod) and Role-Based Access Control (RBAC).
 * 
 * @param allowedRoles Array of roles allowed to execute this action (e.g., ['super_admin', 'company_admin']) or ['*'] for all authenticated.
 * @param schema Zod schema for input validation.
 * @param handler The actual action logic to execute.
 * تم نقل هذا الملف إلى المسار المعماري الصحيح للوظائف المشتركة:
 * src/shared/actions/withServerAction.ts
 */
export function withServerAction<TInput, TOutput>(
  allowedRoles: string[],
  schema: z.ZodType<TInput>,
  handler: (data: TInput, userMeta: Record<string, any>) => Promise<TOutput>
) {
  return async (formDataOrObject: FormData | TInput): Promise<ActionState<TOutput>> => {
    try {
      // 1. Auth & Role Check
      const supabase = await createServerClient()
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session) {
        return { success: false, error: 'Unauthorized: No active session found.' }
      }

      const userMeta = { 
        role: session.user.app_metadata?.role || 'agent', 
        company_id: session.user.app_metadata?.company_id || null 
      }
      
      if (!allowedRoles.includes(userMeta.role) && !allowedRoles.includes('*')) {
        return { success: false, error: 'Unauthorized: Insufficient permissions to perform this action.' }
      }

      // 2. Input Validation
      let inputData: any = formDataOrObject
      if (formDataOrObject instanceof FormData) {
        inputData = Object.fromEntries(formDataOrObject.entries())
      }
      
      const parsed = schema.safeParse(inputData)
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
      }

      // 3. Execute Handler
      const result = await handler(parsed.data, userMeta)
      return { success: true, data: result }
    } catch (error: any) {
      console.error('[SERVER_ACTION_ERROR]', error)
      return { success: false, error: error.message || 'Internal Server Error' }
    }
  }
}
export const isMoved = true;