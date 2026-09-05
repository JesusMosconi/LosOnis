import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { EMPRESA } from "@/lib/cotizador/empresa";

export type CotizacionPdfData = {
  numero: number;
  titulo: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  createdAt: string;
  subtotalMateriales: string;
  montoGastos: string;
  montoManoObra: string;
  montoAdicionales: string;
  total: string;
  items: Array<{
    id: string;
    nombre: string;
    sku: string | null;
    descripcion: string | null;
    unidad: string | null;
    cantidad: string;
    precioUnitario: string;
    subtotal: string;
    urlOrigen: string | null;
  }>;
  adicionales: Array<{
    id: string;
    descripcion: string;
    monto: string;
  }>;
};

const NAVY = "#1C2B3A";
const ORANGE = "#E8743B";
const LIGHT_TEXT = "#C9D2DE";
const BORDER = "#E1E4E8";
const PALE = "#F4F5F7";
const MUTED = "#667386";

const styles = StyleSheet.create({
  page: {
    paddingTop: 184,
    paddingRight: 45,
    paddingBottom: 52,
    paddingLeft: 45,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: NAVY,
  },
  brand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    paddingTop: 16,
    paddingRight: 45,
    paddingBottom: 14,
    paddingLeft: 56,
    backgroundColor: NAVY,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orangeEdge: { position: "absolute", top: 0, left: 0, bottom: 0, width: 11, backgroundColor: ORANGE },
  company: { width: "62%" },
  companyName: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 5 },
  companyLine: { color: LIGHT_TEXT, fontSize: 7.5, marginBottom: 3 },
  quoteMeta: { width: "38%", alignItems: "flex-end" },
  quoteNumber: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8 },
  metaLine: { color: LIGHT_TEXT, fontSize: 7.5, marginBottom: 3 },
  infoBoxes: {
    position: "absolute",
    top: 101,
    left: 45,
    right: 45,
    height: 45,
    flexDirection: "row",
    gap: 10,
  },
  infoBox: { flexGrow: 1, flexBasis: 0, borderWidth: 1, borderColor: BORDER },
  infoTitle: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    backgroundColor: PALE,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 0.8,
  },
  infoBody: { paddingVertical: 5, paddingHorizontal: 7, fontSize: 8.5 },
  infoSecondary: { marginTop: 2, color: MUTED, fontSize: 7 },
  tableHeader: {
    position: "absolute",
    top: 158,
    left: 45,
    right: 45,
    height: 21,
    paddingHorizontal: 6,
    backgroundColor: NAVY,
    color: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
  },
  row: {
    minHeight: 31,
    paddingVertical: 6,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  evenRow: { backgroundColor: PALE },
  providerColumn: { width: "15%", paddingRight: 5 },
  descriptionColumn: { width: "39%", paddingRight: 6 },
  quantityColumn: { width: "10%", textAlign: "right", paddingRight: 6 },
  priceColumn: { width: "17%", textAlign: "right", paddingRight: 6 },
  subtotalColumn: { width: "19%", textAlign: "right" },
  provider: { color: "#8A94A6", fontSize: 6.5 },
  itemName: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  itemDetail: { color: MUTED, fontSize: 6.5, marginTop: 2 },
  itemSubtotal: { fontFamily: "Helvetica-Bold" },
  totals: { width: 265, marginTop: 18, marginLeft: "auto", wrap: false },
  totalRow: {
    minHeight: 23,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
  },
  totalAmount: { color: NAVY, fontFamily: "Helvetica-Bold" },
  finalTotal: {
    minHeight: 36,
    marginTop: 5,
    paddingHorizontal: 11,
    backgroundColor: NAVY,
    color: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  finalAmount: { fontSize: 15 },
  footer: {
    position: "absolute",
    left: 45,
    right: 45,
    bottom: 17,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    color: "#8A94A6",
    fontSize: 6.5,
    textAlign: "center",
  },
  pageNumber: { position: "absolute", right: 0, top: 6 },
});

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: string) => currency.format(Number(value));
const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(value))
  : "—";

function Header({ quote }: { quote: CotizacionPdfData }) {
  return (
    <>
      <View fixed style={styles.brand}>
        <View style={styles.orangeEdge} />
        <View style={styles.company}>
          <Text style={styles.companyName}>{EMPRESA.nombre}</Text>
          <Text style={styles.companyLine}>{EMPRESA.titular} · Herrería y trabajos en metal</Text>
          <Text style={styles.companyLine}>
            CUIT {EMPRESA.cuit} · {EMPRESA.condicionFiscal} · {EMPRESA.domicilio}
          </Text>
        </View>
        <View style={styles.quoteMeta}>
          <Text style={styles.quoteNumber}>COTIZACIÓN N.° {quote.numero}</Text>
          <Text style={styles.metaLine}>Fecha: {formatDate(quote.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.infoBoxes}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>CLIENTE</Text>
          <View style={styles.infoBody}>
            <Text>{quote.clienteNombre}</Text>
            {quote.clienteTelefono && <Text style={styles.infoSecondary}>{quote.clienteTelefono}</Text>}
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>TRABAJO</Text>
          <Text style={styles.infoBody}>{quote.titulo}</Text>
        </View>
      </View>
      <View fixed style={styles.tableHeader}>
        <Text style={styles.providerColumn}>PROVEEDOR</Text>
        <Text style={styles.descriptionColumn}>DESCRIPCIÓN</Text>
        <Text style={styles.quantityColumn}>CANT.</Text>
        <Text style={styles.priceColumn}>P. UNIT.</Text>
        <Text style={styles.subtotalColumn}>SUBTOTAL</Text>
      </View>
    </>
  );
}

function Footer() {
  return (
    <View fixed style={styles.footer}>
      <Text>
        {EMPRESA.nombre} · Tel. {EMPRESA.telefono} · Presupuesto sin validez fiscal, sujeto a variación de precios de materiales
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function CotizacionPdf({ quote }: { quote: CotizacionPdfData }) {
  return (
    <Document title={`Cotización N.° ${quote.numero}`} author={EMPRESA.nombre}>
      <Page size="A4" style={styles.page} wrap>
        <Header quote={quote} />
        {quote.items.map((item, index) => (
          <View key={item.id} style={[styles.row, ...(index % 2 ? [styles.evenRow] : [])]} wrap={false}>
            <Text style={[styles.providerColumn, styles.provider]}>{item.urlOrigen ? "ACERCO" : item.nombre}</Text>
            <View style={styles.descriptionColumn}>
              {item.urlOrigen ? (
                <>
                  <Text style={styles.itemName}>{item.nombre}</Text>
                  {(item.descripcion || item.unidad) && (
                    <Text style={styles.itemDetail}>{[item.descripcion, item.unidad].filter(Boolean).join(" · ")}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.itemName}>{item.descripcion || item.unidad || "Sin descripción"}</Text>
              )}
            </View>
            <Text style={styles.quantityColumn}>{item.cantidad}</Text>
            <Text style={styles.priceColumn}>{formatMoney(item.precioUnitario)}</Text>
            <Text style={[styles.subtotalColumn, styles.itemSubtotal]}>{formatMoney(item.subtotal)}</Text>
          </View>
        ))}
        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text>Subtotal materiales</Text><Text style={styles.totalAmount}>{formatMoney(quote.subtotalMateriales)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Insumos y Viáticos</Text><Text style={styles.totalAmount}>{formatMoney(quote.montoGastos)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Mano de obra</Text><Text style={styles.totalAmount}>{formatMoney(quote.montoManoObra)}</Text>
          </View>
          {quote.adicionales.map((adicional) => (
            <View style={styles.totalRow} key={adicional.id}>
              <Text>{adicional.descripcion || "Adicional"}</Text>
              <Text style={styles.totalAmount}>{formatMoney(adicional.monto)}</Text>
            </View>
          ))}
          <View style={styles.finalTotal}>
            <Text>TOTAL</Text><Text style={styles.finalAmount}>{formatMoney(quote.total)}</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
