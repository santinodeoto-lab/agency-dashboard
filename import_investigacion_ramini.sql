-- INVESTIGACIÓN DE MERCADO — RAMINI (ejemplo de mapeo)

-- 1. Crear/asegurar el registro de investigación
INSERT INTO public.market_research (client_id)
SELECT id FROM public.clients WHERE UPPER(name) = 'RAMINI'
ON CONFLICT (client_id) DO NOTHING;

-- Helper: mr_id de RAMINI
-- 2. Sesgos psicológicos
INSERT INTO public.mr_biases (market_research_id, bias_key, definition, application, status)
SELECT mr.id, b.bias_key, b.definition, b.application, 'complete'
FROM (SELECT mr2.id FROM public.market_research mr2
      JOIN public.clients c ON c.id = mr2.client_id
      WHERE UPPER(c.name) = 'RAMINI') mr
CROSS JOIN (VALUES
  ('reciprocity',     'Tendemos a devolver favores.',                              'Gifting Post-Venta: regalo (medias, botella o gorra) en compras mayores a cierto monto.'),
  ('empathy',         'Tendemos a ayudar a quienes nos caen bien.',                'Storytelling de fundador: contenido de marca personal.'),
  ('social_proof',    'Tendemos a hacer lo que hacen los demás.',                  'Contenido UGC y micro-influencers: cuerpos reales usando las prendas en situaciones cotidianas.'),
  ('authority',       'Tendemos a hacerle caso a las autoridades.',                'Expert Validation: colaboraciones con profesionales del fitness o referentes de moda funcional.'),
  ('scarcity',        'Tendemos a valorar más algo cuando se va a acabar.',        'Real-Time Stock: stock en tiempo real dentro de la web.'),
  ('micro_commitment','Tendemos a continuar dentro de nuestra zona de confort.',   'Ads de presentación: invitación a descubrir la marca.')
) AS b(bias_key, definition, application)
ON CONFLICT (market_research_id, bias_key)
DO UPDATE SET definition = EXCLUDED.definition, application = EXCLUDED.application, status = 'complete';

-- 3. Ciclo de ventas
INSERT INTO public.mr_sales_cycle (market_research_id, presentation, evaluation, conversion, ascension, status)
SELECT mr.id,
  'El gancho principal es la estampa exclusiva, comodidad superior y calidad premium.',
  'El usuario nos compara por los valores de marca: industria nacional, diversidad de talles y durabilidad frente a la competencia.',
  'Derribar la fricción final con una oferta irresistible: 6 cuotas sin interés, 20% de descuento por transferencia, envío gratis en compras superiores a $60k, garantía de 1 mes por cambio de talle y 3 meses por roturas, más productos relacionados para subir el ticket promedio.',
  'Retención mediante Email Marketing segmentado y descuentos exclusivos para clientes frecuentes, convirtiendo una compra única en una relación a largo plazo.',
  'complete'
FROM (SELECT mr2.id FROM public.market_research mr2
      JOIN public.clients c ON c.id = mr2.client_id
      WHERE UPPER(c.name) = 'RAMINI') mr
ON CONFLICT (market_research_id)
DO UPDATE SET presentation = EXCLUDED.presentation, evaluation = EXCLUDED.evaluation,
              conversion = EXCLUDED.conversion, ascension = EXCLUDED.ascension, status = 'complete';

-- 4. Elementos del comprador (data JSONB {content})
INSERT INTO public.mr_buyer_elements (market_research_id, element_key, data, status)
SELECT mr.id, e.element_key, jsonb_build_object('content', e.content), 'complete'
FROM (SELECT mr2.id FROM public.market_research mr2
      JOIN public.clients c ON c.id = mr2.client_id
      WHERE UPPER(c.name) = 'RAMINI') mr
CROSS JOIN (VALUES
  ('audience',     'Edad 25-40 · Mujeres · Argentina · Situación sentimental indiferente · Poder adquisitivo medio/alto.'),
  ('problem',      'Problemas: incomodidad de la ropa deportiva, poca estética, falta de adaptabilidad a todos los cuerpos, diseños repetitivos, importaciones de baja calidad y exposición al entrenar. Top 3: incomodidad, mala estética y falta de adaptabilidad. El más importante: incomodidad.'),
  ('solution',     'Catálogo de diseños únicos y comodidad extrema.'),
  ('differentials','Diseño de autor, calidad textil superior y respaldo de una marca con identidad propia. Beneficio menos mencionado: una misma prenda sirve para entrenar, salir o la oficina (moda athleisure).'),
  ('testimonials', 'Por recolectar. Plan: implementar calificaciones en Tienda Nube y seguimiento post-compra vía WhatsApp para capturar reseñas reales.'),
  ('objections',   'Miedo a que el talle no sea el correcto y la imposibilidad de probarse la prenda físicamente. La objeción más fuerte: no poder probársela.'),
  ('guarantee',    'Cambio garantizado por 30 días y garantía de 3 meses por roturas/defectos de fábrica. Superior al estándar del mercado local de indumentaria.')
) AS e(element_key, content)
ON CONFLICT (market_research_id, element_key)
DO UPDATE SET data = EXCLUDED.data, status = 'complete';
