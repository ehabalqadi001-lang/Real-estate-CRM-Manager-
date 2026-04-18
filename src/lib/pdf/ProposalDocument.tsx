import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Cairo',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIhTp2mxdt0UX8.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvaliETp2mxdt0UX8.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvaliMTp2mxdt0UX8.woff2', fontWeight: 800 },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    backgroundColor: '#FFFFFF',
    padding: 0,
    direction: 'rtl',
  },
  header: {
    backgroundColor: '#102033',
    padding: '28 36',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'column', gap: 4 },
  headerTitle: { color: '#C9964A', fontSize: 22, fontWeight: 800 },
  headerSubtitle: { color: '#94a3b8', fontSize: 10, fontWeight: 400 },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 3 },
  headerMeta: { color: '#94a3b8', fontSize: 9 },
  headerMetaValue: { color: '#FFFFFF', fontSize: 9, fontWeight: 700 },

  body: { padding: '24 36' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#102033',
    borderBottomWidth: 2,
    borderBottomColor: '#C9964A',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 12,
    marginTop: 20,
  },

  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE6E4',
    borderStyle: 'solid',
    padding: '14 18',
    marginBottom: 12,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },

  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 8, color: '#64748b', fontWeight: 400, marginBottom: 3, textTransform: 'uppercase' },
  infoValue: { fontSize: 11, color: '#102033', fontWeight: 700 },

  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEF6F5',
    borderRadius: 6,
    padding: '8 10',
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 10',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE6E4',
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: '#F8FAFC' },
  tableCell: { flex: 1, fontSize: 9, color: '#102033', fontWeight: 400 },
  tableCellHeader: { flex: 1, fontSize: 9, color: '#0F8F83', fontWeight: 700 },

  highlight: {
    backgroundColor: '#102033',
    borderRadius: 8,
    padding: '16 18',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  highlightItem: { flexDirection: 'column', alignItems: 'center', gap: 4 },
  highlightLabel: { color: '#94a3b8', fontSize: 9 },
  highlightValue: { color: '#C9964A', fontSize: 16, fontWeight: 800 },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#DDE6E4',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  footerText: { color: '#94a3b8', fontSize: 8 },

  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 9, fontWeight: 700 },

  divider: { height: 1, backgroundColor: '#DDE6E4', marginVertical: 14 },

  note: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#C9964A',
    borderLeftStyle: 'solid',
    padding: '10 14',
    borderRadius: 4,
    marginTop: 16,
  },
  noteText: { fontSize: 9, color: '#92400e', lineHeight: 1.6 },
})

export interface ProposalData {
  proposalNumber: string
  date: string
  clientName: string
  clientPhone?: string
  clientNationalId?: string
  agentName?: string

  compound: string
  developer?: string
  unitType?: string
  area?: number
  floor?: number
  unitNumber?: string
  governorate?: string
  deliveryDate?: string
  finishType?: string

  totalPrice: number
  downPayment?: number
  monthlyInstallment?: number
  installmentYears?: number
  maintenanceFees?: number
  expectedReturn?: number

  installments?: Array<{ label: string; amount: number; dueDate: string }>

  notes?: string
}

const fmt = (n?: number) =>
  n != null
    ? new Intl.NumberFormat('ar-EG').format(n) + ' ج.م'
    : '—'

const pct = (part?: number, total?: number) =>
  part && total ? ((part / total) * 100).toFixed(1) + '%' : '—'

export function ProposalDocument({ data }: { data: ProposalData }) {
  return (
    <Document
      title={`المقترح الاستثماري - ${data.clientName}`}
      author="FAST INVESTMENT"
      subject="Investment Proposal"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>FAST INVESTMENT</Text>
            <Text style={styles.headerSubtitle}>المقترح الاستثماري الرسمي</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>رقم المقترح</Text>
            <Text style={styles.headerMetaValue}>{data.proposalNumber}</Text>
            <Text style={[styles.headerMeta, { marginTop: 4 }]}>التاريخ</Text>
            <Text style={styles.headerMetaValue}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Client Info ── */}
          <Text style={styles.sectionTitle}>بيانات العميل</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>اسم العميل</Text>
                <Text style={styles.infoValue}>{data.clientName}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>رقم الهاتف</Text>
                <Text style={styles.infoValue}>{data.clientPhone ?? '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>الرقم القومي</Text>
                <Text style={styles.infoValue}>{data.clientNationalId ?? '—'}</Text>
              </View>
              {data.agentName && (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>مسؤول المبيعات</Text>
                  <Text style={styles.infoValue}>{data.agentName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Unit Info ── */}
          <Text style={styles.sectionTitle}>تفاصيل الوحدة العقارية</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>الكمباوند / المشروع</Text>
                <Text style={styles.infoValue}>{data.compound}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>المطور العقاري</Text>
                <Text style={styles.infoValue}>{data.developer ?? '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>نوع الوحدة</Text>
                <Text style={styles.infoValue}>{data.unitType ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>المساحة (م²)</Text>
                <Text style={styles.infoValue}>{data.area ? `${data.area} م²` : '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>الطابق</Text>
                <Text style={styles.infoValue}>{data.floor ?? '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>رقم الوحدة</Text>
                <Text style={styles.infoValue}>{data.unitNumber ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>المحافظة</Text>
                <Text style={styles.infoValue}>{data.governorate ?? '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>موعد التسليم</Text>
                <Text style={styles.infoValue}>{data.deliveryDate ?? '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>نوع التشطيب</Text>
                <Text style={styles.infoValue}>{data.finishType ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* ── Financial Summary ── */}
          <Text style={styles.sectionTitle}>الهيكل المالي</Text>

          <View style={styles.highlight}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightLabel}>إجمالي السعر</Text>
              <Text style={styles.highlightValue}>{fmt(data.totalPrice)}</Text>
            </View>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightLabel}>المقدم</Text>
              <Text style={styles.highlightValue}>{fmt(data.downPayment)}</Text>
            </View>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightLabel}>نسبة المقدم</Text>
              <Text style={styles.highlightValue}>{pct(data.downPayment, data.totalPrice)}</Text>
            </View>
            {data.expectedReturn && (
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>العائد المتوقع</Text>
                <Text style={styles.highlightValue}>{data.expectedReturn}%</Text>
              </View>
            )}
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>القسط الشهري</Text>
                <Text style={styles.infoValue}>{fmt(data.monthlyInstallment)}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>مدة التقسيط</Text>
                <Text style={styles.infoValue}>{data.installmentYears ? `${data.installmentYears} سنوات` : '—'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>رسوم الصيانة</Text>
                <Text style={styles.infoValue}>{fmt(data.maintenanceFees)}</Text>
              </View>
            </View>
          </View>

          {/* ── Installment Schedule ── */}
          {data.installments && data.installments.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>جدول الأقساط</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 2 }]}>البيان</Text>
                  <Text style={styles.tableCellHeader}>المبلغ</Text>
                  <Text style={styles.tableCellHeader}>تاريخ الاستحقاق</Text>
                </View>
                {data.installments.map((inst, i) => (
                  <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{inst.label}</Text>
                    <Text style={styles.tableCell}>{fmt(inst.amount)}</Text>
                    <Text style={styles.tableCell}>{inst.dueDate}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Notes ── */}
          {data.notes && (
            <View style={styles.note}>
              <Text style={styles.noteText}>{data.notes}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>FAST INVESTMENT © {new Date().getFullYear()}</Text>
          <Text style={styles.footerText}>هذا المقترح سري ومخصص للعميل المذكور فقط</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `صفحة ${pageNumber} من ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
