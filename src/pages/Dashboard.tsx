import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Calendar, TrendingUp, Euro } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const evolutionData = [
  { mes: "Ene", contrataciones: 2, ingresos: 1200 },
  { mes: "Feb", contrataciones: 3, ingresos: 1800 },
  { mes: "Mar", contrataciones: 5, ingresos: 3200 },
  { mes: "Abr", contrataciones: 4, ingresos: 2500 },
  { mes: "May", contrataciones: 6, ingresos: 4100 },
  { mes: "Jun", contrataciones: 8, ingresos: 5500 },
  { mes: "Jul", contrataciones: 7, ingresos: 4800 },
  { mes: "Ago", contrataciones: 9, ingresos: 6200 },
  { mes: "Sep", contrataciones: 6, ingresos: 4000 },
  { mes: "Oct", contrataciones: 8, ingresos: 5600 },
  { mes: "Nov", contrataciones: 10, ingresos: 7200 },
  { mes: "Dic", contrataciones: 12, ingresos: 8500 },
];

const sourceData = [
  { name: "Clubs", value: 35, color: "#FFC442" },
  { name: "Festivales", value: 25, color: "#9B0100" },
  { name: "Conciertos", value: 20, color: "#1A1A1A" },
  { name: "Eventos Privados", value: 15, color: "#6B7280" },
  { name: "Otros", value: 5, color: "#EBEBEB" },
];
const stats = [
  {
    title: "Contrataciones",
    value: "—",
    icon: FileText,
    subtitle: "Este mes"
  },
  {
    title: "Próximos Eventos",
    value: "—",
    icon: Calendar,
    subtitle: "Programados"
  },
  {
    title: "Gasto Promedio",
    value: "—",
    icon: TrendingUp,
    subtitle: "Por contratación"
  },
  {
    title: "Gasto Mensual",
    value: "—",
    icon: Euro,
    subtitle: "Total acumulado"
  }
];
const EvolutionChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={evolutionData}>
      <defs>
        <linearGradient id="colorContrataciones" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#FFC442" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#FFC442" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
      <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'hsl(var(--card))', 
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }} 
      />
      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
      <Area 
        yAxisId="left"
        type="monotone" 
        dataKey="contrataciones" 
        stroke="#FFC442" 
        fillOpacity={1} 
        fill="url(#colorContrataciones)" 
        name="Contrataciones"
      />
      <Area 
        yAxisId="right"
        type="monotone" 
        dataKey="ingresos" 
        stroke="#10b981" 
        fillOpacity={1} 
        fill="url(#colorIngresos)" 
        name="Ingresos (€)"
      />
    </AreaChart>
  </ResponsiveContainer>
);

const SourceChart = ({ innerRadius = 60, outerRadius = 100 }: { innerRadius?: number; outerRadius?: number }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={sourceData}
        cx="50%"
        cy="45%"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        paddingAngle={2}
        dataKey="value"
        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
        labelLine={false}
      >
        {sourceData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'hsl(var(--card))', 
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }}
        formatter={(value: number) => [`${value}%`, 'Porcentaje']}
      />
      <Legend wrapperStyle={{ fontSize: '11px' }} />
    </PieChart>
  </ResponsiveContainer>
);

export default function Dashboard() {
  const [expandedChart, setExpandedChart] = useState<'evolution' | 'source' | null>(null);

  return (
    <AppLayout title="Dashboard" subtitle="Resumen de actividad y métricas">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.title} className="border shadow-sm bg-card rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border shadow-sm">
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-muted-foreground mb-4">Próximos Eventos</p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  Aún no hay eventos programados. Cuando aceptes contrataciones aparecerán aquí.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-muted-foreground mb-4">Actividad Reciente</p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  No hay actividad reciente todavía.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="border shadow-sm cursor-pointer transition-all hover:shadow-md" 
            onClick={() => setExpandedChart('evolution')}
          >
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-muted-foreground mb-4">Evolución de Contrataciones</p>
              <div className="h-[300px]">
                <EvolutionChart />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-sm cursor-pointer transition-all hover:shadow-md" 
            onClick={() => setExpandedChart('source')}
          >
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-muted-foreground mb-4">Origen de Contrataciones</p>
              <div className="h-[300px]">
                <SourceChart />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={expandedChart === 'evolution'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Evolución de Contrataciones</DialogTitle>
          </DialogHeader>
          <div className="h-[500px]">
            <EvolutionChart />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === 'source'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Origen de Contrataciones</DialogTitle>
          </DialogHeader>
          <div className="h-[500px]">
            <SourceChart innerRadius={100} outerRadius={180} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}