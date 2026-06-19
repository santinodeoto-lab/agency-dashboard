-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_biases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_sales_cycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_buyer_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_objective_types ENABLE ROW LEVEL SECURITY;

-- FUNCIÓN HELPER: obtiene el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- FUNCIÓN HELPER: obtiene el client_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- CAMPAIGN_OBJECTIVE_TYPES: todos pueden leer
CREATE POLICY "todos pueden ver objetivos" ON public.campaign_objective_types
  FOR SELECT USING (true);

-- PROFILES: cada uno ve y edita solo el suyo
CREATE POLICY "ver propio perfil" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "editar propio perfil" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- CLIENTS: admin ve todo, cliente ve solo el suyo
CREATE POLICY "admin ve todos los clientes" ON public.clients
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve solo el suyo" ON public.clients
  FOR SELECT USING (id = public.get_my_client_id());

-- PAYMENTS: solo admin
CREATE POLICY "admin maneja pagos" ON public.payments
  FOR ALL USING (public.get_my_role() = 'admin');

-- CLIENT_LOG_ENTRIES: solo admin
CREATE POLICY "admin maneja bitácora" ON public.client_log_entries
  FOR ALL USING (public.get_my_role() = 'admin');

-- CLIENT_NOTES: solo admin
CREATE POLICY "admin maneja notas" ON public.client_notes
  FOR ALL USING (public.get_my_role() = 'admin');

-- AD_PLATFORM_CONNECTIONS: solo admin
CREATE POLICY "admin maneja conexiones" ON public.ad_platform_connections
  FOR ALL USING (public.get_my_role() = 'admin');

-- CAMPAIGNS: admin ve todo, cliente ve las suyas
CREATE POLICY "admin maneja campañas" ON public.campaigns
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus campañas" ON public.campaigns
  FOR SELECT USING (client_id = public.get_my_client_id());

-- AD_SETS: admin ve todo, cliente ve los suyos
CREATE POLICY "admin maneja conjuntos" ON public.ad_sets
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus conjuntos" ON public.ad_sets
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE client_id = public.get_my_client_id()
    )
  );

-- ADS: admin ve todo, cliente ve los suyos
CREATE POLICY "admin maneja anuncios" ON public.ads
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus anuncios" ON public.ads
  FOR SELECT USING (
    ad_set_id IN (
      SELECT s.id FROM public.ad_sets s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE c.client_id = public.get_my_client_id()
    )
  );

-- METRICS_DAILY: admin ve todo, cliente ve las suyas
CREATE POLICY "admin maneja métricas" ON public.metrics_daily
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus métricas" ON public.metrics_daily
  FOR SELECT USING (client_id = public.get_my_client_id());

-- CLIENT_KPI_TARGETS: admin ve todo, cliente ve los suyos
CREATE POLICY "admin maneja kpi targets" ON public.client_kpi_targets
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus kpi targets" ON public.client_kpi_targets
  FOR SELECT USING (client_id = public.get_my_client_id());

-- BUDGET_CALCULATIONS: admin ve todo, cliente ve solo los activos
CREATE POLICY "admin maneja calculadora" ON public.budget_calculations
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve su objetivo activo" ON public.budget_calculations
  FOR SELECT USING (
    client_id = public.get_my_client_id() AND is_active_target = true
  );

-- MARKET_RESEARCH: admin ve todo, cliente ve la suya
CREATE POLICY "admin maneja investigación" ON public.market_research
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve su investigación" ON public.market_research
  FOR SELECT USING (client_id = public.get_my_client_id());

-- MR_BIASES: admin ve todo, cliente ve los suyos
CREATE POLICY "admin maneja sesgos" ON public.mr_biases
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus sesgos" ON public.mr_biases
  FOR SELECT USING (
    market_research_id IN (
      SELECT id FROM public.market_research WHERE client_id = public.get_my_client_id()
    )
  );

-- MR_SALES_CYCLE: admin ve todo, cliente ve el suyo
CREATE POLICY "admin maneja ciclo de ventas" ON public.mr_sales_cycle
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve su ciclo de ventas" ON public.mr_sales_cycle
  FOR SELECT USING (
    market_research_id IN (
      SELECT id FROM public.market_research WHERE client_id = public.get_my_client_id()
    )
  );

-- MR_BUYER_ELEMENTS: admin ve todo, cliente ve y edita los suyos (solo campos permitidos)
CREATE POLICY "admin maneja elementos" ON public.mr_buyer_elements
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve sus elementos" ON public.mr_buyer_elements
  FOR SELECT USING (
    market_research_id IN (
      SELECT id FROM public.market_research WHERE client_id = public.get_my_client_id()
    )
  );
CREATE POLICY "cliente edita elementos permitidos" ON public.mr_buyer_elements
  FOR UPDATE USING (
    client_editable = true AND
    market_research_id IN (
      SELECT id FROM public.market_research WHERE client_id = public.get_my_client_id()
    )
  );

-- TASKS: solo admin
CREATE POLICY "admin maneja tareas" ON public.tasks
  FOR ALL USING (public.get_my_role() = 'admin');

-- PIPELINE: solo admin
CREATE POLICY "admin maneja pipeline" ON public.pipeline_opportunities
  FOR ALL USING (public.get_my_role() = 'admin');

-- MONTHLY_REPORTS: admin ve todo, cliente ve solo los publicados
CREATE POLICY "admin maneja reportes" ON public.monthly_reports
  FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "cliente ve reportes publicados" ON public.monthly_reports
  FOR SELECT USING (
    client_id = public.get_my_client_id() AND published_at IS NOT NULL
  );
