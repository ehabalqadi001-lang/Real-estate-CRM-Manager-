-- Schedule the inventory hold releaser Edge Function every 10 minutes.
-- Supabase recommends pg_cron + pg_net for scheduled Edge Function calls.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule('release-expired-unit-holds');
exception
  when others then
    null;
end;
$$;

select cron.schedule(
  'release-expired-unit-holds',
  '*/10 * * * *',
  $$
  select
    net.http_post(
      url := 'https://ahtsflcbwknsastlpwzs.supabase.co/functions/v1/release-expired-holds',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodHNmbGNid2tuc2FzdGxwd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzEyNTUsImV4cCI6MjA5MTM0NzI1NX0.qzRUd6G29CbnYKsjNLMVZ4shdxwQgQA9VCS1FRoD5g'
      ),
      body := jsonb_build_object('scheduled_at', now(), 'job', 'release-expired-unit-holds')
    ) as request_id;
  $$
);
