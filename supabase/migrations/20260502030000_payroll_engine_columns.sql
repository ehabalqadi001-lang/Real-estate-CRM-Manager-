-- Payroll engine: add tax, social insurance, allowances, bonus, overtime, unpaid leave columns
ALTER TABLE public.payroll
  ADD COLUMN IF NOT EXISTS allowances           numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus                numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_amount      numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unpaid_leave_days    smallint      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unpaid_leave_deduct  numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount           numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS social_ins_emp       numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_days         smallint      NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS notes                text;
