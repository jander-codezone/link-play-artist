import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, Info, Users, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  rider_tecnico_pdf: string | null;
  rider_tecnico_comentarios: string | null;
  rider_hospitality_pdf: string | null;
  rider_hospitality_comentarios: string | null;
};


type ArtistBookingPreference = {
  artist_id: string;
  tier: "standard" | "premium";
  deposit_percent_default: number;
  deposit_percent_min: number;
  max_offer_versions: number;
};

type DealRider = {
  id: string;
  booking_deal_id: string;
  defined_by_role: "artist" | "representative";
  defined_by_profile_id: string | null;
  technical_requires_cdjs: boolean;
  technical_requires_mixer: boolean;
  technical_requires_monitors: boolean;
  technical_requires_microphone: boolean;
  technical_requires_sound_engineer: boolean;
  technical_requires_lighting: boolean;
  technical_requires_dj_booth: boolean;
  technical_requires_power_access: boolean;
  technical_additional_notes: string | null;
  hospitality_requires_hotel: boolean;
  hospitality_requires_catering: boolean;
  hospitality_requires_dressing_room: boolean;
  hospitality_requires_beverages: boolean;
  hospitality_requires_ground_transport: boolean;
  hospitality_requires_security_access: boolean;
  hospitality_additional_notes: string | null;
  created_at: string;
  updated_at: string;
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
  includes_hotel: boolean;
  includes_transport: boolean;
  includes_dietas: boolean;
  includes_transfers: boolean;
  message: string | null;
  additional_terms: string | null;
  notes: string | null;
  is_counter_offer: boolean;
  status: "active" | "accepted" | "rejected" | "superseded" | "expired";
  created_at: string;
};

type NotificationItem = {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  status: BookingDeal["current_status"];
  dealId: string;
  offerId: string | null;
};

const ARTISTA_ACTIVO_KEY = "artista_representado_activo_demo";

const normalizarTexto = (valor: string) => {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase()
    .trim();
};

const coincideArtista = (
  deal: BookingDeal,
  artista: { id?: string | null; nombre?: string | null }
) => {
  const idsCoinciden = !!artista.id && deal.artist_id === artista.id;
  return idsCoinciden;
};

const formatearCache = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("es-ES");
};

const formatearTiempoRelativo = (fechaISO: string) => {
  const ahora = new Date().getTime();
  const fecha = new Date(fechaISO).getTime();
  const diferenciaMs = ahora - fecha;

  const minutos = Math.floor(diferenciaMs / (1000 * 60));
  const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (minutos < 1) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${dias} d`;
};

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const formatMoney = (amount: number | null | undefined, currency = "EUR") => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};



const getTechnicalRiderItems = (rider: DealRider | null) => {
  if (!rider) return [] as string[];

  return [
    rider.technical_requires_cdjs ? "CDJs / reproductores" : null,
    rider.technical_requires_mixer ? "Mixer" : null,
    rider.technical_requires_monitors ? "Monitores booth" : null,
    rider.technical_requires_microphone ? "Micrófono" : null,
    rider.technical_requires_sound_engineer ? "Técnico de sonido" : null,
    rider.technical_requires_lighting ? "Iluminación" : null,
    rider.technical_requires_dj_booth ? "Cabina DJ" : null,
    rider.technical_requires_power_access ? "Acceso eléctrico" : null,
  ].filter(Boolean) as string[];
};

const getHospitalityRiderItems = (rider: DealRider | null) => {
  if (!rider) return [] as string[];

  return [
    rider.hospitality_requires_hotel ? "Hotel" : null,
    rider.hospitality_requires_catering ? "Catering" : null,
    rider.hospitality_requires_dressing_room ? "Camerino" : null,
    rider.hospitality_requires_beverages ? "Bebidas" : null,
    rider.hospitality_requires_ground_transport ? "Transporte local" : null,
    rider.hospitality_requires_security_access ? "Acceso / seguridad" : null,
  ].filter(Boolean) as string[];
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

export default function Notificaciones() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [artistaActivo, setArtistaActivo] = useState<ArtistaRepresentadoActivo | null>(null);
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [offersByDeal, setOffersByDeal] = useState<Record<string, BookingOffer | null>>({});
  const [ownedArtists, setOwnedArtists] = useState<OwnedArtist[]>([]);
  const [artistPreferencesById, setArtistPreferencesById] = useState<Record<string, ArtistBookingPreference>>({});
  const [dealRidersByDealId, setDealRidersByDealId] = useState<Record<string, DealRider | null>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [counterOfferTarget, setCounterOfferTarget] = useState<NotificationItem | null>(null);
  const [counterOfferForm, setCounterOfferForm] = useState({
    amount: "",
    depositPercent: "",
    message: "",
  });

  const [riderOpen, setRiderOpen] = useState(false);
  const [riderTargetDealId, setRiderTargetDealId] = useState<string | null>(null);
  const [riderForm, setRiderForm] = useState({
    technical_requires_cdjs: false,
    technical_requires_mixer: false,
    technical_requires_monitors: false,
    technical_requires_microphone: false,
    technical_requires_sound_engineer: false,
    technical_requires_lighting: false,
    technical_requires_dj_booth: false,
    technical_requires_power_access: false,
    technical_additional_notes: "",
    hospitality_requires_hotel: false,
    hospitality_requires_catering: false,
    hospitality_requires_dressing_room: false,
    hospitality_requires_beverages: false,
    hospitality_requires_ground_transport: false,
    hospitality_requires_security_access: false,
    hospitality_additional_notes: "",
  });

  const tipoUsuario =
    profile?.tipo_usuario || localStorage.getItem("tipo_usuario_demo") || "artista_individual";

  useEffect(() => {
    const guardadoArtista = localStorage.getItem(ARTISTA_ACTIVO_KEY);
    if (guardadoArtista) {
      setArtistaActivo(JSON.parse(guardadoArtista));
    }
  }, []);

  useEffect(() => {
    const cargarArtistasPropios = async () => {
      if (!profile?.id && !profile?.user_id) return;

      const profileId = profile?.id || "";
      const userId = profile?.user_id || "";

      let query = supabase
        .from("artistas")
        .select("id,nombre,rider_tecnico_pdf,rider_tecnico_comentarios,rider_hospitality_pdf,rider_hospitality_comentarios");

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
        .order("created_at", { ascending: false });

      if (dealsError || !dealsData) {
        setLoading(false);
        return;
      }

      const dealsCargados = dealsData as BookingDeal[];
      setDeals(dealsCargados);

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

      const artistIds = Array.from(new Set(dealsCargados.map((deal) => deal.artist_id).filter(Boolean)));
      if (artistIds.length > 0) {
        const { data: preferencesData } = await supabase
          .from("artist_booking_preferences")
          .select("artist_id,tier,deposit_percent_default,deposit_percent_min,max_offer_versions")
          .in("artist_id", artistIds);

        if (preferencesData) {
          const mapaPreferencias: Record<string, ArtistBookingPreference> = {};
          (preferencesData as ArtistBookingPreference[]).forEach((preference) => {
            mapaPreferencias[preference.artist_id] = preference;
          });
          setArtistPreferencesById(mapaPreferencias);
        }
      }

      const dealIds = dealsCargados.map((deal) => deal.id).filter(Boolean);
      if (dealIds.length > 0) {
        const { data: ridersData } = await supabase
          .from("deal_riders")
          .select("*")
          .in("booking_deal_id", dealIds);

        if (ridersData) {
          const mapaRiders: Record<string, DealRider | null> = {};
          (ridersData as DealRider[]).forEach((rider) => {
            mapaRiders[rider.booking_deal_id] = rider;
          });
          setDealRidersByDealId(mapaRiders);
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

    return resultado;
  }, [deals, ownedArtists, tipoUsuario, artistaActivo]);

  const getOwnedArtistById = (artistId: string) => {
    return ownedArtists.find((artist) => artist.id === artistId) || null;
  };

  const abrirContraoferta = (notification: NotificationItem) => {
    const deal = deals.find((item) => item.id === notification.dealId);
    const latestOffer = offersByDeal[notification.dealId] || null;
    const preferencias = deal ? artistPreferencesById[deal.artist_id] : undefined;

    setCounterOfferTarget(notification);
    setCounterOfferForm({
      amount: String(latestOffer?.offer_amount ?? deal?.total_fee ?? ""),
      depositPercent: String(
        latestOffer?.deposit_percent_requested ??
          deal?.deposit_percent ??
          preferencias?.deposit_percent_default ??
          40
      ),
      message: latestOffer?.message || "",
    });
    setCounterOfferOpen(true);
  };

  const abrirConfigRider = (dealId: string) => {
    const rider = dealRidersByDealId[dealId] || null;
    const deal = deals.find((item) => item.id === dealId);
    const ownedArtist = getOwnedArtistById(deal?.artist_id || "");
    setRiderTargetDealId(dealId);
    setRiderForm({
      technical_requires_cdjs: false,
      technical_requires_mixer: false,
      technical_requires_monitors: false,
      technical_requires_microphone: false,
      technical_requires_sound_engineer: false,
      technical_requires_lighting: false,
      technical_requires_dj_booth: false,
      technical_requires_power_access: false,
      technical_additional_notes:
        rider?.technical_additional_notes || ownedArtist?.rider_tecnico_comentarios || "",
      hospitality_requires_hotel: false,
      hospitality_requires_catering: false,
      hospitality_requires_dressing_room: false,
      hospitality_requires_beverages: false,
      hospitality_requires_ground_transport: false,
      hospitality_requires_security_access: false,
      hospitality_additional_notes:
        rider?.hospitality_additional_notes || ownedArtist?.rider_hospitality_comentarios || "",
    });
    setRiderOpen(true);
  };

  const guardarRider = async () => {
    if (!riderTargetDealId) return;

    const deal = deals.find((item) => item.id === riderTargetDealId);
    if (!deal) {
      toast.error("No se encontró el deal para configurar el rider");
      return;
    }

    const definedByRole = deal.representative_profile_id ? "representative" : "artist";
    const definedByProfileId = deal.representative_profile_id || deal.artist_profile_id || profile?.id || null;

    setUpdatingId(riderTargetDealId);

    const { data: riderData, error: riderError } = await supabase
      .from("deal_riders")
      .upsert(
        {
          booking_deal_id: riderTargetDealId,
          defined_by_role: definedByRole,
          defined_by_profile_id: definedByProfileId,
          ...riderForm,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "booking_deal_id" }
      )
      .select("*")
      .single();

    if (riderError || !riderData) {
      toast.error("No se pudo guardar el rider de la negociación");
      setUpdatingId(null);
      return;
    }

    setDealRidersByDealId((prev) => ({
      ...prev,
      [riderTargetDealId]: riderData as DealRider,
    }));

    toast.success("Rider de la negociación guardado correctamente");
    setRiderOpen(false);
    setRiderTargetDealId(null);
    setUpdatingId(null);
  };

  const enviarContraoferta = async () => {
    if (!counterOfferTarget) return;

    const deal = deals.find((item) => item.id === counterOfferTarget.dealId);
    if (!deal) {
      toast.error("No se encontró el deal");
      return;
    }

    const latestOffer = offersByDeal[deal.id] || null;
    const preferencias = artistPreferencesById[deal.artist_id];
    const maxVersions = preferencias?.max_offer_versions || 4;

    if (deal.current_offer_version >= maxVersions) {
      toast.error(`Se alcanzó el límite de ${maxVersions} rondas de negociación`);
      return;
    }

    const amount = Number(counterOfferForm.amount);
    const depositPercent = Number(counterOfferForm.depositPercent);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Introduce un importe válido para la contraoferta");
      return;
    }

    if (!Number.isFinite(depositPercent) || depositPercent <= 0) {
      toast.error("Introduce un % de adelanto válido");
      return;
    }

    setUpdatingId(deal.id);

    if (latestOffer?.id) {
      await supabase
        .from("booking_offers")
        .update({ status: "superseded" })
        .eq("id", latestOffer.id);
    }

    const nuevaVersion = (deal.current_offer_version || 1) + 1;
    const createdByProfileId = deal.representative_profile_id || deal.artist_profile_id || profile?.id;
    const createdByRole = deal.representative_profile_id ? "representative" : "artist";

    const { data: nuevaOferta, error: nuevaOfertaError } = await supabase
      .from("booking_offers")
      .insert({
        booking_deal_id: deal.id,
        version: nuevaVersion,
        created_by_profile_id: createdByProfileId,
        created_by_role: createdByRole,
        offer_amount: amount,
        currency: latestOffer?.currency || deal.currency || "EUR",
        tax_mode: latestOffer?.tax_mode || "plus_vat",
        vat_percent: latestOffer?.vat_percent || 21,
        deposit_percent_requested: depositPercent,
        deposit_percent_min: preferencias?.deposit_percent_min || latestOffer?.deposit_percent_min || null,
        message: counterOfferForm.message,
        additional_terms: latestOffer?.additional_terms || null,
        notes: counterOfferForm.message,
        is_counter_offer: true,
        status: "active",
      })
      .select("id")
      .single();

    if (nuevaOfertaError || !nuevaOferta) {
      toast.error("No se pudo enviar la contraoferta");
      setUpdatingId(null);
      return;
    }

    const { error: dealUpdateError } = await supabase
      .from("booking_deals")
      .update({
        current_status: "countered",
        current_offer_version: nuevaVersion,
        latest_offer_id: nuevaOferta.id,
        total_fee: amount,
        deposit_percent: depositPercent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deal.id);

    if (dealUpdateError) {
      toast.error("Se creó la contraoferta, pero no se pudo actualizar el deal");
      setUpdatingId(null);
      return;
    }

    setDeals((prev) =>
      prev.map((item) =>
        item.id === deal.id
          ? {
              ...item,
              current_status: "countered",
              current_offer_version: nuevaVersion,
              latest_offer_id: nuevaOferta.id,
              total_fee: amount,
              deposit_percent: depositPercent,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setOffersByDeal((prev) => ({
      ...prev,
      [deal.id]: {
        id: nuevaOferta.id,
        booking_deal_id: deal.id,
        version: nuevaVersion,
        created_by_profile_id: createdByProfileId || "",
        created_by_role: createdByRole,
        offer_amount: amount,
        currency: latestOffer?.currency || deal.currency || "EUR",
        tax_mode: latestOffer?.tax_mode || "plus_vat",
        vat_percent: latestOffer?.vat_percent || 21,
        deposit_percent_requested: depositPercent,
        deposit_percent_min: preferencias?.deposit_percent_min || latestOffer?.deposit_percent_min || null,
        message: counterOfferForm.message,
        additional_terms: latestOffer?.additional_terms || null,
        notes: counterOfferForm.message,
        is_counter_offer: true,
        status: "active",
        created_at: new Date().toISOString(),
      },
    }));

    toast.success("Contraoferta enviada correctamente");
    setCounterOfferOpen(false);
    setCounterOfferTarget(null);
    setUpdatingId(null);
  };

  const notifications = useMemo<NotificationItem[]>(() => {
    if (dealsFiltrados.length === 0) return [];

    return dealsFiltrados.map((deal) => {
      const latestOffer = offersByDeal[deal.id] || null;
      const importe = latestOffer?.offer_amount ?? deal.total_fee ?? 0;
      const detalles = parseDetallesOferta(latestOffer?.notes || deal.notes);

      const type: NotificationItem["type"] =
        deal.current_status === "accepted" ||
        deal.current_status === "contract_pending" ||
        deal.current_status === "deposit_pending" ||
        deal.current_status === "deposit_paid" ||
        deal.current_status === "completed"
          ? "success"
          : deal.current_status === "rejected" ||
              deal.current_status === "cancelled" ||
              deal.current_status === "expired"
            ? "warning"
            : "info";

      const title =
        deal.current_status === "contract_pending"
          ? `Contrato pendiente · ${deal.venue_name}`
          : deal.current_status === "accepted"
            ? `Oferta aceptada · ${deal.venue_name}`
            : deal.current_status === "rejected"
              ? `Oferta rechazada · ${deal.venue_name}`
              : deal.current_status === "countered"
                ? `Contraoferta abierta · ${deal.venue_name}`
                : `Nueva oferta · ${deal.venue_name}`;

      const message =
        deal.current_status === "contract_pending"
          ? `${deal.venue_name} ha aceptado las condiciones y la negociación ha pasado a contrato. Revisa el rider y continúa la firma desde contrataciones.`
          : deal.current_status === "accepted"
            ? `${deal.venue_name} · ${deal.city || detalles.ubicacion} · ${deal.event_date} · ${Number(importe).toLocaleString("es-ES")} €`
            : deal.current_status === "rejected"
              ? `${deal.venue_name} · ${deal.city || detalles.ubicacion} · ${deal.event_date}`
              : `${deal.venue_name} propone ${Number(importe).toLocaleString("es-ES")} € para el ${deal.event_date}. ${detalles.hora !== "-" ? `Hora: ${detalles.hora}. ` : ""}${detalles.duracion !== "-" ? `Duración: ${detalles.duracion}. ` : ""}${detalles.comentario || ""}`.trim();

      return {
        id: deal.id,
        dealId: deal.id,
        offerId: latestOffer?.id || null,
        type,
        title,
        message,
        time: formatearTiempoRelativo(deal.updated_at || deal.created_at),
        read:
          deal.current_status !== "offer_sent" &&
          deal.current_status !== "countered" &&
          deal.current_status !== "contract_pending",
        status: deal.current_status,
      };
    });
  }, [dealsFiltrados, offersByDeal]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const actualizarEstadoDeal = async (
    dealId: string,
    nuevoEstado: "accepted" | "rejected"
  ) => {
    setUpdatingId(dealId);

    const deal = deals.find((item) => item.id === dealId);
    if (!deal) {
      toast.error("No se encontró el deal");
      setUpdatingId(null);
      return;
    }

    const latestOffer = offersByDeal[dealId] || null;
    const importe = latestOffer?.offer_amount ?? deal.total_fee ?? 0;
    const commissionPercent = Number(deal.commission_percent || 0);
    const depositPercent = Number(deal.deposit_percent || 0);

    const commissionAmount = Number(((importe * commissionPercent) / 100).toFixed(2));
    const depositAmount = Number(((importe * depositPercent) / 100).toFixed(2));
    const balanceAmount = Number((importe - depositAmount).toFixed(2));
    const payoutToArtist = Number((importe - commissionAmount).toFixed(2));

    const targetStatus = nuevoEstado === "accepted" ? "contract_pending" : nuevoEstado;

    const { error: dealError } = await supabase
      .from("booking_deals")
      .update({
        current_status: targetStatus,
        total_fee: importe,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    if (dealError) {
      toast.error("No se pudo actualizar el deal");
      setUpdatingId(null);
      return;
    }

    const rider = dealRidersByDealId[dealId] || null;

    if (nuevoEstado === "accepted") {
      const { data: existingContract, error: existingContractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("booking_deal_id", dealId)
        .maybeSingle();

      if (existingContractError) {
        toast.error("La negociación se aceptó, pero no se pudo verificar el contrato");
        setUpdatingId(null);
        return;
      }

      if (!existingContract) {
        const taxNote =
          latestOffer?.tax_mode === "plus_vat"
            ? "IVA no incluido"
            : latestOffer?.tax_mode === "vat_included"
              ? "IVA incluido"
              : "Sin impuestos";

        const technicalItems = getTechnicalRiderItems(rider);
        const hospitalityItems = getHospitalityRiderItems(rider);

        const contractHtml = `
          <h1>Contrato de actuación</h1>
          <p><strong>Venue:</strong> ${deal.venue_name}</p>
          <p><strong>Artista:</strong> ${ownedArtists.find((artist) => artist.id === deal.artist_id)?.nombre || "Artista"}</p>
          <p><strong>Fecha:</strong> ${deal.event_date}</p>
          <p><strong>Hora:</strong> ${deal.event_start_time || "-"}</p>
          <p><strong>Duración:</strong> ${deal.duration_minutes || 0} min</p>
          <p><strong>Ubicación:</strong> ${deal.city || "-"}, ${deal.country || "-"}</p>
          <p><strong>Importe acordado:</strong> ${formatMoney(importe, latestOffer?.currency || deal.currency)} (${taxNote})</p>
          <p><strong>Adelanto acordado:</strong> ${deal.deposit_percent || 0}%</p>
          <p><strong>Mensaje / condiciones:</strong> ${latestOffer?.message || deal.notes || "-"}</p>
          <h2>Rider técnico</h2>
          <p>${technicalItems.length > 0 ? technicalItems.join(", ") : "Sin requisitos técnicos marcados"}</p>
          <p>${rider?.technical_additional_notes || ""}</p>
          <h2>Hospitality</h2>
          <p>${hospitalityItems.length > 0 ? hospitalityItems.join(", ") : "Sin requisitos de hospitality marcados"}</p>
          <p>${rider?.hospitality_additional_notes || ""}</p>
        `;

        const contractNumber = `CT-${new Date().getFullYear()}-${dealId.slice(0, 8).toUpperCase()}`;

        const { error: contractInsertError } = await supabase.from("contracts").insert({
          booking_deal_id: dealId,
          contract_number: contractNumber,
          status: "draft",
          contract_html: contractHtml,
          updated_at: new Date().toISOString(),
        });

        if (contractInsertError) {
          toast.error("La negociación se aceptó, pero no se pudo crear el borrador de contrato");
          setUpdatingId(null);
          return;
        }
      }
    }

    if (latestOffer?.id) {
      await supabase
        .from("booking_offers")
        .update({ status: nuevoEstado === "accepted" ? "accepted" : "rejected" })
        .eq("id", latestOffer.id);
    }


    setDeals((prev) =>
      prev.map((item) =>
        item.id === dealId
          ? {
              ...item,
              current_status: targetStatus,
              total_fee: importe,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    toast.success(
      nuevoEstado === "accepted"
        ? "Oferta aceptada correctamente. Ya puedes revisar el rider y continuar con el contrato."
        : "Oferta rechazada correctamente"
    );

    setUpdatingId(null);
  };

  return (
    <AppLayout title="Notificaciones" subtitle="Centro de alertas y avisos">
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
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <p className="text-sm text-muted-foreground">Vista general</p>
            <h3 className="text-xl font-semibold">
              {tipoUsuario === "representante_agencia"
                ? "Notificaciones de toda la agencia"
                : "Notificaciones del artista"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tipoUsuario === "representante_agencia"
                ? "Estás viendo las ofertas agregadas de todos los artistas representados."
                : "Estás viendo las ofertas asociadas a tu perfil artístico."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Centro de Notificaciones</h3>
              <p className="text-sm text-muted-foreground">{unreadCount} sin leer</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Marcar todas como leídas
          </Button>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground mb-4">Todas las notificaciones</p>
            {loading ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                Cargando ofertas...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                Aún no hay ofertas ni avisos nuevos.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                      notification.read ? "bg-muted/30" : "bg-muted/70"
                    }`}
                  >
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                      {(() => {
                        const deal = deals.find((item) => item.id === notification.dealId);
                        const latestOffer = offersByDeal[notification.dealId] || null;
                        const rider = dealRidersByDealId[notification.dealId] || null;
                        const technicalItems = getTechnicalRiderItems(rider);
                        const hospitalityItems = getHospitalityRiderItems(rider);
                        const taxNote =
                          latestOffer?.tax_mode === "plus_vat"
                            ? "IVA no incluido"
                            : latestOffer?.tax_mode === "vat_included"
                              ? "IVA incluido"
                              : "Sin impuestos";

                        return deal && latestOffer ? (
                          <div className="mt-4 rounded-lg border border-border bg-background/70 p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Importe oferta</p>
                                <p className="font-semibold">{formatMoney(latestOffer.offer_amount, latestOffer.currency)}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">{taxNote}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Adelanto propuesto</p>
                                <p className="font-semibold">{latestOffer.deposit_percent_requested || deal.deposit_percent || 0}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Versión</p>
                                <p className="font-semibold">V{latestOffer.version}</p>
                              </div>
                            </div>

                            {latestOffer.message && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Mensaje del venue</p>
                                <p className="text-sm text-foreground">{latestOffer.message}</p>
                              </div>
                            )}

                            {rider && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Rider técnico</p>
                                  <div className="flex flex-wrap gap-2">
                                    {technicalItems.length > 0 ? (
                                      technicalItems.map((item) => (
                                        <Badge key={item} variant="secondary">{item}</Badge>
                                      ))
                                    ) : (
                                      <Badge variant="outline">Sin requisitos técnicos marcados</Badge>
                                    )}
                                  </div>
                                  {rider.technical_additional_notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {rider.technical_additional_notes}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Hospitality</p>
                                  <div className="flex flex-wrap gap-2">
                                    {hospitalityItems.length > 0 ? (
                                      hospitalityItems.map((item) => (
                                        <Badge key={item} variant="secondary">{item}</Badge>
                                      ))
                                    ) : (
                                      <Badge variant="outline">Sin requisitos de hospitality marcados</Badge>
                                    )}
                                  </div>
                                  {rider.hospitality_additional_notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {rider.hospitality_additional_notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>

                      {(notification.status === "offer_sent" ||
                        notification.status === "countered" ||
                        notification.status === "contract_pending") && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {notification.status === "contract_pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate("/contrataciones")}
                              >
                                Ver contrato
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirConfigRider(notification.dealId)}
                                disabled={updatingId === notification.dealId}
                              >
                                Enviar rider
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => actualizarEstadoDeal(notification.dealId, "accepted")}
                                disabled={updatingId === notification.dealId}
                              >
                                Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => actualizarEstadoDeal(notification.dealId, "rejected")}
                                disabled={updatingId === notification.dealId}
                              >
                                Rechazar
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => abrirContraoferta(notification)}
                                disabled={updatingId === notification.dealId}
                              >
                                <MessageSquareReply className="h-4 w-4 mr-2" />
                                Contraoferta
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirConfigRider(notification.dealId)}
                                disabled={updatingId === notification.dealId}
                              >
                                Enviar rider
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={riderOpen}
        onOpenChange={(open) => {
          setRiderOpen(open);
          if (!open) setRiderTargetDealId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Enviar rider de esta negociación</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {(() => {
              const deal = deals.find((item) => item.id === riderTargetDealId);
              const ownedArtist = deal ? getOwnedArtistById(deal.artist_id) : null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <p className="text-sm font-medium">Rider técnico (PDF)</p>
                    {ownedArtist?.rider_tecnico_pdf ? (
                      <a
                        href={ownedArtist.rider_tecnico_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-medium text-primary underline"
                      >
                        Abrir PDF del rider técnico
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay PDF técnico configurado para este artista.</p>
                    )}
                    <div>
                      <Label htmlFor="technical-notes">Comentarios adicionales rider técnico</Label>
                      <Textarea
                        id="technical-notes"
                        value={riderForm.technical_additional_notes}
                        onChange={(e) => setRiderForm((prev) => ({ ...prev, technical_additional_notes: e.target.value }))}
                        placeholder="Añade comentarios adicionales que acompañarán al PDF técnico..."
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <p className="text-sm font-medium">Rider hospitality (PDF)</p>
                    {ownedArtist?.rider_hospitality_pdf ? (
                      <a
                        href={ownedArtist.rider_hospitality_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-medium text-primary underline"
                      >
                        Abrir PDF del rider hospitality
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay PDF hospitality configurado para este artista.</p>
                    )}
                    <div>
                      <Label htmlFor="hospitality-notes">Comentarios adicionales rider hospitality</Label>
                      <Textarea
                        id="hospitality-notes"
                        value={riderForm.hospitality_additional_notes}
                        onChange={(e) => setRiderForm((prev) => ({ ...prev, hospitality_additional_notes: e.target.value }))}
                        placeholder="Añade comentarios adicionales que acompañarán al PDF de hospitality..."
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRiderOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarRider} disabled={updatingId === riderTargetDealId}>
                Enviar rider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar contraoferta</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="counter-amount">Importe de contraoferta (€)</Label>
                <Input
                  id="counter-amount"
                  type="text"
                  inputMode="numeric"
                  value={counterOfferForm.amount}
                  onChange={(e) =>
                    setCounterOfferForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="counter-deposit">Adelanto propuesto (%)</Label>
                <Input
                  id="counter-deposit"
                  type="number"
                  value={counterOfferForm.depositPercent}
                  onChange={(e) =>
                    setCounterOfferForm((prev) => ({ ...prev, depositPercent: e.target.value }))
                  }
                />
              </div>
            </div>



            <div>
              <Label htmlFor="counter-message">Mensaje de la contraoferta</Label>
              <Textarea
                id="counter-message"
                value={counterOfferForm.message}
                onChange={(e) =>
                  setCounterOfferForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Explica los ajustes de tu contraoferta..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCounterOfferOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={enviarContraoferta} disabled={updatingId === counterOfferTarget?.dealId}>
                Enviar contraoferta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
