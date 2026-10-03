-- Reserva los números 1 a 104 usados antes de incorporar el cotizador.
-- Si ya existe una cotización con un número mayor, conserva la secuencia por encima de ese valor.
SELECT setval(
  pg_get_serial_sequence('"Cotizacion"', 'numero'),
  GREATEST(104, COALESCE((SELECT MAX("numero") FROM "Cotizacion"), 0)),
  true
);
