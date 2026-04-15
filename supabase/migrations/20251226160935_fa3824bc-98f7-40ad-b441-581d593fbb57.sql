-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Disponibilidad premium visible para todos" ON public.artista_disponibilidad_premium;
DROP POLICY IF EXISTS "Solo artistas o representantes pueden gestionar disponibilidad" ON public.artista_disponibilidad_premium;

-- Create permissive policies instead
CREATE POLICY "Disponibilidad premium visible para todos"
ON public.artista_disponibilidad_premium
FOR SELECT
USING (true);

CREATE POLICY "Gestionar disponibilidad premium"
ON public.artista_disponibilidad_premium
FOR ALL
USING (true)
WITH CHECK (true);