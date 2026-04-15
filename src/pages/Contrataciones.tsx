import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  XCircle,
  FileText,
  PenSquare,
} from "lucide-react";

type ContratacionEstado = "pendiente" | "confirmada" | "completada" | "cancelada";

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
    | "inquiry"
    | "offer_sent"
    | "countered"
    | "accepted"
    | "rejected"
    | "expired"
    | "contract_pending"
    | "deposit_pending"
    | "deposit_paid"
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
  currency: string;
  total_fee: number | null;
  commission_percent: number | null;
  deposit_percent: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type BookingOffer = {
  id: string;
  booking_deal_id: string;
  version: number;
  created_by_profile_id: string;
  created_by_role: "venue" | "artist" | "representative";
  offer_amount: number;
  currency: string;
  tax_mode: "plus_vat" | "vat_included" | "tax_exempt";
  vat_percent: number | null;
  deposit_percent_requested: number | null;
  deposit_percent_min: number | null;
  message: string | null;
  additional_terms: string | null;
  notes: string | null;
  is_counter_offer: boolean;
  status: "active" | "accepted" | "rejected" | "superseded" | "expired";
  created_at: string;
};

type ContractRecord = {
  id: string;
  booking_deal_id: string;
  contract_number: string | null;
  status: "draft" | "sent" | "signed_artist" | "signed_venue" | "fully_signed";
  contract_html: string | null;
  contract_pdf_url: string | null;
  sent_at: string | null;
  signed_artist_at: string | null;
  signed_venue_at: string | null;
  created_at: string;
  updated_at: string;
};

const ARTISTA_ACTIVO_KEY = "artista_representado_activo_demo";

const formatearCache = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("es-ES");
};

const getArtistImageUrl = (fotoUrl: string | null | undefined) => {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith("http://") || fotoUrl.startsWith("https://")) return fotoUrl;

  const cleanedPath = fotoUrl.startsWith("/") ? fotoUrl.slice(1) : fotoUrl;
  const { data } = supabase.storage.from("artists").getPublicUrl(cleanedPath);
  return data?.publicUrl || null;
};

const coincideArtista = (
  deal: BookingDeal,
  artista: { id?: string | null; nombre?: string | null }
) => {
  return !!artista.id && deal.artist_id === artista.id;
};

const parseDetallesOferta = (notes: string | null) => {
  if (!notes) {
    return {
      hora: "-",
      duracion: "-",
      ubicacion: "-",
      comentario: "",
    };
  }

  const partes = notes.split(" · ");
  const hora = partes.find((parte) => parte.startsWith("Hora:"))?.replace("Hora:", "").trim() || "-";
  const duracion =
    partes.find((parte) => parte.startsWith("Duración:"))?.replace("Duración:", "").trim() || "-";
  const ubicacion =
    partes.find((parte) => parte.startsWith("Ubicación:"))?.replace("Ubicación:", "").trim() || "-";
  const comentario = partes
    .filter(
      (parte) =>
        !parte.startsWith("Hora:") &&
        !parte.startsWith("Duración:") &&
        !parte.startsWith("Ubicación:")
    )
    .join(" · ");

  return { hora, duracion, ubicacion, comentario };
};

const formatCurrency = (amount: number | null | undefined, currency = "EUR") => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Contrataciones = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("todas");
  const [artistaActivo, setArtistaActivo] = useState<ArtistaRepresentadoActivo | null>(null);
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [ownedArtists, setOwnedArtists] = useState<OwnedArtist[]>([]);
  const [artistsById, setArtistsById] = useState<Record<string, ArtistRecord>>({});
  const [offersByDeal, setOffersByDeal] = useState<Record<string, BookingOffer | null>>({});
  const [contractsByDeal, setContractsByDeal] = useState<Record<string, ContractRecord | null>>({});
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [contractActionLoading, setContractActionLoading] = useState(false);

  const tipoUsuario =
    profile?.tipo_usuario || localStorage.getItem("tipo_usuario_demo") || "artista_individual";

  useEffect(() => {
    const guardado = localStorage.getItem(ARTISTA_ACTIVO_KEY);
    if (guardado) {
      setArtistaActivo(JSON.parse(guardado));
    }
  }, []);

  useEffect(() => {
    const cargarArtistasPropios = async () => {
      if (!profile?.id && !profile?.user_id) return;

      const profileId = profile?.id || "";
      const userId = profile?.user_id || "";

      let query = supabase.from("artistas").select("id,nombre");

      if (tipoUsuario === "representante_agencia") {
        query = query.or(`representante_id.eq.${profileId},representante_id.eq.${userId}`);
      } else {
        query = query.or(`perfil_artista_id.eq.${profileId},perfil_artista_id.eq.${userId},user_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOwnedArtists((data as OwnedArtist[]) || []);
      }
    };

    cargarArtistasPropios();
  }, [profile?.id, profile?.user_id, tipoUsuario]);

  useEffect(() => {
    const cargarDeals = async () => {
      const { data: dealsData, error: dealsError } = await supabase
        .from("booking_deals")
        .select("*")
        .in("current_status", ["contract_pending", "deposit_pending", "deposit_paid", "completed", "cancelled"])
        .order("created_at", { ascending: false });

      if (dealsError || !dealsData) {
        setLoading(false);
        return;
      }

      const dealsCargados = dealsData as BookingDeal[];
      setDeals(dealsCargados);

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

      const dealIds = dealsCargados.map((deal) => deal.id);
      const latestOfferIds = dealsCargados
        .map((deal) => deal.latest_offer_id)
        .filter((value): value is string => Boolean(value));

      if (latestOfferIds.length > 0) {
        const { data: offersData } = await supabase
          .from("booking_offers")
          .select("*")
          .in("id", latestOfferIds);

        if (offersData) {
          const mapa: Record<string, BookingOffer | null> = {};
          (offersData as BookingOffer[]).forEach((offer) => {
            mapa[offer.booking_deal_id] = offer;
          });
          setOffersByDeal(mapa);
        }
      }

      if (dealIds.length > 0) {
        const { data: contractsData } = await supabase
          .from("contracts")
          .select("*")
          .in("booking_deal_id", dealIds);

        if (contractsData) {
          const mapaContracts: Record<string, ContractRecord | null> = {};
          (contractsData as ContractRecord[]).forEach((contract) => {
            mapaContracts[contract.booking_deal_id] = contract;
          });
          setContractsByDeal(mapaContracts);
        }
      }

      setLoading(false);
    };

    cargarDeals();
  }, []);

  const limpiarArtistaActivo = () => {
    localStorage.removeItem(ARTISTA_ACTIVO_KEY);
    setArtistaActivo(null);
  };

  const getEstado = (deal: BookingDeal): ContratacionEstado => {
    if (deal.current_status === "cancelled") {
      return "cancelada";
    }

    if (deal.current_status === "contract_pending") {
      return "pendiente";
    }

    if (deal.current_status === "deposit_pending" || deal.current_status === "deposit_paid") {
      return "confirmada";
    }

    if (deal.current_status === "completed") {
      return "completada";
    }

    return "pendiente";
  };

  const getEstadoBadge = (estado: ContratacionEstado) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "confirmada":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Clock className="h-3 w-3" />
            Confirmada
          </Badge>
        );
      case "completada":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completada
          </Badge>
        );
      case "cancelada":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        );
    }
  };

  const getEstadoContratoBadge = (contract: ContractRecord | null) => {
    if (!contract) {
      return (
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Sin contrato
        </Badge>
      );
    }

    switch (contract.status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
            <FileText className="h-3 w-3" />
            Borrador
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <Clock className="h-3 w-3" />
            Enviado
          </Badge>
        );
      case "signed_artist":
      case "signed_venue":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <PenSquare className="h-3 w-3" />
            Firma parcial
          </Badge>
        );
      case "fully_signed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Firmado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            Contrato
          </Badge>
        );
    }
  };

  const dealsFiltrados = useMemo<BookingDeal[]>(() => {
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

    if (activeTab !== "todas") {
      resultado = resultado.filter((deal) => getEstado(deal) === activeTab);
    }

    return resultado;
  }, [deals, ownedArtists, tipoUsuario, artistaActivo, activeTab]);

  const countsBase = useMemo(() => {
    let base = deals;

    if (ownedArtists.length > 0) {
      base = base.filter((deal) =>
        ownedArtists.some((artista) => coincideArtista(deal, artista))
      );
    } else if (tipoUsuario === "artista_individual") {
      base = [];
    }

    if (artistaActivo) {
      base = base.filter((deal) => coincideArtista(deal, artistaActivo));
    }

    return base;
  }, [deals, ownedArtists, tipoUsuario, artistaActivo]);

  const counts = {
    todas: countsBase.length,
    pendiente: countsBase.filter((deal) => getEstado(deal) === "pendiente").length,
    confirmada: countsBase.filter((deal) => getEstado(deal) === "confirmada").length,
    completada: countsBase.filter((deal) => getEstado(deal) === "completada").length,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getArtistInitials = (deal: BookingDeal) => {
    const artistName = artistsById[deal.artist_id]?.nombre || "Artista";
    return artistName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const abrirContrato = (dealId: string, contract: ContractRecord | null) => {
    if (!contract) return;
    setSelectedDealId(dealId);
    setSelectedContract(contract);
  };

  const enviarContrato = async () => {
    if (!selectedContract) return;

    setContractActionLoading(true);

    const { data, error } = await supabase
      .from("contracts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedContract.id)
      .select("*")
      .single();

    if (error || !data) {
      setContractActionLoading(false);
      return;
    }

    const updatedContract = data as ContractRecord;

    setContractsByDeal((prev) => ({
      ...prev,
      [updatedContract.booking_deal_id]: updatedContract,
    }));
    setSelectedContract(updatedContract);
    setContractActionLoading(false);
  };

  const firmarContratoArtist = async () => {
    if (!selectedContract || !selectedDealId) return;

    setContractActionLoading(true);

    const nextStatus =
      selectedContract.status === "signed_venue" ? "fully_signed" : "signed_artist";

    const { data, error } = await supabase
      .from("contracts")
      .update({
        status: nextStatus,
        signed_artist_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedContract.id)
      .select("*")
      .single();

    if (error || !data) {
      setContractActionLoading(false);
      return;
    }

    const updatedContract = data as ContractRecord;

    setContractsByDeal((prev) => ({
      ...prev,
      [updatedContract.booking_deal_id]: updatedContract,
    }));
    setSelectedContract(updatedContract);

    if (nextStatus === "fully_signed") {
      await supabase
        .from("booking_deals")
        .update({
          current_status: "deposit_pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedDealId);

      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === selectedDealId
            ? { ...deal, current_status: "deposit_pending", updated_at: new Date().toISOString() }
            : deal
        )
      );
    }

    setContractActionLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrataciones</h1>
          <p className="text-muted-foreground mt-1">
            Sigue contratos, acuerdos cerrados y estado posterior a la negociación
          </p>
        </div>

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
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <p className="text-sm text-muted-foreground">Vista general</p>
            <h3 className="text-xl font-semibold">
              {tipoUsuario === "representante_agencia"
                ? "Todos los contratos de la agencia"
                : "Contratos del artista"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tipoUsuario === "representante_agencia"
                ? "Estás viendo acuerdos cerrados, borradores de contrato y estado contractual de todos los artistas representados."
                : "Estás viendo los acuerdos cerrados y contratos asociados a tu perfil artístico."}
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="todas" className="gap-2">
                  Todas
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {counts.todas}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pendiente" className="gap-2">
                  Pendientes
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {counts.pendiente}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="confirmada" className="gap-2">
                  Confirmadas
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {counts.confirmada}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completada" className="gap-2">
                  Completadas
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {counts.completada}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : dealsFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No hay contrataciones {activeTab !== "todas" ? `${activeTab}s` : ""} para mostrar
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead>Artista</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealsFiltrados.map((deal) => {
                      const latestOffer = offersByDeal[deal.id] || null;
                      const contract = contractsByDeal[deal.id] || null;
                      const detalles = parseDetallesOferta(latestOffer?.notes || deal.notes);
                      const importe = latestOffer?.offer_amount ?? deal.total_fee ?? 0;
                      const duracion =
                        detalles.duracion !== "-"
                          ? detalles.duracion
                          : deal.duration_minutes
                            ? `${deal.duration_minutes} min`
                            : "-";
                      const hora = detalles.hora !== "-" ? detalles.hora : deal.event_start_time || "-";
                      const notas = latestOffer?.message || detalles.comentario || deal.notes || "-";

                      return (
                        <TableRow key={deal.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(deal.venue_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{deal.venue_name}</p>
                                <p className="text-xs text-muted-foreground">{deal.city || detalles.ubicacion || "-"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                {getArtistImageUrl(artistsById[deal.artist_id]?.foto_url) ? (
                                  <img
                                    src={getArtistImageUrl(artistsById[deal.artist_id]?.foto_url) || ""}
                                    alt={artistsById[deal.artist_id]?.nombre || "Artista"}
                                    className="h-9 w-9 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-muted text-xs">
                                  {getArtistInitials(deal)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{artistsById[deal.artist_id]?.nombre || "Artista"}</p>
                                <p className="text-xs text-muted-foreground capitalize">{deal.deal_type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {deal.event_date
                              ? format(new Date(deal.event_date), "d MMM yyyy", { locale: es })
                              : "-"}
                          </TableCell>
                          <TableCell>{hora}</TableCell>
                          <TableCell>{duracion}</TableCell>
                          <TableCell>
                            <span className="font-medium text-muted-foreground">
                              {formatCurrency(importe, latestOffer?.currency || deal.currency || "EUR")}
                            </span>
                          </TableCell>
                          <TableCell>{getEstadoBadge(getEstado(deal))}</TableCell>
                          <TableCell>{getEstadoContratoBadge(contract)}</TableCell>
                          <TableCell className="max-w-[260px]">
                            <p className="truncate text-sm text-muted-foreground">
                              {notas}
                            </p>
                          </TableCell>
                          <TableCell>
                            {contract ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirContrato(deal.id, contract)}
                              >
                                Ver contrato
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No disponible</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!selectedContract} onOpenChange={(open) => {
        if (!open) {
          setSelectedContract(null);
          setSelectedDealId(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedContract?.contract_number || "Contrato"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto rounded-lg border border-border/50 bg-secondary/20 p-6">
            {selectedContract?.contract_html ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No hay contenido de contrato disponible.</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {getEstadoContratoBadge(selectedContract)}
            </div>

            <div className="flex items-center gap-2">
              {selectedContract?.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={enviarContrato}
                  disabled={contractActionLoading}
                >
                  {contractActionLoading ? "Enviando..." : "Enviar contrato"}
                </Button>
              )}

              {(selectedContract?.status === "sent" || selectedContract?.status === "signed_venue") && (
                <Button
                  onClick={firmarContratoArtist}
                  disabled={contractActionLoading}
                >
                  {contractActionLoading ? "Firmando..." : "Firmar contrato"}
                </Button>
              )}

              {selectedContract?.contract_pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedContract.contract_pdf_url as string, "_blank")}
                >
                  Abrir PDF
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Contrataciones;