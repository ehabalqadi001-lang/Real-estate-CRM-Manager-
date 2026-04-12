// src/lib/rate-limit.ts

// نستخدم Map لتخزين الـ IP وعدد الطلبات ووقت بدايتها
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

export function checkRateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // جلب سجل هذا الـ IP
  const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

  // إذا مرت الفترة الزمنية (مثلاً دقيقة)، نقوم بتصفير العداد
  if (record.startTime < windowStart) {
    record.count = 0;
    record.startTime = now;
  }

  // زيادة العداد
  record.count += 1;
  rateLimitMap.set(ip, record);

  // إذا تجاوز الحد، نرفض الطلب
  if (record.count > limit) {
    return { success: false, currentCount: record.count };
  }

  return { success: true, currentCount: record.count };
}

// دالة تنظيف الذاكرة (تعمل كل فترة لتجنب امتلاء الذاكرة)
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    // حذف الـ IPs الخاملة منذ أكثر من 5 دقائق
    if (now - value.startTime > 5 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000); // تنظيف كل 5 دقائق