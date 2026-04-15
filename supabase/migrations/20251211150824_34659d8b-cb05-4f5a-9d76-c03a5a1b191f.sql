-- Tabla para la disponibilidad semanal general del artista
CREATE TABLE public.artista_disponibilidad_semanal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artista_id UUID REFERENCES public.artistas(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL, -- lunes, martes, miercoles, jueves, viernes, sabado, domingo
  activo BOOLEAN DEFAULT false,
  hora_inicio TIME,
  hora_fin TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(artista_id, dia_semana)
);

-- Añadir campos de hora a la tabla de excepciones existente
ALTER TABLE public.artista_disponibilidad 
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fin TIME,
ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.artista_disponibilidad_semanal ENABLE ROW LEVEL SECURITY;

-- Política para que los negocios puedan ver la disponibilidad de artistas (lectura pública)
CREATE POLICY "Disponibilidad semanal visible para todos"
ON public.artista_disponibilidad_semanal
FOR SELECT
USING (true);

-- Política temporal para permitir todas las operaciones (desarrollo)
CREATE POLICY "Acceso completo temporal"
ON public.artista_disponibilidad_semanal
FOR ALL
USING (true)
WITH CHECK (true);

-- Actualizar política de artista_disponibilidad para lectura pública
CREATE POLICY "Excepciones visibles para todos"
ON public.artista_disponibilidad
FOR SELECT
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_artista_disponibilidad_semanal_updated_at
BEFORE UPDATE ON public.artista_disponibilidad_semanal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();