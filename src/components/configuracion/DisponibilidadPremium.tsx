import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const paises = [
  "España", "Alemania", "Andorra", "Argentina", "Australia", "Austria", "Bélgica", "Bolivia", 
  "Brasil", "Canadá", "Chile", "China", "Colombia", "Corea del Sur", "Costa Rica", "Croacia",
  "Cuba", "Dinamarca", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eslovaquia",
  "Eslovenia", "Estados Unidos", "Estonia", "Filipinas", "Finlandia", "Francia", "Grecia", 
  "Guatemala", "Honduras", "Hong Kong", "Hungría", "India", "Indonesia", "Irlanda", "Islandia",
  "Israel", "Italia", "Japón", "Letonia", "Lituania", "Luxemburgo", "Malasia", "Malta", "Marruecos",
  "México", "Mónaco", "Nicaragua", "Nigeria", "Noruega", "Nueva Zelanda", "Países Bajos", "Panamá",
  "Paraguay", "Perú", "Polonia", "Portugal", "Puerto Rico", "Qatar", "Reino Unido", "República Checa",
  "República Dominicana", "Rumanía", "Rusia", "Singapur", "Sudáfrica", "Suecia", "Suiza", "Tailandia",
  "Taiwán", "Turquía", "Ucrania", "Uruguay", "Venezuela", "Vietnam"
];

const ciudadesPorPais: Record<string, string[]> = {
  "España": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma de Mallorca", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Granada", "A Coruña", "Vitoria", "Santa Cruz de Tenerife", "Pamplona", "San Sebastián", "Santander", "Burgos", "Salamanca", "Ibiza"],
  "Alemania": ["Berlín", "Múnich", "Hamburgo", "Frankfurt", "Colonia", "Düsseldorf", "Stuttgart", "Leipzig"],
  "Andorra": ["Andorra la Vella", "Escaldes-Engordany", "Encamp"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Mar del Plata", "La Plata"],
  "Australia": ["Sídney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Austria": ["Viena", "Salzburgo", "Innsbruck", "Graz", "Linz"],
  "Bélgica": ["Bruselas", "Amberes", "Gante", "Brujas", "Lieja"],
  "Bolivia": ["La Paz", "Santa Cruz", "Cochabamba", "Sucre"],
  "Brasil": ["São Paulo", "Río de Janeiro", "Brasilia", "Salvador", "Fortaleza", "Belo Horizonte"],
  "Canadá": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "Viña del Mar"],
  "China": ["Pekín", "Shanghái", "Cantón", "Shenzhen", "Hong Kong"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
  "Corea del Sur": ["Seúl", "Busan", "Incheon", "Daegu"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia"],
  "Croacia": ["Zagreb", "Split", "Dubrovnik", "Rijeka"],
  "Cuba": ["La Habana", "Santiago de Cuba", "Varadero", "Trinidad"],
  "Dinamarca": ["Copenhague", "Aarhus", "Odense", "Aalborg"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Manta"],
  "Egipto": ["El Cairo", "Alejandría", "Giza", "Luxor"],
  "El Salvador": ["San Salvador", "Santa Ana", "San Miguel"],
  "Emiratos Árabes Unidos": ["Dubái", "Abu Dabi", "Sharjah"],
  "Eslovaquia": ["Bratislava", "Košice", "Prešov", "Nitra"],
  "Eslovenia": ["Liubliana", "Maribor", "Celje"],
  "Estados Unidos": ["Miami", "Nueva York", "Los Ángeles", "Chicago", "Houston", "Las Vegas", "San Francisco", "Boston", "Washington D.C.", "Atlanta", "Dallas", "Denver", "Seattle", "Orlando", "San Diego"],
  "Estonia": ["Tallin", "Tartu", "Narva"],
  "Filipinas": ["Manila", "Cebú", "Davao", "Quezon City"],
  "Finlandia": ["Helsinki", "Espoo", "Tampere", "Turku"],
  "Francia": ["París", "Marsella", "Lyon", "Toulouse", "Niza", "Burdeos"],
  "Grecia": ["Atenas", "Salónica", "El Pireo", "Patras"],
  "Guatemala": ["Ciudad de Guatemala", "Antigua Guatemala", "Quetzaltenango"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula", "La Ceiba"],
  "Hong Kong": ["Hong Kong Central", "Kowloon", "Tsim Sha Tsui"],
  "Hungría": ["Budapest", "Debrecen", "Szeged", "Pécs"],
  "India": ["Nueva Delhi", "Bombay", "Bangalore", "Chennai", "Calcuta"],
  "Indonesia": ["Yakarta", "Bali", "Surabaya", "Bandung"],
  "Irlanda": ["Dublín", "Cork", "Galway", "Limerick"],
  "Islandia": ["Reikiavik", "Akureyri", "Kópavogur"],
  "Israel": ["Tel Aviv", "Jerusalén", "Haifa", "Eilat"],
  "Italia": ["Roma", "Milán", "Nápoles", "Turín", "Florencia", "Venecia"],
  "Japón": ["Tokio", "Osaka", "Kioto", "Yokohama", "Nagoya"],
  "Letonia": ["Riga", "Daugavpils", "Liepāja"],
  "Lituania": ["Vilna", "Kaunas", "Klaipėda"],
  "Luxemburgo": ["Luxemburgo", "Esch-sur-Alzette", "Differdange"],
  "Malasia": ["Kuala Lumpur", "George Town", "Johor Bahru"],
  "Malta": ["La Valeta", "Sliema", "St. Julian's"],
  "Marruecos": ["Casablanca", "Marrakech", "Rabat", "Fez", "Tánger"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Cancún", "Tijuana", "Puebla", "León", "Mérida"],
  "Mónaco": ["Mónaco", "Monte Carlo", "La Condamine"],
  "Nicaragua": ["Managua", "León", "Granada"],
  "Nigeria": ["Lagos", "Abuya", "Kano", "Ibadan"],
  "Noruega": ["Oslo", "Bergen", "Trondheim", "Stavanger"],
  "Nueva Zelanda": ["Auckland", "Wellington", "Christchurch", "Queenstown"],
  "Países Bajos": ["Ámsterdam", "Róterdam", "La Haya", "Utrecht"],
  "Panamá": ["Ciudad de Panamá", "Colón", "David"],
  "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo"],
  "Perú": ["Lima", "Arequipa", "Cusco", "Trujillo"],
  "Polonia": ["Varsovia", "Cracovia", "Gdansk", "Wroclaw", "Poznan"],
  "Portugal": ["Lisboa", "Oporto", "Faro", "Braga"],
  "Puerto Rico": ["San Juan", "Ponce", "Mayagüez"],
  "Qatar": ["Doha", "Al Wakrah", "Al Khor"],
  "Reino Unido": ["Londres", "Manchester", "Birmingham", "Liverpool", "Glasgow", "Edimburgo"],
  "República Checa": ["Praga", "Brno", "Ostrava", "Pilsen"],
  "República Dominicana": ["Santo Domingo", "Punta Cana", "Santiago de los Caballeros"],
  "Rumanía": ["Bucarest", "Cluj-Napoca", "Timișoara", "Iași"],
  "Rusia": ["Moscú", "San Petersburgo", "Novosibirsk", "Kazán"],
  "Singapur": ["Singapur", "Sentosa", "Marina Bay"],
  "Sudáfrica": ["Johannesburgo", "Ciudad del Cabo", "Durban", "Pretoria"],
  "Suecia": ["Estocolmo", "Gotemburgo", "Malmö", "Uppsala"],
  "Suiza": ["Zúrich", "Ginebra", "Basilea", "Berna", "Lausana"],
  "Tailandia": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  "Taiwán": ["Taipéi", "Kaohsiung", "Taichung"],
  "Turquía": ["Estambul", "Ankara", "Esmirna", "Antalya"],
  "Ucrania": ["Kiev", "Odesa", "Járkov", "Lviv"],
  "Uruguay": ["Montevideo", "Punta del Este", "Colonia del Sacramento"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto"],
  "Vietnam": ["Ho Chi Minh", "Hanói", "Da Nang", "Nha Trang"],
};

const horas = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  "00:30", "01:30", "02:30", "03:30", "04:30", "05:30", "06:30", "07:30", "08:30", "09:30", "10:30", "11:30",
  "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30"
].sort();

export interface DisponibilidadPremiumItem {
  id: string;
  fecha: Date;
  ciudad: string;
  pais: string;
  cacheEspecial: string;
  disponible: boolean;
  notas: string;
  horaInicio: string;
  horaFin: string;
}

interface DisponibilidadPremiumProps {
  disponibilidad: DisponibilidadPremiumItem[];
  onChange: (disponibilidad: DisponibilidadPremiumItem[]) => void;
}

export function DisponibilidadPremium({ disponibilidad, onChange }: DisponibilidadPremiumProps) {
  const [nuevaDisp, setNuevaDisp] = useState<Partial<DisponibilidadPremiumItem>>({
    pais: "España",
    disponible: true,
    cacheEspecial: "",
    notas: "",
    horaInicio: "",
    horaFin: "",
  });
  const [fechaOpen, setFechaOpen] = useState(false);

  const ciudades = ciudadesPorPais[nuevaDisp.pais || "España"] || [];

  const handleAgregar = () => {
    if (!nuevaDisp.fecha || !nuevaDisp.ciudad) return;
    
    const nueva: DisponibilidadPremiumItem = {
      id: crypto.randomUUID(),
      fecha: nuevaDisp.fecha,
      ciudad: nuevaDisp.ciudad,
      pais: nuevaDisp.pais || "España",
      cacheEspecial: nuevaDisp.cacheEspecial || "",
      disponible: true,
      notas: nuevaDisp.notas || "",
      horaInicio: nuevaDisp.horaInicio || "",
      horaFin: nuevaDisp.horaFin || "",
    };
    
    onChange([...disponibilidad, nueva]);
    setNuevaDisp({
      pais: "España",
      disponible: true,
      cacheEspecial: "",
      notas: "",
      horaInicio: "",
      horaFin: "",
    });
  };

  const handleEliminar = (id: string) => {
    onChange(disponibilidad.filter((d) => d.id !== id));
  };

  // Agrupar por mes
  const disponibilidadPorMes = disponibilidad.reduce((acc, item) => {
    const mes = format(item.fecha, "MMMM yyyy", { locale: es });
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(item);
    return acc;
  }, {} as Record<string, DisponibilidadPremiumItem[]>);

  return (
    <div className="space-y-6">
      {/* Formulario para añadir disponibilidad */}
      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 space-y-4">
        <p className="text-sm font-medium">Añadir disponibilidad</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover open={fechaOpen} onOpenChange={setFechaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nuevaDisp.fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nuevaDisp.fecha ? (
                    format(nuevaDisp.fecha, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nuevaDisp.fecha}
                  onSelect={(date) => {
                    setNuevaDisp({ ...nuevaDisp, fecha: date });
                    setFechaOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>País</Label>
            <Select 
              value={nuevaDisp.pais} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, pais: v, ciudad: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {paises.map((pais) => (
                  <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Select 
              value={nuevaDisp.ciudad} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, ciudad: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {ciudades.length > 0 ? (
                  ciudades.map((ciudad) => (
                    <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="otra" disabled>No hay ciudades para este país</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Caché especial (€)</Label>
            <Input
              type="number"
              placeholder="Ej: 15000"
              value={nuevaDisp.cacheEspecial || ""}
              onChange={(e) => setNuevaDisp({ ...nuevaDisp, cacheEspecial: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Hora inicio (aprox.)</Label>
            <Select 
              value={nuevaDisp.horaInicio || ""} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, horaInicio: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {horas.map((hora) => (
                  <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hora fin (aprox.)</Label>
            <Select 
              value={nuevaDisp.horaFin || ""} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, horaFin: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {horas.map((hora) => (
                  <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAgregar} 
          disabled={!nuevaDisp.fecha || !nuevaDisp.ciudad}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir disponibilidad
        </Button>
      </div>

      {/* Lista de disponibilidad agrupada por mes */}
      {Object.keys(disponibilidadPorMes).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(disponibilidadPorMes)
            .sort(([a], [b]) => {
              const dateA = new Date(disponibilidadPorMes[a][0].fecha);
              const dateB = new Date(disponibilidadPorMes[b][0].fecha);
              return dateA.getTime() - dateB.getTime();
            })
            .map(([mes, items]) => (
              <div key={mes}>
                <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">{mes}</p>
                <div className="space-y-2">
                  {items
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {format(item.fecha, "EEEE d", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {item.ciudad}, {item.pais}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {item.horaInicio && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {item.horaInicio}{item.horaFin && ` - ${item.horaFin}`}
                              </span>
                            )}
                            {item.cacheEspecial && (
                              <span className="text-sm text-emerald-600 font-medium">
                                Caché: {parseInt(item.cacheEspecial).toLocaleString("es-ES")}€
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminar(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay fechas de disponibilidad configuradas. Añade las ciudades y fechas donde el artista estará disponible.
        </p>
      )}
    </div>
  );
}
