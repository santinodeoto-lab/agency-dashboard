-- Carga de prospectos al pipeline desde Notion
-- Los 10 clientes "Activo" se omiten (ya existen en el módulo de clientes)
-- Cotizado -> proposal_sent | Perdido -> lost

INSERT INTO public.pipeline_opportunities
  (contact_name, company_name, stage, expected_monthly_value, currency, close_probability)
VALUES
  -- Cotizados (propuesta enviada)
  ('CENTRAL DE BEBIDAS',     'CENTRAL DE BEBIDAS',     'proposal_sent', 500, 'USD', 50),
  ('SOBERANA',               'SOBERANA',               'proposal_sent', 380, 'USD', 50),
  ('Lic. Mauricio González', 'Lic. Mauricio González', 'proposal_sent', 350, 'USD', 50),
  -- Perdidos
  ('THE ROSS',            'THE ROSS',            'lost', 200, 'USD', 0),
  ('ELITE SPORT',         'ELITE SPORT',         'lost', 500, 'USD', 0),
  ('AUTOMENDOZA',         'AUTOMENDOZA',         'lost', 200, 'USD', 0),
  ('JOYASBYLULA',         'JOYASBYLULA',         'lost', 200, 'USD', 0),
  ('ANTARES',             'ANTARES',             'lost', 300, 'USD', 0),
  ('INSTITUTO ENGLISH',   'INSTITUTO ENGLISH',   'lost', 120, 'USD', 0),
  ('VENDRELL RIEGOS',     'VENDRELL RIEGOS',     'lost', 320, 'USD', 0),
  ('CBE LABORATORIO',     'CBE LABORATORIO',     'lost', 120, 'USD', 0),
  ('SERGIO SIMONE',       'SERGIO SIMONE',       'lost', 180, 'USD', 0),
  ('LASADELAILAS',        'LASADELAILAS',        'lost', 200, 'USD', 0),
  ('UNIFORTEX',           'UNIFORTEX',           'lost', 350, 'USD', 0),
  ('CERAMICOS AVP',       'CERAMICOS AVP',       'lost', 220, 'USD', 0),
  ('COMPARA SOFTWARE',    'COMPARA SOFTWARE',    'lost', 500, 'USD', 0),
  ('BLUMA PRODUCCIONES',  'BLUMA PRODUCCIONES',  'lost',  70, 'USD', 0),
  ('DAMATEC',             'DAMATEC',             'lost', 250, 'USD', 0),
  ('PeakFlow',            'PeakFlow',            'lost', 250, 'USD', 0),
  ('silvanamuzzino.arte', 'silvanamuzzino.arte', 'lost', 350, 'USD', 0);
