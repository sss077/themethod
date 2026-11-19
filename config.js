/*
 * ================================================================
 *  НАСТРОЙКИ ПОДКЛЮЧЕНИЯ К SUPABASE — единственный файл с ключами.
 *  Где взять значения: Supabase → Project Settings → API (см. SETUP.md, шаг 3).
 *
 *  ВАЖНО: сюда вставляется только публичный ключ "anon public"
 *  (он же "publishable"). Ключ "service_role" / "secret" сюда НЕ вставлять никогда!
 * ================================================================
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://ssidcicslozingemimjd.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_FWre1_3nFsXYw8Id1mp6Aw_BRo2A8VI',

  // Имя хранилища для картинок (менять не нужно, если выполняли schema.sql)
  STORAGE_BUCKET: 'media',
};
