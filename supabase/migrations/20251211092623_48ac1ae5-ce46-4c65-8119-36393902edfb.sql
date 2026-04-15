-- 1. Tabla artistas
CREATE TABLE public.artistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT,
  cache NUMERIC,
  estilo TEXT,
  foto_url TEXT,
  descripcion TEXT,
  tipos_evento TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla negocios
CREATE TABLE public.negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT,
  capacidad INTEGER,
  ubicacion TEXT,
  estilos_musicales TEXT[],
  presupuesto_min NUMERIC,
  presupuesto_max NUMERIC,
  descripcion TEXT,
  dias_apertura TEXT[],
  hora_apertura TIME,
  hora_cierre TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL,
  fecha DATE,
  hora_inicio TIME,
  duracion INTEGER,
  notas TEXT,
  artista_confirmado BOOLEAN DEFAULT false,
  pago_realizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabla contrataciones
CREATE TABLE public.contrataciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL,
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL,
  evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  fecha DATE,
  cache_pagado NUMERIC,
  notas TEXT,
  satisfaccion INTEGER,
  asistencia_estimada INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla artista_disponibilidad
CREATE TABLE public.artista_disponibilidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID REFERENCES public.artistas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  disponible BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla notificaciones
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID REFERENCES public.artistas(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  tipo TEXT,
  titulo TEXT,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.artistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrataciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artista_disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público temporal
CREATE POLICY "Acceso público temporal" ON public.artistas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público temporal" ON public.negocios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público temporal" ON public.eventos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público temporal" ON public.contrataciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público temporal" ON public.artista_disponibilidad FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público temporal" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_negocios_updated_at BEFORE UPDATE ON public.negocios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_artista_disponibilidad_updated_at BEFORE UPDATE ON public.artista_disponibilidad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();