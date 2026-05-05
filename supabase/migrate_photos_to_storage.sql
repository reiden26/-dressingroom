-- ============================================================
-- Migración: fotos de escaneo → Supabase Storage
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- PASOS:
-- 1. Ejecutar este SQL para crear el bucket y migrar columnas
-- 2. Crear el bucket manualmente en Storage → New bucket:
--    Name: scan-photos | Public: NO | File size limit: 5MB
--    Allowed MIME types: image/jpeg, image/png, image/webp
-- 3. Las fotos antiguas (base64) se migran automáticamente
--    desde la app la próxima vez que el usuario accede al perfil
-- ============================================================

-- Cambiar columnas de base64 text a URLs (varchar más corto)
-- Usamos ALTER COLUMN para no perder datos existentes durante la transición
ALTER TABLE public.scans
  ALTER COLUMN photo_front TYPE varchar(500),
  ALTER COLUMN photo_side  TYPE varchar(500),
  ALTER COLUMN photo_back  TYPE varchar(500);

-- Índice para queries por usuario ordenadas por fecha (historial)
CREATE INDEX IF NOT EXISTS scans_user_id_captured_at_idx
  ON public.scans (user_id, captured_at DESC);

-- ─── Storage bucket policies ──────────────────────────────────
-- Ejecutar DESPUÉS de crear el bucket "scan-photos" en el dashboard

-- Usuarios solo pueden subir a su propia carpeta (user_id/*)
CREATE POLICY "Users can upload own scan photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuarios solo pueden leer sus propias fotos
CREATE POLICY "Users can read own scan photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scan-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuarios pueden eliminar sus propias fotos
CREATE POLICY "Users can delete own scan photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scan-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
