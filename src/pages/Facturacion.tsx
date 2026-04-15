import { createInvoicePdf } from "@/lib/invoices/createInvoicePdf";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Euro, Clock, Users, Receipt, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ArtistaRepresentadoActivo = {
  id: string;
  nombre: string;
  estilo: string;
  cache: string;
  foto: string;
};

type OwnedArtist = {
  id: string;
  nombre: string;
};

type ArtistRecord = {
  id: string;
  nombre: string;
  foto_url: string | null;
};

type BookingDeal = {
  id: string;
  artist_id: string;
  artist_profile_id: string | null;
  representative_profile_id: string | null;
  venue_profile_id: string;
  deal_type: "standard" | "structured" | "premium";
  current_status:
    | "draft"
    | "requested"
    | "countered"
    | "accepted"
    | "rejected"
    | "contract_generated"
    | "deposit_pending"
    | "deposit_paid"
    | "fully_paid"
    | "completed"
    | "cancelled";
  current_offer_version: number;
  latest_offer_id: string | null;
  event_date: string;
  event_start_time: string | null;
  duration_minutes: number | null;
  venue_name: string;
  city: string | null;
  country: string | null;
  event_type: string | null;
  event_title: string | null;
  audience_size: number | null;
  currency: string;
  total_fee: number | null;
  commission_percent: number | null;
  deposit_percent: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DealTerm = {
  booking_deal_id: string;
  final_fee: number;
  currency: string;
  commission_percent: number;
  commission_amount: number;
  deposit_percent: number;
  deposit_amount: number;
  balance_amount: number;
  tax_percent: number | null;
  tax_amount: number | null;
  payout_to_artist: number | null;
  platform_revenue: number | null;
  created_at?: string;
  updated_at?: string;
};

type DealPayment = {
  id: string;
  booking_deal_id: string;
  payment_type: "deposit" | "balance" | "full" | "commission";
  amount: number;
  currency: string;
  payer_profile_id: string;
  payee_profile_id: string | null;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at?: string;
};

type DealInvoice = {
  booking_deal_id: string;
  invoice_number: string;
  pdf_public_url: string | null;
  pdf_storage_path: string | null;
  status: string;
};

type InvoiceRow = {
  dealId: string;
  artistId: string;
  artistName: string;
  venueName: string;
  city: string;
  eventDate: string;
  total: number;
  paid: number;
  pending: number;
  representativeFee: number;
  artistNet: number;
  invoiceNumber: string;
  pdfUrl: string | null;
};

const ARTISTA_ACTIVO_KEY = "artista_representado_activo_demo";

const formatearCache = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("es-ES");
};

const coincideArtista = (
  deal: BookingDeal,
  artista: { id?: string | null; nombre?: string | null }
) => {
  return !!artista.id && deal.artist_id === artista.id;
};

const formatCurrency = (amount: number) => {
  const entero = Math.round(Number(amount || 0));
  return `${entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function Facturacion() {
  const navigate = useNavigate();
  const [artistaActivo, setArtistaActivo] = useState<ArtistaRepresentadoActivo | null>(null);
  const [ownedArtists, setOwnedArtists] = useState<OwnedArtist[]>([]);
  const [artistsById, setArtistsById] = useState<Record<string, ArtistRecord>>({});
  const [invoicesByDeal, setInvoicesByDeal] = useState<Record<string, DealInvoice | null>>({});
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [termsByDeal, setTermsByDeal] = useState<Record<string, DealTerm | null>>({});
  const [paymentsByDeal, setPaymentsByDeal] = useState<Record<string, DealPayment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedArtistId, setSelectedArtistId] = useState<string>("todos");

  const tipoUsuario = localStorage.getItem("tipo_usuario_demo") || "artista_individual";
  const profileId = localStorage.getItem("profile_id_demo") || "";
  const userId = localStorage.getItem("user_id_demo") || "";

  useEffect(() => {
    const guardado = localStorage.getItem(ARTISTA_ACTIVO_KEY);
    if (guardado) {
      const artista = JSON.parse(guardado) as ArtistaRepresentadoActivo;
      setArtistaActivo(artista);
      setSelectedArtistId(artista.id);
    }
  }, []);

  const limpiarArtistaActivo = () => {
    localStorage.removeItem(ARTISTA_ACTIVO_KEY);
    setArtistaActivo(null);
    setSelectedArtistId("todos");
  };

  useEffect(() => {
    const cargarArtistasPropios = async () => {
      let query = supabase.from("artistas").select("id,nombre");

      if (tipoUsuario === "representante_agencia") {
        if (!profileId && !userId) return;
        query = query.or(`representante_id.eq.${profileId},representante_id.eq.${userId}`);
      } else {
        if (!profileId && !userId) return;
        query = query.or(`perfil_artista_id.eq.${profileId},perfil_artista_id.eq.${userId},user_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOwnedArtists((data as OwnedArtist[]) || []);
      }
    };

    cargarArtistasPropios();
  }, [profileId, userId, tipoUsuario]);

  useEffect(() => {
    const cargarFacturacion = async () => {
      const { data: dealsData, error: dealsError } = await supabase
        .from("booking_deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (dealsError || !dealsData) {
        setLoading(false);
        return;
      }

      const dealsCargados = dealsData as BookingDeal[];
      setDeals(dealsCargados);

      const dealIds = dealsCargados.map((deal) => deal.id);
      const artistIds = Array.from(new Set(dealsCargados.map((deal) => deal.artist_id).filter(Boolean)));

      if (artistIds.length > 0) {
        const { data: artistsData } = await supabase
          .from("artistas")
          .select("id,nombre,foto_url")
          .in("id", artistIds);

        if (artistsData) {
          const mapaArtists: Record<string, ArtistRecord> = {};
          (artistsData as ArtistRecord[]).forEach((artist) => {
            mapaArtists[artist.id] = artist;
          });
          setArtistsById(mapaArtists);
        }
      }

      if (dealIds.length > 0) {
        const { data: termsData } = await supabase
          .from("deal_terms")
          .select("*")
          .in("booking_deal_id", dealIds);

        const mapaTerms: Record<string, DealTerm | null> = {};
        (termsData as DealTerm[] | null)?.forEach((term) => {
          mapaTerms[term.booking_deal_id] = term;
        });
        setTermsByDeal(mapaTerms);

        const { data: paymentsData } = await supabase
          .from("deal_payments")
          .select("*")
          .in("booking_deal_id", dealIds)
          .order("created_at", { ascending: true });

        const mapaPayments: Record<string, DealPayment[]> = {};
        (paymentsData as DealPayment[] | null)?.forEach((payment) => {
          if (!mapaPayments[payment.booking_deal_id]) {
            mapaPayments[payment.booking_deal_id] = [];
          }
          mapaPayments[payment.booking_deal_id].push(payment);
        });
        setPaymentsByDeal(mapaPayments);

        const { data: invoicesData } = await supabase
          .from("deal_invoices")
          .select("booking_deal_id,invoice_number,pdf_public_url,pdf_storage_path,status")
          .in("booking_deal_id", dealIds);

        const mapaInvoices: Record<string, DealInvoice | null> = {};
        (invoicesData as DealInvoice[] | null)?.forEach((invoice) => {
          mapaInvoices[invoice.booking_deal_id] = invoice;
        });
        setInvoicesByDeal(mapaInvoices);
      }

      setLoading(false);
    };

    cargarFacturacion();
  }, []);

  const dealsFiltrados = useMemo(() => {
    let resultado = deals;

    if (ownedArtists.length > 0) {
      resultado = resultado.filter((deal) =>
        ownedArtists.some((artista) => coincideArtista(deal, artista))
      );
    } else if (tipoUsuario === "artista_individual") {
      resultado = [];
    }

    if (artistaActivo) {
      resultado = resultado.filter((deal) => coincideArtista(deal, artistaActivo));
    }

    if (!artistaActivo && selectedArtistId !== "todos") {
      resultado = resultado.filter((deal) => deal.artist_id === selectedArtistId);
    }

    return resultado;
  }, [deals, ownedArtists, tipoUsuario, artistaActivo, selectedArtistId]);

  const invoiceRows = useMemo<InvoiceRow[]>(() => {
    return dealsFiltrados
      .map((deal) => {
        const term = termsByDeal[deal.id] || null;
        const payments = paymentsByDeal[deal.id] || [];
        const invoice = invoicesByDeal[deal.id] || null;
        const total = Number(term?.final_fee ?? deal.total_fee ?? 0);
        const artistNet = Number(term?.payout_to_artist ?? total);
        const representativeFee = Math.max(0, total - artistNet);
        const paid = payments
          .filter((payment) => payment.status === "paid")
          .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);
        const pending = payments
          .filter((payment) => payment.status === "pending")
          .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);

        return {
          dealId: deal.id,
          artistId: deal.artist_id,
          artistName: artistsById[deal.artist_id]?.nombre || "Artista",
          venueName: deal.venue_name || "Venue",
          city: deal.city || "",
          eventDate: deal.event_date,
          total,
          paid,
          pending,
          representativeFee,
          artistNet,
          invoiceNumber: invoice?.invoice_number || `FAC-${deal.id.slice(0, 8).toUpperCase()}`,
          pdfUrl: invoice?.pdf_public_url || null,
        };
      })
      .sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || ""));
  }, [dealsFiltrados, artistsById, termsByDeal, paymentsByDeal, invoicesByDeal]);

  const resumen = useMemo(() => {
    const facturacionArtistas = invoiceRows.reduce((acc, row) => acc + row.artistNet, 0);
    const facturacionAgencia = invoiceRows.reduce((acc, row) => acc + row.representativeFee, 0);
    const pendienteCobro = invoiceRows.reduce((acc, row) => acc + row.pending, 0);

    return {
      facturacionArtistas,
      facturacionAgencia,
      pendienteCobro,
    };
  }, [invoiceRows]);

  const artistOptions = useMemo(() => {
    const mapa = new Map<string, string>();

    ownedArtists.forEach((artist) => {
      mapa.set(artist.id, artist.nombre);
    });

    Object.values(artistsById).forEach((artist) => {
      if (artist?.id && artist?.nombre) {
        mapa.set(artist.id, artist.nombre);
      }
    });

    invoiceRows.forEach((row) => {
      if (row.artistId && row.artistName) {
        mapa.set(row.artistId, row.artistName);
      }
    });

    return Array.from(mapa.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [ownedArtists, artistsById, invoiceRows]);

  const textoCabecera = artistaActivo
    ? `Estás viendo la facturación de ${artistaActivo.nombre}.`
    : "Estás viendo la facturación agregada de la agencia y puedes filtrarla por artista.";

  const openPdfUrl = (url: string) => {
    const separator = url.includes("?") ? "&" : "?";
    const cacheBustedUrl = `${url}${separator}t=${Date.now()}`;
    window.open(cacheBustedUrl, "_blank", "noopener,noreferrer");
  };

  const handleGenerateInvoice = async (row: InvoiceRow) => {
    try {
      toast.loading("Generando factura...", { id: `invoice-${row.dealId}` });

      const pdfUrl = await createInvoicePdf({
        invoiceNumber: row.invoiceNumber,
        artistName: row.artistName,
        venueName: row.venueName,
        eventDate: row.eventDate,
        city: row.city,
        totalFee: row.total,
        representativeFee: row.representativeFee,
        artistNet: row.artistNet,
      });

      const filePath = `invoices/${row.invoiceNumber}.pdf`;

      // BEGIN replacement block
      const existingInvoice = invoicesByDeal[row.dealId];
      const subtotalAmount = Number(row.total || 0);
      const taxPercent = 21;
      const taxAmount = subtotalAmount * (taxPercent / 100);
      const totalAmount = subtotalAmount + taxAmount;

      const insertPayload = {
        booking_deal_id: row.dealId,
        invoice_number: row.invoiceNumber,
        issuer_type: "representative",
        issuer_name: "Link & Play Agency S.L.",
        issuer_tax_id: "B00000000",
        issuer_address: "Calle Serrano 123, Madrid",
        issuer_email: "facturacion@linkandplay.com",
        recipient_name: row.venueName,
        recipient_address: row.city || "",
        service_description: `Actuación artística (${row.eventDate})`,
        subtotal_amount: subtotalAmount,
        tax_percent: taxPercent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: "EUR",
        status: "issued",
        pdf_public_url: pdfUrl,
        pdf_storage_path: filePath,
      };

      const { error: updateError } = existingInvoice
        ? await supabase
            .from("deal_invoices")
            .update({
              pdf_public_url: pdfUrl,
              pdf_storage_path: filePath,
              status: "issued",
            })
            .eq("booking_deal_id", row.dealId)
        : await supabase.from("deal_invoices").insert(insertPayload);
      // END replacement block

      if (updateError) {
        console.error("Error actualizando deal_invoices:", updateError);
        toast.error("La factura se generó, pero no se pudo guardar su URL en la base de datos.", {
          id: `invoice-${row.dealId}`,
        });
        return;
      }

      setInvoicesByDeal((prev) => ({
        ...prev,
        [row.dealId]: {
          booking_deal_id: row.dealId,
          invoice_number: row.invoiceNumber,
          pdf_public_url: pdfUrl,
          pdf_storage_path: filePath,
          status: prev[row.dealId]?.status || "issued",
        },
      }));

      toast.success("Factura generada correctamente.", { id: `invoice-${row.dealId}` });
      openPdfUrl(pdfUrl);
    } catch (error) {
      console.error("Error generando factura", error);
      const message = error instanceof Error ? error.message : "No se pudo generar la factura PDF.";
      toast.error(message, { id: `invoice-${row.dealId}` });
    }
  };

  return (
    <AppLayout title="Facturación" subtitle="Resumen económico de artistas y agencia">
      <div className="space-y-6">
        {artistaActivo ? (
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {artistaActivo.foto ? (
                    <img
                      src={artistaActivo.foto}
                      alt={artistaActivo.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Gestionando artista</p>
                  <h3 className="text-xl font-semibold">{artistaActivo.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    {artistaActivo.estilo || "Sin estilo definido"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Caché: {artistaActivo.cache ? `${formatearCache(artistaActivo.cache)} €` : "No definido"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={limpiarArtistaActivo}>
                  Ver todos
                </Button>
                <Button variant="outline" onClick={() => navigate("/artistas")}>
                  Cambiar artista
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Vista general</p>
              <h3 className="text-xl font-semibold">Facturación agregada de la agencia</h3>
              <p className="text-sm text-muted-foreground mt-1">{textoCabecera}</p>
            </div>

            <div className="max-w-sm">
              <label className="text-sm text-muted-foreground block mb-2">Filtrar por artista</label>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="todos">Todos los artistas</option>
                {artistOptions.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Facturación artistas",
              value: formatCurrency(resumen.facturacionArtistas),
              icon: Euro,
              subtitle: "Neto acumulado de los artistas",
            },
            {
              title: "Facturación agencia",
              value: formatCurrency(resumen.facturacionAgencia),
              icon: Receipt,
              subtitle: "Fee de representación agregado",
            },
            {
              title: "Pendiente de cobro",
              value: formatCurrency(resumen.pendienteCobro),
              icon: Clock,
              subtitle: "Importe aún pendiente",
            },
          ].map((stat) => (
            <Card key={stat.title} className="border shadow-sm bg-card rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-base font-semibold text-foreground">
                    {stat.title}
                  </span>
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Facturas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vista consolidada por contratación y artista
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Cargando facturación...
              </div>
            ) : invoiceRows.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Aún no hay facturas o deals con información financiera para mostrar.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-foreground w-[220px]">Artista</TableHead>
                      <TableHead className="font-semibold text-foreground w-[140px]">Fecha actuación</TableHead>
                      <TableHead className="text-right font-semibold text-foreground w-[140px]">Importe total</TableHead>
                      <TableHead className="text-right font-semibold text-foreground w-[120px]">Cobrado</TableHead>
                      <TableHead className="text-right font-semibold text-foreground w-[120px]">Pendiente</TableHead>
                      <TableHead className="text-right font-semibold text-foreground w-[160px]">Fee representante</TableHead>
                      <TableHead className="text-right font-semibold text-foreground w-[140px]">Neto artista</TableHead>
                      <TableHead className="font-semibold text-foreground w-[150px]">Nº factura</TableHead>
                      <TableHead className="text-center font-semibold text-foreground w-[110px]">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceRows.map((row) => (
                      <TableRow key={row.dealId} className="[&>td]:py-4">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-muted text-xs">
                                {getInitials(row.artistName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{row.artistName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.eventDate ? format(parseISO(row.eventDate), "d MMM yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.paid)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.pending)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.representativeFee)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.artistNet)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">Factura</div>
                            <div className="text-xs text-muted-foreground">{row.invoiceNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.pdfUrl ? (
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => openPdfUrl(row.pdfUrl || "")}
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                Abrir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenerateInvoice(row)}
                                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                              >
                                Regenerar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGenerateInvoice(row)}
                              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Generar
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}