import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  getWeek,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";

type BookingRequest = {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_style: string | null;
  venue_name: string;
  venue_city: string;
  event_date: string;
  budget: number | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type ArtistaRepresentadoActivo = {
  id: string;
  nombre: string;
  estilo: string;
  cache: string;
  foto: string;
};

const ARTISTA_ACTIVO_KEY = "artista_representado_activo_demo";

const hours = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00",
];

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const monthDayNames = ["L", "M", "X", "J", "V", "S", "D"];

const formatearCache = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("es-ES");
};

export default function Calendario() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [artistaActivo, setArtistaActivo] = useState<ArtistaRepresentadoActivo | null>(null);
  const [solicitudes, setSolicitudes] = useState<BookingRequest[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem(ARTISTA_ACTIVO_KEY);
    if (guardado) {
      setArtistaActivo(JSON.parse(guardado));
    }
  }, []);

  useEffect(() => {
    const cargarSolicitudes = async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("status", "accepted")
        .order("event_date", { ascending: true });

      if (!error && data) {
        setSolicitudes(data as BookingRequest[]);
      }

      setLoadingSolicitudes(false);
    };

    cargarSolicitudes();
  }, []);

  const limpiarArtistaActivo = () => {
    localStorage.removeItem(ARTISTA_ACTIVO_KEY);
    setArtistaActivo(null);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd });

  const goToPreviousWeek = () => {
    setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const normalizarTexto = (valor: string) => {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase()
      .trim();
  };

  const coincideNombreArtista = (nombreSolicitud: string, nombreActivo: string) => {
    const solicitudNormalizada = normalizarTexto(nombreSolicitud);
    const activoNormalizado = normalizarTexto(nombreActivo);

    return (
      solicitudNormalizada === activoNormalizado ||
      solicitudNormalizada.includes(activoNormalizado) ||
      activoNormalizado.includes(solicitudNormalizada)
    );
  };

  const extraerHoraDeSolicitud = (mensaje: string | null) => {
    if (!mensaje) return null;
    const partesMensaje = mensaje.split(" · ");
    const horaParte = partesMensaje.find((parte) => parte.startsWith("Hora:"));
    if (!horaParte) return null;
    return horaParte.replace("Hora:", "").trim();
  };

  const extraerDuracionDeSolicitud = (mensaje: string | null) => {
    if (!mensaje) return null;
    const partesMensaje = mensaje.split(" · ");
    const duracionParte = partesMensaje.find((parte) => parte.startsWith("Duración:"));
    if (!duracionParte) return null;
    return duracionParte.replace("Duración:", "").trim();
  };

  const solicitudesFiltradas = useMemo(() => {
    let resultado = solicitudes;

    if (artistaActivo) {
      resultado = resultado.filter(
        (solicitud) =>
          solicitud.artist_id === artistaActivo.id ||
          coincideNombreArtista(solicitud.artist_name, artistaActivo.nombre)
      );
    }

    return resultado;
  }, [solicitudes, artistaActivo]);

  const proximosEventosSemana = useMemo(() => {
    return solicitudesFiltradas.filter((solicitud) => {
      const fecha = new Date(solicitud.event_date);
      return weekDays.some((day) => format(day, "yyyy-MM-dd") === format(fecha, "yyyy-MM-dd"));
    });
  }, [solicitudesFiltradas, weekDays]);

  useEffect(() => {
    if (solicitudesFiltradas.length === 0) return;

    const hayEventoEnSemanaActual = solicitudesFiltradas.some((solicitud) => {
      const fecha = new Date(solicitud.event_date);
      return weekDays.some((day) => format(day, "yyyy-MM-dd") === format(fecha, "yyyy-MM-dd"));
    });

    if (!hayEventoEnSemanaActual) {
      setCurrentDate(new Date(solicitudesFiltradas[0].event_date));
    }
  }, [solicitudesFiltradas, weekDays]);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, BookingRequest[]>();

    solicitudesFiltradas.forEach((solicitud) => {
      const clave = format(new Date(solicitud.event_date), "yyyy-MM-dd");
      const existentes = mapa.get(clave) || [];
      mapa.set(clave, [...existentes, solicitud]);
    });

    return mapa;
  }, [solicitudesFiltradas]);

  const eventosPorCelda = useMemo(() => {
    const mapa = new Map<string, BookingRequest[]>();

    solicitudesFiltradas.forEach((solicitud) => {
      const fechaClave = format(new Date(solicitud.event_date), "yyyy-MM-dd");
      const hora = extraerHoraDeSolicitud(solicitud.message);
      if (!hora) return;

      const clave = `${fechaClave}_${hora}`;
      const existentes = mapa.get(clave) || [];
      mapa.set(clave, [...existentes, solicitud]);
    });

    return mapa;
  }, [solicitudesFiltradas]);

  return (
    <AppLayout title="Calendario">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            {viewMode === "week" ? (
              <>
                <p className="text-sm text-muted-foreground">Semana {weekNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vista compacta · franja visible 18:00 - 06:00
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Vista mensual</p>
                <p className="text-xs text-muted-foreground">
                  Todos los eventos confirmados del mes de {format(currentDate, "MMMM", { locale: es })}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-lg"
            >
              Mes
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-lg"
            >
              Semana
            </Button>
          </div>
        </div>

        {artistaActivo ? (
          <div className="mb-6 rounded-xl border border-border/40 bg-card p-4">
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
          <div className="mb-6 rounded-xl border border-border/40 bg-card p-4">
            <p className="text-sm text-muted-foreground">Vista general</p>
            <h3 className="text-xl font-semibold">Todos los artistas representados</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Estás viendo el calendario agregado de toda la agencia.
            </p>
          </div>
        )}

        {/* Calendar Grid */}
        {viewMode === "week" ? (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
            {/* Days Header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40">
              <div className="p-3 text-sm text-muted-foreground bg-muted/50 border-r border-border/40">
                Hora
              </div>
              {weekDays.map((day, index) => {
                const claveDia = format(day, "yyyy-MM-dd");
                const totalEventosDia = eventosPorDia.get(claveDia)?.length || 0;

                return (
                  <div
                    key={index}
                    className="p-3 border-r border-border/40 last:border-r-0 relative flex items-center justify-center"
                  >
                    <span className="text-sm font-medium">{dayNames[index]}</span>
                    <span className="absolute top-2 right-3 text-xs text-muted-foreground">
                      {format(day, "d")}
                    </span>
                    {totalEventosDia > 0 && (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {totalEventosDia} evento{totalEventosDia > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="max-h-[520px] overflow-y-auto">
              {hours.map((hour) => {
                const isFullHour = hour.endsWith(":00");
                return (
                  <div
                    key={hour}
                    className={`grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0 ${isFullHour ? "border-border/60" : "border-border/30"}`}
                  >
                    <div className="p-2 text-sm text-muted-foreground bg-muted/50 border-r border-border/40 flex items-center justify-start pl-3">
                      {hour}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const claveDia = format(day, "yyyy-MM-dd");
                      const claveCelda = `${claveDia}_${hour}`;
                      const eventosCelda = eventosPorCelda.get(claveCelda) || [];

                      return (
                        <div
                          key={dayIndex}
                          className={`p-1 min-h-[32px] border-r border-border/40 last:border-r-0 transition-colors ${
                            eventosCelda.length > 0 ? "bg-emerald-50/80" : "hover:bg-muted/30"
                          }`}
                        >
                          {eventosCelda.length > 0 && (
                            <div className="space-y-1">
                              {eventosCelda.map((evento) => {
                                const duracion = extraerDuracionDeSolicitud(evento.message);

                                return (
                                  <div
                                    key={evento.id}
                                    className="rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 text-[10px] leading-tight text-emerald-800"
                                    title={`${evento.artist_name} · ${evento.venue_name}`}
                                  >
                                    <div className="font-semibold truncate">{evento.venue_name}</div>
                                    <div className="truncate">{evento.artist_name}</div>
                                    {duracion && <div className="truncate">{duracion}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
            <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
              {monthDayNames.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 border-border/40">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                const claveDia = format(day, "yyyy-MM-dd");
                const eventosDia = eventosPorDia.get(claveDia) || [];
                const esDelMesActual = isSameMonth(day, currentDate);

                return (
                  <div
                    key={index}
                    className={`min-h-[140px] border-r border-b border-border/40 p-2 align-top ${
                      esDelMesActual ? "bg-card" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${esDelMesActual ? "text-foreground" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </span>
                      {eventosDia.length > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          {eventosDia.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {eventosDia.slice(0, 3).map((evento) => {
                        const hora = extraerHoraDeSolicitud(evento.message) || "-";
                        return (
                          <div
                            key={evento.id}
                            className="rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 text-[10px] leading-tight text-emerald-800"
                            title={`${evento.venue_name} · ${evento.artist_name} · ${hora}`}
                          >
                            <div className="font-semibold truncate">{evento.venue_name}</div>
                            <div className="truncate">{hora} · {evento.artist_name}</div>
                          </div>
                        );
                      })}
                      {eventosDia.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{eventosDia.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border/40 bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Eventos confirmados</h3>
              <p className="text-sm text-muted-foreground">
                Solicitudes aceptadas visibles en calendario
              </p>
            </div>
          </div>

          {loadingSolicitudes ? (
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
              Cargando eventos confirmados...
            </div>
          ) : proximosEventosSemana.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
              No hay eventos confirmados para esta semana. Si existe alguno aceptado, el calendario saltará automáticamente a su semana.
            </div>
          ) : (
            <div className="space-y-3">
              {proximosEventosSemana.map((solicitud) => {
                const hora = extraerHoraDeSolicitud(solicitud.message) || "-";
                const duracion = extraerDuracionDeSolicitud(solicitud.message) || "-";

                return (
                  <div
                    key={solicitud.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-4"
                  >
                    <div>
                      <p className="font-medium">{solicitud.venue_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {solicitud.venue_city} · {format(new Date(solicitud.event_date), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {solicitud.artist_name} · {hora} · {duracion}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID artista: {solicitud.artist_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">Confirmado</p>
                      <p className="text-sm text-muted-foreground">
                        {solicitud.budget !== null
                          ? `${Number(solicitud.budget).toLocaleString("es-ES")} €`
                          : "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-sm text-muted-foreground">Pendiente</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
