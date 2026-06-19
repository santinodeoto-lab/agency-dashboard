-- Generar pagos de julio 2026 para todos los clientes activos
INSERT INTO public.payments (client_id, amount, currency, due_date, month_reference, status)
SELECT
  id,
  fee_amount,
  fee_currency,
  DATE('2026-07-' || LPAD(payment_due_day::TEXT, 2, '0')),
  DATE('2026-07-01'),
  'pending'
FROM public.clients
WHERE status = 'active';
