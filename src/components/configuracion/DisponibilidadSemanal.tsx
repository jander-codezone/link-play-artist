import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const diasSemana = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

export interface DiaDisponibilidad {
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

export interface DisponibilidadSemanalData {
  [key: string]: DiaDisponibilidad;
}

interface DisponibilidadSemanalProps {
  disponibilidad: DisponibilidadSemanalData;
  onChange: (disponibilidad: DisponibilidadSemanalData) => void;
}

export function DisponibilidadSemanal({ disponibilidad, onChange }: DisponibilidadSemanalProps) {
  const handleToggleDia = (diaId: string) => {
    onChange({
      ...disponibilidad,
      [diaId]: {
        ...disponibilidad[diaId],
        activo: !disponibilidad[diaId]?.activo,
      },
    });
  };

  const handleHoraChange = (diaId: string, campo: "horaInicio" | "horaFin", valor: string) => {
    onChange({
      ...disponibilidad,
      [diaId]: {
        ...disponibilidad[diaId],
        [campo]: valor,
      },
    });
  };

  return (
    <div className="space-y-3">
      {diasSemana.map((dia) => {
        const diaData = disponibilidad[dia.id] || { activo: false, horaInicio: "21:00", horaFin: "06:00" };
        
        return (
          <div
            key={dia.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              diaData.activo ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3 w-32">
              <Switch
                checked={diaData.activo}
                onCheckedChange={() => handleToggleDia(dia.id)}
              />
              <Label className={`font-medium ${diaData.activo ? "text-foreground" : "text-muted-foreground"}`}>
                {dia.label}
              </Label>
            </div>
            
            {diaData.activo && (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={diaData.horaInicio}
                  onChange={(e) => handleHoraChange(dia.id, "horaInicio", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="time"
                  value={diaData.horaFin}
                  onChange={(e) => handleHoraChange(dia.id, "horaFin", e.target.value)}
                  className="w-28"
                />
              </div>
            )}
            
            {!diaData.activo && (
              <span className="text-sm text-muted-foreground">No disponible</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
