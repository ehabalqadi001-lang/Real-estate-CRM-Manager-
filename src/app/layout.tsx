export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en"> {/* أو ar حسب رغبتك كبداية */}
      <body>{children}</body>
    </html>
  )
}