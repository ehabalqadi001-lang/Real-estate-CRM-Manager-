-- =====================================================================
-- Migration 014: Performance Indexes + Full-Text Search Arabic
-- الأداء والبحث النصي الكامل بالعربية
-- =====================================================================

-- ─── ١. تفعيل Extensions المطلوبة ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- Trigram للبحث الجزئي
CREATE EXTENSION IF NOT EXISTS unaccent;      -- إزالة التشكيل
CREATE EXTENSION IF NOT EXISTS btree_gin;     -- GIN indexes

-- ─── ٢. Full-Text Search للعملاء المحتملين ───────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- دالة تحديث search_vector
CREATE OR REPLACE FUNCTION public.leads_search_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.client_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.source, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.preferred_area, '')), 'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_search_trigger ON public.leads;
CREATE TRIGGER leads_search_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_search_update();

-- تحديث السجلات الحالية
UPDATE public.leads SET updated_at = now() WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_search_vector
  ON public.leads USING GIN(search_vector);

-- Trigram index للبحث الجزئي (بدون النص الكامل)
CREATE INDEX IF NOT EXISTS idx_leads_name_trgm
  ON public.leads USING GIN(client_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm
  ON public.leads USING GIN(phone gin_trgm_ops);

-- دالة البحث في العملاء
CREATE OR REPLACE FUNCTION public.search_leads(
  p_query text,
  p_company_id uuid,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, client_name text, phone text, status text,
  score integer, temperature text, source text,
  expected_value numeric, created_at timestamptz,
  rank real
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    l.id, l.client_name, l.phone, l.status,
    l.score, l.temperature, l.source,
    l.expected_value, l.created_at,
    ts_rank(l.search_vector, websearch_to_tsquery('simple', p_query)) AS rank
  FROM public.leads l
  WHERE l.company_id = p_company_id
    AND (
      p_query IS NULL OR p_query = ''
      OR l.search_vector @@ websearch_to_tsquery('simple', p_query)
      OR l.client_name ILIKE '%' || p_query || '%'
      OR l.phone LIKE '%' || p_query || '%'
    )
    AND (p_status IS NULL OR l.status = p_status)
  ORDER BY rank DESC NULLS LAST, l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ─── ٣. Full-Text Search للمخزون ─────────────────────────────────────
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.inventory_search_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.unit_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.unit_type, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.developer::text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_search_trigger ON public.inventory;
CREATE TRIGGER inventory_search_trigger
  BEFORE INSERT OR UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.inventory_search_update();

CREATE INDEX IF NOT EXISTS idx_inventory_search_vector
  ON public.inventory USING GIN(search_vector);

-- ─── ٤. Full-Text Search للمشاريع ─────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.projects_search_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.developer_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.district, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_search_trigger ON public.projects;
CREATE TRIGGER projects_search_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.projects_search_update();

CREATE INDEX IF NOT EXISTS idx_projects_search_vector
  ON public.projects USING GIN(search_vector);

-- ─── ٥. Dashboard KPI Function (شاملة) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_company_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH
  leads_stats AS (
    SELECT
      COUNT(*)                                          AS total_leads,
      COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())) AS new_this_month,
      COUNT(*) FILTER (WHERE status = 'contracted')    AS converted,
      COUNT(*) FILTER (WHERE temperature = 'hot')      AS hot_leads,
      AVG(score)                                        AS avg_score
    FROM public.leads
    WHERE company_id = p_company_id
  ),
  deals_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE stage = 'closed_won')     AS won,
      COUNT(*) FILTER (WHERE stage NOT IN ('closed_won','closed_lost')) AS open,
      COALESCE(SUM(unit_value) FILTER (WHERE stage = 'closed_won' AND
        DATE_TRUNC('month', actual_close_date) = DATE_TRUNC('month', now())), 0) AS revenue_this_month,
      COALESCE(SUM(unit_value) FILTER (WHERE stage NOT IN ('closed_won','closed_lost')), 0) AS pipeline_value
    FROM public.deals
    WHERE company_id = p_company_id
  ),
  inventory_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'available')  AS available_units,
      COUNT(*) FILTER (WHERE status = 'reserved')   AS reserved_units,
      COUNT(*) FILTER (WHERE status = 'sold')        AS sold_units,
      COUNT(*)                                        AS total_units
    FROM public.inventory
    WHERE company_id = p_company_id
  ),
  commission_stats AS (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)  AS pending_commissions,
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND
        DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())), 0) AS paid_this_month
    FROM public.commissions
    WHERE company_id = p_company_id
  )
  SELECT jsonb_build_object(
    'leads', jsonb_build_object(
      'total', l.total_leads,
      'new_this_month', l.new_this_month,
      'converted', l.converted,
      'hot', l.hot_leads,
      'avg_score', ROUND(l.avg_score, 1),
      'conversion_rate', ROUND(l.converted::numeric / NULLIF(l.total_leads, 0) * 100, 1)
    ),
    'deals', jsonb_build_object(
      'won', d.won,
      'open', d.open,
      'revenue_this_month', d.revenue_this_month,
      'pipeline_value', d.pipeline_value
    ),
    'inventory', jsonb_build_object(
      'available', i.available_units,
      'reserved', i.reserved_units,
      'sold', i.sold_units,
      'total', i.total_units,
      'sold_rate', ROUND(i.sold_units::numeric / NULLIF(i.total_units, 0) * 100, 1)
    ),
    'commissions', jsonb_build_object(
      'pending', c.pending_commissions,
      'paid_this_month', c.paid_this_month
    )
  )
  FROM leads_stats l, deals_stats d, inventory_stats i, commission_stats c;
$$;

-- ─── ٦. Indexes شاملة للأداء ─────────────────────────────────────────
-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_status_temp     ON public.leads(status, temperature);
CREATE INDEX IF NOT EXISTS idx_leads_score_desc      ON public.leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to     ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact    ON public.leads(last_contact_at DESC);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_stage_company   ON public.deals(stage, company_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at      ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_unit_id         ON public.deals(unit_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id         ON public.deals(lead_id);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inv_status_company    ON public.inventory(status, company_id);
CREATE INDEX IF NOT EXISTS idx_inv_price_range       ON public.inventory(price);
CREATE INDEX IF NOT EXISTS idx_inv_type_status       ON public.inventory(unit_type, status);
CREATE INDEX IF NOT EXISTS idx_inv_project_status    ON public.inventory(project_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_tags              ON public.inventory USING GIN(tags);

-- Projects
CREATE INDEX IF NOT EXISTS idx_proj_area_type        ON public.projects(area_type, status);
CREATE INDEX IF NOT EXISTS idx_proj_price_range      ON public.projects(min_price, max_price);

-- Commissions
CREATE INDEX IF NOT EXISTS idx_comm_status_company   ON public.commissions(status, company_id);
CREATE INDEX IF NOT EXISTS idx_comm_agent_status     ON public.commissions(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_comm_created_at       ON public.commissions(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notif_unread          ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_action          ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target          ON public.audit_logs(target_table, target_id);

-- ─── ٧. Materialized View: ملخص الأداء الشهري ──────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS public.monthly_performance AS
SELECT
  DATE_TRUNC('month', d.created_at) AS month,
  d.company_id,
  d.agent_id,
  p.full_name AS agent_name,
  COUNT(*) FILTER (WHERE d.stage = 'closed_won')  AS deals_won,
  COUNT(*) FILTER (WHERE d.stage = 'closed_lost') AS deals_lost,
  COALESCE(SUM(d.unit_value) FILTER (WHERE d.stage = 'closed_won'), 0) AS revenue,
  COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) AS commissions_earned
FROM public.deals d
LEFT JOIN public.profiles p ON p.id = d.agent_id
LEFT JOIN public.commissions c ON c.deal_id = d.id
GROUP BY DATE_TRUNC('month', d.created_at), d.company_id, d.agent_id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_perf_unique
  ON public.monthly_performance(month, company_id, agent_id);

-- Refresh نشط كل يوم (يُشغَّل عبر cron أو Supabase Edge Functions)
COMMENT ON MATERIALIZED VIEW public.monthly_performance IS
  'Refresh daily via: REFRESH MATERIALIZED VIEW CONCURRENTLY public.monthly_performance';

-- ─── ٨. pg_stat_statements للمراقبة (اختياري في Supabase Pro) ─────────
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ─── ٩. تنظيف وتحديث Sequences ───────────────────────────────────────
-- تأكد أن contract_number_seq محمي
GRANT USAGE ON SEQUENCE public.contract_number_seq TO authenticated;

-- ─── ١٠. Views مفيدة للتطبيق ─────────────────────────────────────────
CREATE OR REPLACE VIEW public.active_reservations_with_timer AS
SELECT
  r.id,
  r.unit_id,
  r.deal_id,
  r.lead_id,
  r.client_name,
  r.client_phone,
  r.reserved_at,
  r.expires_at,
  r.status,
  EXTRACT(EPOCH FROM (r.expires_at - now()))::integer AS seconds_remaining,
  CASE
    WHEN r.expires_at < now() THEN 'expired'
    WHEN r.expires_at < now() + interval '6 hours' THEN 'expiring_soon'
    ELSE 'active'
  END AS urgency,
  i.unit_name,
  i.unit_type,
  pr.name AS project_name,
  p.full_name AS reserved_by_name,
  p.company_id
FROM public.unit_reservations r
JOIN public.inventory i  ON i.id = r.unit_id
LEFT JOIN public.projects pr ON pr.id = i.project_id
JOIN public.profiles p   ON p.id = r.reserved_by
WHERE r.status = 'active';

-- View: الأقساط المتأخرة
CREATE OR REPLACE VIEW public.overdue_installments_view AS
SELECT
  ip.id,
  ip.contract_id,
  ip.installment_number,
  ip.amount,
  ip.due_date,
  ip.paid_amount,
  (ip.amount - ip.paid_amount) AS outstanding,
  (CURRENT_DATE - ip.due_date)::integer AS days_overdue,
  c.contract_number,
  c.client_name,
  c.client_phone,
  c.agent_id,
  c.company_id
FROM public.installment_plans ip
JOIN public.contracts c ON c.id = ip.contract_id
WHERE ip.status = 'pending'
  AND ip.due_date < CURRENT_DATE
ORDER BY ip.due_date ASC;
