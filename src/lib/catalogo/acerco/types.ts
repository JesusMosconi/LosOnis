export type AcercoProductType = "SIMPLE" | "VARIABLE";

export type AcercoListingProduct = {
  externalId: number;
  name: string;
  url: string;
  type: AcercoProductType;
};

export type AcercoCategory = {
  name: string;
  slug: string;
  url: string;
};

export type AcercoCatalogItem = {
  externalKey: string;
  variationId: number | null;
  name: string;
  sku: string | null;
  attributes: Record<string, string>;
  priceInCents: number;
  inStock: boolean | null;
};

export type AcercoProduct = AcercoListingProduct & {
  sku: string | null;
  categories: AcercoCategory[];
  items: AcercoCatalogItem[];
  warnings: string[];
};

export type AcercoListingPage = {
  products: AcercoListingProduct[];
  totalPages: number;
};
