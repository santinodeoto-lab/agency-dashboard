-- Dar permisos de acceso a los roles de Supabase en todas las tablas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.clients TO authenticated, service_role;
GRANT ALL ON public.payments TO authenticated, service_role;
GRANT ALL ON public.client_log_entries TO authenticated, service_role;
GRANT ALL ON public.client_notes TO authenticated, service_role;
GRANT ALL ON public.ad_platform_connections TO authenticated, service_role;
GRANT ALL ON public.campaigns TO authenticated, service_role;
GRANT ALL ON public.ad_sets TO authenticated, service_role;
GRANT ALL ON public.ads TO authenticated, service_role;
GRANT ALL ON public.metrics_daily TO authenticated, service_role;
GRANT ALL ON public.client_kpi_targets TO authenticated, service_role;
GRANT ALL ON public.budget_calculations TO authenticated, service_role;
GRANT ALL ON public.market_research TO authenticated, service_role;
GRANT ALL ON public.mr_biases TO authenticated, service_role;
GRANT ALL ON public.mr_sales_cycle TO authenticated, service_role;
GRANT ALL ON public.mr_buyer_elements TO authenticated, service_role;
GRANT ALL ON public.tasks TO authenticated, service_role;
GRANT ALL ON public.pipeline_opportunities TO authenticated, service_role;
GRANT ALL ON public.monthly_reports TO authenticated, service_role;
GRANT SELECT ON public.campaign_objective_types TO anon, authenticated, service_role;
