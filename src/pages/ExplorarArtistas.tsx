

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Send } from "lucide-react";

type ArtistaMarketplace = {
  id: string;
  nombre: string;
  estilo: string;
  cache: string;
  foto: string;
};

type SolicitudBookingDemo = {
  id: string;
  artistaId: string;
  artistaNombre: string;
  artistaEstilo: string;
  venueNombre: string;
  venueCiudad: string;
  fecha: string;
  presupuesto: string;
  mensaje: string;
  estado: "pendiente" | "aceptada" | "rechazada";
  createdAt: string;
};

const ARTISTAS_KEY = "artistas_representados_demo";
const SOLICITUDES_KEY = "solicitudes_booking_demo";

const artistasFallback: ArtistaMarketplace[] = [
  {
    id: "fallback-1",
    nombre: "Bad Bunny",
    estilo: "Reggaeton",
    cache: "150000",
    foto: "",
  },
  {
    id: "fallback-2",
    nombre: "Bizarrap",
    estilo: "Urban / Electronic",
    cache: "120000",
    foto: "",
  },
  {
    id: "fallback-3",
    nombre: "Black Coffee",
    estilo: "House",
    cache: "90000",
    foto: "",
  },
];

const formatearCache = (valor: string) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("es-ES");
};

export default function ExplorarArtistas() {
  const [artistas, setArtistas] = useState<ArtistaMarketplace[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [artistaSeleccionado, setArtistaSeleccionado] = useState<ArtistaMarketplace | null>(null);
  const [venueNombre, setVenueNombre] = useState("Opium Madrid");
  const [venueCiudad, setVenueCiudad] = useState("Madrid");
  const [fecha, setFecha] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const guardados = localStorage.getItem(ARTISTAS_KEY);
    if (guardados) {
      const parsed = JSON.parse(guardados) as ArtistaMarketplace[];
      if (parsed.length > 0) {
        setArtistas(parsed);
        return;
      }
    }

    setArtistas(artistasFallback);
  }, []);

  const artistasFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return artistas;

    return artistas.filter(
      (artista) =>
        artista.nombre.toLowerCase().includes(termino) ||
        artista.estilo.toLowerCase().includes(termino)
    );
  }, [artistas, busqueda]);

  const abrirSolicitud = (artista: ArtistaMarketplace) => {
    setArtistaSeleccionado(artista);
    setErrorFormulario("");
    setSuccessMessage("");
    setFecha("");
    setPresupuesto("");
    setMensaje("");
  };

  const cerrarSolicitud = () => {
    setArtistaSeleccionado(null);
    setErrorFormulario("");
    setSuccessMessage("");
    setFecha("");
    setPresupuesto("");
    setMensaje("");
  };

  const enviarSolicitud = () => {
    if (!artistaSeleccionado) return;

    if (!venueNombre.trim() || !venueCiudad.trim() || !fecha.trim() || !presupuesto.trim() || !mensaje.trim()) {
      setErrorFormulario("Debes completar todos los campos para enviar la solicitud.");
      return;
    }

    const solicitud: SolicitudBookingDemo = {
      id: crypto.randomUUID(),
      artistaId: artistaSeleccionado.id,
      artistaNombre: artistaSeleccionado.nombre,
      artistaEstilo: artistaSeleccionado.estilo,
      venueNombre: venueNombre.trim(),
      venueCiudad: venueCiudad.trim(),
      fecha: fecha.trim(),
      presupuesto: presupuesto.trim(),
      mensaje: mensaje.trim(),
      estado: "pendiente",
      createdAt: new Date().toISOString(),
    };

    const existentes = localStorage.getItem(SOLICITUDES_KEY);
    const solicitudesActuales = existentes ? (JSON.parse(existentes) as SolicitudBookingDemo[]) : [];
    const nuevasSolicitudes = [solicitud, ...solicitudesActuales];

    localStorage.setItem(SOLICITUDES_KEY, JSON.stringify(nuevasSolicitudes));

    setErrorFormulario("");
    setSuccessMessage(`Solicitud enviada a ${artistaSeleccionado.nombre}.`);

    setTimeout(() => {
      cerrarSolicitud();
    }, 900);
  };

  return (
    <AppLayout title="Explorar artistas" subtitle="Descubre artistas y envía solicitudes de contratación">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o estilo musical"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {artistasFiltrados.map((artista) => (
            <Card key={artista.id}>
              <CardContent className="p-5 space-y-4">
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
                    <p className="font-semibold text-lg leading-none">{artista.nombre}</p>
                    <p className="text-sm text-muted-foreground mt-2">{artista.estilo || "Sin estilo definido"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Caché: {artista.cache ? `${formatearCache(artista.cache)} €` : "No definido"}
                    </p>
                  </div>
                </div>

                <Button className="w-full" onClick={() => abrirSolicitud(artista)}>
                  <Send className="h-4 w-4 mr-2" />
                  Solicitar contratación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {artistasFiltrados.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se han encontrado artistas para esa búsqueda.
            </CardContent>
          </Card>
        )}

        {artistaSeleccionado && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitar contratación · {artistaSeleccionado.nombre}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorFormulario && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorFormulario}
                </div>
              )}

              {successMessage && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Nombre del venue"
                  value={venueNombre}
                  onChange={(e) => setVenueNombre(e.target.value)}
                />
                <Input
                  placeholder="Ciudad"
                  value={venueCiudad}
                  onChange={(e) => setVenueCiudad(e.target.value)}
                />
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                <Input
                  placeholder="Presupuesto (€)"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>

              <textarea
                placeholder="Mensaje para el artista o la agencia"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cerrarSolicitud}>
                  Cancelar
                </Button>
                <Button onClick={enviarSolicitud}>
                  Enviar solicitud
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}