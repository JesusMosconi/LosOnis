const REQUEST_HEADERS = {
  "User-Agent": "LosOnisCatalogSync/1.0 (catalogo interno de taller)",
};

async function requestWithRetry(url: URL | string, init: RequestInit, attempts = 2) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...REQUEST_HEADERS, ...init.headers },
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) continue;
    }
  }
  throw new Error(
    `No se pudo descargar ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

export async function fetchAcercoHtml(url: string): Promise<string> {
  const response = await requestWithRetry(url, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  return response.text();
}

export async function fetchAcercoVariation(
  productUrl: string,
  productId: number,
  attributes: Record<string, string>,
): Promise<unknown> {
  const endpoint = new URL("/", productUrl);
  endpoint.searchParams.set("wc-ajax", "get_variation");
  const response = await requestWithRetry(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: productUrl,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: new URLSearchParams({ product_id: String(productId), ...attributes }),
  });
  return response.json();
}
