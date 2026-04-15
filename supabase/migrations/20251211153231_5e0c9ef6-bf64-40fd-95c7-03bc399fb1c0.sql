-- Add time fields to premium availability table
ALTER TABLE public.artista_disponibilidad_premium
ADD COLUMN hora_inicio time without time zone,
ADD COLUMN hora_fin time without time zone;