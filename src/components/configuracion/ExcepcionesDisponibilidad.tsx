import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface ExcepcionFecha {
  id: string;
  fecha: Date;
  disponible: boolean;
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
}

interface ExcepcionesDisponibilidadProps {
  excepciones: ExcepcionFecha[];
  onChange: (excepciones: ExcepcionFecha[]) => void;
}

export function ExcepcionesDisponibilidad({ excepciones, onChange }: ExcepcionesDisponibilidadProps) {
  const [nuevaExcepcion, setNuevaExcepcion] = useState<Partial<ExcepcionFecha>>({
    disponible: false,
    horaInicio: "21:00",
    horaFin: "06:00",
    motivo: "",
  });
  const [fechaOpen, setFechaOpen] = useState(false);

  const handleAgregarExcepcion = () => {
    if (!nuevaExcepcion.fecha) return;
    
    const nueva: ExcepcionFecha = {
      id: crypto.randomUUID(),
      fecha: nuevaExcepcion.fecha,
      disponible: nuevaExcepcion.disponible || false,
      horaInicio: nuevaExcepcion.disponible ? nuevaExcepcion.horaInicio : undefined,
      horaFin: nuevaExcepcion.disponible ? nuevaExcepcion.horaFin : undefined,
      motivo: nuevaExcepcion.motivo || "",
    };
    
    onChange([...excepciones, nueva]);
    setNuevaExcepcion({
      disponible: false,
      horaInicio: "21:00",
      horaFin: "06:00",
      motivo: "",
    });
  };

  const handleEliminarExcepcion = (id: string) => {
    onChange(excepciones.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Formulario para añadir excepción */}
      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 space-y-4">
        <p className="text-sm font-medium">Añadir excepción</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover open={fechaOpen} onOpenChange={setFechaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nuevaExcepcion.fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nuevaExcepcion.fecha ? (
                    format(nuevaExcepcion.fecha, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nuevaExcepcion.fecha}
                  onSelect={(date) => {
                    setNuevaExcepcion({ ...nuevaExcepcion, fecha: date });
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
            <Label>Estado</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                checked={nuevaExcepcion.disponible}
                onCheckedChange={(checked) => setNuevaExcepcion({ ...nuevaExcepcion, disponible: checked })}
              />
              <span className={cn(
                "text-sm",
                nuevaExcepcion.disponible ? "text-emerald-600" : "text-destructive"
              )}>
                {nuevaExcepcion.disponible ? "Disponible" : "No disponible"}
              </span>
            </div>
          </div>
        </div>

        {nuevaExcepcion.disponible && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <Input
                type="time"
                value={nuevaExcepcion.horaInicio}
                onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, horaInicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora fin</Label>
              <Input
                type="time"
                value={nuevaExcepcion.horaFin}
                onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, horaFin: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Motivo (opcional)</Label>
          <Textarea
            placeholder="Ej: Vacaciones, compromiso personal..."
            value={nuevaExcepcion.motivo}
            onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, motivo: e.target.value })}
            rows={2}
          />
        </div>

        <Button 
          onClick={handleAgregarExcepcion} 
          disabled={!nuevaExcepcion.fecha}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir excepción
        </Button>
      </div>

      {/* Lista de excepciones */}
      {excepciones.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Excepciones configuradas</p>
          {excepciones
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
            .map((excepcion) => (
              <div
                key={excepcion.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  excepcion.disponible ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-destructive/10 border border-destructive/20"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(excepcion.fecha, "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      excepcion.disponible 
                        ? "bg-emerald-500/20 text-emerald-700" 
                        : "bg-destructive/20 text-destructive"
                    )}>
                      {excepcion.disponible ? "Disponible" : "No disponible"}
                    </span>
                  </div>
                  {excepcion.disponible && excepcion.horaInicio && (
                    <p className="text-sm text-muted-foreground">
                      {excepcion.horaInicio} - {excepcion.horaFin}
                    </p>
                  )}
                  {excepcion.motivo && (
                    <p className="text-sm text-muted-foreground mt-1">{excepcion.motivo}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEliminarExcepcion(excepcion.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {excepciones.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay excepciones configuradas. La disponibilidad general se aplicará a todas las fechas.
        </p>
      )}
    </div>
  );
}
