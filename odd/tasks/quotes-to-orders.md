# Quotes to orders
Branches: feat/eliminar-calendario (calendar commit 3f23be8), then feat/pedidos-desde-cotizacion (quote/order commit d12848f). Delivery: ask-on-risk. Runner: npm run cotizador:test, npm run lint, npm run build.

## Specs
- S1: "No vamos a utilizar mas el calendario de inicio"; clarification: "si es mas facil ocultarlo que eliminar todo, entonces lo ocultemos".
- S2: "Para reemplazar la pantalla de inicio podriamos mostrar (al igual que ahora) Los pedidos, mas el monto total de los pedidos del mes".
- S3: "Ahora se pueden ver las cotizaciones y abrir cada una para editarlas, con un boton que dice Guardar Cambios. Ademas quiero que se agregue un boton que sea Confirmar Cotizacion, el cual cree el pedido".
- S4: "Nombre, numero de telefono y titulo, el titulo vendria a reemplazar el \"Tipo de trabajo\" que hay en pedidos. Ademas el monto que entraria en pedidos seria solamente el monto de la Mano de obra de la cotizacion.".
- S5: "se refiere al Titulo, ya que si deja el titulo vacio, despues en Pedidos quedaria con un nombre feo. Entonces pasaria a ser Not null".
- S6: "Sacamos el campo \"tipoTrabajo\""; "Diego nunca daria de alta un pedido sin antes realizar una cotizacion."
- S7: "siempre antes de pushear o mergear me tenes que consultar".

## Tasks
- T1 [S1-S2] inline: hide calendar entry points and show current-month order amount; verified and committed as 3f23be8.
- T2 [S3-S6] inline: require title, link quote confirmation to order creation, update order schema and UI; verified locally and with rollback-only database test, committed as d12848f. Authenticated HTTP route was not exercised against Neon.
- T3 [S1-S7] inline: verify and report without push or merge; lint, 27 tests, build, Prisma schema validation, migration status, data counts and independent blocker recheck passed. Candidate review declined by user; no push or merge.

## Log
- L1: User requested calendar removal/hiding, quote-to-order automation, feature/develop branches, and later authorized implementation with approval before push or merge. Exact prompts are recorded in Engram prompt history; credentials intentionally omitted here.
- L2: Title is already non-null at the database level, but new quotes currently auto-generate a title when left blank; validation and UI must change.
- L3: Existing uncommitted calendar-hiding changes were reviewed and preserved. Engram mirror pending because multiple active runtime sessions prevent saving without an authoritative session ID.
- L4: Local implementation is uncommitted on feat/eliminar-calendario. No push, merge or remote database operation occurred. Migration renames the existing Pedido column to preserve values and adds a nullable unique quote link for legacy orders.
- L5: Independent verifier found a confirmation/edit interleaving and lost legacy amount editing; both were corrected and structurally rechecked. No PostgreSQL concurrency exercise has run.
- L6: User authorized applying only the new migration to the feat/pedidos-desde-cotizacion Neon branch. Prisma migrate status returned an opaque schema-engine error, but a read-only pg connection succeeded. The remote migration table shows two earlier local migrations (20260907190000 and 20260909000000) not applied; applying the new migration through migrate deploy would also execute those unrelated sequence changes, so no migration was applied. Awaiting explicit scope decision.
- L7: User authorized the two earlier sequence migrations. Prisma migrate deploy applied all three pending migrations successfully to feat/pedidos-desde-cotizacion Neon, and migrate status reports the schema up to date. Read-only counts show four legacy orders, all four with a non-null title and zero linked to a quote, as expected. No test records were created and no other remote database was touched.
- L8: User authorized a rollback-only write test. A test cotizacion and linked pedido were inserted inside a transaction, duplicate quote linkage was rejected, then the transaction was rolled back; a subsequent query confirmed zero test rows remained. This tests database constraints and mapping, not the authenticated HTTP route.
- L9: The calendar commit 3f23be8 was assessed as medium/under_budget with untracked files excluded. The feature branch feat/pedidos-desde-cotizacion was created locally from that commit; no push or merge occurred.
- L10: The quote/order commit d12848f was assessed high because it changes persisted data. User declined native review for this candidate only; review mode remains enabled. Rollback-only Neon test passed, but the authenticated HTTP handler was not exercised against Neon. Both local branches remain unpublished.
