-- Migration: Initialize Core PropTech Mesh Tables
-- Uses DO $$ blocks so PostgreSQL-aware tooling parses this correctly.

-- 1. API Gateway Registry for Developers
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.developer_api_clients (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id    uuid        NOT NULL,
    company_id      uuid,
    name            text        NOT NULL,
    client_key      text        NOT NULL UNIQUE,
    secret_ref      text        NOT NULL,
    allowed_ips     inet[],
    scopes          text[]      NOT NULL DEFAULT ARRAY['inventory:write'],
    active          boolean     NOT NULL DEFAULT true,
    last_used_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.developer_api_clients ENABLE ROW LEVEL SECURITY;

-- 2. Ingestion Engine Batches
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.inventory_ingestion_batches (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id    uuid,
    company_id      uuid,
    source_type     text        NOT NULL CHECK (source_type IN ('api','excel','csv','manual')),
    source_name     text,
    status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','completed','failed','partially_completed')),
    total_rows      integer     NOT NULL DEFAULT 0,
    processed_rows  integer     NOT NULL DEFAULT 0,
    failed_rows     integer     NOT NULL DEFAULT 0,
    mapping_payload jsonb       NOT NULL DEFAULT '{}'::jsonb,
    error_summary   text,
    created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.inventory_ingestion_batches ENABLE ROW LEVEL SECURITY;

-- 3. Ingestion Engine Rows
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.inventory_ingestion_rows (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        uuid        NOT NULL REFERENCES public.inventory_ingestion_batches(id) ON DELETE CASCADE,
    row_number      integer     NOT NULL,
    raw_payload     jsonb       NOT NULL,
    mapped_payload  jsonb       NOT NULL DEFAULT '{}'::jsonb,
    target_table    text,
    target_id       uuid,
    status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processed','failed','ignored')),
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.inventory_ingestion_rows ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (idempotent)
DO $$ BEGIN
  CREATE POLICY "api_clients_admin_only"
    ON public.developer_api_clients
    FOR ALL TO authenticated
    USING (
      (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin','platform_admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ingestion_batches_company_scope"
    ON public.inventory_ingestion_batches
    FOR ALL TO authenticated
    USING (
      (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin','platform_admin')
      OR company_id = (SELECT auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ingestion_rows_batch_scope"
    ON public.inventory_ingestion_rows
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.inventory_ingestion_batches b
        WHERE b.id = inventory_ingestion_rows.batch_id
          AND (
            (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin','platform_admin')
            OR b.company_id = (SELECT auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
          )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
