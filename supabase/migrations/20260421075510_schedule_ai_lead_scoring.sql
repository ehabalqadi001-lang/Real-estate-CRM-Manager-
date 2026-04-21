-- Schedule nightly AI lead scoring through Supabase Edge Functions.
-- Runs daily at 00:10 UTC.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'nightly-ai-lead-scoring') then
    perform cron.unschedule('nightly-ai-lead-scoring');
  end if;
end
$$;

select cron.schedule(
  'nightly-ai-lead-scoring',
  '10 0 * * *',
  $$
  select net.http_post(
    url := 'https://ahtsflcbwknsastlpwzs.supabase.co/functions/v1/ai-lead-scoring',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"source":"pg_cron","job":"nightly-ai-lead-scoring"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
