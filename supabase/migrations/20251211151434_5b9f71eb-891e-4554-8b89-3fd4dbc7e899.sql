-- Tabla de perfiles de usuario (artista individual o representante)
CREATE TABLE public.perfiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_usuario TEXT NOT NULL DEFAULT 'artista_individual', -- artista_individual, representante
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Añadir campos a artistas para soportar representantes y categorías
ALTER TABLE public.artistas
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'standard', -- standard, premium
ADD COLUMN IF NOT EXISTS representante_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS perfil_artista_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL; -- para artistas individuales

-- Tabla de disponibilidad premium (con ciudad y caché especial)
CREATE TABLE public.artista_disponibilidad_premium (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artista_id UUID NOT NULL REFERENCES public.artistas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  ciudad TEXT NOT NULL,
  pais TEXT DEFAULT 'España',
  cache_especial NUMERIC,
  disponible BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(artista_id, fecha, ciudad)
);

-- Habilitar RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artista_disponibilidad_premium ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
CREATE POLICY "Perfiles visibles para todos" ON public.perfiles
FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden editar su perfil" ON public.perfiles
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para disponibilidad premium
CREATE POLICY "Disponibilidad premium visible para todos" ON public.artista_disponibilidad_premium
FOR SELECT USING (true);

CREATE POLICY "Gestión disponibilidad premium" ON public.artista_disponibilidad_premium
FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at en perfiles
CREATE TRIGGER update_perfiles_updated_at
BEFORE UPDATE ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en disponibilidad premium
CREATE TRIGGER update_artista_disponibilidad_premium_updated_at
BEFORE UPDATE ON public.artista_disponibilidad_premium
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();