import { syncAcercoCatalog } from "@/lib/catalogo/sync-catalogo";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET no está configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await syncAcercoCatalog();
  return Response.json(result, { status: result.status === "FALLIDA" ? 500 : 200 });
}
