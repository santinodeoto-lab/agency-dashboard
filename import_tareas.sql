-- Carga de tareas pendientes desde Notion (las terminadas se omiten)
-- Matchea el cliente por nombre (case-insensitive)

INSERT INTO public.tasks (client_id, title, type, priority, status, due_date)
SELECT c.id, t.title, 'task', t.priority, 'pending', t.due_date
FROM (VALUES
  ('RISPOLI VIAJES',        'Disney familia con las 15k',         'normal', DATE '2026-06-19'),
  ('INMOBILIARIA OBREGÓN',  'campaña de trafico web',             'normal', DATE '2026-06-19'),
  ('PAULA OIKOS',           'nuevas prop + subir creativos pau',  'high',   DATE '2026-06-19'),
  ('RISPOLI TEENS',         'apagar tucuman',                     'normal', DATE '2026-08-21'),
  ('RISPOLI TEENS',         'apagar la rioja',                    'normal', DATE '2026-07-03'),
  ('RISPOLI TEENS',         'apagar catamarca',                   'normal', DATE '2026-06-26'),
  ('RISPOLI TEENS',         'apagar rosario',                     'normal', DATE '2026-07-27'),
  ('RISPOLI TEENS',         'apagar cordoba',                     'normal', DATE '2026-08-17')
) AS t(client_name, title, priority, due_date)
LEFT JOIN public.clients c ON UPPER(c.name) = UPPER(t.client_name);
