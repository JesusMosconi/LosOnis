export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET no está configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  return Response.json(
    { error: "La sincronización se ejecuta desde GitHub Actions (Catálogo ACERCO)" },
    { status: 410 },
  );
}
