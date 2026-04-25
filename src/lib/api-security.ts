import crypto from 'crypto'

/**
 * Verifies the HMAC SHA-256 signature for Developer API Gateway requests.
 * Follows Section 9 of the PropTech Service Mesh Architecture.
 */
export function verifyDeveloperSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  clientSecret: string
): { valid: boolean; reason?: string } {
  // 1. Check timestamp freshness (reject requests older than 5 minutes)
  const requestTime = new Date(timestamp).getTime()
  const now = Date.now()
  
  if (isNaN(requestTime)) {
    return { valid: false, reason: 'Invalid timestamp format' }
  }

  const timeDifferenceMinutes = Math.abs(now - requestTime) / (1000 * 60)
  if (timeDifferenceMinutes > 5) {
    return { valid: false, reason: 'Request timestamp is too old (replay attack protection)' }
  }

  // 2. Validate HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(timestamp + rawBody)
    .digest('hex')

  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Signature mismatch' }
  }

  return { valid: true }
}