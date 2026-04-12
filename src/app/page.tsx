import { redirect } from 'next/navigation';

export default function RootPage() {
  // توجيه الزائر فوراً للداشبورد بمجرد فتح الموقع
  redirect('/dashboard');
}