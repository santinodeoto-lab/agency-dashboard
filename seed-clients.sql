-- Insertar los 10 clientes de Santino
-- Primero obtenemos los IDs de los objetivos
DO $$
DECLARE
  obj_whatsapp UUID;
  obj_sales UUID;
  obj_leads UUID;
  obj_branding UUID;
BEGIN
  SELECT id INTO obj_whatsapp FROM public.campaign_objective_types WHERE key = 'whatsapp';
  SELECT id INTO obj_sales FROM public.campaign_objective_types WHERE key = 'sales';
  SELECT id INTO obj_leads FROM public.campaign_objective_types WHERE key = 'leads';
  SELECT id INTO obj_branding FROM public.campaign_objective_types WHERE key = 'branding';

  INSERT INTO public.clients (name, company_name, fee_amount, fee_currency, payment_condition, payment_due_day, primary_objective_id, status) VALUES
    ('GOLDTECH',              'Goldtech',              1050, 'USD', 'arrears',  10, obj_whatsapp, 'active'),
    ('GARAGE',                'Garage',                 450, 'USD', 'advance',  10, obj_branding, 'active'),
    ('INMOBILIARIA OBREGÓN',  'Inmobiliaria Obregón',  350, 'USD', 'arrears',  10, obj_leads,    'active'),
    ('PAULA OIKOS',           'Paula Oikos',            350, 'USD', 'advance',  10, obj_leads,    'active'),
    ('EPIC WORLD',            'Epic World',             350, 'USD', 'advance',  10, obj_whatsapp, 'active'),
    ('GO TRAVEL ACADEMY',     'Go Travel Academy',      280, 'USD', 'advance',  10, obj_sales,    'active'),
    ('RISPOLI TEENS',         'Rispoli Teens',          280, 'USD', 'advance',  10, obj_leads,    'active'),
    ('RISPOLI VIAJES',        'Rispoli Viajes',         280, 'USD', 'advance',  10, obj_leads,    'active'),
    ('NOIRPRESS',             'NoirPress',              200, 'USD', 'advance',  10, obj_sales,    'active'),
    ('RAMINI',                'Ramini',                 200, 'USD', 'advance',  10, obj_sales,    'active');
END $$;
