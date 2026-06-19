-- 1. TIPOS DE OBJETIVO DE CAMPAÑA
CREATE TABLE public.campaign_objective_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  default_kpis TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.campaign_objective_types (key, label, default_kpis) VALUES
  ('sales',    'Ventas online',           ARRAY['roas', 'cpa']),
  ('leads',    'Generación de leads',     ARRAY['cpl', 'leads']),
  ('whatsapp', 'Conversaciones WhatsApp', ARRAY['cost_per_conv', 'messages']),
  ('branding', 'Posicionamiento de marca',ARRAY['cpm', 'reach', 'frequency']);

-- 2. CLIENTES
CREATE TABLE public.clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  company_name          TEXT,
  email                 TEXT,
  phone                 TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  fee_amount            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fee_currency          TEXT NOT NULL DEFAULT 'ARS',
  payment_condition     TEXT NOT NULL DEFAULT 'advance' CHECK (payment_condition IN ('advance', 'arrears')),
  payment_due_day       INTEGER NOT NULL DEFAULT 1 CHECK (payment_due_day BETWEEN 1 AND 31),
  payment_alert_days    INTEGER NOT NULL DEFAULT 3,
  primary_objective_id  UUID REFERENCES public.campaign_objective_types(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 3. PERFILES DE USUARIO
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. PAGOS
CREATE TABLE public.payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount           NUMERIC(12, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'ARS',
  due_date         DATE NOT NULL,
  paid_date        DATE,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  month_reference  DATE NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 5. BITÁCORA Y NOTAS
CREATE TABLE public.client_log_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.client_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. CONEXIONES A PLATAFORMAS DE ADS
CREATE TABLE public.ad_platform_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),
  account_id       TEXT NOT NULL,
  account_name     TEXT,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  last_synced_at   TIMESTAMPTZ,
  connected_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, platform, account_id)
);

-- 7. CAMPAÑAS, CONJUNTOS Y ANUNCIOS
CREATE TABLE public.campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  connection_id     UUID NOT NULL REFERENCES public.ad_platform_connections(id),
  platform          TEXT NOT NULL,
  external_id       TEXT NOT NULL,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  objective_type_id UUID REFERENCES public.campaign_objective_types(id),
  daily_budget      NUMERIC(12, 2),
  lifetime_budget   NUMERIC(12, 2),
  budget_currency   TEXT DEFAULT 'ARS',
  start_date        DATE,
  end_date          DATE,
  last_synced_at    TIMESTAMPTZ,
  raw_data          JSONB,
  UNIQUE (platform, external_id)
);

CREATE TABLE public.ad_sets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  external_id    TEXT NOT NULL,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  daily_budget   NUMERIC(12, 2),
  targeting      JSONB,
  last_synced_at TIMESTAMPTZ,
  raw_data       JSONB,
  UNIQUE (campaign_id, external_id)
);

CREATE TABLE public.ads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id      UUID NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
  external_id    TEXT NOT NULL,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  creative       JSONB,
  last_synced_at TIMESTAMPTZ,
  raw_data       JSONB,
  UNIQUE (ad_set_id, external_id)
);

-- 8. MÉTRICAS DIARIAS
CREATE TABLE public.metrics_daily (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    TEXT NOT NULL CHECK (entity_type IN ('campaign', 'ad_set', 'ad')),
  entity_id      UUID NOT NULL,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  date           DATE NOT NULL,
  impressions    INTEGER,
  reach          INTEGER,
  frequency      NUMERIC(8, 4),
  clicks         INTEGER,
  spend          NUMERIC(12, 2),
  cpm            NUMERIC(10, 4),
  cpc            NUMERIC(10, 4),
  ctr            NUMERIC(8, 4),
  purchases      INTEGER,
  purchase_value NUMERIC(12, 2),
  roas           NUMERIC(10, 4),
  cpa            NUMERIC(12, 4),
  leads          INTEGER,
  cpl            NUMERIC(12, 4),
  messages       INTEGER,
  cost_per_conv  NUMERIC(12, 4),
  custom_metrics JSONB,
  UNIQUE (entity_type, entity_id, date, platform)
);

CREATE INDEX idx_metrics_client_date ON public.metrics_daily (client_id, date);
CREATE INDEX idx_metrics_entity ON public.metrics_daily (entity_type, entity_id, date);

-- 9. KPI TARGETS POR CLIENTE
CREATE TABLE public.client_kpi_targets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  kpi_type      TEXT NOT NULL,
  target_value  NUMERIC(12, 4) NOT NULL,
  currency      TEXT,
  source        TEXT DEFAULT 'manual'
);

-- 10. CALCULADORA DE PRESUPUESTO
CREATE TABLE public.budget_calculations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id       UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  label             TEXT,
  mode              TEXT NOT NULL CHECK (mode IN ('sales', 'leads')),
  currency          TEXT NOT NULL DEFAULT 'ARS',
  target_revenue    NUMERIC(14, 2) NOT NULL,
  avg_ticket        NUMERIC(12, 2) NOT NULL,
  margin_pct        NUMERIC(5, 4) NOT NULL,
  conversion_rate   NUMERIC(5, 4),
  sales_needed      NUMERIC(10, 2),
  target_cpa        NUMERIC(12, 4),
  investment_needed NUMERIC(12, 2),
  target_roas       NUMERIC(10, 4),
  target_cpl        NUMERIC(12, 4),
  leads_needed      NUMERIC(10, 2),
  is_active_target  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 11. INVESTIGACIÓN DE MERCADO
CREATE TABLE public.market_research (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.mr_biases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_research_id  UUID NOT NULL REFERENCES public.market_research(id) ON DELETE CASCADE,
  bias_key            TEXT NOT NULL CHECK (bias_key IN ('reciprocity','empathy','social_proof','authority','scarcity','micro_commitment')),
  definition          TEXT,
  application         TEXT,
  status              TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty','in_progress','complete')),
  UNIQUE (market_research_id, bias_key)
);

CREATE TABLE public.mr_sales_cycle (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_research_id  UUID NOT NULL UNIQUE REFERENCES public.market_research(id) ON DELETE CASCADE,
  presentation        TEXT,
  evaluation          TEXT,
  conversion          TEXT,
  ascension           TEXT,
  status              TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty','in_progress','complete'))
);

CREATE TABLE public.mr_buyer_elements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_research_id  UUID NOT NULL REFERENCES public.market_research(id) ON DELETE CASCADE,
  element_key         TEXT NOT NULL CHECK (element_key IN ('audience','problem','solution','differentials','testimonials','objections','guarantee')),
  data                JSONB NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty','in_progress','complete')),
  client_editable     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (market_research_id, element_key)
);

-- 12. TAREAS
CREATE TABLE public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task','learning')),
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  due_date    DATE,
  reminder_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 13. PIPELINE COMERCIAL
CREATE TABLE public.pipeline_opportunities (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name           TEXT NOT NULL,
  company_name           TEXT,
  email                  TEXT,
  phone                  TEXT,
  stage                  TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','contacted','proposal_sent','negotiating','won','lost')),
  expected_monthly_value NUMERIC(12, 2),
  currency               TEXT DEFAULT 'ARS',
  close_probability      INTEGER CHECK (close_probability BETWEEN 0 AND 100),
  expected_close_date    DATE,
  notes                  TEXT,
  lost_reason            TEXT,
  converted_client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- 14. REPORTES MENSUALES
CREATE TABLE public.monthly_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month_date       DATE NOT NULL,
  metrics_snapshot JSONB,
  admin_comment    TEXT,
  published_at     TIMESTAMPTZ,
  email_sent_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, month_date)
);
