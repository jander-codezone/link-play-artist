-- Añadir política temporal de acceso público para desarrollo
CREATE POLICY "Acceso público temporal para desarrollo" 
ON public.perfiles 
FOR ALL 
USING (true) 
WITH CHECK (true);