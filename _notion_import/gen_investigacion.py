# -*- coding: utf-8 -*-
# Genera SQL de investigación de mercado para 5 clientes, con escaping correcto.

DATA = {
  "NOIRPRESS": {
    "biases": {
      "reciprocity": ("Tendemos a devolver favores.", "Recetas, contenido educativo y tutoriales del funcionamiento de la cafetera."),
      "empathy": ("Tendemos a ayudar a quienes nos caen bien.", "Hacer parte a la audiencia; marca personal."),
      "social_proof": ("Tendemos a hacer lo que hacen los demás.", "Testimonios, +300 unidades vendidas, UGC e influencers."),
      "authority": ("Tendemos a hacerle caso a las autoridades.", "UGC e influencers, MercadoLíder, +300 unidades vendidas y experiencia personal."),
      "scarcity": ("Tendemos a valorar más algo cuando se va a acabar.", "Stock en tiempo real, descuentos por inmediatez, últimas unidades."),
      "micro_commitment": ("Tendemos a continuar dentro de nuestra zona de confort.", "Tráfico al perfil e interacción orgánica."),
    },
    "cycle": {
      "presentation": "Producto portátil 3 en 1 que rompe la barrera de lugar y tiempo para disfrutar tu café: independencia, libertad y ahorro frente al café al paso y a la cafetera tradicional. Tono inspiracional y de curiosidad.",
      "evaluation": "El cliente nos descubre por publicidad sin conocer el producto. Compara por los beneficios mencionados, los medios de pago y la promoción.",
      "conversion": "Se cierra después de conocer la marca, el producto y su funcionalidad.",
      "ascension": "Soporte de la cafetera, vasos y cápsulas.",
    },
    "buyer": {
      "audience": "Edad 30 a +65 · Mujeres · Toda Argentina · Casados · Poder adquisitivo medio/alto.",
      "problem": "Calidad del café al paso, pérdida de plata en café al paso, dependencia de la cafetera tradicional, falta de tiempo, portabilidad. Top 3: calidad fuera de casa, libertad y adaptabilidad a la rutina. El más importante: calidad cuando no estás en casa.",
      "solution": "Cápsulas de mejor calidad, 20 bares de presión, fácil portabilidad e independencia de electricidad y agua caliente.",
      "differentials": "Precio más competitivo, marca humanizada, garantía y envío gratis. Beneficio menos mencionado: el beneficio económico.",
      "testimonials": "Reviews de Mercado Libre y mensajes de WhatsApp de clientes. Plan: enviar formulario por WhatsApp y pedir videos/testimonios orgánicos a clientes pasados.",
      "objections": "Poco café extraído, desconocimiento del producto, falta de prueba social y desconfianza en la marca. La más fuerte: cantidad de café extraído.",
      "guarantee": "Confianza de Mercado Pago, garantía de 6 meses, marca humanizada y contacto uno a uno. Superior por la garantía de 6 meses y el trato cercano.",
    },
  },

  "INMOBILIARIA OBREGÓN": {
    "biases": {
      "reciprocity": ("Tendemos a devolver favores.", "\"Antes de poner tu propiedad en venta, mirá esto: los 3 errores que hacen que una casa no se venda en Mendoza.\""),
      "empathy": ("Tendemos a ayudar a quienes nos caen bien.", "\"Vender tu casa no es solo una operación, es una decisión emocional; te acompañamos en cada paso.\" Frase de marca: \"Te acercamos al lugar donde nacen las historias y viven los recuerdos: tu hogar.\""),
      "social_proof": ("Tendemos a hacer lo que hacen los demás.", "\"Más de 120 familias ya confiaron en nosotros para vender en Mendoza.\" / \"Propiedad vendida en 32 días.\""),
      "authority": ("Tendemos a hacerle caso a las autoridades.", "\"Operamos bajo normativa vigente y asesoramiento legal especializado.\" / \"Más de 10 años en el mercado inmobiliario mendocino.\""),
      "scarcity": ("Tendemos a valorar más algo cuando se va a acabar.", "\"Última unidad disponible.\" / \"Propiedad única en la zona.\" / \"Solo 3 lotes disponibles.\""),
      "micro_commitment": ("Tendemos a continuar dentro de nuestra zona de confort.", "\"Consultanos el precio.\" / \"Escribinos INFO y te enviamos detalles.\" / \"Agendá una visita.\" / \"Solicitá la tasación.\""),
    },
    "cycle": {
      "presentation": "No es la propiedad en sí, sino lo intangible: \"Te ayudamos a vender mejor, más rápido y con respaldo profesional / te acompañamos a encontrar tu propiedad ideal sin riesgos ni sorpresas.\" Propiedades verificadas legalmente, asesoramiento en negociación, acompañamiento hasta escrituración, opciones según presupuesto real y gestión completa de publicación + pauta.",
      "evaluation": "Nos descubren por redes, Google, boca en boca, cartelería y portales.",
      "conversion": "Al firmar la exclusividad y los acuerdos comerciales; luego al señar una propiedad, firmar la reserva y el boleto.",
      "ascension": "Vendedor: administración de alquileres, inversión inmobiliaria, búsqueda de nueva propiedad, asesoramiento fiscal y tasaciones futuras. Comprador: administración para renta, reventa futura, segunda inversión y referidos. Ambos: hacer seguimiento (pendiente de implementar).",
    },
    "buyer": {
      "audience": "Edad 30-65 (clave los adultos mayores) · Decisión compartida · Mendoza Capital, Godoy Cruz, Guaymallén, Luján, Maipú y algunas provincias · Poder adquisitivo: alquileres bajo/medio/alto, ventas medio/alto.",
      "problem": "No saben cuánto vale su propiedad, miedo a malvender, desconfianza hacia inmobiliarias, dudas legales, publicaciones sin consultas, interesados que no califican, miedo a estafas. Top 3: no vender al precio correcto, no vender en tiempo razonable y no confiar en quién maneja su propiedad. El más importante: la desconfianza y el miedo a perder plata.",
      "solution": "Tasación basada en mercado real, estrategia de precio y posicionamiento, filtro de interesados, comunicación clara y acompañamiento legal y contractual.",
      "differentials": "Seguimiento personalizado, estrategia de venta, asesoramiento integral (legal y comercial) y acompañamiento humano. Beneficio menos mencionado: guiar, transmitir confianza y orden con los papeles; lo emocional, que el cliente esté tranquilo.",
      "testimonials": "Comentarios en Google ya recolectados. Plan: pedir más testimonios al final del proceso, capturas de pantalla y antes/después.",
      "objections": "\"La comisión es alta\", \"tengo un conocido que vende\", \"pruebo por mi cuenta / se lo damos a otra inmobiliaria\", \"no es buen momento\", \"no quiero exclusividad\", miedo a mala publicación del precio. La más fuerte: \"voy a probar vender por mi cuenta / se lo damos a otra inmobiliaria\".",
      "guarantee": "Ser matriculados y tasadores, experiencia, red de inmobiliarias y colegas, acompañamiento legal, conocimiento del mercado, transparencia y poder de negociación. Superior frente a las desprolijidades comunes del rubro.",
    },
  },

  "EPIC WORLD": {
    "biases": {
      "reciprocity": ("Tendemos a devolver favores.", "Kit de regalo en cada viaje o asistencia al viajero de regalo."),
      "empathy": ("Tendemos a ayudar a quienes nos caen bien.", "Mostrar que somos 3 emprendedoras; comunicar que nosotras también tuvimos miedo de viajar solas o en grupo."),
      "social_proof": ("Tendemos a hacer lo que hacen los demás.", "\"X confió en nosotras para su despedida de soltera / luna de miel\", influencers que viajan con nosotras."),
      "authority": ("Tendemos a hacerle caso a las autoridades.", "Mostrar todas las capacitaciones a las que asistimos."),
      "scarcity": ("Tendemos a valorar más algo cuando se va a acabar.", "Solo X cupos; empezar a pagar antes para tener más cuotas sin interés."),
      "micro_commitment": ("Tendemos a continuar dentro de nuestra zona de confort.", "Pedir info, registrarse, hacer una videollamada o sumarse a un grupo de WhatsApp."),
    },
    "cycle": {
      "presentation": "Oferta irresistible: pago en cuotas sin interés y en varios meses (según anticipación), más viajes inusuales como un grupal a NY por la semana de la moda.",
      "evaluation": "Nos descubren por recomendaciones, la vidriera física del local e Instagram. Criterios: confiabilidad, precio competitivo y local físico.",
      "conversion": "En la seña o reserva.",
      "ascension": "Comunidad, email marketing con ofertas exclusivas y prioridad para otros viajes grupales.",
    },
    "buyer": {
      "audience": "Edad 25-45 · Femenino · Mendoza · Novia (viaje de pareja), soltera (viaje grupal) o mujer que organiza el viaje familiar · Poder adquisitivo medio/medio-alto.",
      "problem": "Buscar el mejor precio en toda la web, organizar todo de punta a punta y formas de pago accesibles. Top 3: falta de tiempo para organizar, estrés y desconocimiento del lugar. El más importante: quieren todo resuelto y al menor precio.",
      "solution": "Armamos el viaje desde cero sin que tengan que preocuparse por nada, a un precio que no encuentran en ninguna web.",
      "differentials": "Respondemos con inmediatez y ofrecemos experiencias nuevas como viajes grupales de mujeres. Beneficio menos mencionado: la experiencia completa.",
      "testimonials": "Mensajes de WhatsApp de agradecimiento y fotos/videos etiquetándonos. Plan: preguntar durante el viaje cómo están, pedir fotos y reseñas post viaje.",
      "objections": "Comparación de precios con otras agencias o buscar solos cuando ya tienen toda la info. La más fuerte: \"no es el momento\".",
      "guarantee": "Acompañamiento antes y después del viaje, asistencia permanente y resolución de cualquier inconveniente. Similar a la competencia.",
    },
  },

  "RISPOLI TEENS": {
    "biases": {
      "reciprocity": ("Tendemos a devolver favores.", "Padres: guía PDF \"Todo lo que un padre necesita saber antes del viaje de 15\" y webinar gratis con los dueños. Hija: checklist \"Qué llevar al viaje\". Reloaded: \"10 razones para volver a Disney siendo adulta\"."),
      "empathy": ("Tendemos a ayudar a quienes nos caen bien.", "Padres: video de Fabián y Marcelo a cámara \"Sabemos lo que es confiarnos una hija\" + detrás de escena de la oficina. Hija: reels de pasajeras reales. Reloaded: testimonios \"viajé a los 15, hoy vuelvo\"."),
      "social_proof": ("Tendemos a hacer lo que hacen los demás.", "Padres: \"Familias mendocinas que nos eligen por generaciones\", reviews. Hija: \"Tantas chicas de tu colegio ya viajaron con Rispoli\" (FOMO). Reloaded: grupos de ex-pasajeras reinscriptas."),
      "authority": ("Tendemos a hacerle caso a las autoridades.", "80 años de Agencia Rispoli + 30+ en quinceañeras, pioneros en Mendoza, seguro médico ampliado, staff médico propio y coordinador cada 12."),
      "scarcity": ("Tendemos a valorar más algo cuando se va a acabar.", "\"Cupos limitados Disney julio 2027, congelá precio en USD antes de que cambie el dólar.\" Reloaded: \"Cupo mínimo 15.\" Urgencia honesta, no falsa."),
      "micro_commitment": ("Tendemos a continuar dentro de nuestra zona de confort.", "Primer paso simple: \"Recibí la info por WhatsApp\" / \"Agendá tu reunión de 20 min\". Hija: \"Mandale este reel a tu mamá\"."),
    },
    "cycle": {
      "presentation": "Padres: \"El viaje de 15 con la única agencia mendocina con +30 años en quinceañeras, donde los dueños te responden por WhatsApp y tu hija vuelve bien, sin sorpresas de precio.\" Hija: \"El mejor viaje de tu vida con tus amigas.\" Reloaded: \"El viaje que soñabas a los 15, ahora a tu manera.\"",
      "evaluation": "Descubrimiento por boca a boca de familias del colegio (canal #1), redes (la hija ve reels), búsqueda Google del padre y prensa local. Criterios del padre: seguridad, trayectoria, referidos, transparencia de precio/cuotas, comunicación durante el viaje y ratio de coordinadores. Compite con Enjoy Quince, Travel Rock, Expertur, la fiesta de 15 y el viaje familiar por cuenta propia.",
      "conversion": "Se cierra en la reunión con los padres (presencial en Mitre 1240 o webinar con un Rispoli): ahí se firma contrato + seña en USD. Estructura típica: seña USD 500 + refuerzos a 7 y 2 meses del viaje.",
      "ascension": "Hermana/prima menor → próximo viaje de 15. Ex-pasajera 2010-2020 → Disney Reloaded Adults Only (el activo más rentable). Familia de Brasil (entry) → Disney premium. Padres → programa formal de referidos.",
    },
    "buyer": {
      "audience": "Doble decisor. Hija (influenciadora) 13-15, femenino, Gran Mendoza + interior, sin poder adquisitivo propio pero alta influencia emocional. Padres (decisor/pagador) 40-55, NSE medio/medio-alto, compran con financiación en cuotas. Perfil B Reloaded: mujeres 18-40+ (ex-pasajeras nostálgicas o con la espina clavada), deciden y pagan ellas mismas (ciclo corto).",
      "problem": "Padres: miedo a que algo le pase a la hija lejos, a ser estafados, al costo y al dólar, a que el grupo no sea adecuado, a la logística (pasaporte, visa, permisos). Hija: FOMO de que sus amigas viajen y ella no. El más importante: el miedo del padre a confiar a su hija a 8.000 km y que algo salga mal. Reloaded: el sueño pendiente + no encontrar formato/grupo adecuado para una adulta.",
      "solution": "Comunicación directa de los dueños por WhatsApp 24h, coordinador cada 12 + staff médico propio + seguro ampliado, diario de viaje online y live streaming, custodia del dinero, 80 años de trayectoria y reuniones pre-viaje. Reloaded: formato libre (sin coordinador c/12), itinerario adulto completo y cupo mínimo 15 que garantiza grupo.",
      "differentials": "Trayectoria multigeneracional mendocina (80 años Rispoli / 30+ Teens), dueños presentes con cara y apellido, ratio coord c/12, comunicación directa dueño↔padre y base de ex-pasajeras leales. Beneficio a apropiarse: la paz mental del padre mostrada con pruebas (live streaming, staff médico) y el ángulo \"sin sorpresas de precio\" frente a la crisis Travel Rock/Baxtter.",
      "testimonials": "Familias que viajaron por generaciones y 315 reviews de Rispoli Viajes en Google (4,5). Plan: fotógrafo del viaje capta testimonios verticales, cena de reencuentro post-viaje, ficha Google Business propia de Rispoli Teens y testimonios de padres referidores.",
      "objections": "\"Es mucha plata / ¿y si sube el dólar?\", \"¿cómo sé que no me estafan?\", \"¿y si le pasa algo?\", \"¿no le conviene la fiesta?\". La más fuerte: \"no me la banco lejos / no confío en ninguna agencia\", que se rebate con prueba (live streaming + staff médico + dueños + 80 años + referidos), no con argumento. Reloaded: \"Disney a mi edad es ridículo\", se rebate con tono y estética adulta.",
      "guarantee": "Precio congelado en USD sin cargos sorpresa (anti-Travel Rock), respaldo de 80 años, comunicación directa de los dueños y seguro médico 24h. Recomendación: formalizar y comunicar una \"garantía de precio sin sorpresas\" como claim de marca.",
    },
  },

  "RISPOLI VIAJES": {
    "biases": {
      "reciprocity": ("Tendemos a devolver favores.", "Cotización personalizada gratis por WhatsApp en 24h, guías descargables (\"Cómo elegir hotel en Punta Cana\"), asesoramiento previo sin compromiso y auditoría gratis de cotización (\"mostranos lo que te cotizó Despegar\")."),
      "empathy": ("Tendemos a ayudar a quienes nos caen bien.", "Mostrar caras reales (Fabián y Marcelo Rispoli en cámara, 3ª generación), detrás de escena en sucursal, reels de agentes e historias mendocinas multigeneracionales."),
      "social_proof": ("Tendemos a hacer lo que hacen los demás.", "\"3 generaciones de mendocinos viajaron con nosotros\", testimonios en video de clientes reales, capturas de clientes que vuelven tras 20 años y conteo de viajes coordinados (\"+1.200 mendocinos el año pasado\")."),
      "authority": ("Tendemos a hacerle caso a las autoridades.", "Disney Platinum Award (única en Mendoza), 83 años desde 1943, Master LAN y Premio Beto Carrero, inscripción en Ministerio de Turismo y AMAVYT, proveedores premium (Universal Assistance, Iberostar, Disney, LATAM)."),
      "scarcity": ("Tendemos a valorar más algo cuando se va a acabar.", "Cupos limitados en grupos coordinados, salidas con fecha fija, tarifas congeladas en dólares hasta cierta fecha y ventanas estacionales (\"solo en mayo, Punta Cana en cuotas antes de la suba\")."),
      "micro_commitment": ("Tendemos a continuar dentro de nuestra zona de confort.", "CTA principal \"Cotizá gratis por WhatsApp\" (no \"comprá\"), quiz \"respondé 4 preguntas y te recomendamos destino\", calculadora de cuotas y propuesta sin obligación."),
    },
    "cycle": {
      "presentation": "\"No te vendemos un buscador, te armamos el viaje. Hace 83 años que 3 generaciones de mendocinos confían en nosotros; si pasa algo a las 3am en Punta Cana, atendemos nosotros, no un call center.\" Ofertas: Caribe all inclusive en cuotas, Brasil grupal, Europa con coordinador mendocino y viaje a medida con auditoría gratis.",
      "evaluation": "Descubrimiento por boca a boca, Google, Meta Ads, sucursal física y orgánico IG (62K). Compara con Despegar (principal), Almundo, Atrápalo y armarse el viaje solo. Criterios en orden: confianza (¿pierdo mi plata?), precio total, financiación, atención humana, conocimiento del destino y reputación.",
      "conversion": "No se cierra en la web. Embudo: anuncio Meta → WhatsApp → cotización formal → reunión presencial/videollamada → seña (20-30%) → saldo en cuotas. Evento a optimizar: Lead (mensaje WhatsApp), no Purchase; necesita CAPI.",
      "ascension": "LTV altísimo (USD 3.000-8.000 por viaje). Crucero post-Caribe, Europa post-Caribe, luna de miel, aniversarios y cliente recurrente con asesor asignado. Custom Audience de clientes anteriores + Lookalike 1% de los mejores.",
    },
    "buyer": {
      "audience": "3 audiencias (excluye Teens). A) Familia mendocina media-alta 38-58, ABC1/C2, ticket USD 4.000-8.000. B) Pareja luna de miel/aniversario 28-42, ticket USD 3.500-7.000. C) Adulto mayor tradicional 50-75, cliente histórico, grupos coordinados a Europa/cruceros, ticket USD 4.000-10.000 por persona.",
      "problem": "Miedo a la estafa (casos Traveling Turismo y Felgueres), complejidad del dólar, saturación de info en OTAs, no saber qué hotel/excursión vale la pena, coordinar logística, soporte ante fallas, financiación. Top 3: miedo a la estafa/desconfianza, sobrecarga de decisiones y financiación. El más importante: \"voy a invertir USD 4.000-8.000, no quiero perderlo, equivocarme de hotel ni quedar sin nadie del otro lado\".",
      "solution": "83 años de operación continua (la mejor prueba de no-estafa), 3 sucursales físicas, 3ª generación con apellido en juego, asesoramiento humano vs. comparador, coordinador en destino, WhatsApp 24/7 con personas, premios verificables (Disney Platinum) y respaldo legal (Ministerio + AMAVYT).",
      "differentials": "83 años vs. Despegar (27), asesor con nombre vs. call center, 3 sucursales físicas, agentes que viajaron a los destinos, coordinador en destino, Disney Platinum y personalización total. Beneficio menos explotado (oro puro): \"te decimos a qué hotel ir\" (nadie más lo dice). Aceptar que no gana en precio, velocidad ni cuotas: debe compensarlo.",
      "testimonials": "Testimonios espontáneos en redes y Google (ej. clientes que viajaron en el 98 y vuelven con hijas). Plan sistemático: WhatsApp post-viaje a los 7 días, QR de reseña en sucursal, \"Mendocinos que viajan con Rispoli\" (1 cliente/mes), UGC desde destino y banco de testimonios por destino. Formato: video vertical 9:16 de 30-60s.",
      "objections": "\"En Despegar es más barato\", \"no tengo todo el dinero ahora\", \"¿no son una estafa más?\", \"me lo armo solo\", \"las agencias son cosa de antes\", \"voy a esperar a que baje el dólar\". La más fuerte: \"en Despegar lo encuentro más barato y pago en cuotas en dólares\". Se rebate con valor (asesoramiento, respaldo, costo de equivocarse), no con precio.",
      "guarantee": "Precio total transparente (sin costos ocultos), soporte 24/7 en destino, garantía de recomendación de hotel, inscripción legal verificable y seña reembolsable hasta cierto plazo. Diferencial: una sola persona responde por todo el viaje, vs. el cliente atrapado entre aerolínea y plataforma en Despegar.",
    },
  },
}

BIAS_ORDER = ["reciprocity","empathy","social_proof","authority","scarcity","micro_commitment"]
BUYER_ORDER = ["audience","problem","solution","differentials","testimonials","objections","guarantee"]

def q(s):
    return "'" + s.replace("'", "''") + "'"

out = []
for client, d in DATA.items():
    cn = q(client)
    out.append(f"-- ===== {client} =====")
    out.append(f"INSERT INTO public.market_research (client_id) SELECT id FROM public.clients WHERE UPPER(name) = {cn} ON CONFLICT (client_id) DO NOTHING;")
    mr_sub = f"(SELECT mr2.id FROM public.market_research mr2 JOIN public.clients c ON c.id = mr2.client_id WHERE UPPER(c.name) = {cn})"
    # biases
    out.append("INSERT INTO public.mr_biases (market_research_id, bias_key, definition, application, status)")
    out.append(f"SELECT mr.id, b.bias_key, b.definition, b.application, 'complete' FROM {mr_sub} mr CROSS JOIN (VALUES")
    rows = []
    for k in BIAS_ORDER:
        defi, app = d["biases"][k]
        rows.append(f"  ({q(k)}, {q(defi)}, {q(app)})")
    out.append(",\n".join(rows))
    out.append(") AS b(bias_key, definition, application) ON CONFLICT (market_research_id, bias_key) DO UPDATE SET definition = EXCLUDED.definition, application = EXCLUDED.application, status = 'complete';")
    # cycle
    c = d["cycle"]
    out.append("INSERT INTO public.mr_sales_cycle (market_research_id, presentation, evaluation, conversion, ascension, status)")
    out.append(f"SELECT mr.id, {q(c['presentation'])}, {q(c['evaluation'])}, {q(c['conversion'])}, {q(c['ascension'])}, 'complete' FROM {mr_sub} mr")
    out.append("ON CONFLICT (market_research_id) DO UPDATE SET presentation = EXCLUDED.presentation, evaluation = EXCLUDED.evaluation, conversion = EXCLUDED.conversion, ascension = EXCLUDED.ascension, status = 'complete';")
    # buyer
    out.append("INSERT INTO public.mr_buyer_elements (market_research_id, element_key, data, status)")
    out.append(f"SELECT mr.id, e.element_key, jsonb_build_object('content', e.content), 'complete' FROM {mr_sub} mr CROSS JOIN (VALUES")
    rows = []
    for k in BUYER_ORDER:
        rows.append(f"  ({q(k)}, {q(d['buyer'][k])})")
    out.append(",\n".join(rows))
    out.append(") AS e(element_key, content) ON CONFLICT (market_research_id, element_key) DO UPDATE SET data = EXCLUDED.data, status = 'complete';")
    out.append("")

with open("import_investigacion_resto.sql", "w") as f:
    f.write("\n".join(out))
print("OK", len("\n".join(out)), "chars")
