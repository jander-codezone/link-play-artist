import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Users, Plus, Trash2, Upload, Pencil, CalendarDays, ChevronDown, Crown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ArtistaRepresentado = {
  id: string;
  nombre: string;
  estilo: string;
  categoria: "standard" | "premium";
  cacheMin: string;
  cacheMax: string;
  foto: string;
  disponibilidadGeografica: "nacional" | "internacional" | "ciudades_concretas";
  ciudadesDisponibles: string;
  riderTecnicoPdf: string;
  riderTecnicoComentarios: string;
  riderHospitalityPdf: string;
  riderHospitalityComentarios: string;
  bookingNotes: string;
  disponibilidadFecha: string;
  disponibilidadCiudad: string;
  disponibilidadHoraInicio: string;
  disponibilidadHoraFin: string;
  disponibilidadCacheMin: string;
  disponibilidadCacheMax: string;
  disponibilidadNotas: string;
  disponibilidadTipoActuacion: "showcase" | "concierto";
};

type ErroresFormulario = {
  nombre?: string;
  estilo?: string;
  cacheMin?: string;
  cacheMax?: string;
  foto?: string;
  general?: string;
  disponibilidad?: string;
};

const ARTISTA_ACTIVO_KEY = "artista_representado_activo_demo";

const formatearNumero = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;

  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
    useGrouping: true,
  });

  return formatter.format(numero);
};

const formatearRangoCache = (cacheMin: string, cacheMax: string) => {
  if (cacheMin && cacheMax) {
    return `${formatearNumero(cacheMin)} € - ${formatearNumero(cacheMax)} €`;
  }
  if (cacheMin) {
    return `Desde ${formatearNumero(cacheMin)} €`;
  }
  return "No definido";
};

const getCategoriaLabel = (categoria: "standard" | "premium") =>
  categoria === "standard" ? "Estándar" : "Premium";

const normalizarNombre = (nombre: string) => {
  return nombre.trim().toLowerCase();
};


const mapArtistaFromDb = (artista: any): ArtistaRepresentado => ({
  id: artista.id,
  nombre: artista.nombre || "",
  estilo: artista.estilo || "",
  categoria: artista.categoria === "standard" ? "standard" : "premium",
  cacheMin: artista.cache_min?.toString() || artista.cache?.toString() || "",
  cacheMax: artista.cache_max?.toString() || artista.cache?.toString() || "",
  foto: artista.foto_url || artista.foto || "",
  disponibilidadGeografica:
    artista.disponibilidad_geografica || "nacional",
  ciudadesDisponibles: artista.ciudades_disponibles || "",
  riderTecnicoPdf: artista.rider_tecnico_pdf || "",
  riderTecnicoComentarios: artista.rider_tecnico_comentarios || artista.rider_tecnico || "",
  riderHospitalityPdf: artista.rider_hospitality_pdf || "",
  riderHospitalityComentarios: artista.rider_hospitality_comentarios || artista.rider_hospitality || "",
  bookingNotes: artista.booking_notes || "",
  disponibilidadFecha: artista.disponibilidad_fecha || "",
  disponibilidadCiudad: artista.disponibilidad_ciudad || "",
  disponibilidadHoraInicio: artista.disponibilidad_hora_inicio || "",
  disponibilidadHoraFin: artista.disponibilidad_hora_fin || "",
  disponibilidadCacheMin: artista.disponibilidad_cache_min?.toString() || "",
  disponibilidadCacheMax: artista.disponibilidad_cache_max?.toString() || "",
  disponibilidadNotas: artista.disponibilidad_notas || "",
  disponibilidadTipoActuacion:
    artista.disponibilidad_tipo_actuacion === "concierto" ? "concierto" : "showcase",
});

export default function Artistas() {
  const navigate = useNavigate();

  const [artistas, setArtistas] = useState<ArtistaRepresentado[]>([]);
  const [formExpanded, setFormExpanded] = useState(false);
  const [nombre, setNombre] = useState("");
  const [estilo, setEstilo] = useState("");
  const [categoria, setCategoria] = useState<"standard" | "premium">("premium");
  const [cacheMin, setCacheMin] = useState("");
  const [cacheMax, setCacheMax] = useState("");
  const [disponibilidadGeografica, setDisponibilidadGeografica] = useState<"nacional" | "internacional" | "ciudades_concretas">("nacional");
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState("");
  const [riderTecnicoPdf, setRiderTecnicoPdf] = useState("");
  const [riderTecnicoComentarios, setRiderTecnicoComentarios] = useState("");
  const [riderHospitalityPdf, setRiderHospitalityPdf] = useState("");
  const [riderHospitalityComentarios, setRiderHospitalityComentarios] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [disponibilidadFecha, setDisponibilidadFecha] = useState("");
  const [disponibilidadCiudad, setDisponibilidadCiudad] = useState("");
  const [disponibilidadHoraInicio, setDisponibilidadHoraInicio] = useState("");
  const [disponibilidadHoraFin, setDisponibilidadHoraFin] = useState("");
  const [disponibilidadCacheMin, setDisponibilidadCacheMin] = useState("");
  const [disponibilidadCacheMax, setDisponibilidadCacheMax] = useState("");
  const [disponibilidadNotas, setDisponibilidadNotas] = useState("");
  const [disponibilidadTipoActuacion, setDisponibilidadTipoActuacion] = useState<"showcase" | "concierto">("showcase");
  const [foto, setFoto] = useState("");
  const [previewFoto, setPreviewFoto] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [artistaEditandoId, setArtistaEditandoId] = useState<string | null>(null);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [availabilityArtist, setAvailabilityArtist] = useState<ArtistaRepresentado | null>(null);
  const [availabilityCalendarOpen, setAvailabilityCalendarOpen] = useState(false);
  const [deleteAvailabilityDialogOpen, setDeleteAvailabilityDialogOpen] = useState(false);
  const [deleteAvailabilityArtist, setDeleteAvailabilityArtist] = useState<ArtistaRepresentado | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCacheMin, setFilterCacheMin] = useState("");
  const [filterCacheMax, setFilterCacheMax] = useState("");
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<"all" | "nacional" | "internacional" | "ciudades_concretas">("all");
  const [filterDisponibilidadFijada, setFilterDisponibilidadFijada] = useState<"all" | "yes" | "no">("all");
const formatFechaDisponibilidadDisplay = (value: string) => {
  if (!value) return "Selecciona una fecha";
  try {
    return format(new Date(`${value}T12:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return value;
  }
};

const parseFechaDisponibilidad = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizarHoraInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const manejarHoraDisponibilidadChange = (
  rawValue: string,
  setter: (value: string) => void
) => {
  setter(normalizarHoraInput(rawValue));
};

const hasDisponibilidadPublicada = (artista: ArtistaRepresentado) => {
  return Boolean(
    artista.disponibilidadFecha ||
      artista.disponibilidadCiudad ||
      artista.disponibilidadHoraInicio ||
      artista.disponibilidadHoraFin ||
      artista.disponibilidadCacheMin ||
      artista.disponibilidadCacheMax ||
      artista.disponibilidadNotas
  );
};

  useEffect(() => {
    const cargarArtistas = async () => {
      const { data, error } = await supabase
        .from("artistas")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        setErrores({ general: "No se pudieron cargar los artistas." });
        setArtistas([]);
        return;
      }

      setArtistas((data || []).map(mapArtistaFromDb));
    };

    cargarArtistas();
  }, []);


  const manejarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result as string;
      setFoto(resultado);
      setPreviewFoto(resultado);
      setErrores((prev) => ({ ...prev, foto: undefined, general: undefined }));
    };
    reader.readAsDataURL(archivo);
  };

  const manejarPdf = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      setErrores((prev) => ({
        ...prev,
        general: "Solo puedes subir archivos PDF para los riders.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result as string;
      setter(resultado);
      setErrores((prev) => ({ ...prev, general: undefined }));
    };
    reader.readAsDataURL(archivo);
  };

  const validarFormulario = (): ErroresFormulario => {
    const nuevosErrores: ErroresFormulario = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = "Debes introducir el nombre del artista.";
    }

    if (!estilo.trim()) {
      nuevosErrores.estilo = "Debes indicar el estilo musical.";
    }

    if (!cacheMin.trim()) {
      nuevosErrores.cacheMin = "Debes indicar el caché mínimo.";
    }

    if (!cacheMax.trim()) {
      nuevosErrores.cacheMax = "Debes indicar el caché máximo.";
    }

    if (!foto.trim()) {
      nuevosErrores.foto = "Debes subir una foto.";
    }

    const nombreNormalizado = normalizarNombre(nombre);
    const nombreDuplicado = artistas.some(
      (artista) =>
        normalizarNombre(artista.nombre) === nombreNormalizado &&
        artista.id !== artistaEditandoId
    );

    if (nombre.trim() && nombreDuplicado) {
      nuevosErrores.nombre = "Ya existe un artista con ese nombre.";
      nuevosErrores.general = "No puedes añadir artistas duplicados.";
    }

    return nuevosErrores;
  };

  const validarDisponibilidad = (): string | null => {
    if (!disponibilidadFecha.trim()) return "Debes indicar la fecha de la disponibilidad.";
    if (!disponibilidadCiudad.trim()) return "Debes indicar la ciudad o ubicación.";
    if (!disponibilidadHoraInicio.trim()) return "Debes indicar la hora de inicio.";
    if (!disponibilidadHoraFin.trim()) return "Debes indicar la hora de fin.";
    if (!disponibilidadCacheMin.trim()) return "Debes indicar el caché mínimo.";
    if (!disponibilidadCacheMax.trim()) return "Debes indicar el caché máximo.";

    const min = Number(disponibilidadCacheMin);
    const max = Number(disponibilidadCacheMax);
    if (Number.isFinite(min) && Number.isFinite(max) && max < min) {
      return "El caché máximo no puede ser inferior al caché mínimo.";
    }

    return null;
  };

  const limpiarFormulario = () => {
    setNombre("");
    setEstilo("");
    setCategoria("premium");
    setCacheMin("");
    setCacheMax("");
    setDisponibilidadGeografica("nacional");
    setCiudadesDisponibles("");
    setRiderTecnicoPdf("");
    setRiderTecnicoComentarios("");
    setRiderHospitalityPdf("");
    setRiderHospitalityComentarios("");
    setBookingNotes("");
    setDisponibilidadFecha("");
    setDisponibilidadCiudad("");
    setDisponibilidadHoraInicio("");
    setDisponibilidadHoraFin("");
    setDisponibilidadCacheMin("");
    setDisponibilidadCacheMax("");
    setDisponibilidadNotas("");
    setDisponibilidadTipoActuacion("showcase");
    setFoto("");
    setPreviewFoto("");
    setErrores({});
    setArtistaEditandoId(null);
    setFormExpanded(false);
    setAvailabilityDialogOpen(false);
    setAvailabilityArtist(null);
    setAvailabilityCalendarOpen(false);
    setDeleteAvailabilityDialogOpen(false);
    setDeleteAvailabilityArtist(null);
  };
  const abrirEliminarDisponibilidad = (artista: ArtistaRepresentado) => {
    setDeleteAvailabilityArtist(artista);
    setDeleteAvailabilityDialogOpen(true);
  };

  const eliminarDisponibilidad = async () => {
    if (!deleteAvailabilityArtist) return;

    const { error } = await supabase
      .from("artistas")
      .update({
        disponibilidad_fecha: null,
        disponibilidad_ciudad: null,
        disponibilidad_hora_inicio: null,
        disponibilidad_hora_fin: null,
        disponibilidad_cache_min: null,
        disponibilidad_cache_max: null,
        disponibilidad_notas: null,
        disponibilidad_tipo_actuacion: null,
      })
      .eq("id", deleteAvailabilityArtist.id);

    if (error) {
      setErrores({
        general: `No se pudo eliminar la disponibilidad.${error.message ? ` ${error.message}` : ""}`,
      });
      return;
    }

    setErrores((prev) => ({ ...prev, general: undefined }));
    await recargarArtistas();
    setDeleteAvailabilityDialogOpen(false);
    setDeleteAvailabilityArtist(null);
  };

  const recargarArtistas = async () => {
    const { data, error } = await supabase
      .from("artistas")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      setErrores({ general: "No se pudieron refrescar los artistas." });
      return;
    }

    setArtistas((data || []).map(mapArtistaFromDb));
  };

  const guardarArtista = async () => {
    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    if (artistaEditandoId) {
      const { error } = await supabase
        .from("artistas")
        .update({
          nombre: nombre.trim(),
          estilo: estilo.trim(),
          categoria,
          cache_min: cacheMin.trim() ? parseFloat(cacheMin.trim()) : null,
          cache_max: cacheMax.trim() ? parseFloat(cacheMax.trim()) : null,
          foto_url: foto.trim() || null,
          disponibilidad_geografica: disponibilidadGeografica,
          ciudades_disponibles: ciudadesDisponibles.trim() || null,
          rider_tecnico_pdf: riderTecnicoPdf || null,
          rider_tecnico_comentarios: riderTecnicoComentarios.trim() || null,
          rider_hospitality_pdf: riderHospitalityPdf || null,
          rider_hospitality_comentarios: riderHospitalityComentarios.trim() || null,
          booking_notes: bookingNotes.trim() || null,
        })
        .eq("id", artistaEditandoId);

      if (error) {
        setErrores({ general: "No se pudo guardar el artista." });
        return;
      }

      await recargarArtistas();
      limpiarFormulario();
      return;
    }

    const { error } = await supabase.from("artistas").insert({
      nombre: nombre.trim(),
      estilo: estilo.trim(),
      categoria,
      cache_min: cacheMin.trim() ? parseFloat(cacheMin.trim()) : null,
      cache_max: cacheMax.trim() ? parseFloat(cacheMax.trim()) : null,
      foto_url: foto.trim() || null,
      disponibilidad_geografica: disponibilidadGeografica,
      ciudades_disponibles: ciudadesDisponibles.trim() || null,
      rider_tecnico_pdf: riderTecnicoPdf || null,
      rider_tecnico_comentarios: riderTecnicoComentarios.trim() || null,
      rider_hospitality_pdf: riderHospitalityPdf || null,
      rider_hospitality_comentarios: riderHospitalityComentarios.trim() || null,
      booking_notes: bookingNotes.trim() || null,
    });

    if (error) {
      setErrores({ general: "No se pudo crear el artista." });
      return;
    }

    await recargarArtistas();
    setFormExpanded(false);
    limpiarFormulario();
  };

  const editarArtista = (artista: ArtistaRepresentado) => {
    setArtistaEditandoId(artista.id);
    setNombre(artista.nombre);
    setEstilo(artista.estilo);
    setCategoria(artista.categoria);
    setCacheMin(artista.cacheMin);
    setCacheMax(artista.cacheMax);
    setDisponibilidadGeografica(artista.disponibilidadGeografica);
    setCiudadesDisponibles(artista.ciudadesDisponibles);
    setRiderTecnicoPdf(artista.riderTecnicoPdf);
    setRiderTecnicoComentarios(artista.riderTecnicoComentarios);
    setRiderHospitalityPdf(artista.riderHospitalityPdf);
    setRiderHospitalityComentarios(artista.riderHospitalityComentarios);
    setBookingNotes(artista.bookingNotes);
    setDisponibilidadFecha(artista.disponibilidadFecha);
    setDisponibilidadCiudad(artista.disponibilidadCiudad);
    setDisponibilidadHoraInicio(artista.disponibilidadHoraInicio);
    setDisponibilidadHoraFin(artista.disponibilidadHoraFin);
    setDisponibilidadCacheMin(artista.disponibilidadCacheMin);
    setDisponibilidadCacheMax(artista.disponibilidadCacheMax);
    setDisponibilidadNotas(artista.disponibilidadNotas);
    setDisponibilidadTipoActuacion(artista.disponibilidadTipoActuacion);
    setFoto(artista.foto);
    setPreviewFoto(artista.foto);
    setFormExpanded(true);
    setErrores({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarArtista = async (id: string) => {
    const { error } = await supabase.from("artistas").delete().eq("id", id);

    if (error) {
      setErrores({ general: "No se pudo eliminar el artista." });
      return;
    }

    const artistaActivo = localStorage.getItem(ARTISTA_ACTIVO_KEY);
    if (artistaActivo) {
      const artistaActivoParseado = JSON.parse(artistaActivo);
      if (artistaActivoParseado.id === id) {
        localStorage.removeItem(ARTISTA_ACTIVO_KEY);
      }
    }

    await recargarArtistas();

    if (artistaEditandoId === id) {
      limpiarFormulario();
    }
  };

  const gestionarArtista = (artista: ArtistaRepresentado) => {
    localStorage.setItem(ARTISTA_ACTIVO_KEY, JSON.stringify(artista));
    navigate("/calendario");
  };

  const publicarDisponibilidad = (artista: ArtistaRepresentado) => {
    setAvailabilityArtist(artista);
    setDisponibilidadFecha(artista.disponibilidadFecha || "");
    setDisponibilidadCiudad(artista.disponibilidadCiudad || "");
    setDisponibilidadHoraInicio(artista.disponibilidadHoraInicio || "");
    setDisponibilidadHoraFin(artista.disponibilidadHoraFin || "");
    setDisponibilidadCacheMin(artista.disponibilidadCacheMin || "");
    setDisponibilidadCacheMax(artista.disponibilidadCacheMax || "");
    setDisponibilidadNotas(artista.disponibilidadNotas || "");
    setDisponibilidadTipoActuacion(artista.disponibilidadTipoActuacion || "showcase");
    setErrores((prev) => ({ ...prev, disponibilidad: undefined }));
    setAvailabilityCalendarOpen(false);
    setAvailabilityDialogOpen(true);
  };

  const guardarDisponibilidad = async () => {
    if (!availabilityArtist) return;
    const disponibilidadError = validarDisponibilidad();
    if (disponibilidadError) {
      setErrores((prev) => ({ ...prev, disponibilidad: disponibilidadError }));
      return;
    }
    setErrores((prev) => ({ ...prev, disponibilidad: undefined }));
    const { data: updatedArtist, error } = await supabase
      .from("artistas")
      .update({
        disponibilidad_fecha: disponibilidadFecha || null,
        disponibilidad_ciudad: disponibilidadCiudad.trim() || null,
        disponibilidad_hora_inicio: disponibilidadHoraInicio || null,
        disponibilidad_hora_fin: disponibilidadHoraFin || null,
        disponibilidad_cache_min: disponibilidadCacheMin.trim()
          ? parseFloat(disponibilidadCacheMin.trim())
          : null,
        disponibilidad_cache_max: disponibilidadCacheMax.trim()
          ? parseFloat(disponibilidadCacheMax.trim())
          : null,
        disponibilidad_notas: disponibilidadNotas.trim() || null,
        disponibilidad_tipo_actuacion: disponibilidadTipoActuacion,
      })
      .eq("id", availabilityArtist.id)
      .select("*")
      .maybeSingle();

    if (error) {
      setErrores({
        general: `No se pudo publicar la disponibilidad.${error.message ? ` ${error.message}` : ""}`,
        disponibilidad: undefined,
      });
      return;
    }

    if (!updatedArtist) {
      setErrores({
        general: "No se pudo publicar la disponibilidad. No se encontró el artista o no tienes permisos para actualizarlo.",
        disponibilidad: undefined,
      });
      return;
    }

    setErrores((prev) => ({ ...prev, general: undefined }));
    setErrores((prev) => ({ ...prev, disponibilidad: undefined }));
    await recargarArtistas();
    setAvailabilityCalendarOpen(false);
    setAvailabilityDialogOpen(false);
    setAvailabilityArtist(null);
    setDisponibilidadFecha("");
    setDisponibilidadCiudad("");
    setDisponibilidadHoraInicio("");
    setDisponibilidadHoraFin("");
    setDisponibilidadCacheMin("");
    setDisponibilidadCacheMax("");
    setDisponibilidadNotas("");
    setDisponibilidadTipoActuacion("showcase");
  };

  const artistasFiltrados = artistas.filter((artista) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      artista.nombre.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const artistCacheMin = Number(artista.cacheMin || 0);
    const artistCacheMax = Number(artista.cacheMax || 0);
    const selectedMin = Number(filterCacheMin || 0);
    const selectedMax = Number(filterCacheMax || 0);

    const matchesCacheMin = !filterCacheMin || artistCacheMax >= selectedMin;
    const matchesCacheMax = !filterCacheMax || artistCacheMin <= selectedMax;

    const matchesDisponibilidad =
      filterDisponibilidad === "all" ||
      artista.disponibilidadGeografica === filterDisponibilidad;

    const artistHasDisponibilidad = hasDisponibilidadPublicada(artista);
    const matchesDisponibilidadFijada =
      filterDisponibilidadFijada === "all" ||
      (filterDisponibilidadFijada === "yes" ? artistHasDisponibilidad : !artistHasDisponibilidad);

    return (
      matchesSearch &&
      matchesCacheMin &&
      matchesCacheMax &&
      matchesDisponibilidad &&
      matchesDisponibilidadFijada
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artistas representados</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Gestiona los artistas que representas o añade nuevos perfiles a tu agencia.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {artistaEditandoId ? "Editar artista" : "Añadir artista"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {errores.general && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errores.general}
              </div>
            )}

            <button
              type="button"
              onClick={() => setFormExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <div>
                <p className="font-medium text-sm">Datos del artista representado</p>
                <p className="text-xs text-muted-foreground">
                  Despliega este formulario para completar la ficha del artista.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${formExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {formExpanded && (
              <div className="space-y-4 rounded-lg border p-4 bg-muted/10">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nombre artístico</Label>
                    <Input
                      placeholder="Nombre del artista"
                      value={nombre}
                      onChange={(e) => {
                        setNombre(e.target.value);
                        setErrores((prev) => ({ ...prev, nombre: undefined, general: undefined }));
                      }}
                      className={errores.nombre ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errores.nombre && <p className="text-sm text-red-600">{errores.nombre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Estilo musical</Label>
                    <Input
                      placeholder="Estilo musical"
                      value={estilo}
                      onChange={(e) => {
                        setEstilo(e.target.value);
                        setErrores((prev) => ({ ...prev, estilo: undefined }));
                      }}
                      className={errores.estilo ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errores.estilo && <p className="text-sm text-red-600">{errores.estilo}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={categoria} onValueChange={(value) => setCategoria(value as "standard" | "premium")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="standard">Estándar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Caché mínimo (€)</Label>
                    <Input
                      placeholder="Ej: 20000"
                      value={cacheMin}
                      onChange={(e) => {
                        setCacheMin(e.target.value.replace(/[^\d]/g, ""));
                        setErrores((prev) => ({ ...prev, cacheMin: undefined }));
                      }}
                      className={errores.cacheMin ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errores.cacheMin && <p className="text-sm text-red-600">{errores.cacheMin}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Caché máximo (€)</Label>
                    <Input
                      placeholder="Ej: 40000"
                      value={cacheMax}
                      onChange={(e) => {
                        setCacheMax(e.target.value.replace(/[^\d]/g, ""));
                        setErrores((prev) => ({ ...prev, cacheMax: undefined }));
                      }}
                      className={errores.cacheMax ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errores.cacheMax && <p className="text-sm text-red-600">{errores.cacheMax}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Disponibilidad geográfica</Label>
                  <Select
                    value={disponibilidadGeografica}
                    onValueChange={(value) => setDisponibilidadGeografica(value as "nacional" | "internacional" | "ciudades_concretas")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="internacional">Internacional</SelectItem>
                      <SelectItem value="ciudades_concretas">Solo algunas ciudades concretas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {disponibilidadGeografica === "ciudades_concretas" && (
                  <div className="space-y-2">
                    <Label>Ciudades disponibles</Label>
                    <Input
                      placeholder="Ej: Madrid, Barcelona, Valencia"
                      value={ciudadesDisponibles}
                      onChange={(e) => setCiudadesDisponibles(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-3 rounded-lg border p-4 bg-background">
                  <div>
                    <Label className="text-sm font-medium">Rider técnico (PDF)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sube o arrastra el PDF del rider técnico del artista.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      <span>Selecciona un PDF desde tu ordenador</span>
                    </div>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => manejarPdf(e, setRiderTecnicoPdf)}
                      className="block w-full text-sm"
                    />

                    <p className="text-xs text-muted-foreground mt-2">
                      También puedes arrastrar y soltar aquí el PDF del rider técnico.
                    </p>
                  </div>

                  {riderTecnicoPdf && (
                    <p className="text-sm text-muted-foreground">PDF técnico cargado correctamente.</p>
                  )}

                  <div className="space-y-2">
                    <Label>Comentarios adicionales rider técnico</Label>
                    <Textarea
                      placeholder="Añade aquí cualquier comentario adicional sobre el rider técnico."
                      value={riderTecnicoComentarios}
                      onChange={(e) => setRiderTecnicoComentarios(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4 bg-background">
                  <div>
                    <Label className="text-sm font-medium">Rider hospitality (PDF)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sube o arrastra el PDF del rider hospitality del artista.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      <span>Selecciona un PDF desde tu ordenador</span>
                    </div>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => manejarPdf(e, setRiderHospitalityPdf)}
                      className="block w-full text-sm"
                    />

                    <p className="text-xs text-muted-foreground mt-2">
                      También puedes arrastrar y soltar aquí el PDF del rider hospitality.
                    </p>
                  </div>

                  {riderHospitalityPdf && (
                    <p className="text-sm text-muted-foreground">PDF hospitality cargado correctamente.</p>
                  )}

                  <div className="space-y-2">
                    <Label>Comentarios adicionales rider hospitality</Label>
                    <Textarea
                      placeholder="Añade aquí cualquier comentario adicional sobre el rider hospitality."
                      value={riderHospitalityComentarios}
                      onChange={(e) => setRiderHospitalityComentarios(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas de booking</Label>
                  <Textarea
                    placeholder="Cualquier detalle operativo adicional que deba añadirse automáticamente a la oferta."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={3}
                  />
                </div>


                <div className="space-y-3">
                  <Label>Sube aquí tu foto</Label>

                  <div className={`border rounded-lg p-4 bg-muted/20 ${errores.foto ? "border-red-400 bg-red-50/40" : ""}`}>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      <span>Selecciona una imagen desde tu ordenador</span>
                    </div>

                    <input type="file" accept="image/*" onChange={manejarFoto} className="block w-full text-sm" />

                    <p className="text-xs text-muted-foreground mt-2">Formatos recomendados: JPG o PNG.</p>
                  </div>

                  {errores.foto && <p className="text-sm text-red-600">{errores.foto}</p>}

                  {previewFoto && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  {artistaEditandoId && (
                    <Button variant="outline" onClick={limpiarFormulario}>
                      Cancelar
                    </Button>
                  )}

                  <Button onClick={guardarArtista}>
                    <Plus className="w-4 h-4 mr-2" />
                    {artistaEditandoId ? "Guardar cambios" : "Añadir"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar y filtrar artistas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label>Buscar por nombre</Label>
                <Input
                  placeholder="Ej: Bad Bunny"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Caché mínimo (€)</Label>
                <Input
                  placeholder="Ej: 10000"
                  value={filterCacheMin}
                  onChange={(e) => setFilterCacheMin(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>

              <div className="space-y-2">
                <Label>Caché máximo (€)</Label>
                <Input
                  placeholder="Ej: 50000"
                  value={filterCacheMax}
                  onChange={(e) => setFilterCacheMax(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>

              <div className="space-y-2">
                <Label>Disponibilidad geográfica</Label>
                <Select
                  value={filterDisponibilidad}
                  onValueChange={(value) =>
                    setFilterDisponibilidad(
                      value as "all" | "nacional" | "internacional" | "ciudades_concretas"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="internacional">Internacional</SelectItem>
                    <SelectItem value="ciudades_concretas">Ciudades concretas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilidad fijada</Label>
                <Select
                  value={filterDisponibilidadFijada}
                  onValueChange={(value) =>
                    setFilterDisponibilidadFijada(value as "all" | "yes" | "no")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {artistasFiltrados.length} artista{artistasFiltrados.length !== 1 ? "s" : ""} encontrado{artistasFiltrados.length !== 1 ? "s" : ""}
              </p>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCacheMin("");
                  setFilterCacheMax("");
                  setFilterDisponibilidad("all");
                  setFilterDisponibilidadFijada("all");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {artistasFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay artistas que coincidan con los filtros aplicados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {artistasFiltrados.map((artista) => (
              <Card key={artista.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {artista.foto ? (
                        <img
                          src={artista.foto}
                          alt={artista.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{artista.nombre}</p>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {artista.categoria === "premium" ? (
                            <>
                              <Crown className="mr-1 h-3 w-3 text-amber-500" />
                              Premium
                            </>
                          ) : (
                            "Estándar"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {artista.estilo || "Sin estilo definido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Caché: {formatearRangoCache(artista.cacheMin, artista.cacheMax)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Disponibilidad: {artista.disponibilidadGeografica === "ciudades_concretas"
                          ? artista.ciudadesDisponibles || "Ciudades concretas"
                          : artista.disponibilidadGeografica === "internacional"
                          ? "Internacional"
                          : "Nacional"}
                      </p>
                      {hasDisponibilidadPublicada(artista) && (
                        <div className="group flex items-center gap-2 text-sm text-muted-foreground">
                          <p>
                            Nueva disponibilidad: {artista.disponibilidadFecha}
                            {artista.disponibilidadCiudad ? ` · ${artista.disponibilidadCiudad}` : ""}
                            {artista.disponibilidadHoraInicio && artista.disponibilidadHoraFin
                              ? ` · ${artista.disponibilidadHoraInicio} - ${artista.disponibilidadHoraFin}`
                              : ""}
                            {artista.disponibilidadTipoActuacion
                              ? ` · ${artista.disponibilidadTipoActuacion === "concierto" ? "Concierto" : "Showcase"}`
                              : ""}
                          </p>
                          <button
                            type="button"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirEliminarDisponibilidad(artista);
                            }}
                            aria-label="Eliminar disponibilidad"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-amber-400 text-amber-950 hover:bg-amber-500"
                      onClick={() => publicarDisponibilidad(artista)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Publicar disponibilidad
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => gestionarArtista(artista)}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Gestionar
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => editarArtista(artista)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => eliminarArtista(artista.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      {/* Dialogo de disponibilidad */}
        <Dialog
          open={availabilityDialogOpen}
          onOpenChange={(open) => {
            setAvailabilityDialogOpen(open);
            if (!open) {
              setErrores((prev) => ({ ...prev, general: undefined, disponibilidad: undefined }));
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Publicar disponibilidad{availabilityArtist ? ` · ${availabilityArtist.nombre}` : ""}
              </DialogTitle>
              <DialogDescription>
                Publica una ventana concreta en la que este artista estará disponible para contratación.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {errores.disponibilidad && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errores.disponibilidad}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover open={availabilityCalendarOpen} onOpenChange={setAvailabilityCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {formatFechaDisponibilidadDisplay(disponibilidadFecha)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseFechaDisponibilidad(disponibilidadFecha)}
                        onSelect={(date) => {
                          if (!date) return;
                          setDisponibilidadFecha(format(date, "yyyy-MM-dd"));
                          setAvailabilityCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Ciudad / ubicación</Label>
                  <Input
                    placeholder="Ej: Guatemala"
                    value={disponibilidadCiudad}
                    onChange={(e) => setDisponibilidadCiudad(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hora disponible desde</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="02:30"
                    className="placeholder:text-muted-foreground/40"
                    value={disponibilidadHoraInicio}
                    onChange={(e) => manejarHoraDisponibilidadChange(e.target.value, setDisponibilidadHoraInicio)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora disponible hasta</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="04:00"
                    className="placeholder:text-muted-foreground/40"
                    value={disponibilidadHoraFin}
                    onChange={(e) => manejarHoraDisponibilidadChange(e.target.value, setDisponibilidadHoraFin)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Caché mínimo disponibilidad (€)</Label>
                  <Input
                    placeholder="Ej: 50000"
                    value={disponibilidadCacheMin}
                    onChange={(e) => setDisponibilidadCacheMin(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Caché máximo disponibilidad (€)</Label>
                  <Input
                    placeholder="Ej: 70000"
                    value={disponibilidadCacheMax}
                    onChange={(e) => setDisponibilidadCacheMax(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de actuación</Label>
                <Select
                  value={disponibilidadTipoActuacion}
                  onValueChange={(value) =>
                    setDisponibilidadTipoActuacion(value as "showcase" | "concierto")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="showcase">Showcase</SelectItem>
                    <SelectItem value="concierto">Concierto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas de disponibilidad</Label>
                <Textarea
                  placeholder="Ej: Disponible después del concierto entre la 01:30 y las 03:30 para club set en la misma ciudad."
                  value={disponibilidadNotas}
                  onChange={(e) => setDisponibilidadNotas(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAvailabilityDialogOpen(false);
                    setErrores((prev) => ({ ...prev, general: undefined, disponibilidad: undefined }));
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarDisponibilidad}
                  className="bg-amber-400 text-amber-950 hover:bg-amber-500"
                  disabled={
                    !disponibilidadFecha.trim() ||
                    !disponibilidadCiudad.trim() ||
                    !disponibilidadHoraInicio.trim() ||
                    !disponibilidadHoraFin.trim() ||
                    !disponibilidadCacheMin.trim() ||
                    !disponibilidadCacheMax.trim()
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publicar disponibilidad
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteAvailabilityDialogOpen} onOpenChange={setDeleteAvailabilityDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar disponibilidad</DialogTitle>
              <DialogDescription>
                ¿Vas a eliminar la disponibilidad de tu artista? ¿Quieres confirmar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteAvailabilityDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={eliminarDisponibilidad}>
                Eliminar disponibilidad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}