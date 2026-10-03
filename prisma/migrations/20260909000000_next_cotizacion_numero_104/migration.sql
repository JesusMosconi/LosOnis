-- La próxima cotización debe ser la 104. No modifica cotizaciones existentes.
SELECT setval(
  pg_get_serial_sequence('"Cotizacion"', 'numero'),
  GREATEST(103, COALESCE((SELECT MAX("numero") FROM "Cotizacion"), 0)),
  true
);
