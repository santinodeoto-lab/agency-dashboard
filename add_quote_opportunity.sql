ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.pipeline_opportunities(id) ON DELETE SET NULL;
