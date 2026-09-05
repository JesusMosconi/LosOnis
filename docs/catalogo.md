# Catálogo ACERCO

El workflow `.github/workflows/catalogo.yml` ejecuta `npm run catalogo:sync`
directamente en GitHub Actions, con Node 24 y un runner Linux estándar.
El horario es 09:00 UTC (06:00 Argentina), sujeto a demoras de GitHub.
También se puede iniciar desde Actions → Catálogo ACERCO → Run workflow.
El workflow debe estar en la rama predeterminada para activar el horario.

Configurar el secreto de repositorio `CATALOGO_DATABASE_URL` con la conexión
Postgres de producción. Nunca guardar la URL en el workflow ni en archivos
versionados. No se ejecutan migraciones desde esta tarea.

La importación tiene 25 minutos y el job 30, reservando margen para instalación
y cierre. Mantiene dos productos simultáneos. Guarda progreso después de cada
página y lote de dos productos; una interrupción dentro del lote puede dejar
hasta dos productos persistidos que todavía no figuren en el contador.
Los logs y el resumen de Actions muestran el resultado. Un resultado PARCIAL
o FALLIDA hace fallar el workflow.

El grupo de concurrencia evita solapamientos en Actions. La base también impide
iniciar otra importación mientras exista una fila EN_PROCESO. El endpoint viejo
de Vercel devuelve 410 a solicitudes autorizadas y ya no importa productos.

El paso final cierra como FALLIDA una ejecución interrumpida, conservando sus
contadores y errores. No modifica resultados que ya terminaron. Si se pierde
el runner completo o la base no responde durante el cierre, puede quedar una
fila EN_PROCESO. En ese caso, comprobar primero que el proceso ya terminó y
ejecutar, con DATABASE_URL configurada:

```sh
CATALOG_SYNC_ID=ID_DE_LA_EJECUCION npm run catalogo:finalize
```

Después volver a ejecutar el workflow. No hay reintentos completos automáticos:
los fetch conservan sus reintentos individuales y una nueva ejecución actualiza
los mismos productos mediante upsert. Las bajas de productos solo se aplican
cuando el listado completo termina sin errores.
