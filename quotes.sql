-- MÓDULO DE COTIZACIONES
CREATE TABLE IF NOT EXISTS public.quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  company_name        TEXT,
  objective           TEXT,                         -- objetivo general (texto libre)
  platforms           TEXT[] DEFAULT '{}',          -- ['meta','google','tiktok']
  fee_amount          NUMERIC(12,2),
  fee_currency        TEXT NOT NULL DEFAULT 'USD',
  ad_spend_suggestion NUMERIC(12,2),
  ad_spend_currency   TEXT NOT NULL DEFAULT 'USD',
  discount_note       TEXT,                         -- nota opcional de descuento
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','accepted','rejected')),
  validity_days       INTEGER NOT NULL DEFAULT 7,
  consultant          TEXT DEFAULT 'Santino De Oto',
  client_id           UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quotes" ON public.quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
