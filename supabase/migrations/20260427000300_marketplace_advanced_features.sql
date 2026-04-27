-- ============================================================
-- Marketplace Advanced Features: GIS, VR, Saved Searches, Chat
-- ============================================================

BEGIN;

-- 1. Enable PostGIS Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

SET LOCAL search_path = public, extensions;

-- 2. Extend ads table with GIS, VR, and advanced filtering columns
ALTER TABLE public.marketplace_properties
  ADD COLUMN IF NOT EXISTS geom geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS virtual_tour_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS payment_options text[] DEFAULT '{}'::text[];

-- Update geom based on existing lat/lng if available (though they are new here)
UPDATE public.marketplace_properties
SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom IS NULL;

-- 3. Create index for spatial searches
CREATE INDEX IF NOT EXISTS idx_marketplace_properties_geom ON public.marketplace_properties USING GIST (geom);

-- 4. Customer Control Panel: Saved Properties
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES public.marketplace_properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- 5. Customer Control Panel: Saved Searches (Alerts)
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  send_email_alerts boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to update updated_at for saved_searches
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_searches_updated_at ON public.saved_searches;
CREATE TRIGGER trg_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Advanced Chat System: Conversations Threads
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.marketplace_properties(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ad_id, client_id, owner_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- Extend existing chat_messages to support conversation threads
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE;

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE public.chat_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON public.chat_messages;
CREATE TRIGGER trg_update_conversation_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- 7. RLS Policies
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Saved Properties RLS
DROP POLICY IF EXISTS "Users can manage their own saved properties" ON public.saved_properties;
CREATE POLICY "Users can manage their own saved properties" ON public.saved_properties
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved Searches RLS
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat Conversations RLS
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can start conversations" ON public.chat_conversations;
CREATE POLICY "Users can start conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = client_id);

COMMIT;
