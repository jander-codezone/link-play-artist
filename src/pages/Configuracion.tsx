import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, DollarSign, Calendar, Clock, Loader2, Users, Crown, Building, CreditCard, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DisponibilidadSemanal, DisponibilidadSemanalData } from "@/components/configuracion/DisponibilidadSemanal";
import { ExcepcionesDisponibilidad, ExcepcionFecha } from "@/components/configuracion/ExcepcionesDisponibilidad";
import { DisponibilidadPremium, DisponibilidadPremiumItem } from "@/components/configuracion/DisponibilidadPremium";
import { GestionArtistas, ArtistaGestionado } from "@/components/configuracion/GestionArtistas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  getTiersForUserType, 
  getTierByProductId, 
  type UserType 
} from "@/lib/subscription-tiers";

const estilosMusicales = [
  "House", "Techno", "Tech House", "Minimal", "Deep House", 
  "Progressive", "Trance", "Drum & Bass", "Dubstep", "Hip Hop",
  "R&B", "Pop", "Rock", "Jazz", "Electrónica", "Reggaeton", "Latino"
];

const tiposArtista = [
  "DJ", "Productor", "DJ/Productor", "Cantante", "Banda", "Solista", "Grupo"
];

const disponibilidadInicial: DisponibilidadSemanalData = {
  lunes: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  martes: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  miercoles: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  jueves: { activo: false, horaInicio: "22:00", horaFin: "04:00" },
  viernes: { activo: false, horaInicio: "23:00", horaFin: "06:00" },
  sabado: { activo: false, horaInicio: "23:00", horaFin: "07:00" },
  domingo: { activo: false, horaInicio: "21:00", horaFin: "03:00" },
};

type TipoUsuario = "artista_individual" | "representante_agencia" | "artista" | "representante" | "venue";

export default function Configuracion() {
  const { profile } = useAuth();

  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("artista_individual");
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  
  // Estado para suscripción
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);

  // Estado para cobros / Stripe Connect
  const [payoutAccountLoading, setPayoutAccountLoading] = useState(false);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [payoutAccount, setPayoutAccount] = useState<{
    profile_id: string;
    account_type: "artist" | "representative";
    stripe_connected_account_id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null>(null);
  
  // Estado para artista individual
  const [artistaId, setArtistaId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState({
    nombre: "",
    tipoArtista: "",
    estiloMusical: "",
    descripcion: "",
    cacheMin: "",
    cacheMax: "",
    email: "",
  });
  const [disponibilidadSemanal, setDisponibilidadSemanal] = useState<DisponibilidadSemanalData>(disponibilidadInicial);
  const [excepciones, setExcepciones] = useState<ExcepcionFecha[]>([]);

  // Estado para representante
  const [artistasGestionados, setArtistasGestionados] = useState<ArtistaGestionado[]>([]);
  const [artistaSeleccionado, setArtistaSeleccionado] = useState<string | null>(null);
  const [disponibilidadPremium, setDisponibilidadPremium] = useState<DisponibilidadPremiumItem[]>([]);

  const payoutProfileId = useMemo(() => {
    const normalizedTipoUsuario = String(tipoUsuario || "").toLowerCase();

    const isRepresentative =
      normalizedTipoUsuario === "representante_agencia" ||
      normalizedTipoUsuario === "representante" ||
      normalizedTipoUsuario === "agencia" ||
      normalizedTipoUsuario === "manager";

    const isArtist =
      normalizedTipoUsuario === "artista_individual" ||
      normalizedTipoUsuario === "artista" ||
      normalizedTipoUsuario === "artist";

    if ((isRepresentative || isArtist) && perfilId) {
      return perfilId;
    }

    return perfilId || null;
  }, [tipoUsuario, perfilId]);

  const payoutAccountType = useMemo<"artist" | "representative" | null>(() => {
    const normalizedTipoUsuario = String(tipoUsuario || "").toLowerCase();

    if (
      normalizedTipoUsuario === "representante_agencia" ||
      normalizedTipoUsuario === "representante" ||
      normalizedTipoUsuario === "agencia" ||
      normalizedTipoUsuario === "manager"
    ) {
      return "representative";
    }

    if (
      normalizedTipoUsuario === "artista_individual" ||
      normalizedTipoUsuario === "artista" ||
      normalizedTipoUsuario === "artist"
    ) {
      return "artist";
    }

    return perfilId ? "artist" : null;
  }, [tipoUsuario, perfilId]);
  useEffect(() => {
    const cargarPayoutAccount = async () => {
      if (!payoutProfileId || !payoutAccountType) {
        setPayoutAccount(null);
        return;
      }

      try {
        setPayoutAccountLoading(true);

        const { data, error } = await supabase
          .from("payout_accounts")
          .select("profile_id,account_type,stripe_connected_account_id,charges_enabled,payouts_enabled,details_submitted")
          .eq("profile_id", payoutProfileId)
          .eq("account_type", payoutAccountType)
          .maybeSingle();

        if (error) throw error;

        setPayoutAccount(data || null);
      } catch (error) {
        console.error("Error cargando payout account:", error);
        toast.error("No se pudo cargar la configuración de cobros.");
      } finally {
        setPayoutAccountLoading(false);
      }
    };

    cargarPayoutAccount();
  }, [payoutProfileId, payoutAccountType]);

  // Cargar datos
  useEffect(() => {

    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const tipoGuardado = localStorage.getItem("tipo_usuario_demo") as TipoUsuario | null;
        if (tipoGuardado) {
          setTipoUsuario(tipoGuardado);
      }
         setLoading(false);
         return;
      }

      try {
        // Buscar o crear perfil
        let { data: perfilData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!perfilData) {
          const { data: nuevoPerfil, error } = await supabase
            .from("user_profiles")
            .insert({
	      user_id: user.id,
	      nombre: "Mi Perfil",
	      tipo_usuario: "artista"
	    })
            .select()
            .single();
          
          if (error) throw error;
          perfilData = nuevoPerfil;
        }

        setPerfilId(perfilData.id);
        setTipoUsuario(perfilData.tipo_usuario as TipoUsuario);

        if (perfilData.tipo_usuario === "artista_individual" || perfilData.tipo_usuario === "artista") {
          // Cargar datos de artista individual
          let { data: artista } = await supabase
            .from("artistas")
            .select("*")
            .eq("perfil_artista_id", perfilData.id)
            .maybeSingle();

          if (!artista) {
            // Buscar artista sin perfil o crear uno nuevo
            const { data: artistaSinPerfil } = await supabase
              .from("artistas")
              .select("*")
              .is("perfil_artista_id", null)
              .is("representante_id", null)
              .limit(1)
              .maybeSingle();

            if (artistaSinPerfil) {
              await supabase
                .from("artistas")
                .update({ perfil_artista_id: perfilData.id })
                .eq("id", artistaSinPerfil.id);
              artista = artistaSinPerfil;
            } else {
              const { data: nuevoArtista, error } = await supabase
                .from("artistas")
                .insert({ 
                  nombre: perfilData.nombre || "Mi Perfil",
                  perfil_artista_id: perfilData.id,
                  categoria: "standard",
		  user_id: user?.id
                })
                .select()
                .single();
              
              if (error) throw error;
              artista = nuevoArtista;
            }
          }

          if (artista) {
            setArtistaId(artista.id);
            setPerfil({
              nombre: artista.nombre || "",
              tipoArtista: artista.tipos_evento?.[0] || "",
              estiloMusical: artista.estilo || "",
              descripcion: artista.descripcion || "",
              cacheMin: artista.cache_min?.toString() || "",
              cacheMax: artista.cache_max?.toString() || "",
              email: artista.email || "",
            });

            // Cargar disponibilidad semanal
            const { data: disponibilidadData } = await supabase
              .from("artista_disponibilidad_semanal")
              .select("*")
              .eq("artista_id", artista.id);

            if (disponibilidadData && disponibilidadData.length > 0) {
              const nuevaDisponibilidad = { ...disponibilidadInicial };
              disponibilidadData.forEach((d) => {
                nuevaDisponibilidad[d.dia_semana] = {
                  activo: d.activo || false,
                  horaInicio: d.hora_inicio?.slice(0, 5) || "21:00",
                  horaFin: d.hora_fin?.slice(0, 5) || "06:00",
                };
              });
              setDisponibilidadSemanal(nuevaDisponibilidad);
            }

            // Cargar excepciones
            const { data: excepcionesData } = await supabase
              .from("artista_disponibilidad")
              .select("*")
              .eq("artista_id", artista.id);

            if (excepcionesData) {
              setExcepciones(
                excepcionesData.map((e) => ({
                  id: e.id,
                  fecha: new Date(e.fecha),
                  disponible: e.disponible || false,
                  horaInicio: e.hora_inicio?.slice(0, 5),
                  horaFin: e.hora_fin?.slice(0, 5),
                  motivo: e.motivo || e.notas || "",
                }))
              );
            }
          }
        } else {
          // Cargar artistas gestionados para representante
          const { data: artistasData } = await supabase
            .from("artistas")
            .select("*")
            .eq("representante_id", perfilData.id);

          if (artistasData) {
            setArtistasGestionados(
              artistasData.map((a) => ({
                id: a.id,
                nombre: a.nombre,
                estilo: a.estilo || "",
                categoria: (a.categoria as "standard" | "premium") || "premium",
                cacheMin: a.cache_min?.toString() || "",
                cacheMax: a.cache_max?.toString() || "",
                disponibilidadGeografica:
                  (a.disponibilidad_geografica as "nacional" | "internacional" | "ciudades_concretas") || "nacional",
                ciudadesDisponibles: a.ciudades_disponibles || "",
                riderTecnico: a.rider_tecnico || "",
                riderHospitality: a.rider_hospitality || "",
                bookingNotes: a.booking_notes || "",
              }))
            );

            if (artistasData.length > 0) {
              setArtistaSeleccionado(artistasData[0].id);
              await cargarDisponibilidadPremium(artistasData[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar la configuración: " + String(error));
      } finally {
        setLoading(false);
      }
    };

    const cargarSuscripcion = async () => {
      try {
        setSubscriptionLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setSubscriptionLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        setSubscription(data);
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    cargarDatos();
    cargarSuscripcion();
  }, []);

  const cargarDisponibilidadPremium = async (artistaId: string) => {
    const { data } = await supabase
      .from("artista_disponibilidad_premium")
      .select("*")
      .eq("artista_id", artistaId);

    if (data) {
      setDisponibilidadPremium(
        data.map((d) => ({
          id: d.id,
          fecha: new Date(d.fecha),
          ciudad: d.ciudad,
          pais: d.pais || "España",
          cacheEspecial: d.cache_especial?.toString() || "",
          disponible: d.disponible || true,
          notas: d.notas || "",
          horaInicio: d.hora_inicio || "",
          horaFin: d.hora_fin || "",
        }))
      );
    } else {
      setDisponibilidadPremium([]);
    }
  };

  const handleSeleccionarArtista = async (id: string) => {
    setArtistaSeleccionado(id);
    await cargarDisponibilidadPremium(id);
  };

  const handleAgregarArtista = async (artista: Omit<ArtistaGestionado, "id">) => {
    if (!perfilId) return;

    const { data, error } = await supabase
      .from("artistas")
      .insert({
        nombre: artista.nombre,
        estilo: artista.estilo,
        categoria: artista.categoria,
        representante_id: perfilId,
        cache_min: artista.cacheMin ? parseFloat(artista.cacheMin) : null,
        cache_max: artista.cacheMax ? parseFloat(artista.cacheMax) : null,
        disponibilidad_geografica: artista.disponibilidadGeografica || "nacional",
        ciudades_disponibles: artista.ciudadesDisponibles || null,
        rider_tecnico: artista.riderTecnico || null,
        rider_hospitality: artista.riderHospitality || null,
        booking_notes: artista.bookingNotes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al añadir artista");
      return;
    }

    const nuevoArtista: ArtistaGestionado = {
      id: data.id,
      nombre: data.nombre,
      estilo: data.estilo || "",
      categoria: data.categoria as "standard" | "premium",
      cacheMin: data.cache_min?.toString() || "",
      cacheMax: data.cache_max?.toString() || "",
      disponibilidadGeografica:
        (data.disponibilidad_geografica as "nacional" | "internacional" | "ciudades_concretas") || "nacional",
      ciudadesDisponibles: data.ciudades_disponibles || "",
      riderTecnico: data.rider_tecnico || "",
      riderHospitality: data.rider_hospitality || "",
      bookingNotes: data.booking_notes || "",
    };

    setArtistasGestionados([...artistasGestionados, nuevoArtista]);
    setArtistaSeleccionado(data.id);
    setDisponibilidadPremium([]);
    toast.success("Artista añadido correctamente");
  };

  const handleEliminarArtista = async (id: string) => {
    const { error } = await supabase
      .from("artistas")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar artista");
      return;
    }

    setArtistasGestionados(artistasGestionados.filter((a) => a.id !== id));
    if (artistaSeleccionado === id) {
      const remaining = artistasGestionados.filter((a) => a.id !== id);
      setArtistaSeleccionado(remaining.length > 0 ? remaining[0].id : null);
    }
    toast.success("Artista eliminado");
  };

  const handleCambiarTipoUsuario = async (tipo: TipoUsuario) => {
    setTipoUsuario(tipo);
    localStorage.setItem("tipo_usuario_demo", tipo);
    window.location.reload();
  };

  const payoutReady = !!(
    payoutAccount?.stripe_connected_account_id &&
    payoutAccount?.charges_enabled &&
    payoutAccount?.payouts_enabled &&
    payoutAccount?.details_submitted
  );

  const authProfileId = (profile as { id?: string } | null)?.id || null;

  const effectivePayoutProfileId = payoutProfileId || perfilId || authProfileId || null;

  const effectivePayoutAccountType: "artist" | "representative" | null =
    payoutAccountType ||
    (String(tipoUsuario || "").toLowerCase().includes("represent") ||
    String(tipoUsuario || "").toLowerCase().includes("agencia") ||
    String(tipoUsuario || "").toLowerCase().includes("manager")
      ? "representative"
      : (perfilId || authProfileId)
        ? "artist"
        : null);

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("No se pudo abrir el portal de gestión.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    const profileIdToUse = effectivePayoutProfileId;
    const accountTypeToUse = effectivePayoutAccountType;

    if (!profileIdToUse || !accountTypeToUse) {
      console.error("Payout identity missing", {
        payoutProfileId,
        payoutAccountType,
        perfilId,
        authProfileId,
        tipoUsuario,
        profile,
      });
      toast.error("No se pudo identificar el perfil de cobro.");
      return;
    }

    try {
      setPayoutActionLoading(true);

      const { data, error } = await supabase.functions.invoke("create-connect-onboarding-link", {
        body: {
          profileId: profileIdToUse,
          accountType: accountTypeToUse,
          returnUrl: "http://localhost:8081/configuracion?tab=general&stripe=connected",
          refreshUrl: "http://localhost:8081/configuracion?tab=general&stripe=refresh",
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error("No se recibió la URL de onboarding de Stripe.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error conectando Stripe:", error);
      toast.error("No se pudo iniciar la conexión con Stripe.");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    const profileIdToUse = effectivePayoutProfileId;
    const accountTypeToUse = effectivePayoutAccountType;

    if (!profileIdToUse || !accountTypeToUse) {
      console.error("Payout identity missing", {
        payoutProfileId,
        payoutAccountType,
        perfilId,
        authProfileId,
        tipoUsuario,
        profile,
      });
      toast.error("No se pudo identificar el perfil de cobro.");
      return;
    }

    try {
      setPayoutActionLoading(true);

      const { data, error } = await supabase.functions.invoke("create-connect-dashboard-link", {
        body: {
          profileId: profileIdToUse,
          accountType: accountTypeToUse,
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error("No se recibió la URL del panel de Stripe.");
      }

      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error abriendo panel de Stripe:", error);
      toast.error("No se pudo abrir el panel de Stripe.");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setPerfil(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      if ((tipoUsuario === "artista" || tipoUsuario === "artista_individual") && artistaId) {
        // Guardar perfil del artista
        const { error: perfilError } = await supabase
          .from("artistas")
          .update({
            nombre: perfil.nombre,
            email: perfil.email,
            estilo: perfil.estiloMusical,
            descripcion: perfil.descripcion,
            cache_min: perfil.cacheMin ? parseFloat(perfil.cacheMin) : null,
            cache_max: perfil.cacheMax ? parseFloat(perfil.cacheMax) : null,
            tipos_evento: perfil.tipoArtista ? [perfil.tipoArtista] : null,
          })
          .eq("id", artistaId);

        if (perfilError) throw perfilError;

        // Guardar disponibilidad semanal
        const diasSemana = Object.entries(disponibilidadSemanal);
        for (const [dia, config] of diasSemana) {
          const { error: dispError } = await supabase
            .from("artista_disponibilidad_semanal")
            .upsert({
              artista_id: artistaId,
              dia_semana: dia,
              activo: config.activo,
              hora_inicio: config.horaInicio,
              hora_fin: config.horaFin,
            }, { onConflict: "artista_id,dia_semana" });

          if (dispError) throw dispError;
        }

        // Guardar excepciones
        await supabase
          .from("artista_disponibilidad")
          .delete()
          .eq("artista_id", artistaId);

        if (excepciones.length > 0) {
          const excepcionesParaInsertar = excepciones.map((e) => ({
            artista_id: artistaId,
            fecha: format(e.fecha, 'yyyy-MM-dd'),
            disponible: e.disponible,
            hora_inicio: e.disponible ? e.horaInicio : null,
            hora_fin: e.disponible ? e.horaFin : null,
            motivo: e.motivo,
            notas: e.motivo,
          }));

          const { error: excError } = await supabase
            .from("artista_disponibilidad")
            .insert(excepcionesParaInsertar);

          if (excError) throw excError;
        }
      } else if (tipoUsuario === "representante_agencia" && artistaSeleccionado) {
        // Guardar disponibilidad premium
        await supabase
          .from("artista_disponibilidad_premium")
          .delete()
          .eq("artista_id", artistaSeleccionado);

        if (disponibilidadPremium.length > 0) {
          const dispParaInsertar = disponibilidadPremium.map((d) => ({
            artista_id: artistaSeleccionado,
            fecha: format(d.fecha, 'yyyy-MM-dd'),
            ciudad: d.ciudad,
            pais: d.pais,
            cache_especial: d.cacheEspecial ? parseFloat(d.cacheEspecial) : null,
            disponible: d.disponible,
            notas: d.notas,
            hora_inicio: d.horaInicio || null,
            hora_fin: d.horaFin || null,
          }));

          const { error } = await supabase
            .from("artista_disponibilidad_premium")
            .insert(dispParaInsertar);

          if (error) throw error;
        }
      }

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error guardando:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Configuración" subtitle="Ajustes y preferencias del sistema">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const artistaSeleccionadoData = artistasGestionados.find((a) => a.id === artistaSeleccionado);

  return (
    <AppLayout title="Configuración" subtitle="Ajustes y preferencias del sistema">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Centro de Configuración</h3>
            <p className="text-sm text-muted-foreground">
              Personaliza los parámetros del sistema
            </p>
          </div>
        </div>

        {/* Selector de Tipo de Cuenta */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Tipo de Cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => handleCambiarTipoUsuario("artista_individual")}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  tipoUsuario === "artista_individual"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">Artista Individual</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu propia agenda y disponibilidad
                </p>
              </button>

              <button
                onClick={() => handleCambiarTipoUsuario("representante_agencia")}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  tipoUsuario === "representante_agencia"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Representante / Agencia</span>
                  <Crown className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestiona múltiples artistas desde una sola cuenta
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {tipoUsuario === "artista_individual" || tipoUsuario === "venue" ? (
          <>
            {/* Perfil del Artista Individual */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Perfil del Artista</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre artístico</Label>
                    <Input
                      id="nombre"
                      placeholder="Tu nombre artístico"
                      value={perfil.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={perfil.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipoArtista">Tipo de artista</Label>
                    <Select value={perfil.tipoArtista} onValueChange={(v) => handleChange("tipoArtista", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposArtista.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
t                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estiloMusical">Estilo musical</Label>
                    <Select value={perfil.estiloMusical} onValueChange={(v) => handleChange("estiloMusical", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {estilosMusicales.map((estilo) => (
                          <SelectItem key={estilo} value={estilo}>{estilo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción / Bio</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Cuéntanos sobre ti y tu música..."
                    value={perfil.descripcion}
                    onChange={(e) => handleChange("descripcion", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rangos de Caché */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <CardTitle className="text-lg">Rangos de Caché</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cacheMin">Caché mínimo (€)</Label>
                    <Input
                      id="cacheMin"
                      type="number"
                      placeholder="500"
                      value={perfil.cacheMin}
                      onChange={(e) => handleChange("cacheMin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cacheMax">Caché máximo (€)</Label>
                    <Input
                      id="cacheMax"
                      type="number"
                      placeholder="2000"
                      value={perfil.cacheMax}
                      onChange={(e) => handleChange("cacheMax", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Define tu rango de precios para que los locales puedan encontrarte según su presupuesto.
                </p>
              </CardContent>
            </Card>

            {/* Disponibilidad Semanal */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Disponibilidad Semanal</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configura tu horario habitual de disponibilidad
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DisponibilidadSemanal 
                  disponibilidad={disponibilidadSemanal} 
                  onChange={setDisponibilidadSemanal} 
                />
              </CardContent>
            </Card>

            {/* Excepciones de Disponibilidad */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Excepciones de Disponibilidad</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Añade fechas específicas donde tu disponibilidad sea diferente a la habitual
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExcepcionesDisponibilidad 
                  excepciones={excepciones} 
                  onChange={setExcepciones} 
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Gestión de Artistas para Representante */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <CardTitle className="text-lg">Artistas Representados</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <GestionArtistas
                  artistas={artistasGestionados}
                  artistaSeleccionado={artistaSeleccionado}
                  onSeleccionar={handleSeleccionarArtista}
                  onAgregar={handleAgregarArtista}
                  onEliminar={handleEliminarArtista}
                />
              </CardContent>
            </Card>

            {/* Disponibilidad Premium del Artista Seleccionado */}
            {artistaSeleccionado && artistaSeleccionadoData && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Calendar className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Disponibilidad de {artistaSeleccionadoData.nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Indica las fechas, ciudades y caché especial para este artista
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DisponibilidadPremium
                    disponibilidad={disponibilidadPremium}
                    onChange={setDisponibilidadPremium}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {(
          tipoUsuario === "artista_individual" ||
          tipoUsuario === "representante_agencia" ||
          tipoUsuario === "artista" ||
          tipoUsuario === "representante"
        ) && (
          <Card className="border shadow-sm" id="pagos">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pagos y cobros</CardTitle>
                  <CardDescription>
                    Conecta Stripe para poder recibir adelantos y pagos de venues dentro de Link&Play.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {payoutAccountLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Cuenta de cobros</span>
                          {payoutReady ? (
                            <Badge className="bg-green-600 hover:bg-green-600">Activa</Badge>
                          ) : payoutAccount?.stripe_connected_account_id ? (
                            <Badge variant="secondary">Pendiente de completar</Badge>
                          ) : (
                            <Badge variant="outline">No configurada</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tipoUsuario === "representante_agencia"
                            ? "Los venues pagarán a la cuenta de Stripe de tu agencia o representación."
                            : "Los venues pagarán directamente a tu cuenta de Stripe como artista."}
                        </p>
                        {payoutAccount?.stripe_connected_account_id ? (
                          <p className="text-xs text-muted-foreground">
                            Cuenta conectada: {payoutAccount.stripe_connected_account_id}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleConnectStripe} disabled={payoutActionLoading}>
                          {payoutActionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          {payoutAccount?.stripe_connected_account_id ? "Actualizar Stripe" : "Conectar Stripe"}
                        </Button>
                        {payoutAccount?.stripe_connected_account_id ? (
                          <Button
                            variant="outline"
                            onClick={handleOpenStripeDashboard}
                            disabled={payoutActionLoading}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver panel de Stripe
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Datos enviados</p>
                      <p className="font-medium mt-1">
                        {payoutAccount?.details_submitted ? "Completados" : "Pendientes"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Cobros habilitados</p>
                      <p className="font-medium mt-1">
                        {payoutAccount?.charges_enabled ? "Sí" : "No"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Payouts habilitados</p>
                      <p className="font-medium mt-1">
                        {payoutAccount?.payouts_enabled ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>

                  {!payoutReady && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Para poder recibir pagos de venues dentro de Link&Play debes completar la configuración de Stripe Connect.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gestión de Suscripción */}
        <Card className="border shadow-sm" id="suscripcion">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10">
                <CreditCard className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Gestión de Suscripción</CardTitle>
                <CardDescription>
                  Administra tu plan y método de pago
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscription?.subscribed ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="font-semibold">
                        {subscription.product_id 
                          ? getTierByProductId(subscription.product_id)?.tier === "premium" 
                            ? "Plan Premium" 
                            : "Plan Estándar"
                          : "Plan Activo"}
                      </span>
                      <Badge variant="default" className="ml-2">Activa</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Próxima renovación: {subscription.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString("es-ES")
                        : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription} 
                    disabled={portalLoading}
                    className="flex-1"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Cambiar plan o método de pago
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleManageSubscription} 
                    disabled={portalLoading}
                  >
                    Cancelar suscripción
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Serás redirigido al portal seguro de Stripe para gestionar tu suscripción.
                </p>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  No tienes una suscripción activa.
                </p>
                <Button asChild>
                  <a href="/suscripciones">Ver planes disponibles</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleGuardar} className="px-8" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
